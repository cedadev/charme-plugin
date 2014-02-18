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

charme.logic.authToken = '';

charme.logic.constants={
		ATN_ID_PREFIX:'http://localhost/',
		BODY_ID_PREFIX:'http://localhost/',
		REMOTE_BASE_URL: '@@triplestore.url@@',
		DOI_PREFIX: 'http://dx.doi.org/',
		URL_PREFIX: 'http://',
		
		//CROSSREF_URL: 'http://www.crossref.org/openurl/',
		CROSSREF_URL: 'http://data.crossref.org/',
		CROSSREF_CRITERIA_DOI:'id',
		NERC_SPARQL_EP: 'http://vocab.nerc.ac.uk/sparql/sparql',
		
		SPARQL_GCMD:	'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>						' +
						'PREFIX skos: <http://www.w3.org/2004/02/skos/core#>							' +
						'SELECT ?p ?l WHERE																' +
						'{																				' +
						'	<http://vocab.nerc.ac.uk/collection/P64/current/> rdf:type skos:Collection.	' +
						'	<http://vocab.nerc.ac.uk/collection/P64/current/> ?o ?p.					' +
						'	?p skos:prefLabel ?l														' +
						'}																				' +
						'ORDER BY ?l																	'
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
	return (charme.logic.constants.REMOTE_BASE_URL.match(/\/$/) ? charme.logic.constants.REMOTE_BASE_URL : charme.logic.constants.REMOTE_BASE_URL + '/') + 'data/' + id + '?format=json-ld';
};

charme.logic.gcmdVocabRequest=function (sparqlQry){
	var url = charme.logic.constants.NERC_SPARQL_EP;
	url+='?query=' + encodeURIComponent(charme.logic.constants.SPARQL_GCMD);
	url+='&output=json';
	return url;
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

/**
 * Fetches and processes the GCMD keywords used for specifying the domain of interest
 * @returns {Promise}
 */
charme.logic.fetchGCMDVocab=function(){
	var promise = new Promise(function(resolver){
		var reqUrl = charme.logic.gcmdVocabRequest(charme.logic.constants.SPARQL_GCMD);
		if (reqUrl === null || reqUrl.length ===0){
			resolver.reject();
		}
		$.ajax(reqUrl, {
			headers:{
				accept: 'application/sparql-results+json; charset=utf-8'
			}
		}).then(
			function(jsonResp){
				var keywords = [];
				$(jsonResp.results.bindings).each(function(index, binding){
					var word = binding.l.value;
					word = word.substring(word.lastIndexOf('>') + 1);
					keywords.push({uri: binding.p.value, desc: word});
				});
				resolver.fulfill(keywords);
			}, function(e){
			resolver.reject(e);
		});
	});
	return promise;
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
		headers: {'Authorization':'Bearer ' + charme.logic.authToken},
		type: 'POST',
		contentType: 'application/ld+json',
		success: successCB,
		error: errorCB,
		data: stringified,
	});
};

/*
 * Persist a populated annotation to the triplestore
 * 
 * Parameters:
 *		successCB: a callback to be invoked on successful completion
 *		errorCB: a callback to be invoked on error
 */
charme.logic.saveGraph=function(graph){
	var promise = new Promise(function(resolver){
		var reqUrl = charme.logic.createRequest();
		var jsonSrc = graph.toJSON();
		$.ajax(reqUrl, {
			dataType: 'json',
			type: 'POST',
			headers: {'Authorization':'Bearer ' + charme.logic.constants.OAUTH_TOKEN},
			contentType: 'application/ld+json',
			data: jsonSrc,
		}).then( 
		function(){
			resolver.fulfill();
		}, function(e){
			resolver.reject(e);
		}	
		);
	});
	return promise;
};

/*
 * Retrieve a specific annotation
 * 
 */
charme.logic.fetchAnnotation=function(annotationId){
	//Isolate the annotation ID from a full URI
	var matches = annotationId.match(/([^\/]+)\/?$/g);
	var shortId = annotationId;
	if (matches)
		shortId = matches[0];
	
	var promise = new Promise(function(resolver){
		var reqUrl = charme.logic.fetchRequest(shortId);
		$.ajax(reqUrl, {type: 'GET',}).then(
				function(data){
					var graph = new jsonoa.types.Graph();
					graph.load(data).
						then(function(graph){
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
 * Retrieve all annotations for the specified state
 * 
 * Parameters:
 *		successCB: a callback to be invoked on successful completion. The returned JSON-LD graph will be passed into this function
 *		errorCB: a callback to be invoked on error
 */
charme.logic.fetchAnnotationsForTarget=function(targetId){
	var promise = new Promise(function(resolver){
		var reqUrl = charme.logic.fetchForTarget(targetId);
		$.ajax(reqUrl, {type: 'GET',}).then(
				function(data){
					//Data is returned as ATOM wrapped json-ld
					var result = new charme.atom.result(data);
					//Extract json-ld from the multiple 'content' payloads returned
					var resultArr = [];
					/*
					 * Collect all entries so that they can be processed at the same time
					 */
					$.each(result.entries, function(index, value){
						var shortGraph = $.parseJSON(value.content);
						resultArr.push(shortGraph['@graph']);
						
					});
					var graphSrc = {'@graph': resultArr};
					
					var graph = new jsonoa.types.Graph();
					graph.load(graphSrc).
						then(function(graph){
							$.each(result.entries, function(index, value){
								var graphAnno = graph.getNode(value.id);
								if (graphAnno)
									value.annotation=graphAnno;
							});
							resolver.fulfill(result);
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