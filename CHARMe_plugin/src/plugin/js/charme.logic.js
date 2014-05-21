/*
 * charme.logic.js
 * 
 * Functions for abstracting the lower level functions of the jsonoa.js library
 */
jQuery.support.cors = true;
if (!charme) {
	var charme = {};
	if (typeof wgxpath !== 'undefined') {
		wgxpath.install();
	}
}
charme.logic = {};

charme.logic.authToken = {};

charme.logic.constants = {
    ANNO_DEPTH : 99, // A depth specifier for the graph depth that is
    // returned when viewing annotations
    ATN_ID_PREFIX : 'http://localhost/',
    BODY_ID_PREFIX : 'http://localhost/',

    DOI_PREFIX : 'http://dx.doi.org/',
    URL_PREFIX : 'http://',

    CROSSREF_URL : 'http://data.crossref.org/',
    CROSSREF_CRITERIA_DOI : 'id',
    NERC_SPARQL_EP : 'http://vocab.nerc.ac.uk/sparql/sparql',
    FABIO_URL : 'http://eelst.cs.unibo.it/apps/LODE/source?url=http://purl.org/spar/fabio',

    SPARQL_GCMD : 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>			' +
            'PREFIX skos: <http://www.w3.org/2004/02/skos/core#>				' +
            'SELECT ?p ?l WHERE {								' +
            '	<http://vocab.nerc.ac.uk/collection/P64/current/> rdf:type skos:Collection.	' +
            '	<http://vocab.nerc.ac.uk/collection/P64/current/> ?o ?p.			' +
            '	?p skos:prefLabel ?l								' +
            '}											' +
             'ORDER BY ?l									',

    FABIO_XP_CLASSES : '//owl:Class'

};

/*
 * A series of utility functions for constructing REST requests to the various
 * CHARMe web services Main reference source for this is the CHARMe Node ICD
 */
charme.logic._baseURL = function(uri) {
	return (charme.settings.REMOTE_BASE_URL.match(/\/$/) ? charme.settings.REMOTE_BASE_URL :
		charme.settings.REMOTE_BASE_URL + '/');
};
charme.logic.existRequest = function(uri) {
	return charme.logic._baseURL() + 'index/' + uri + '?format=json-ld';
};
charme.logic.createRequest = function() {
	return charme.logic._baseURL() + 'insert/annotation';
};
charme.logic.stateRequest = function(newState) {
	return charme.logic._baseURL() + 'advance_status';
};

charme.logic.fetchForTarget = function(targetId) {
	//return 'testData/charmetest.atom';
	return charme.logic._baseURL() + 'search/atom?target=' + encodeURIComponent(targetId) +
		'&status=submitted';
};

charme.logic.fetchRequest = function(id) {
	return charme.logic._baseURL() +
		'data/' +
		id +
		'?format=json-ld' +
		(charme.logic.constants.ANNO_DEPTH === 0 ? '' : '&depth=' + 
			charme.logic.constants.ANNO_DEPTH);
};
charme.logic.userDetailsRequest = function(id) {
	return charme.logic._baseURL() + 'token/userinfo';
};
charme.logic.authRequest = function() {
	return charme.settings.AUTH_BASE_URL + charme.settings.AUTH_PATH + '/?client_id=' +
		charme.settings.AUTH_CLIENT_ID + '&response_type=' + 
		charme.settings.AUTH_RESPONSE_TYPE;
};
charme.logic.fabioTypesRequest = function() {
	return charme.logic.constants.FABIO_URL;
};
charme.logic.gcmdVocabRequest = function(sparqlQry) {
	var url = charme.logic.constants.NERC_SPARQL_EP;
	url += '?query=' + encodeURIComponent(charme.logic.constants.SPARQL_GCMD);
	url += '&output=json';
	return url;
};
charme.logic.crossRefRequest = function(criteria) {
	var url = null;
	if (criteria[charme.logic.constants.CROSSREF_CRITERIA_DOI] &&
		criteria[charme.logic.constants.CROSSREF_CRITERIA_DOI].length > 0) {
		var doi = criteria[charme.logic.constants.CROSSREF_CRITERIA_DOI];
		if (doi.indexOf(charme.logic.constants.CROSSREF_URL) === 0) {
			doi = doi.substring(charme.logic.constants.CROSSREF_URL.length + 1);
		}
		url = charme.logic.constants.CROSSREF_URL + doi;
	}
	return url;
};

/*
 * Utility functions
 */

/**
 * Escapes characters in the string that are not safe to use in a RegExp. Taken
 * from Google closure library - https://developers.google.com/closure/library/
 * 
 * @param {*}
 *            s The string to escape. If not a string, it will be cast to one.
 * @return {string} A RegExp safe, escaped copy of {@code s}.
 */
charme.logic.regExpEscape = function(s) {
	return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').replace(/\x08/g, '\\x08');
};

/**
 * A 'namespace resolver' This function is essential for parsing XML documents
 * that contain namespaces. Given a prefix, it will resolve to a canonical
 * namespace URL.
 * 
 * @param prefix
 * @returns
 */
charme.logic.fabioNSResolver = function(prefix) {
	var ns = {
		'rdfs' : 'http://www.w3.org/2000/01/rdf-schema#',
		'owl' : 'http://www.w3.org/2002/07/owl#'
	};
	return ns[prefix] || null;
};

/**
 * A utility function that will find a DOI within a given string
 * 
 * @param someString
 * @returns
 */
charme.logic.findDOI = function(someString) {
	return (/\b(10[.][0-9]{3,}(?:[.][0-9]+)*\/(?:(?!["&\'])\S)+)\b/).exec(someString);
};

/**
 * A function for auto-generating GUIDs
 * @returns
 */
charme.logic.generateGUID = function() {
	return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
};

/**
 * A utility function for generating valid CHARMe resource identifiers
 * @returns {String}
 */
charme.logic.generateId = function() {
	return charme.logic._baseURL() + 'resource/' + charme.logic.generateGUID();
};

/*
 * Functions for fetching data
 */

/**
 * Given some authentication details provided by the login action and passed
 * back to the CHARMe plugin,
 */
charme.logic.fetchUserDetails = function(authToken) {
	var promise = new Promise(function(resolver) {
		var reqUrl = charme.logic.userDetailsRequest();
		if (reqUrl === null || reqUrl.length === 0) {
			resolver.reject();
		}
		$.ajax(reqUrl, {
			headers : {
				'Authorization' : ' Bearer ' + authToken
			}
		}).then(function(userDetails) {
			resolver.fulfill(userDetails);
		}, function(error) {
			resolver.reject(error);
		});
	});
	return promise;
};

/**
 * Fetches and processes the GCMD keywords used for specifying the domain of
 * interest
 * 
 * @returns {Promise}
 */
charme.logic.fetchGCMDVocab = function() {
	var promise = new Promise(function(resolver) {
		var reqUrl = charme.logic.gcmdVocabRequest(charme.logic.constants.SPARQL_GCMD);
		if (reqUrl === null || reqUrl.length === 0) {
			resolver.reject();
		}
		$.ajax(reqUrl, {
			headers : {
				accept : 'application/sparql-results+json; charset=utf-8'
			}
		}).then(function(jsonResp) {
			var keywords = [];
			$(jsonResp.results.bindings).each(function(index, binding) {
				var word = binding.l.value;
				word = word.substring(word.lastIndexOf('>') + 1);
				keywords.push({
					uri : binding.p.value,
					desc : word
				});
			});
			resolver.fulfill(keywords);
		}, function(e) {
			resolver.reject(e);
		});
	});
	return promise;
};

/**
 * Fetches and processes the GCMD keywords used for specifying the domain of
 * interest
 * 
 * @returns {Promise}
 */
charme.logic.fetchFabioTypes = function() {
	var promise = new Promise(function(resolver) {

		var fabioTypes = [ {
			label : 'Technical Report',
			resource : 'http://purl.org/spar/fabio/TechnicalReport'
		}, {
			label : 'Conference Paper',
			resource : 'http://purl.org/spar/fabio/ConferencePaper'
		}, {
			label : 'Journal Article',
			resource : 'http://purl.org/spar/fabio/JournalArticle'
		}, {
			label : 'Dataset',
			resource : 'http://purl.org/dc/dcmitype/Dataset'
		} ];
		resolver.fulfill(fabioTypes);
	});
	return promise;
};

/**
 * Uses the Crossref web services (available from http://www.crossref.org/ to retrieve 
 * bibliographic data for a given DOI
 */
charme.logic.fetchCrossRefMetaData = function(criteria) {
	var promise = new Promise(function(resolver) {
		var reqUrl = charme.logic.crossRefRequest(criteria);
		if (reqUrl === null || reqUrl.length === 0) {
			resolver.reject();
		}
		$.ajax(reqUrl, {
			headers : {
				accept : 'text/bibliography; style=apa; locale=en-US'
			}
		}).then(function(xmlResp) {
			resolver.fulfill(xmlResp);
		}, function(e) {
			resolver.reject(e);
		});
	});
	return promise;
};

/**
 * Given a state, returns true if any metadata exists for this resource
 */
charme.logic.exists = function(state, successCB, errorCB) {
	var reqUrl = charme.logic.existRequest(state);
	$.ajax(reqUrl, {
		dataType : 'json',
		success : successCB,
		error : errorCB
	});
};

/**
 * Persist a populated annotation to the triplestore
 * 
 * Parameters: successCB: a callback to be invoked on successful completion
 * errorCB: a callback to be invoked on error
 */
charme.logic.createAnnotation = function(annotation, successCB, errorCB) {
	var reqUrl = charme.logic.createRequest();
	var jsonObj = annotation.serialize();
	var stringified = JSON.stringify(jsonObj);
	$.ajax(reqUrl, {
		dataType : 'json',
		headers : {
			'Authorization' : ' Bearer ' + charme.logic.authToken.token
		},
		type : 'POST',
		contentType : 'application/ld+json',
		success : successCB,
		error : errorCB,
		data : stringified,
	});
};

/**
 * Persist a populated annotation to the triplestore
 * 
 * Parameters: successCB: a callback to be invoked on successful completion
 * errorCB: a callback to be invoked on error
 */
charme.logic.saveGraph = function(graph, token) {
	var promise = new Promise(function(resolver) {
		var reqUrl = charme.logic.createRequest();
		var jsonSrc = graph.toJSON();
		$.ajax(reqUrl, {
			dataType : 'text',
			type : 'POST',
			headers : {
				'Authorization' : ' Bearer ' + token
			},
			contentType : 'application/ld+json',
			data : jsonSrc,
		}).then(function() {
			resolver.fulfill();
		}, function(e, msg) {
			console.error('Error saving annotation: ' + msg);
			resolver.reject(e);
		});
	});
	return promise;
};

/**
 * Retrieve a specific annotation
 * 
 */
charme.logic.fetchAnnotation = function(annotationId) {
	// Isolate the annotation ID from a full URI
	var matches = annotationId.match(/([^\/]+)\/?$/g);
	var shortId = annotationId;
	if (matches)
		shortId = matches[0];

	var promise = new Promise(function(resolver) {
		var reqUrl = charme.logic.fetchRequest(shortId);
		$.ajax(reqUrl, {
			type : 'GET',
		}).then(function(data) {
			var graph = new jsonoa.types.Graph();
			graph.load(data).then(function(graph) {
				resolver.fulfill(graph);
			}, function(e) {
				resolver.reject(e);
			});
		}, function(jqXHR, textStatus, errorThrown) {
			resolver.reject();
		});
	});
	return promise;
};

/**
 * Retrieve all annotations for the specified state
 * 
 * Parameters: successCB: a callback to be invoked on successful completion. The
 * returned JSON-LD graph will be passed into this function errorCB: a callback
 * to be invoked on error
 */
charme.logic.fetchAnnotationsForTarget = function(targetId) {
	var promise = new Promise(function(resolver) {
		var reqUrl = charme.logic.fetchForTarget(targetId);
		$.ajax(reqUrl, {
			type : 'GET',
		}).then(function(data) {
			// Data is returned as ATOM wrapped json-ld
			var result = new charme.atom.Result(data);
			// Extract json-ld from the multiple 'content' payloads returned
			var resultArr = [];
			/*
			 * Collect all entries so that they can be processed at the same
			 * time
			 */
			$.each(result.entries, function(index, value) {
				var shortGraph = $.parseJSON(value.content);
				if (typeof shortGraph['@graph']!== 'undefined'){
					resultArr.push(shortGraph['@graph']);
				} else {
				resultArr.push(shortGraph);
				}

			});
			var graphSrc = {
				'@graph' : resultArr
			};

			var graph = new jsonoa.types.Graph();
			graph.load(graphSrc).then(function(graph) {
				$.each(result.entries, function(index, value) {
					var graphAnno = graph.getNode(value.id);
					if (graphAnno)
						value.annotation = graphAnno;
				});
				resolver.fulfill(result);
			}, function(e) {
				resolver.reject(e);
			});

		}, function(jqXHR, textStatus, errorThrown) {
			resolver.reject();
		});
	});
    return promise;
};