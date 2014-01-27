/*
 * charme.logic.js
 * 
 * Functions for abstracting the lower level functions of the jsonoa.js library
 */
if (!charme){
	var charme= {};
	if (typeof wgxpath !== 'undefined'){
		wgxpath.install();
	}
}
charme.logic = {};


charme.logic.constants={
		ATN_ID_PREFIX:'http://localhost/',
		BODY_ID_PREFIX:'http://localhost/',
		REMOTE_BASE_URL: '@@triplestore.url@@',
		DOI_PREFIX: 'http://dx.doi.org/',
		URL_PREFIX: 'http://',
		
		//CROSSREF_URL: 'http://www.crossref.org/openurl/',
		CROSSREF_URL: 'http://data.crossref.org/',
		CROSSREF_CRITERIA_DOI:'id'		
};

/**
 * Escapes characters in the string that are not safe to use in a RegExp.
 * Taken from Google closure library - https://developers.google.com/closure/library/
 * @param {*} s The string to escape. If not a string, it will be cast
 *     to one.
 * @return {string} A RegExp safe, escaped copy of {@code s}.
 */
charme.logic.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').
      replace(/\x08/g, '\\x08');
};

/*
 * A series of utility functions for constructing REST requests to the various CHARMe web services
 * Main reference source for this is the CHARMe Node ICD
 */
charme.logic.existRequest=function (uri){
	return (charme.logic.constants.REMOTE_BASE_URL.match(/\/$/) ? charme.logic.constants.REMOTE_BASE_URL : charme.logic.constants.REMOTE_BASE_URL + '/') + 'index/' + uri + '?format=json-ld';
};
charme.logic.createRequest=function(){
	return (charme.logic.constants.REMOTE_BASE_URL.match(/\/$/) ? charme.logic.constants.REMOTE_BASE_URL : charme.logic.constants.REMOTE_BASE_URL + '/') + 'insert/annotation';
};
charme.logic.stateRequest=function(newState){
	return (charme.logic.constants.REMOTE_BASE_URL.match(/\/$/) ? charme.logic.constants.REMOTE_BASE_URL : charme.logic.constants.REMOTE_BASE_URL + '/') + 'advance_status';
};
charme.logic.fetchForTarget=function (targetId){
	return (charme.logic.constants.REMOTE_BASE_URL.match(/\/$/) ? charme.logic.constants.REMOTE_BASE_URL : charme.logic.constants.REMOTE_BASE_URL + '/') + 'search/atom?target=' + encodeURIComponent(targetId) + '&status=submitted';
};
charme.logic.fetchRequest=function (id){
	return (charme.logic.constants.REMOTE_BASE_URL.match(/\/$/) ? charme.logic.constants.REMOTE_BASE_URL : charme.logic.constants.REMOTE_BASE_URL + '/') + 'data/' + id;
};

charme.logic.crossRefRequest=function(criteria){
	var url=null;
	if (criteria[charme.logic.constants.CROSSREF_CRITERIA_DOI] && criteria[charme.logic.constants.CROSSREF_CRITERIA_DOI].length > 0){
		url=charme.logic.constants.CROSSREF_URL + criteria[charme.logic.constants.CROSSREF_CRITERIA_DOI];
	}
	return url;
};

charme.logic.generateGUID = function(){
	return 'xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
};

charme.logic.fetchCrossRefMetaData=function(criteria){
	var promise = new Promise(function(resolver){
		var reqUrl = charme.logic.crossRefRequest(criteria);
		if (reqUrl === null || reqUrl.length ===0){
			resolver.reject();
		}
		$.ajax(reqUrl, {
			headers:{
				accept: 'text/bibliography; style=apa; locale=en-US'
			}
		}).then(
			function(xmlResp){
				resolver.fulfill(xmlResp);
			}, function(e){
			resolver.reject(e);
		});
	});
	return promise;
};

/*
 * Given a state, returns true if any metadata exists for this resource 
 */
charme.logic.exists=function(state, successCB, errorCB){
	var reqUrl = charme.logic.existRequest(state);
	$.ajax(reqUrl, {
		dataType: 'json',
		success: successCB,
		error: errorCB
	});
};

/*
 * Persist a populated annotation to the triplestore
 * 
 * Parameters:
 *		successCB: a callback to be invoked on successful completion
 *		errorCB: a callback to be invoked on error
 */
charme.logic.createAnnotation=function(annotation, successCB, errorCB){
	var reqUrl = charme.logic.createRequest();
	var jsonObj = annotation.serialize();
	var stringified = JSON.stringify(jsonObj);
	$.ajax(reqUrl, {
		dataType: 'json',
		type: 'POST',
		contentType: 'application/ld+json',
		success: successCB,
		error: errorCB,
		data: stringified,
	});
};

/*
 * Retrieve all annotations for the specified state
 * 
 * Parameters:
 *		successCB: a callback to be invoked on successful completion. The returned JSON-LD graph will be passed into this function
 *		errorCB: a callback to be invoked on error
 */
charme.logic.fetchAnnotationsForTarget=function(targetId){
	var promise = new Promise(function(resolver){
		var reqUrl = charme.logic.fetchForTarget(targetId);
		$.ajax(reqUrl, {type: 'GET'}).then(
				function(data){
					//Data is returned as ATOM wrapped json-ld
					var result = new charme.atom.result(data);
					//Extract json-ld from the multiple 'content' payloads returned
					var resultArr = [];
					$.each(result.entries, function(index, value){
						var shortGraph = $.parseJSON(value.content);
						resultArr.push(shortGraph['@graph']);
						
					});
					var graph = {'@graph': resultArr};
	
					//first, expand the data. Expanding the data standardises it and simplifies the process of parsing it.
					var processor = new jsonld.JsonLdProcessor();
					var options = {base: document.baseURI};
					processor.expand(graph, options).then(OA.deserialize).then(function(graph){
							resolver.fulfill(graph);
					}, function(e){
						resolver.reject(e);
						});
				},
				function(jqXHR, textStatus, errorThrown){
					resolver.reject();
				}
		);
	});
	return promise;
};

/*
 * Change the status of the given annotation. All transitions between states are allowed.
 * 
 * Parameters:
 *		annotationId: The annotation to modify
 *		newState: The state to advance to
 *		successCB: a callback to be invoked on successful completion.
 *		errorCB: a callback to be invoked on error
 */
charme.logic.advanceState=function(annotationId, newState, successCB, errorCB){
	var url = charme.logic.stateRequest(newState);
	$.ajax(url, {
		dataType: 'json',
		type: 'POST',
		contentType: 'application/json',
		data: {annotation: annotationId, toState: newState},
		success: successCB,
		error: errorCB
	});
};