/*
 * Copyright (c) 2014, CGI
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without modification, are 
 * permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice, this list of 
 *    conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list 
 *    of conditions and the following disclaimer in the documentation and/or other materials 
 *    provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors may be 
 *    used to endorse or promote products derived from this software without specific prior 
 *    written permission.
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF 
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL 
 * THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, 
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT 
 * OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) 
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR 
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS 
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

"use strict";
if (!charme) {
	var charme = {};
}

//Define an object that will provide scope for charme-specific functions and fields
charme.plugin = {};

//Map to hold selected target names as keys and the target hrefs as corresponding values
charme.plugin.selectedTargets = {};

//variable to hold the currently highlighted target from the set of selected targets
charme.plugin.selectedTargetsHighlighted = {};

charme.plugin.constants = (function constants() {
	constants.XPATH_BASE = '//atm:feed';
	constants.XPATH_TOTAL_RESULTS = constants.XPATH_BASE + '/os:totalResults';
	constants.MATCH_EXACT = 0;
	constants.MATCH_PARTIAL = 1;
	//this.XPATH_TOTAL_RESULTS	= '//os:totalResults';
	return constants;
})();

// GUI open/closed
charme.plugin.isOpenFlag = false;

/**
 * An XML document namespace resolver. This is required for processing the atom feed
 * @param prefix
 * @returns {*|null}
 */
charme.plugin.nsResolver = function (prefix) {
	var ns = {
		'atm': 'http://www.w3.org/2005/Atom',
		'os': 'http://a9.com/-/spec/opensearch/1.1/'
	};
	return ns[prefix] || null;
};

/**
 * Execute an xpath query on a given XML document
 * @param xpath An xpath query
 * @param xmlDoc An xml document
 * @param type A type specifier that will attempt to be used to coerce the returned data into the requested format. Types are defined on the builtin XPathResult object.
 * @returns A value of the type specified by the type parameter
 */
charme.plugin.xpathQuery = function (xpath, xmlDoc, type) {
	var xmlEval = xmlDoc;

	if (charme.common.isIE11orLess) {
		xmlEval.setProperty('SelectionLanguage', 'XPath');
		var ns = charme.plugin.nsResolver;
		xmlEval.setProperty('SelectionNamespaces',
				'xmlns:atm="' + ns('atm') + '" xmlns:os="' + ns('os') + '" xmlns="' + ns('atm') +
				'"');
		return xmlEval.selectSingleNode(xpath);
	}
	/**
	 * In some non ie browsers, XML is required to be evaluated from the HTML document
	 */
	if (typeof xmlEval.evaluate === 'undefined') {
		xmlEval = document;
	}
	//Other browsers
	var resultObj = xmlEval.evaluate(xpath, xmlDoc, charme.plugin.nsResolver,
		type ? type : XPathResult.ANY_TYPE, null);
	var resultVal = null;
	switch (type) {
		case XPathResult.NUMBER_TYPE:
			resultVal = resultObj.numberValue;
			break;
		case XPathResult.STRING_TYPE:
			resultVal = resultObj.stringValue;
			break;
		case XPathResult.BOOLEAN_TYPE:
			resultVal = resultObj.booleanValue;
			break;
		default:
			resultVal = resultObj;
			break;
	}
	return resultVal;
};

charme.plugin.request = {};

/**
 * Generate a request URL to fetch annotations for target
 * @param targetId
 * @returns {String}
 */
charme.plugin.request.fetchForTarget = function (targetId) {
    
        targetId = targetId === charme.common.ALL_TARGETS ? '' : targetId;
    
	return (charme.settings.REMOTE_BASE_URL.match(/\/$/) ? charme.settings.REMOTE_BASE_URL :
		charme.plugin.constants.REMOTE_BASE_URL + '/') + 'search/atom?target=' +
		encodeURIComponent(targetId) + '&status=submitted';
};

/**
 * A function that abstracts the browser-specific code necessary to process an XML document. Document is processed synchronously
 * @param xmlString
 * @returns {*}
 */
charme.plugin.parseXML = function (xmlString) {
	var xmlDoc;
	//Unfortunately, Internet explorer support for XPath is difficult. Need to force the response type, but only for IE.
	//SHOULD use feature detection, but in this case it needs to apply to all IE versions, and does not relate to a specific feature that can be easily detected (the response type needs to be set because the feature in question even exists to be detected)
	if (charme.common.isIE11orLess) {
		xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
		xmlDoc.async = false;
		xmlDoc.loadXML(xmlString);
	} else {
		var parser = new DOMParser();
		xmlDoc = parser.parseFromString(xmlString, "text/xml");
	}

	return xmlDoc;
};

/**
 * Send a new AJAX request. Not using any framework to avoid creating external dependencies on integrators.
 * @param url
 * @param successCB
 * @param errorCB
 */
charme.plugin.ajax = function (url, successCB, errorCB) {
	var oReq = new XMLHttpRequest();
	oReq.addEventListener("load", function () {
		if (oReq.status === 200) {
			try {
				var xmlDoc = charme.plugin.parseXML(oReq.responseText);
				successCB.call(oReq, xmlDoc);
			} catch (err) {
				errorCB.call(oReq);
			}
		}
	}, false);
	oReq.addEventListener("error", function () {
		errorCB.call(oReq);
	}, false);
	oReq.open('GET', url, true);

	//Unfortunately, Internet explorer support for XPath is difficult. Need to force the response type, but only for IE.
	//SHOULD use feature detection, but in this case it needs to apply to all IE versions, and does not relate to a specific feature that can be easily detected (the response type needs to be set because the feature in question even exists to be detected)
	if (charme.common.isIE11orLess) {
		//Internet Explorer, so set 'responseType' attribute in order to receive MS XML object. This is an unfortunate hack required to support xPath in a vaguely cross-browser manner
		oReq.responseType = 'msxml-document';
	} else {
		oReq.setRequestHeader('Accept', "application/atom+xml,application/xml");
	}
	oReq.send();
};

/**
 * Fetches the number of annotations that are defined against the given target
 * @param el
 * @param activeImgSrc
 * @param inactiveImgSrc
 */
charme.plugin.getAnnotationCountForTarget = function (el, activeImgSrc, inactiveImgSrc, noconnectionImgSrc) {
    
	charme.plugin.ajax(charme.plugin.request.fetchForTarget(el.href), function (xmlDoc) {
		// Success callback
		var constants = charme.plugin.constants;
		var annoCount = 0;
		if (typeof XPathResult !== 'undefined') {
			annoCount = charme.plugin.xpathQuery(constants.XPATH_TOTAL_RESULTS, xmlDoc,
				XPathResult.NUMBER_TYPE);
		} else {
			//Internet explorer
			annoCount = charme.plugin.xpathQuery(constants.XPATH_TOTAL_RESULTS, xmlDoc
				/*,XPathResult.ANY_TYPE*/);
			if (typeof annoCount === 'object' && annoCount.text) {
				annoCount = parseInt(annoCount.text);
			}
		}
		if (annoCount > 0) {
			el.title = 'CHARMe annotations exist';
			el.style.background = 'url("' + activeImgSrc + '") no-repeat left top';
		} else {
			el.title = 'No CHARMe annotations';
			el.style.background = 'url("' + inactiveImgSrc + '") no-repeat left top';
		}
                
        // Show the annotation count next to the CHARMe icon - use the className 'charme-count' to hide the count in CSS file if desired
        var showCount = charme.plugin.getByClass('charme-count', charme.plugin.constants.MATCH_EXACT, el.parentNode);
        if(showCount.length > 0) 
            showCount = showCount[0];
        else {
            showCount = document.createElement('span');
            showCount.className = 'charme-count';
            el.parentNode.insertBefore(showCount, el.nextSibling);
        }
        showCount.innerHTML = ' (' + annoCount + ')';

        charme.common.addEvent(el, 'click', charme.plugin.showPlugin);
	}, function () {
		el.title = 'CHARMe Plugin - Unable to fetch annotation data';
		el.style.background = 'url("' + noconnectionImgSrc + '") no-repeat left top';
		charme.common.addEvent(el, 'click', function(e){
			alert('CHARMe Plugin - Unable to fetch annotation data');
			charme.plugin.stopBubble(e);
		});

		if (window.console) {
			window.console.error('CHARMe Plugin - Unable to fetch annotation data');
		} else {
			throw 'CHARMe Plugin - Unable to fetch annotation data';
		}
	});
};

/**
 * Adds a click event to a passed in checkbox element
 * @param targetCheckbox
 */
charme.plugin.setSelectionEventOnTarget = function (checkbox, boxType) {
	if(boxType === 'all')
		charme.common.addEvent(checkbox, 'click', charme.plugin.setWholeTargetList);
	if(boxType === 'target')
		charme.common.addEvent(checkbox, 'click', charme.plugin.refreshSelectedTargetList);
};

// Select/unselect all targets
charme.plugin.setWholeTargetList = function(checkbox) {
	var els = charme.plugin.getByClass('charme-select', charme.plugin.constants.MATCH_EXACT);
	for(var i = 0 ; i < els.length; i++) {
		els[i].checked = !checkbox.target.checked;
		els[i].click();
	}
};

// Disable icons if plugin already launched
charme.plugin.disableWholeTargetList = function(isDisabled) {
    var els = charme.plugin.getByClass('charme-select', charme.plugin.constants.MATCH_EXACT);
    for(var i = 0 ; i < els.length; i++)
        els[i].disabled = isDisabled;
};

/**
 * Defines the function that executes when a checkbox on a target is clicked.
 * The event ensures that the charme.plugin.selectedTargets map is kept up-to-date
 * @param targetCheckbox
 */
charme.plugin.refreshSelectedTargetList = function (targetCheckbox) {

    var targetHref = targetCheckbox.target.id;
    var targetHrefEncoded = '';
    var targetName = targetHref;//.substring(targetHref.lastIndexOf('/')+1);
    
    var targetTypeLabel = targetCheckbox.target.name;
    var targetTypeDesc = targetTypeLabel.split('-');
    var tempArr = [];
    for(var i = 0; i < targetTypeDesc.length; i++) {
        var descFrag = targetTypeDesc[i];
        descFrag = descFrag[0].toUpperCase() + descFrag.substr(1).toLowerCase();
        tempArr.push(descFrag);
    }
    targetTypeLabel = tempArr.join('');
    targetTypeDesc = tempArr.join(' ');
        
    //alert('event fired : checked status = ' + targetCheckbox.target.checked + " " + targetCheckbox.target.id);

    //targetHref = targetCheckbox.target.id;
    //targetName = targetHref.substring(targetHref.lastIndexOf('/')+1);
    
    //targetHrefEncoded = encodeURIComponent(targetHref);
    //targetHrefEncoded = targetHref;

    if(targetCheckbox.target.checked)
    {
        if (!(targetHref in charme.plugin.selectedTargets))
        {
            //Add the target in the list
            charme.plugin.selectedTargets[targetHref] = [targetName, targetTypeLabel, targetTypeDesc];

            //alert('added : ' + targetName);
        }

    }
    else
    {
        if (targetHref in charme.plugin.selectedTargets)
        {
            // remove from the charme.plugin.selectedTargets
            delete charme.plugin.selectedTargets[targetHref];

            //alert('removed : ' + targetName);
        }
    }

};

/**
 * This function programmatically sets the selection checkbox to the checked state
 * and also inserts it in the selectedTarget map. This is specifically used when
 * a charme icon that is not in the set of selected datsets already, is clicked to
 * invoke the plugin on the main data provider page.
 * @param targetHref
 */
/*charme.plugin.setAsSelected = function (targetHref, targetType) {

 var targetName = targetHref.substring(targetHref.lastIndexOf('/')+1);
 //var targetHrefEncoded = encodeURIComponent(targetHref);
 //var targetHrefEncoded = targetHref;

 //Load the clicked target into the selected list, if not in a clicked state.
 if (!(targetHref in charme.plugin.selectedTargets))
 {
 var targetTypeDesc = targetType.split('-');
 var tempArr = [];
 for(var i = 0; i < targetTypeDesc.length; i++) {
 var descFrag = targetTypeDesc[i];
 descFrag = descFrag[0].toUpperCase() + descFrag.substr(1).toLowerCase();
 tempArr.push(descFrag);
 }
 targetTypeDesc = tempArr.join(' ');

 //Add the target in the list
 charme.plugin.selectedTargets[targetHref] =  [targetName, targetType, targetTypeDesc];

 //Set the checkbox to 'checked' state
 var targetCheckboxs = charme.plugin.getByClass('charme-select', charme.plugin.constants.MATCH_EXACT);
 for (var i = 0; i < targetCheckboxs.length; i++) {
 if (targetCheckboxs[i].id === targetHref) {
 targetCheckboxs[i].checked = true;
 }
 }
 }

 //Save the clicked target into the "highlighted" list.
 //charme.plugin.selectedTargetsHighlighted = {};
 //charme.plugin.selectedTargetsHighlighted[targetName] = targetHrefEncoded;
 }*/



charme.plugin.getSelectedTargets = function () {

    return charme.plugin.selectedTargets;
};


//charme.plugin.getSelectedTargetsHighlighted = function () {
//
//    return charme.plugin.selectedTargetsHighlighted;
//}



//charme.plugin.populateTargetList = function (){
//
//
//    var array_keys = new Array();
//    var keys = '';
//
//    var count = 0;
//
//    for (var key in charme.plugin.selectedTargets) {
//        array_keys.push(key);
//        keys = keys + '\n' + key;
//        count++;
//    }
//
//    //alert('Current Selections : \n' + array_keys);
//    alert('Current Selections : \n' + keys);
//
//
//    for (var i=0; i<count; i++) {
//        //var tempOpt = new Option(charme.plugin.selectedTargets[i], charme.plugin.selectedTargets[i]);
//
//        //charme.plugin.getByClass('targetMultiList')[0].options.add(tempOpt);
//
//        var tempOpt =  document.createElement('Option');
//        tempOpt.value = charme.plugin.selectedTargets[i];
//        tempOpt.innerHTML = charme.plugin.selectedTargets[i];
//        charme.plugin.getByClass('targetMultiList')[0].appendChild(tempOpt);
//
//    }
//
//}



/**
 * Cross browser class selector. Defined in order to avoid add external dependencies on libraries such as JQuery.
 */
charme.plugin.getByClass = function (className, searchType, rootElement) {
	rootElement = rootElement || document;
	//Default to native function if it exists, and your search is exact (not partial)
	if(document.getElementsByClassName && searchType === charme.plugin.constants.MATCH_EXACT) {
		return rootElement.getElementsByClassName(className);
	} else {
		//Else, search exhaustively
		var elArray = [], regex;
		var tmp = rootElement.getElementsByTagName("*");

		if(searchType === charme.plugin.constants.MATCH_EXACT)
			regex = new RegExp("(^|\\s)" + className + "(\\s|$)");
		else if(searchType === charme.plugin.constants.MATCH_PARTIAL)
			regex = new RegExp(className);

		for(var i = 0; i < tmp.length; i++) {
			if(regex.test(tmp[i].className)) {
				elArray.push(tmp[i]);
			}
		}

		return elArray;
	}
};

// Find CHARMe icon insertion points / refresh icon insertion point for specified targetId
charme.plugin.markupTags = function (isFirstLoad, targetId) {
    var activeImage = new Image();
    activeImage.src = charme.settings.path + '/activebuttonsmall.png';
    var inactiveImage = new Image();
    inactiveImage.src = charme.settings.path + '/inactivebuttonsmall.png';
    var noConnectionImage = new Image();
    noConnectionImage.src = charme.settings.path + '/noconnectionbuttonsmall.png';
    
    if(isFirstLoad) {
        var selectAllContainer = document.getElementById('charme-placeholder');
        var selectAllBox = document.createElement('input');
        selectAllBox.type = 'checkbox';
        selectAllContainer.parentNode.insertBefore(selectAllBox, selectAllContainer);
        charme.plugin.setSelectionEventOnTarget(selectAllBox, 'all');
        
        var text = document.createElement('span');
        text.innerHTML = 'Select/unselect all';
		text.id='charme-select-all';
        selectAllContainer.parentNode.insertBefore(text, selectAllContainer);
        
        var allTargetsContainer = document.getElementById('charme-placeholder-all-targets');
        var anchor = document.createElement('a');
        anchor.href = charme.common.ALL_TARGETS;
        anchor.className = 'charme-all-types';
        allTargetsContainer.appendChild(anchor, allTargetsContainer);
        
        text = document.createElement('span');
        text.innerHTML = 'All targets';
		text.id='charme-all-targets'
        allTargetsContainer.insertBefore(text, anchor);
    }
    
    var els = charme.plugin.getByClass('charme-', charme.plugin.constants.MATCH_PARTIAL);
    for(var i = 0; i < els.length; i++) {
        if(els[i].href) {
            //if(isFirstLoad || els[i].href === targetId)
            if(isFirstLoad || els[i].href === targetId || els[i].href === charme.common.ALL_TARGETS)
                charme.plugin.getAnnotationCountForTarget(els[i], activeImage.src, inactiveImage.src, noConnectionImage.src);

            if(isFirstLoad) {
                els[i].style.display = 'inline-block';
                els[i].style.width = '36px';
                els[i].style.height = '26px';
                
                // Insert checkboxes and attach selection events
                if(els[i].href !== charme.common.ALL_TARGETS) {
                    var targetCheckbox = document.createElement('input');
                    targetCheckbox.type = 'checkbox';
                    targetCheckbox.className = 'charme-select';
                    targetCheckbox.id = els[i].href;
                    targetCheckbox.name = charme.plugin.extractTargetType(els[i].className);
                    els[i].parentNode.insertBefore(targetCheckbox, els[i]);
                    charme.plugin.setSelectionEventOnTarget(targetCheckbox, 'target');
                }
            }
        }
    }
};

charme.plugin.extractTargetType = function(className) {
	var targetType = className.substring('charme-'.length);
	if(targetType.length > 0)
		return(targetType);
	else
		return('Type undefined');

	/*var targetType = className.split('-');

	 if(targetType.length > 1 && targetType[1].length > 0) {
	 targetType = targetType[1];
	 targetType = targetType[0].toUpperCase() + targetType.substr(1).toLowerCase();
	 return(targetType[0].toUpperCase() + targetType.substr(1).toLowerCase());
	 }
	 else
	 return('Type undefined');*/
};

/* ============================================================================================  */
/**
 * Function to capture messages fromm the Plugin Iframe
 */

function listenMessage(msg) {
	var _msg= msg.data;
	var n = _msg.lastIndexOf(':::');
	var targetId = _msg.substring(n + 3);

	charme.plugin.markupTags(false, targetId);
}

if (window.addEventListener) {
	window.addEventListener("message", listenMessage, false);
} else {
	window.attachEvent("onmessage", listenMessage);
}

/* ============================================================================================  */

/**
 * Creates the iFrame in which the plugin will be hosted. Should only be called once
 */
charme.plugin.loadPlugin = function () {
    /* Use an iframe to completely isolate plugin from javascript and css on the main site */
    
    // Don't use createElement here, because in IE11 you won't be able to use input fields (weird bug)
    //var plugin = document.createElement('iframe');
    //document.lastChild.appendChild(plugin);
    
    var plugin = document.getElementById('charme-placeholder');
    plugin.innerHTML += '<iframe id="charme-iframe" name="charme-iframe"></iframe>';
    plugin = plugin.lastChild;

    plugin.frameBorder = "no";
    plugin.id = 'charme-plugin-frame';
    plugin.style.backgroundColor = 'transparent';
    //plugin.style.minWidth = '1260px';
    plugin.style.display = 'none';
    plugin.style.margin = 'auto';
    plugin.style.position = 'fixed';
    plugin.style.left = '0';
    plugin.style.right = '0';
    plugin.style.bottom = '0';
    plugin.style.top = '0';
    //plugin.style.paddingTop = '50px';
    //plugin.style.paddingLeft = '25px';
    plugin.style.height = '100%';
    plugin.style.zIndex = 1000;
    plugin.allowTransparency = true;
    plugin.setAttribute('scrolling', 'no');
    
    if(screen.width <= charme.common.SMALL_SCREEN) {
        plugin.style.minWidth = '1262px';
    }
    else {
        plugin.style.minWidth = '1367px';
        plugin.style.paddingTop = '50px';
        plugin.style.paddingLeft = '25px';
    }
};

/**
 * A callback function used for hiding the plugin. Because the iFrame that the plugin is held in is created outside of the plugin itself (within the scope of the hosted environment), it must also be hidden from this scope. Using a callback avoids the plugin having to know anything about its hosted environment.
 */
charme.plugin.closeFunc = function (isOneTarget, targetId) {
	var plugin = document.getElementById('charme-plugin-frame');
	plugin.contentWindow.location.href = 'about:blank';
        charme.plugin.maximiseFunc(); // In case GUI was closed while minimised
	plugin.style.display = 'none';
        
        //if(isOneTarget) {
        if(isOneTarget && targetId !== charme.common.ALL_TARGETS) {
            var targetCheckboxs = charme.plugin.getByClass('charme-select', charme.plugin.constants.MATCH_EXACT);
            targetCheckboxs[targetId].click();
        }
        
        if(charme.plugin.selectedTargets.hasOwnProperty(charme.common.ALL_TARGETS))
            delete charme.plugin.selectedTargets[charme.common.ALL_TARGETS];
            
        charme.plugin.disableWholeTargetList(false);
        charme.plugin.isOpenFlag = false;
        
        //charme.plugin.loadPlugin();
};

charme.plugin.miniaturiseFunc = function () {
    var plugin = document.getElementById('charme-plugin-frame');
    //plugin.style.height = '40%';
    //plugin.style.minWidth = '720px';
    //plugin.style.paddingTop = '300px';
    
    plugin.style.minWidth = '450px';
    plugin.style.height = '74px';
    
};

charme.plugin.maximiseFunc = function () {
    var plugin = document.getElementById('charme-plugin-frame');
    plugin.style.height = '100%';
    //plugin.style.minWidth = '1260px';
    //plugin.style.paddingLeft = '25px';
    //plugin.style.paddingTop = '50px';
    
    if(screen.width <= charme.common.SMALL_SCREEN) {
        plugin.style.minWidth = '1262px';
    }
    else {
        plugin.style.minWidth = '1367px';
        plugin.style.paddingTop = '50px';
        plugin.style.paddingLeft = '25px';
    }
};

/**
 * Registers the close and minituarise function listeners with the plugin itself. The close buttons exist within the plugin, so the event will be fired from there.
 */
charme.plugin.loadFunc = function () {

	//Close listeners
	//this.contentWindow.charme.web.removeCloseListener(charme.plugin.closeFunc);
	this.contentWindow.charme.web.addCloseListener(charme.plugin.closeFunc);

	//Minimise & Maximise listeners
	//this.contentWindow.charme.web.removeMiniaturiseListener(charme.plugin.miniaturiseFunc);
	this.contentWindow.charme.web.addMiniaturiseListener(charme.plugin.miniaturiseFunc);

	//this.contentWindow.charme.web.removeMaximiseListener(charme.plugin.maximiseFunc);
	this.contentWindow.charme.web.addMaximiseListener(charme.plugin.maximiseFunc);

	charme.common.removeEvent(this, 'load', charme.plugin.loadFunc); // Remove the loadfunc. Only want it to load once
};

charme.plugin.stopBubble = function(e){
    /*
     * Prevent default behaviour for anchor onclick (ie following the link)
     */
    if (e && e.stopPropagation) { // Non-IE browsers
            e.preventDefault(); // Prevent default behaviour, but NOT BUBBLING - This is an important distinction, 
            // we don't want to prevent events firing further up the chain as this might interfere with data provider's site.
    } else { // IE versions <= 8
            if (window.event) {
                    window.event.returnValue = false; // Prevent default behaviour, but NOT BUBBLING
            }
            if (e) {
                    e.returnValue = false;
            }
    }
};
/**
 * Renders the plugin visible
 * @param e event object. This is used
 */
charme.plugin.showPlugin = function (e) {
        charme.plugin.stopBubble(e);
        
        if(charme.plugin.isOpenFlag)
            return;        
    
	var plugin = document.getElementById('charme-plugin-frame');
	charme.common.addEvent(plugin, 'load', charme.plugin.loadFunc);

        //charme.plugin.stopBubble(e);
	var targetHref = '', targetType = '';
	if (typeof e.target === 'undefined') {
		targetHref = e.srcElement.href;
                //targetType = charme.plugin.extractTargetType(e.srcElement.className);
	} else {
		targetHref = e.target.href;
                //targetType = charme.plugin.extractTargetType(e.target.className);
	}
        
        if(targetHref === charme.common.ALL_TARGETS) {
            charme.plugin.selectedTargets[targetHref] = ['All Targets', 'Alltypes', 'all types'];
            charme.plugin.disableWholeTargetList(true);
        }
        
        
        // If data provider allows the plugin GUI to be dragged, insert script (first removing it if already present) and set 
        // option to allow dragging off screen. We remove the script first as dragiframe.js has no clear/removeHandle() method.
        var dragScript = document.getElementById("dragiframeScript");
        if(dragScript)
            dragScript.parentNode.removeChild(dragScript);
        
        var _plugin = document.getElementById('charme-placeholder');
        if(_plugin.className === 'charme-draggable') {
            dragScript = document.createElement('script');
            dragScript.id = 'dragiframeScript';
            dragScript.type = 'text/javascript';
            dragScript.src = scriptPath + '/plugin/js/vendor/dragiframe.js';
            document.getElementsByTagName('body')[0].appendChild(dragScript);

            if(dragScript.readyState) {
                dragScript.onreadystatechange = function () {
                    if (dragScript.readyState === "loaded" || dragScript.readyState === "complete") {
                        dragScript.onreadystatechange = null;
                        (function() {return dragIF_allowDragOffScreen(true);}());
                    }
                };
            }
            else
                dragScript.onload = function() {return dragIF_allowDragOffScreen(true);};
        }

        function _showPlugin() {
            charme.common.removeEvent(plugin, 'load', _showPlugin);
            plugin.style.display = 'block'; // Only show the iFrame once the content has loaded in order to minimize flicker
	}
	charme.common.addEvent(plugin, 'load', _showPlugin);
	plugin.contentWindow.location.href = charme.settings.path + '/plugin/plugin.html#/' +
            encodeURIComponent(encodeURIComponent(targetHref)) + '/init';
        
        charme.plugin.isOpenFlag = true;

    ////charme.plugin.populateTargetList();
    //charme.plugin.setAsSelected(targetHref, targetType);
    
    //if (!(targetHref in charme.plugin.selectedTargets)) {
    if (!(targetHref in charme.plugin.selectedTargets) && targetHref !== charme.common.ALL_TARGETS) {
        var targetCheckboxs = charme.plugin.getByClass('charme-select', charme.plugin.constants.MATCH_EXACT);
        targetCheckboxs[targetHref].click();
    }
};

var scriptPath;
charme.plugin.preInit = function () {
	/**
	 * This is duplicated (unfortunately) from charme.common.js. The code below should not be used anywhere else.
	 */
	var scripts = document.getElementsByTagName('script');
	scriptPath = scripts[scripts.length - 1].src;//The last loaded script will be this one
	if (!/charme\.js$/.test(scriptPath)) {
		if (typeof console !== 'undefined' && console.error) {
			console.error('Unable to initialise CHARMe plugin. Error determining script path');
		}
		return;
	}
	scriptPath = scriptPath.substring(0, scriptPath.lastIndexOf('/'));

	/**
	 * Include other required source files
	 */
	var loadSettings = function () {
		var settingsScript = document.createElement('script');
		settingsScript.type = 'text/javascript';
		settingsScript.src = scriptPath + '/charme.settings.js';

                if(settingsScript.readyState) {
                    settingsScript.onreadystatechange = function () {
                        if (settingsScript.readyState === "loaded" || settingsScript.readyState === "complete") {
                            settingsScript.onreadystatechange = null;
                            charme.plugin.init();
                        }
                    };
                }
                else
                    settingsScript.onload = charme.plugin.init;
                
		document.getElementsByTagName('body')[0].appendChild(settingsScript);
                
                /*// If data provider allows the plugin GUI to be dragged, insert script and set option to allow dragging off screen
                var plugin = document.getElementById('charme-placeholder');
                if(plugin.className === 'charme-draggable') {
                    var dragScript = document.createElement('script');
                    dragScript.type = 'text/javascript';
                    dragScript.src = scriptPath + '/plugin/js/vendor/dragiframe.js';
                    document.getElementsByTagName('body')[0].appendChild(dragScript);

                    if(dragScript.readyState) {
                        dragScript.onreadystatechange = function () {
                            if (dragScript.readyState === "loaded" || dragScript.readyState === "complete") {
                                dragScript.onreadystatechange = null;
                                (function() {return dragIF_allowDragOffScreen(true);}());
                            }
                        };
                    }
                    else
                        dragScript.onload = function() {return dragIF_allowDragOffScreen(true);};
                }*/
	};

	var loadCommon = function () {
		var commonScript = document.createElement('script');
		commonScript.type = 'text/javascript';
		commonScript.src = scriptPath + '/charme.common.js';
                
                if(commonScript.readyState) {
                    commonScript.onreadystatechange = function () {
                        if (commonScript.readyState === "loaded" || commonScript.readyState === "complete") {
                            commonScript.onreadystatechange = null;
                            loadSettings();
                        }
                    };
                }
                else
                    commonScript.onload = loadSettings;
                
		document.getElementsByTagName('body')[0].appendChild(commonScript);
	};

	loadCommon();
};

/**
 * Will execute on window load (most init code should go in here)
 */
charme.plugin.init = function () {
	charme.plugin.markupTags(true);
	charme.plugin.loadPlugin();
};

charme.plugin.preInit();

//master