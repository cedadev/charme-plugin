"use strict";
if (!charme) {
	var charme = {};
}

//Define an object that will provide scope for charme-specific functions and fields
charme.plugin = {};

charme.plugin.constants = function () {
	this.XPATH_BASE = '//atm:feed';
	this.XPATH_TOTAL_RESULTS = this.XPATH_BASE + '/os:totalResults';
	//this.XPATH_TOTAL_RESULTS	= '//os:totalResults';
};

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
charme.plugin.getAnnotationCountForTarget = function (el, activeImgSrc, inactiveImgSrc, noConnectionImgSrc) {
	charme.plugin.ajax(charme.plugin.request.fetchForTarget(el.href), function (xmlDoc) {
		// Success callback
		var constants = new charme.plugin.constants();
		var annoCount = 0;                
		if (typeof XPathResult !== 'undefined') {
			annoCount = charme.plugin.xpathQuery(constants.XPATH_TOTAL_RESULTS, xmlDoc,
				XPathResult.NUMBER_TYPE);
		} else {
			//Internet explorer
			annoCount = charme.plugin.xpathQuery(constants.XPATH_TOTAL_RESULTS, xmlDoc);//,
				//XPathResult.ANY_TYPE);
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
                
                // Show the annotation count next to the CHARMe icon - use the className 'charme-count' to hide the count if desired
                var showCount = charme.plugin.getByClass('charme-count', 'exact', el.parentNode);
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
                el.style.background = 'url("' + noConnectionImgSrc + '") no-repeat left top';
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
 * Cross browser class selector. Defined in order to avoid add external dependencies on libraries such as JQuery.
 */
charme.plugin.getByClass = function (className, searchType, rootElement) {
    //Default to native function if it exists, and your search is exact (not partial)
    if(document.getElementsByClassName && searchType === "exact") {
        return rootElement.getElementsByClassName(className);
    } else {
        //Else, search exhaustively
        var elArray = [], regex;
        var tmp = rootElement.getElementsByTagName("*");

        if(searchType === "exact")
            regex = new RegExp("(^|\s)" + className + "(\s|$)");
        else if(searchType === "partial")
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

    var els = charme.plugin.getByClass('charme-', 'partial', document);
    for(var i = 0; i < els.length; i++) {
        if(els[i].href) {
            if(isFirstLoad || els[i].href === targetId)
                charme.plugin.getAnnotationCountForTarget(els[i], activeImage.src, inactiveImage.src, noConnectionImage.src);

            if(isFirstLoad) {
                els[i].style.display = 'inline-block';
                els[i].style.width = '36px';
                els[i].style.height = '26px';
            }
        }
    }
};

/*charme.plugin.markupTags = function () {
	//preload charme icon
	var activeImage = new Image();
	activeImage.src = charme.settings.path + '/activebuttonsmall.png';
	var inactiveImage = new Image();
	inactiveImage.src = charme.settings.path + '/inactivebuttonsmall.png';
        var noConnectionImage = new Image();
	noConnectionImage.src = charme.settings.path + '/noconnectionbuttonsmall.png';

	var els = charme.plugin.getByClass('charme-', 'partial', document);
	for (var i = 0; i < els.length; i++) {
		if (els[i].href) {
			charme.plugin.getAnnotationCountForTarget(els[i], activeImage.src, inactiveImage.src, noConnectionImage.src);
		}
		els[i].style.display = 'inline-block';
		els[i].style.width = '36px';
		els[i].style.height = '26px';
	}
};*/

/* ============================================================================================  */
/**
 * Function to capture messages fromm the Plugin Iframe
 */

function listenMessage(msg) {
    var _msg= msg.data;
    var n = _msg.lastIndexOf(':::');
    var targetId = _msg.substring(n + 3);

    //charme.plugin.markupTargetRefresh(targetId);
    charme.plugin.markupTags(false, targetId);
}

if (window.addEventListener) {
    window.addEventListener("message", listenMessage, false);
} else {
    window.attachEvent("onmessage", listenMessage);
}


/**
 * Refresh CHARMe icon insertion point for specified TargetId
 */
/*charme.plugin.markupTargetRefresh = function (targetId) {
        //preload charme icon
        var activeImage = new Image();
        activeImage.src = charme.settings.path + '/activebuttonsmall.png';
        var inactiveImage = new Image();
        inactiveImage.src = charme.settings.path + '/inactivebuttonsmall.png';
        var noConnectionImage = new Image();
        noConnectionImage.src = charme.settings.path + '/noconnectionbuttonsmall.png';

        var els = charme.plugin.getByClass('charme-', 'partial', document);
        for (var i = 0; i < els.length; i++) {
            if (els[i].href && els[i].href === targetId) {
                    charme.plugin.getAnnotationCountForTarget(els[i], activeImage.src, inactiveImage.src, noConnectionImage.src);
            }
        }
};*/

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
    plugin.innerHTML = '<iframe></iframe>';
    plugin = plugin.firstChild;

    plugin.frameBorder = "no";
    plugin.id = 'charme-plugin-frame';
    plugin.style.backgroundColor = 'transparent';
    plugin.style.minWidth = '1040px';
    plugin.style.display = 'none';
    plugin.style.margin = 'auto';
    plugin.style.position = 'fixed';
    plugin.style.left = '0';
    plugin.style.right = '0';
    plugin.style.bottom = '0';
    plugin.style.top = '0';
    plugin.style.paddingTop = '50px';
    plugin.style.height = '100%';
    plugin.style.zIndex = 1000;
    plugin.allowTransparency = true;
    plugin.setAttribute('scrolling', 'no');
};

/**
 * A callback function used for hiding the plugin. Because the iFrame that the plugin is held in is created outside of the plugin itself (within the scope of the hosted environment), it must also be hidden from this scope. Using a callback avoids the plugin having to know anything about its hosted environment.
 */
charme.plugin.closeFunc = function () {
	var plugin = document.getElementById('charme-plugin-frame');
	plugin.style.display = 'none';
};

/**
 * Registers the close function listeners with the plugin itself. The close buttons exist within the plugin, so the event will be fired from there.
 */
charme.plugin.loadFunc = function () {
	this.contentWindow.charme.web.removeCloseListener(charme.plugin.closeFunc);
	this.contentWindow.charme.web.addCloseListener(charme.plugin.closeFunc);
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
}

/**
 * Renders the plugin visible
 * @param e event object. This is used
 */
charme.plugin.showPlugin = function (e) {
	var plugin = document.getElementById('charme-plugin-frame');
	charme.common.removeEvent(plugin, 'load', charme.plugin.loadFunc);
	charme.common.addEvent(plugin, 'load', charme.plugin.loadFunc);

        charme.plugin.stopBubble(e);
	var targetHref = '';
	if (typeof e.target === 'undefined') {
		targetHref = e.srcElement.href;
	} else {
		targetHref = e.target.href;
	}

	plugin.contentWindow.location.href = charme.settings.path + '/plugin/plugin.html#/' +
		encodeURIComponent(encodeURIComponent(targetHref)) + '/init';
	plugin.style.display = 'block'; // Only show the iFrame once the content has loaded in order to minimize flicker
};

charme.plugin.preInit = function () {

	/**
	 * This is duplicated (unfortunately) from charme.common.js. The code below should not be used anywhere else.
	 */
	var scripts = document.getElementsByTagName('script');
	var scriptPath = scripts[scripts.length - 1].src;//The last loaded script will be this one
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
		settingsScript.onreadystatechange = charme.plugin.init;
		settingsScript.onload = charme.plugin.init;
		document.getElementsByTagName('body')[0].appendChild(settingsScript);
	};

	var loadCommon = function () {
		var commonScript = document.createElement('script');
		commonScript.type = 'text/javascript';
		commonScript.src = scriptPath + '/charme.common.js';
		commonScript.onreadystatechange = loadSettings;
		commonScript.onload = loadSettings;
		document.getElementsByTagName('body')[0].appendChild(commonScript);
	};

	loadCommon();

};

/**
 * Will execute on window load (most init code should go in here)
 */
charme.plugin.init = function () {
	//charme.plugin.markupTags();
        charme.plugin.markupTags(true);
	charme.plugin.loadPlugin();
};

charme.plugin.preInit();
