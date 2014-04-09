if (!charme)
	var charme = {};

charme.settings = {
	path: null
};

charme.common = {};

charme.common.isIE11 = navigator.userAgent.indexOf(".NET CLR") > -1;      
charme.common.isIE11orLess = charme.common.isIE11 || navigator.appVersion.indexOf("MSIE") != -1;

/**
 * Finds the path to the current script (for referencing images etc.) DO NOT INVOKE THIS FUNCTION DIRECTLY
 */
charme.common._scriptPath = function(){
	var scripts = document.getElementsByTagName('script');
	var scriptPath = scripts[scripts.length-1].src;
	if (!/charme\..*\.js$/.test(scriptPath)){
		//FUNCTION SHOULD ONLY EVER BE INVOKED FROM THIS FILE, OTHERWISE RESULTS UNPREDICTABLE
		if (console && console.error){
			console.error('Unable to initialise CHARMe plugin. Error determining script path');
		}
		return;
	}
	scriptPath = scriptPath.substring(0, scriptPath.lastIndexOf('/'));
	charme.settings.path=scriptPath;
};

charme.common.parameterise = function(str){
	if (str === "") return {};
	var a = str.split('&');
	var b = {};
	for (var i = 0; i < a.length; ++i)
	{
		var p=a[i].split('=');
		if (p.length != 2) continue;
		b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
	}
	return b;
};

/**
 * Parses parameters that are passed to this page as URL query string. Is executed automatically on page load, 
 * and will return parameters in associative array with structure ["paramName":"paramValue"]
 */
charme.common.params = 
	charme.common.parameterise(window.location.search.substr(1));

/**
 * Cross-browser event handling
 */
charme.common.addEvent = function(el, ev, fn){
	if (el.addEventListener){
		el.addEventListener(ev, fn, false);
	} else if (el.attachEvent){
		el.attachEvent("on" + ev, fn);
	} else {
		//Do nothing.
	}
};

charme.common.removeEvent = function(el, ev, fn){
	if (el.removeEventListener){
		el.removeEventListener(ev, fn, false);
	} else if (el.detachEvent){
		el.detachEvent("on" + ev, fn);
	} else {
		//Do nothing.
	}
};

(function(){
charme.common._scriptPath();
})();