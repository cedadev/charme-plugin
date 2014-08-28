charme.web.services = angular.module('charmeServices', []);

charme.web.services.factory('persistence', function(){ 
	var persistService = {};
	persistService.persist = function(key, val){
		$.jStorage.set(key, val);
	};
	persistService.retrieve = function(key){
		var promise = new Promise(function(resolver){
			var val = $.jStorage.get(key);
			if (val){
				resolver.fulfill(val);
			} else {
				resolver.reject(val);
			}
		});
		return promise;
	};
	persistService.clear = function(){
		$.jStorage.flush();
	};
	return persistService;
});

charme.web.services.factory('loginService', ['persistence', function(persistence){
	var loginService = {};
	loginService._loginListeners = [];
	loginService._logoutListeners = [];
	loginService._auth = null;
	
	/**
	 * Load stored credentials (if any)
	 */
	loginService._loadState=function(){
		persistence.retrieve(charme.web.constants.CHARME_TK).then(function(auth){
			loginService._doLogin(auth);
		});
	};
	
	loginService.setAuth=function(auth){
		loginService._auth = auth;
	};
	loginService.isLoggedIn=function(){
		return loginService._auth && !loginService.isExpired() ? true : false;
	};
	loginService.isExpired=function(){
		if (loginService._auth.expiry < new Date()){
			persistence.clear();
			return true;
		}
		return false;
	};
	loginService.getAuth=function(){
		return loginService._auth;
	};
	
	loginService.fetchUserDetails=function(authToken){
		return charme.logic.fetchUserDetails(authToken.token);
	};
	
	loginService._doLogin=function(authData){
		if (authData.expiry){
			authData.expiry = new Date(authData.expiry);
		}
		if (authData.token){
			loginService.setAuth(authData);
		}
		loginService.fetchUserDetails(authData).then(function(userDetails){
			loginService.getAuth().user = userDetails;
			angular.forEach(loginService._loginListeners, function(value, key){
				value(loginService.getAuth());
			});
		}, function(error){
			loginService.logout();
		});
	};
	
	loginService._loginEvent=function(evt){
		if (evt.data){
			var msg = JSON.parse(evt.data);
			try {
				persistence.persist(charme.web.constants.CHARME_TK, msg);
			}
			catch (e){
				if (console){
					console.log('Unable to persist user credentials ');
					console.log(e);
				}
			}
			loginService._doLogin(msg);
		}
	};
	
	loginService._logoutEvent = function(){
		angular.forEach(loginService._logoutListeners, function(value, key){
			value();
		});
		persistence.clear();
	};
	
	loginService.logout=function(){
		loginService._auth = null;
		loginService._logoutEvent();
	};
	
	/**
	 * Function to allow objects to register for login events
	 */
	loginService.addLoginListener=function(listener){
		loginService._loginListeners.push(listener);
	};

	/**
	 * Function to allow objects to register for login events
	 */
	loginService.addLogoutListener=function(listener){
		loginService._logoutListeners.push(listener);
	};
	
	return loginService;
}]);

/**
 * Register charme.logic methods as service methods
 */
charme.web.services.factory('fetchAnnotationsForTarget', function(){
        return charme.logic.fetchAnnotationsForTarget;
});

charme.web.services.factory('fetchAnnotation', function(){
        return charme.logic.fetchAnnotation;
});

charme.web.services.factory('searchAnnotations', function(){
	var searchService = {};
	searchService.listenerTypes = {
		SUCCESS: 'SUCCESS',
		ERROR: 'ERROR',
		BEFORE_SEARCH: 'BEFORE_SEARCH',
		AFTER_SEARCH: 'AFTER_SEARCH'
	};
	var annoSpec = jsonoa.types.Annotation;
	searchService.listeners = {};
        
	searchService.addListener = function (type, listener){
		if (typeof searchService.listeners[type] === 'undefined'){
			searchService.listeners[type] = [];
		}    
            searchService.listeners[type].push(listener);
	};

	searchService.removeListener = function(type, listener){
		if (typeof searchService.listeners[type] !== 'undefined'){
			var index = searchService.listeners[type].indexOf(listener);
			if (index > -1){
				searchService.listeners[type].splice(index, 1);
			}
		}
	};
        
        searchService.clearListeners = function() {
            searchService.listeners = {};
        };

	searchService.tellListeners = function (type, data1, data2, data3){
		angular.forEach(searchService.listeners[type], function(listener){
			if (typeof data1 !== 'undefined' || typeof data2 !== 'undefined' || typeof data3 !== 'undefined'){
				listener(data1, data2, data3);
			} else {
				listener();
			}
		});
	};

	searchService.searchAnnotations = function(criteria){
		searchService.tellListeners(searchService.listenerTypes.BEFORE_SEARCH);
		charme.logic.searchAnnotations(criteria).then(
			function(feed){
				var results = [];
				//Prepare the model for the view
				angular.forEach(feed.entries, function(value, key){
					var anno = value.annotation;
					var title = charme.logic.shortAnnoTitle(anno);
					var updated = value.updated;
					var person = anno.getValues(annoSpec.ANNOTATED_BY);
					var author = '';
					var userName = '';
					var organizationName = '';

					var date = anno.getValue(annoSpec.DATE);
					date = (date !== undefined && date.hasOwnProperty('@value')) ? date['@value'] : 'undefined';

					angular.forEach(person, function(detail){
						var personType = jsonoa.types.Person; //Alias the Person type locally so that we don't need to use fully qualified path to reference constants
						var organizationType = jsonoa.types.Organization;
						if (detail.hasType(personType.TYPE)){
							author = detail.getValue(personType.GIVEN_NAME) + ' ' + detail.getValue(personType.FAMILY_NAME);
							userName = detail.getValue(personType.USER_NAME);
						} else if (detail.hasType(organizationType.TYPE)){
							organizationName = detail.getValue(organizationType.NAME);
						}
					});
                                        
					results.push(
						{
                            'id': value.id,
						    'title': title,
						    'updated': updated,
						    'author': author,
							'userName': userName,
							'organizationName': organizationName,
							'date': date
						}
					);
				});
                                
				// date sorting on client side
				//results.sort(function(a, b) {return (Date.parse(a.date) - Date.parse(b.date)) * criteria.listOrder;});
				//results.splice(0, criteria.resultsPerPage * (criteria.pageNum - 1));
				//results.splice(criteria.resultsPerPage, results.length - criteria.resultsPerPage);

				var pages = [];
				for(var i = 1; i <= Math.ceil(feed.totalResults / criteria.resultsPerPage); i++) {
					if(i === criteria.pageNum)
						pages.push({status: 'current'});
					else
						pages.push({status: 'notCurrent'});
				}
                                
				searchService.tellListeners(searchService.listenerTypes.SUCCESS, results, pages, feed.totalResults);
				searchService.tellListeners(searchService.listenerTypes.AFTER_SEARCH);   
			},
			function(error){
				searchService.tellListeners(searchService.listenerTypes.ERROR, 'Error: ' + error);
				searchService.tellListeners(searchService.listenerTypes.AFTER_SEARCH);
			}
		, function(error){
				searchService.tellListeners(searchService.listenerTypes.ERROR, 'Error: ' + error);
				searchService.tellListeners(searchService.listenerTypes.AFTER_SEARCH);
		});
	};

	return searchService;
});

charme.web.services.factory('saveAnnotation', function () {
	return function(annoModel, targetId, auth){
		var promise = new Promise(function(resolver){
			var annoSpec = jsonoa.types.Annotation;
			var graph = new jsonoa.core.Graph();
			var anno = graph.createNode({type: jsonoa.types.Annotation, id: charme.logic.constants.ATN_ID_PREFIX + 'annoID'});
			var bodyId = charme.logic.constants.BODY_ID_PREFIX + 'bodyID';
			var commentId = bodyId; 
			
			if (annoModel.comment){
				var comment = graph.createNode({type: jsonoa.types.Text, id: commentId});
				comment.setValue(jsonoa.types.Text.CONTENT_CHARS, annoModel.comment);
				anno.addValue(annoSpec.BODY, comment);
			} 
			if (annoModel.type){
				var type = jsonoa.util.templateFromType(annoModel.type);
				if (typeof type !== 'function'){
					resolver.reject('Invalid selection ' + annoModel.type);
				}
				if (annoModel.uri){
					var linkURI = encodeURI(annoModel.uri);
					var doiVal = charme.logic.findDOI(linkURI);
					
					//If a DOI is provided, create a citation act for the body
					if (doiVal){
						//Create a fully qualified canonical URI for the DOI
						linkURI=charme.logic.constants.DXDOI_URL + doiVal;
						//Auto-generating IDs at the moment on client side, which shouldn't happen. The Node must take responsibility for this, but no method is available yet for multiple bodies
						var citoId = charme.logic.generateId();
						
						/*
						 * Create a citation act for the body. 
						 */
						var citoType = jsonoa.types.CitationAct;
						var citation = graph.createNode({type: citoType, id: citoId});
						citation.setValue(citoType.CITED_ENTITY, graph.createStub(targetId));
						citation.setValue(citoType.CITING_ENTITY, graph.createStub(linkURI));
						anno.addValue(annoSpec.BODY, citation);
						//Create node for link uri, with typing information
						graph.createNode({type: type, id: linkURI});
					} else {
						var linkBody =graph.createNode({type: type, id: linkURI});
						anno.addValue(annoSpec.BODY, linkBody);
					}

                    //Automatically add the "Linking" Motivation
                    var page = graph.createStub("http://www.w3.org/ns/oa#linking");
                    anno.addValue(annoSpec.MOTIVATED_BY, page);
				} else {
					resolver.reject('No URI entered');
				}
			}
			if (annoModel.domain){
				angular.forEach(annoModel.domain, function(domain){
					var tagId = domain.value;
					var tag = graph.createNode({type: jsonoa.types.SemanticTag, id: tagId});
					tag.setValue(jsonoa.types.SemanticTag.PREF_LABEL, domain.text);
					anno.addValue(annoSpec.BODY, tag);
				});

                //Automatically add the "Tagging" Motivation
                var page = graph.createStub("http://www.w3.org/ns/oa#tagging");
                anno.addValue(annoSpec.MOTIVATED_BY, page);
			}
            if (annoModel.motivation){
                angular.forEach(annoModel.motivation, function(motivation){
                    //var tagId = charme.logic.generateId();
                    var page = graph.createStub(motivation.value);
                    //var tag = graph.createNode(jsonoa.types.SemanticTag, tagId);
                    //tag.setValue(tag.MOTIVATED_BY, page);
                    anno.addValue(annoSpec.MOTIVATED_BY, page);
                });
            }
			//var target = graph.createNode(jsonoa.types.DatasetTarget, targetId);
            var target = graph.createNode({type: jsonoa.types[annoModel.target], id: targetId});
                        
			anno.setValue(annoSpec.TARGET, target);
			charme.logic.saveGraph(graph, auth.token).then(
				function(data){
					resolver.fulfill(data);
				}, 
				function(error){
					console.error(error);
					resolver.reject('Unable to save annotation');
				}
			);
		});
		return promise;
	};
});

charme.web.services.factory('fetchKeywords', function(){
	var categories = [];//Only fetch once, and scope to session
	return function(annoModel, targetId){	
		var promise = new Promise(function(resolver){
			if (categories.length===0){
				charme.logic.fetchGCMDVocab().then(function(keywords){
					categories.push({
						name: 'GCMD',
						keywords: keywords
					});
					resolver.fulfill(categories);
				});
			} else {
				resolver.fulfill(categories);
			}
		}, function(error){
			resolver.reject(error);
		});
		return promise;
	};
});


charme.web.services.factory('fetchAllMotivations', function(){
    var categories = [];//Only fetch once, and scope to session
	return function () {
        var promise = new Promise(function(resolver){
            if (categories.length===0){
                charme.logic.fetchMotivationVocab().then(function(keywords){
                    categories.push({
                        name: 'OA Motivation',
                        keywords: keywords
                    });
                    resolver.fulfill(categories);
                });
            } else {
                resolver.fulfill(categories);
            }
        }, function(error){
            resolver.reject(error);
        });
        return promise;
    };
});


charme.web.services.factory('fetchFabioTypes', function(){
	return function(annoModel, targetId){	
		var promise = new Promise(function(resolver){
			charme.logic.fetchFabioTypes().then(function(types){
				resolver.fulfill(types);
			});
		}, function(error){
			resolver.reject(error);
		});
		return promise;
	};
});

charme.web.services.factory('fetchTargetTypes', function(){
    return function() {	
        var promise = new Promise(function(resolver) {
            charme.logic.fetchTargetTypes().then(function(types) {
                resolver.fulfill(types);
            });
        }, function(error) {
            resolver.reject(error);
        });
        
        return promise;
    };
});

charme.web.services.factory('fetchAllSearchFacets', function(){
    /* return charme.logic.fetchAllSearchFacets(); */

    return function(criteria) {
	var promise = new Promise(function(resolver){
            charme.logic.fetchAllSearchFacets(criteria).then(function(facetTypes){
                resolver.fulfill(facetTypes);
            });
        }, function(error){
            resolver.reject(error);
        });

	return promise;
    };
});
