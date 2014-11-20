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
        
        loginService.handshake = function(evt) {
            if(evt.origin === window.location.protocol + '//' + window.location.host && evt.data) {
                if(evt.data === 'charme-handshake-request') {
                    window.removeEventListener('message', loginService.handshake, false);
                    window.addEventListener('message', loginService._loginEvent, false);
                    
                    var msgStr = 'charme-handshake-established';
                    if (charme.common.isIE11orLess)
                        evt.source.charme.web.postMessageProxy(msgStr, evt.origin);
                    else // Else use HTML5 standard method
                        evt.source.postMessage(msgStr, evt.origin);
                }
                else {
                    console.error('Bad message received:');
                    console.error(evt);
                }
            }
            else {
                console.error('Bad message received:');
                console.error(evt);
                }
        };
	
	loginService._loginEvent = function(evt) {
            if(evt.origin === window.location.protocol + '//' + window.location.host && evt.data) {
                var msg = JSON.parse(evt.data);
                if(!msg.hasOwnProperty('token') || !msg.hasOwnProperty('expiry')) {
                    console.error('Bad message received:');
                    console.error(msg);
                    return;
                }
                
                if(msg.error)
                    console.error(msg.error);

                try {
                    persistence.persist(charme.web.constants.CHARME_TK, msg);
                }
                catch(e) {
                    if(console) {
                        console.log('Unable to persist user credentials');
                        console.log(e);
                    }
                }
                
                loginService._doLogin(msg);
		}
                else {
                    console.error('Bad message received:');
                    console.error(evt);
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

	searchService.tellListeners = function (type, data1, data2, data3, data4, data5, data6){
		angular.forEach(searchService.listeners[type], function(listener){
			if (typeof data1 !== 'undefined' || 
                            typeof data2 !== 'undefined' || 
                            typeof data3 !== 'undefined' ||
                            typeof data4 !== 'undefined' ||
                            typeof data5 !== 'undefined' ||
                            typeof data6 !== 'undefined') {
				listener(data1, data2, data3, data4, data5, data6);
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
                                        var organizationUri = '';
                                        
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
                                organizationUri = detail.getValue(organizationType.URI);
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
                                                    'organizationUri': organizationUri,
                                                    'date': date,
                                                    'targets': criteria.targets
						}
					);
				});
                                
				// date sorting on client side
				//results.sort(function(a, b) {return (Date.parse(a.date) - Date.parse(b.date)) * criteria.listOrder;});
				//results.splice(0, criteria.resultsPerPage * (criteria.pageNum - 1));
				//results.splice(criteria.resultsPerPage, results.length - criteria.resultsPerPage);

				var pages = [];
                                var lastPage = Math.ceil(feed.totalResults / criteria.resultsPerPage);
				for(var i = 1; i <= lastPage; i++) {
                                    if(i === criteria.pageNum)
                                        pages.push({status: 'current'});
                                    else if((criteria.pageNum <= Math.ceil(charme.logic.constants.NUM_PAGE_BUTTONS / 2) && i <= charme.logic.constants.NUM_PAGE_BUTTONS) || 
                                            (criteria.pageNum >= lastPage - Math.floor(charme.logic.constants.NUM_PAGE_BUTTONS / 2) && i >= lastPage - charme.logic.constants.NUM_PAGE_BUTTONS + 1) ||
                                            Math.abs(i - criteria.pageNum) <= Math.floor(charme.logic.constants.NUM_PAGE_BUTTONS / 2))
                                        pages.push({status: 'notCurrent'});
				}
                                
                                var targetIsAnno = criteria.targetIsAnno || false;
                                
				searchService.tellListeners(searchService.listenerTypes.SUCCESS, results, pages, criteria.pageNum, lastPage, feed.totalResults, targetIsAnno);
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

charme.web.services.factory('deleteAnnotation', function(){
	return charme.logic.deleteAnnotation;
});

charme.web.services.factory('saveAnnotation', function () {
	return function(annoModel, targetId, targetMap, auth){
		var promise = new Promise(function(resolver){
			var annoSpec = jsonoa.types.Annotation;
            var graph = new jsonoa.core.Graph();
			var anno = graph.createNode({type: jsonoa.types.Annotation, id: charme.logic.constants.ATN_ID_PREFIX + 'annoID'});
			var bodyId = charme.logic.constants.BODY_ID_PREFIX + 'bodyID';
			var commentId = bodyId;
            var compositeSpec = jsonoa.types.Composite;
            var composite = graph.createNode({type: jsonoa.types.Composite, id: charme.logic.constants.COMPOSITE_ID_PREFIX + 'targetID'});

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
						//var citation = graph.createNode({type: citoType, id: citoId});
						//citation.setValue(citoType.CITED_ENTITY, graph.createStub(targetId));
						//citation.setValue(citoType.CITING_ENTITY, graph.createStub(linkURI));
						//anno.addValue(annoSpec.BODY, citation);

						//Create node for link uri, with typing information
						var uriLink = graph.createNode({type: type, id: linkURI});

                        //Add the "citationAct type" to annotation
                        anno.addValue('@type', citoType.TYPE);
                        //anno.setValue(annoSpec.CITED_ENTITY, graph.createStub(targetId));
                        anno.setValue(citoType.CITED_ENTITY, graph.createStub(targetId));
                        //anno.setValue(annoSpec.CITING_ENTITY, graph.createStub(linkURI));
                        //anno.setValue(citoType.CITING_ENTITY, uriLink);
                        anno.setValue(citoType.CITING_ENTITY, graph.createStub(linkURI));

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
					tag.setValue(jsonoa.types.SemanticTag.PREF_LABEL, domain.textLong);
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

            //If the number of targets exceeds one, then attach the collection as a oc:composite.
            //Else attach the target directly to the annotation

            //if(targetMap.length > 1)
            if(Object.keys(targetMap).length > 1 )
            {

                // Save each of the selected targetids into the annotation target
                for(target in targetMap)
                {
                    var targetTargetId = target;
                    var targetDesc = targetMap[target][1];

                    var target = graph.createNode({type: jsonoa.types[targetDesc], id: targetTargetId});
                    composite.addValue(compositeSpec.ITEM, graph.createStub(targetTargetId));
                }

                //Attach the composite to the Annotation
                anno.setValue(annoSpec.TARGET, composite);

            }
            else
            {
                for(target in targetMap)
                {
                    var targetTargetId = target;
                    var targetDesc = targetMap[target][1];

                    var target = graph.createNode({type: jsonoa.types[targetDesc], id: targetId});
                    anno.setValue(annoSpec.TARGET, graph.createStub(targetTargetId));
                }
                //Attach the target to the Annotation
                anno.setValue(annoSpec.TARGET, target);
            }



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
				charme.logic.fetchGCMDVocab(false).then(function(keywords){
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


/*charme.web.services.factory('fetchFabioTypes', function(){
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
});*/

/*charme.web.services.factory('fetchTargetType', function() {
    return function(targetId) {
        return charme.logic.fetchTargetType(targetId);
    };
});*/

charme.web.services.factory('fetchTargetTypeVocab', function() {
    return function() {	
        var promise = new Promise(function(resolver) {
            charme.logic.fetchTargetTypeVocab().then(function(types) {
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

/**
 * This service returns the list of selected targets.
 */
charme.web.services.factory('targetService', function() {
        return {
            targets: [],   /* This array is initialised in the InitCtrl */
            //targetsHighlighted: []
            
            listViewTarget: ''
        };
    }
);

charme.web.services.factory('searchBarService', function() {
        return {
            isSearchOpen: false,
            targetDropdownFlag: false
        };
    }
);

charme.web.services.factory('minimisedService', function() {
        return {
            isMinimised: false
        };
    }
);

charme.web.services.factory('shiftAnnoService', function() {
        var shiftAnnoService = {};
        shiftAnnoService.annoList = {};
        
        shiftAnnoService.getPosition = function(targetId, annoId) {
            for(var i = 0; i < shiftAnnoService.annoList[targetId].length; i++) {
                if(annoId === shiftAnnoService.annoList[targetId][i].id)
                    return i + 1;
            }
        };
        
        shiftAnnoService.getListLength = function(targetId) {
            return shiftAnnoService.annoList[targetId].length;
        };
    
        shiftAnnoService.getNewAnno = function(targetId, annoId, direction) {
            for(var i = 0; i < shiftAnnoService.annoList[targetId].length; i++) {
                if(shiftAnnoService.annoList[targetId][i].id === annoId) {
                    if(i + direction === -1)
                        return shiftAnnoService.annoList[targetId][shiftAnnoService.annoList[targetId].length - 1];
                    else if(i + direction === shiftAnnoService.annoList[targetId].length)
                        return shiftAnnoService.annoList[targetId][0];
                    else                    
                        return shiftAnnoService.annoList[targetId][i + direction];
                }
            }
        };

        return shiftAnnoService;
    }
);

charme.web.services.factory('replyToAnnoService', function() {
        return {
            comments: '',
            initialTarget: ''
        };
    }
);
