/*
 * charme.logic.js
 * 
 * Functions for abstracting the lower level functions of the jsonoa.js library
 */
if (!charme)
	var charme= {};
charme.logic = {};


charme.logic.constants={
		ATN_ID_PREFIX:'http://localhost/',
		BODY_ID_PREFIX:'http://localhost/',
		REMOTE_BASE_URL: 'http://charme-dev.cems.rl.ac.uk/',
		DOI_PREFIX: 'http://dx.doi.org/'
};

/**
 * Escapes characters in the string that are not safe to use in a RegExp.
 * Taken from Google closure library - https://developers.google.com/closure/library/
 * @param {*} s The string to escape. If not a string, it will be casted
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
charme.logic.fetchRequest=function (id){
	return (charme.logic.constants.REMOTE_BASE_URL.match(/\/$/) ? charme.logic.constants.REMOTE_BASE_URL : charme.logic.constants.REMOTE_BASE_URL + '/') + 'data/' + id;
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
 * 		successCB: a callback to be invoked on successful completion
 * 		errorCB: a callback to be invoked on error
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

/**
 * IMPORTANT: DO NOT propagate Promise.js beyond this point. Everything else uses the jquery promise model.
 */
charme.logic.fetchAnnotation = function(annoId, successCB, errorCB){
	var reqUrl = charme.logic.fetchRequest(annoId);
	$.ajax(reqUrl, {
		dataType: 'json',
	    accepts: {
	        json: "application/ld+json"
	    },
		type: 'GET',
		success: 
			function(data){
				//first, expand the data. Expanding the data standardises it and simplifies the process of parsing it.
			    var processor = new jsonld.JsonLdProcessor();
			    // set base IRI
			    var options = {base: document.baseURI};
			    //DO NOT bubble ANY Promise.js promises above this level.
			    processor.expand(data, options).then(function(expData){
					OA.deserialize(expData).then(function(graph){
						successCB(graph);
					});
			    })['catch'](errorCB); // 'catch' - worst, function name, ever. Thanks W3C.
			},
		error:
			function(jqXHR, textStatus, errorThrown){
				errorCB();
			},
	});
};

/*
 * Retrieve all annotations for the specified state
 * 
 * Parameters:
 * 		successCB: a callback to be invoked on successful completion. The returned JSON-LD graph will be passed into this function
 * 		errorCB: a callback to be invoked on error
 */
charme.logic.fetchAnnotations=function(state, successCB, errorCB){
	var reqUrl = charme.logic.existRequest(state);
	$.ajax(reqUrl, {
		dataType: 'json',
		type: 'GET',
		contentType: 'application/ld+json',
		success: 
			function(data){
				//first, expand the data. Expanding the data standardises it and simplifies the process of parsing it.
			    var processor = new jsonld.JsonLdProcessor();
			    // set base IRI
			    var options = {base: document.baseURI};
			    processor.expand(data, options).then(function(expData){
					OA.deserialize(expData).then(function(graph){
						successCB(graph);
					});
			    })['catch'](errorCB); // 'catch' - worst, function name, ever. Thanks W3C.
			},
		error:
			function(jqXHR, textStatus, errorThrown){
				errorCB();
			},
	});
};

/*
 * Change the status of the given annotation. All transitions between states are allowed.
 * 
 * Parameters:
 * 		annotationId: The annotation to modify
 * 		newState: The state to advance to
 * 		successCB: a callback to be invoked on successful completion.
 * 		errorCB: a callback to be invoked on error
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