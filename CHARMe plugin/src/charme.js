var charme = {};
charme.plugin = {};
charme.settings = {
	path: null
};

/**
 * Cross-browser event handling
 */
charme.plugin.addEvent = function(el, ev, fn){
	if (el.addEventListener){
		el.addEventListener(ev, fn, false);
	} else if (el.attachEvent){
		el.attachEvent("on" + ev, fn);
	} else {
		//Do nothing.
	}
} 

/**
 * Cross browser class selector
 */
charme.plugin.getByClass = function(className){
	//Default to native function if it exists
	if (document.getElementsByClassName){
		return document.getElementsByClassName(className);
	} else {
		//Else, go huntin'
        var elArray = [];
        var tmp = document.getElementsByTagName("*");
        var regex = new RegExp("(^|\\s)" + className + "(\\s|$)");
        for (var i = 0; i < tmp.length; i++) {

            if (regex.test(tmp[i].className)) {
                elArray.push(tmp[i]);
            }
        }

        return elArray;
	}
}

/**
 * Finds the path to the current script (for referencing images etc.)
 */
charme.plugin.setScriptPath = function(){
	var scripts = document.getElementsByTagName('script');
	var scriptPath = scripts[scripts.length-1].src;
	scriptPath = scriptPath.substring(0, scriptPath.lastIndexOf('/'));
	charme.settings.path=scriptPath;
};

/**
 * Find CHARMe icon insertion points
 */
charme.plugin.markupTags = function(){
	//preload charme icon
	var bgImage = new Image();
	bgImage.src = charme.settings.path + '/charme-logo.png';
	
	var els = charme.plugin.getByClass('charme-dataset');
	for (var i=0; i < els.length; i++){
		els[i].style.display='inline-block';
		els[i].style.width='22px';
		els[i].style.height='23px';
		els[i].title='CHARMe metadata available';
		els[i].style.background = 'url("' + bgImage.src + '") no-repeat left top';
		charme.plugin.addEvent(els[i], 'click', charme.plugin.showPlugin);
	}
}

charme.plugin.loadPlugin = function(){
	/* Use an iframe to completely isolate plugin from javascript and css on the main site */
	var plugin = document.createElement('iframe');
	plugin.frameBorder = "no";
	plugin.id='charme-plugin-frame';
	plugin.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms');
	document.lastChild.appendChild(plugin);
	plugin.style.backgroundColor='transparent';
	plugin.style.minWidth='640px';
	plugin.style.display='none';
	plugin.style.margin='auto';
	plugin.style.position='absolute';
	plugin.style.left='0';
	plugin.style.right='0';
	plugin.style.bottom='0';
	plugin.style.top='0';
	plugin.allowTransparency=true;
	plugin.style.height='480px';
	plugin.setAttribute('scrolling','no');
	
	charme.plugin.addEvent(plugin, 'load', function(){
		plugin.contentWindow.charme.web.setCloseCallback(function() {
			plugin.style.display='none';
		});
		plugin.contentWindow.charme.web.setResizeFunction(function(){alert('resize')});
		plugin.style.display='block'; // Only show the iframe once the content has loaded in order to minimize flicker
	});
}

charme.plugin.showPlugin = function(e){
	var plugin = document.getElementById('charme-plugin-frame');
	
	/*
	 * Prevent default behaviour for anchor onclick (ie following the link)
	 */
	if (e && e.stopPropagation){ // Non-IE browsers
		e.preventDefault(); // Prevent default behaviour, but NOT BUBBLING - This is an important distinction, 
							// we don't want to prevent events firing further up the chain as this might interfere with data provider's site.
	}
	else { // IE versions <= 8
		if (window.event){
			window.event.returnValue=false; // Prevent default behaviour, but NOT BUBBLING
		}
		if (e){
			e.returnValue=false;
		}
	}
	var url = charme.settings.path + '/plugin/plugin.html?targetId=' + encodeURIComponent(e.target.href);
	
	plugin.src = url;
}

/**
 * Will execute on window load (most init code should go in here)
 */
charme.plugin.init = function(){
	charme.plugin.markupTags();
	charme.plugin.loadPlugin();
};

/**
 * Will execute immediately (should rarely be used)
 */
(function(){
	charme.plugin.setScriptPath();
	charme.plugin.addEvent(window, "load", charme.plugin.init);
})();