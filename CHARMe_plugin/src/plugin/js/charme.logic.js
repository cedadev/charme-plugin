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

    URL_PREFIX : 'http://',
    //DOI_PREFIX : 'http://dx.doi.org/',
    DXDOI_URL : 'http://dx.doi.org/',
    DXDOI_CRITERIA_DOI : 'id',

    CROSSREF_URL : 'http://data.crossref.org/',
    CROSSREF_CRITERIA_DOI : 'id',
    NERC_SPARQL_EP : 'http://vocab.nerc.ac.uk/sparql/sparql',
    FABIO_URL : 'http://eelst.cs.unibo.it/apps/LODE/source?url=http://purl.org/spar/fabio',
    TARGET_URL : 'localData/target_types.json', // use locally cached file for now

    SPARQL_GCMD : 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>			' +
            'PREFIX skos: <http://www.w3.org/2004/02/skos/core#>				' +
            'SELECT ?p ?l WHERE {								' +
            '	<http://vocab.nerc.ac.uk/collection/P64/current/> rdf:type skos:Collection.	' +
            '	<http://vocab.nerc.ac.uk/collection/P64/current/> ?o ?p.			' +
            '	?p skos:prefLabel ?l								' +
            '}											' +
             'ORDER BY ?l									',

    FABIO_XP_CLASSES : '//owl:Class',

	FACET_TYPE_MOTIVATION: 'motivation',
	FACET_TYPE_DOMAIN: 'domainOfInterest',
	FACET_TYPE_ORGANIZATION: 'organization',
	FACET_TYPE_DATA_TYPE: 'dataType'
};

/*
 * A series of utility functions for constructing REST requests to the various
 * CHARMe web services - main reference source for this is the CHARMe Node ICD
 * 
 */
charme.logic.urls={};
charme.logic.urls._baseURL = function(uri) {
	return (charme.settings.REMOTE_BASE_URL.match(/\/$/) ? charme.settings.REMOTE_BASE_URL :
		charme.settings.REMOTE_BASE_URL + '/');
};
charme.logic.urls.existRequest = function(uri) {
	return charme.logic.urls._baseURL() + 'index/' + uri + '?format=json-ld';
};
charme.logic.urls.createRequest = function() {
	return charme.logic.urls._baseURL() + 'insert/annotation';
};
charme.logic.urls.stateRequest = function(newState) {
	return charme.logic.urls._baseURL() + 'advance_status';
};

charme.logic.urls.fetchForTarget = function(targetId) {
	//return 'testData/charmetest.atom';
	return charme.logic.urls._baseURL() + 'search/atom?target=' + encodeURIComponent(targetId) +
		'&status=submitted';
};

charme.logic.urls.fetchRequest = function(id) {
	return charme.logic.urls._baseURL() +
		'data/' +
		id +
		'?format=json-ld' +
		(charme.logic.constants.ANNO_DEPTH === 0 ? '' : '&depth=' + 
			charme.logic.constants.ANNO_DEPTH);
};

charme.logic.urls.fetchSearchFacets = function(criteria, facets){
	var url=charme.logic.urls._baseURL() + 'suggest/atom?status=submitted&q=';
	if (typeof facets !== 'undefined'){
		url+=facets.join(',');
	} else {
		url+='*';
	}

        if (typeof criteria.targets !== 'undefined' && criteria.targets.length > 0){
		url+='&target=' + encodeURIComponent(criteria.targets.join(' '));
	}
        
	return url;
};

charme.logic.urls.userDetailsRequest = function(id) {
	return charme.logic.urls._baseURL() + 'token/userinfo';
};
charme.logic.urls.authRequest = function() {
	return charme.settings.AUTH_BASE_URL + charme.settings.AUTH_PATH + '/?client_id=' +
		charme.settings.AUTH_CLIENT_ID + '&response_type=' + 
		charme.settings.AUTH_RESPONSE_TYPE;
};
charme.logic.urls.fabioTypesRequest = function() {
	return charme.logic.constants.FABIO_URL;
};
charme.logic.urls.gcmdVocabRequest = function(sparqlQry) {
	var url = charme.logic.constants.NERC_SPARQL_EP;
	url += '?query=' + encodeURIComponent(charme.logic.constants.SPARQL_GCMD);
	url += '&output=json';
	return url;
};
charme.logic.urls.targetTypesRequest = function() {
    return charme.logic.constants.TARGET_URL;
};
/*charme.logic.urls.crossRefRequest = function(criteria) {
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
};*/
charme.logic.urls.dxdoiRequest = function(criteria) {
	var url = null;
	if (criteria[charme.logic.constants.DXDOI_CRITERIA_DOI] &&
		criteria[charme.logic.constants.DXDOI_CRITERIA_DOI].length > 0) {
		var doi = criteria[charme.logic.constants.DXDOI_CRITERIA_DOI];
		if (doi.indexOf(charme.logic.constants.DXDOI_URL) === 0) {
			doi = doi.substring(charme.logic.constants.DXDOI_URL.length + 1);
		}
		url = charme.logic.constants.DXDOI_URL + doi;
	}
	return url;
};

charme.logic.urls.fetchAnnotations = function(criteria) {
	var url= charme.logic.urls._baseURL() + 'search/atom?status=submitted';
	if (typeof criteria.targets !== 'undefined' && criteria.targets.length > 0){
		url+='&target=' + encodeURIComponent(criteria.targets.join(' '));
	}
	if (typeof criteria.motivations !== 'undefined' && criteria.motivations.length > 0){
		url+='&motivation=' + encodeURIComponent(criteria.motivations.join(' '));
	}
	// need node to support search for linkType
	//if (typeof criteria.linkTypes !== 'undefined' && criteria.linkTypes.length > 0) {
	//	url+='&linkType=' + encodeURIComponent(criteria.linkTypes.join(' '));
	//}
	if (typeof criteria.domainsOfInterest !== 'undefined' && criteria.domainsOfInterest.length > 0) {
		url+='&domainOfInterest=' + encodeURIComponent(criteria.domainsOfInterest.join(' '));
	}
	if (typeof criteria.organization !== 'undefined' && criteria.organization !== null &&
		criteria.organization.length > 0) {
		url += '&organization=' + encodeURIComponent(criteria.organization);
	}
	if (typeof criteria.creator !== 'undefined' && criteria.creator !== null &&
		criteria.creator.length > 0) {
		url += '&userName=' + encodeURIComponent(criteria.creator);
	}
        if (typeof criteria.pageNum !== 'undefined' && criteria.pageNum !== null) {
		url += '&startPage=' + encodeURIComponent(criteria.pageNum.toString());
	}
        if (typeof criteria.resultsPerPage !== 'undefined' && criteria.resultsPerPage !== null) {
		url += '&count=' + encodeURIComponent(criteria.resultsPerPage.toString());
	}
        //if (typeof criteria.resultsPerPage !== 'undefined' && criteria.resultsPerPage !== null) {
	//	url += '&count=' + encodeURIComponent(criteria.count.toString());
	//}

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
		var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
};

/**
 * A utility function for generating valid CHARMe resource identifiers
 * @returns {String}
 */
charme.logic.generateId = function() {
	return charme.logic.urls._baseURL() + 'resource/' + charme.logic.generateGUID();
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
		var reqUrl = charme.logic.urls.userDetailsRequest();
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
		var reqUrl = charme.logic.urls.gcmdVocabRequest(charme.logic.constants.SPARQL_GCMD);
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
				word = word.trim();
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
 * Fetches the keywords used for specifying Motivation
 * This will pick up statically defined list of motivations from a text file - motivations.json
 * No SPARQL call is made since the list of motivations is not expected to change drastically over time.
 *
 * @returns {Promise}
 */
charme.logic.fetchMotivationVocab = function() {

    //return $.getJSON("motivations.json").done();

    var promise = new Promise(function(resolver) {


// ATTEMPT 1 : Using getJSON()....   couldnot make it work

//        $.getJSON("motivations.json")
//            .done(function (jsonResp) {
//                var keywords = [];
//                $(jsonResp.results.bindings).each(function (index, binding) {
//                    var word = binding.l.value;
//                    word = word.substring(word.lastIndexOf('>') + 1);
//                    keywords.push({
//                        uri: binding.p.value,
//                        desc: word
//                    });
//                });
//                resolver.fulfill(keywords);
//            })
//            //.fail(function (e) {
//            //    resolver.reject(e);
//            //});


// ATTEMPT 2 : Using .ajax()....   couldnot make it work
//
//        $.ajax({
//            type: 'GET',
//            url: 'motivations.json',
//            dataType: 'json',
//            success: function (jsonResp) {
//                var keywords = [];
//                $(jsonResp.results.bindings).each(function (index, binding) {
//                    var word = binding.l.value;
//                    word = word.substring(word.lastIndexOf('>') + 1);
//                    keywords.push({
//                        uri: binding.p.value,
//                        desc: word
//                    });
//                });
//                resolver.fulfill(keywords);
//            },
//            error: function(e) {
//                resolver.reject(e);
//            }
//        });



// ATTEMPT 3 : Reading in the motivations from a json formatted string... Works !

        try {

            var jsontext =      '{                                                                                                                              ' +
                                '    "head": {                                                                                                                  ' +
                                '        "vars": [ "p" , "l" ]                                                                                                  ' +
                                '    } ,                                                                                                                        ' +
                                '    "results": {                                                                                                               ' +
                                '        "bindings": [                                                                                                          ' +
                                '            {                                                                                                                  ' +
                                '                "p": { "type": "uri" , "value": "http://www.w3.org/ns/oa#bookmarking" } ,                                      ' +
                                '                "l": { "type": "literal" , "xml:lang": "en" , "value": "OA > Motivation > bookmarking" }                       ' +
                                '            } ,                                                                                                                ' +
                                '            {                                                                                                                  ' +
                                '                "p": { "type": "uri" , "value": "http://www.w3.org/ns/oa#classifying" } ,                                      ' +
                                '                "l": { "type": "literal" , "xml:lang": "en" , "value": "OA > Motivation > classifying" }                       ' +
                                '            } ,                                                                                                                ' +
                                '            {                                                                                                                  ' +
                                '                "p": { "type": "uri" , "value": "http://www.w3.org/ns/oa#commenting" } ,                                       ' +
                                '                "l": { "type": "literal" , "xml:lang": "en" , "value": "OA > Motivation > commenting" }                        ' +
                                '            } ,                                                                                                                ' +
                                '            {                                                                                                                  ' +
                                '                "p": { "type": "uri" , "value": "http://www.w3.org/ns/oa#describing" } ,                                       ' +
                                '                "l": { "type": "literal" , "xml:lang": "en" , "value": "OA > Motivation > describing" }                        ' +
                                '            } ,                                                                                                                ' +
                                '            {                                                                                                                  ' +
                                '                "p": { "type": "uri" , "value": "http://www.w3.org/ns/oa#editing" } ,                                          ' +
                                '                "l": { "type": "literal" , "xml:lang": "en" , "value": "OA > Motivation > editing" }                           ' +
                                '            } ,                                                                                                                ' +
                                '            {                                                                                                                  ' +
                                '                "p": { "type": "uri" , "value": "http://www.w3.org/ns/oa#highlighting" } ,                                     ' +
                                '                "l": { "type": "literal" , "xml:lang": "en" , "value": "OA > Motivation > highlighting" }                      ' +
                                '            } ,                                                                                                                ' +
                                '            {                                                                                                                  ' +
                                '                "p": { "type": "uri" , "value": "http://www.w3.org/ns/oa#identifying" } ,                                      ' +
                                '                "l": { "type": "literal" , "xml:lang": "en" , "value": "OA > Motivation > identifying" }                       ' +
                                '            } ,                                                                                                                ' +
                                '            {                                                                                                                  ' +
                                '                "p": { "type": "uri" , "value": "http://www.w3.org/ns/oa#linking" } ,                                          ' +
                                '                "l": { "type": "literal" , "xml:lang": "en" , "value": "OA > Motivation > linking" }                           ' +
                                '            } ,                                                                                                                ' +
                                '            {                                                                                                                  ' +
                                '                "p": { "type": "uri" , "value": "http://www.w3.org/ns/oa#moderating" } ,                                       ' +
                                '                "l": { "type": "literal" , "xml:lang": "en" , "value": "OA > Motivation > moderating" }                        ' +
                                '            } ,                                                                                                                ' +
                                '            {                                                                                                                  ' +
                                '                "p": { "type": "uri" , "value": "http://www.w3.org/ns/oa#questioning" } ,                                      ' +
                                '                "l": { "type": "literal" , "xml:lang": "en" , "value": "OA > Motivation > questioning" }                       ' +
                                '            } ,                                                                                                                ' +
                                '            {                                                                                                                  ' +
                                '                "p": { "type": "uri" , "value": "http://www.w3.org/ns/oa#replying" } ,                                         ' +
                                '                "l": { "type": "literal" , "xml:lang": "en" , "value": "OA > Motivation > replying" }                          ' +
                                '            } ,                                                                                                                ' +
                                '            {                                                                                                                  ' +
                                '                "p": { "type": "uri" , "value": "http://www.w3.org/ns/oa#tagging" } ,                                          ' +
                                '                "l": { "type": "literal" , "xml:lang": "en" , "value": "OA > Motivation > tagging" }                           ' +
                                '            }                                                                                                                  ' +
                                '        ]                                                                                                                      ' +
                                '    }                                                                                                                          ' +
                                '}                                                                                                                              ' ;


            var jsonResp = JSON.parse(jsontext);

            var keywords = [];
            $(jsonResp.results.bindings).each(function (index, binding) {
                var word = binding.l.value;
                word = word.substring(word.lastIndexOf('>') + 1);
                keywords.push({
                    uri: binding.p.value,
                    desc: word
                });
            });
            resolver.fulfill(keywords);


        }
        catch(e) {
            resolver.reject(e);
        }


    });

    return promise;

};

/*charme.logic.fetchMotivations = function() {
	var promise = new Promise(function(resolver) {

		var motivations = [ {
			label : 'Bookmarking',
			resource : 'Bookmarking'
		}, {
			label : 'Annotating',
			resource : 'Annotating'
		}, {
			label : 'Commenting',
			resource : 'Commenting'
		}, {
			label : 'Describing',
			resource : 'Describing'
		} ];
		resolver.fulfill(motivations);
	});
	return promise;
};*/

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

charme.logic.fetchTargetTypes = function() {
    var promise = new Promise(function(resolver) {
        var reqUrl = charme.logic.urls.targetTypesRequest(charme.logic.constants.TARGET_URL);
        if (reqUrl === null || reqUrl.length === 0) {
            resolver.reject();
        }
        
        $.ajax(reqUrl, {
            headers: {
                accept: 'application/json; charset=utf-8'
            }
        }).then(function(jsonResp) {
            resolver.fulfill(jsonResp);
        }, function(e) {
            resolver.reject(e);
        });
    });
    
    return promise;
};

/**
 * Uses the Crossref web services (available from http://www.crossref.org/ to retrieve 
 * bibliographic data for a given DOI
 */
/*charme.logic.fetchCrossRefMetaData = function(criteria) {
	var promise = new Promise(function(resolver) {
		var reqUrl = charme.logic.urls.crossRefRequest(criteria);
		if (reqUrl === null || reqUrl.length === 0) {
			resolver.reject();
		}
		$.ajax(reqUrl, {
			headers : {
				accept : 'text/x-bibliography; style=apa; locale=en-US'
			}
		}).then(function(xmlResp) {
			resolver.fulfill(xmlResp);
		}, function(e) {
			resolver.reject(e);
		});
	});
	return promise;
};*/
/**
 * Uses the dx.doi web services (available from http://www.dx.doi.org/ to retrieve 
 * bibliographic data for a given DOI
 */
charme.logic.fetchDxdoiMetaData = function(criteria) {
    var promise = new Promise(function(resolver) {
        var reqUrl = charme.logic.urls.dxdoiRequest(criteria);
        if(reqUrl === null || reqUrl.length === 0) {
            resolver.reject();
        }
        $.ajax(reqUrl, {
            headers: {
                accept: 'text/x-bibliography; style=apa; locale=en-US'
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
	var reqUrl = charme.logic.urls.existRequest(state);
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
	var reqUrl = charme.logic.urls.createRequest();
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
		data : stringified
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
		var reqUrl = charme.logic.urls.createRequest();
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
		var reqUrl = charme.logic.urls.fetchRequest(shortId);
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

charme.logic.fetchAllSearchFacets = function(criteria){
	var promise = new Promise(function(resolver) {
		var reqUrl = charme.logic.urls.fetchSearchFacets(criteria);
                
		$.ajax(reqUrl, {
			type : 'GET'
		}).then(function(data) {
			// Data is returned as ATOM wrapped json-ld
			var result = new charme.atom.Result(data);
			// Extract json-ld from the multiple 'content' payloads returned
			var resultMap = [];
			/*
			 * Collect all entries so that they can be processed at the same
			 * time
			 */
			$.each(result.entries, function(index, entry) {
				var facetGraphStr = entry.content;
				var facetGraphObj = JSON.parse(facetGraphStr);
				var facetType = entry.id;
				resultMap[facetType]=[];
				var facets = [];
				if (typeof facetGraphObj[jsonoa.constants.GRAPH]!=='undefined'){
					facets = facetGraphObj[jsonoa.constants.GRAPH];
				} else {
					facets.push(facetGraphObj);
				}

				$.each(facets, function (index, facet){
					var facetObj = {};
					facetObj.uri=facet[jsonoa.constants.ID];
					if (facetType === charme.logic.constants.FACET_TYPE_ORGANIZATION)
						facetObj.label = facet[jsonoa.constants.NAME]; else
						facetObj.label = facet[jsonoa.constants.PREF_LABEL];
					resultMap[facetType].push(facetObj);
				});
			});
			resolver.fulfill(resultMap);
		}), function(jqXHR, textStatus, errorThrown) {
			resolver.reject();
		};
	});

	return promise;
};

charme.logic.shortAnnoTitle = function(anno){
	var out='';
	var bodies = anno.getValues(anno.BODY);
	angular.forEach(bodies, function(body){
		if (body instanceof jsonoa.types.TextBody){
			out=body.getValue(body.CONTENT_CHARS);
		} else if (body instanceof jsonoa.types.Publication && out.length===0){
			out=body.getValue(body.CITING_ENTITY).getValue(body.ID);
		}
	});
	return out;
}

/**
 * Retrieve all annotations matching the supplied criteria
 *
 * Parameters:
 * 	criteria: The values which will be used to search the annotations
 */
charme.logic.searchAnnotations = function(criteria) {
	var promise = new Promise(function(resolver) {
		var reqUrl = charme.logic.urls.fetchAnnotations(criteria);
		$.ajax(reqUrl, {
			type : 'GET'
		}).then(function(data) {          
			// Data is returned as ATOM wrapped json-ld
			var result = new charme.atom.Result(data);
			// Extract json-ld from the multiple 'content' payloads returned
			var resultArr = [];
			/*
			 * Collect all entries so that they can be processed at the same
			 * time
			 */
			$.each(result.entries, function(index, entry) {
				var shortGraph = $.parseJSON(entry.content);
				if (typeof shortGraph[jsonoa.constants.GRAPH]!== 'undefined'){
					resultArr.push(shortGraph[jsonoa.constants.GRAPH]);
				} else {
					resultArr.push(shortGraph);
				}

			});
			var graphSrc = {};
			graphSrc[jsonoa.constants.GRAPH]=resultArr;
                        
			var graph = new jsonoa.types.Graph();
			graph.load(graphSrc, true).then(function(graph) {
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
