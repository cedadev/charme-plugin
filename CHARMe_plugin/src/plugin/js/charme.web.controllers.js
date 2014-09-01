charme.web.controllers = angular.module('charmeControllers', ['charmeServices']);

/**
 * A controller that is run on intialisation of the plugin.
 */
charme.web.controllers.controller('InitCtrl', ['$scope', '$routeParams', '$location', '$filter', 'loginService', 'persistence', 'searchAnnotations',
    function ($scope, $routeParams, $location, $filter, loginService, persistence, searchAnnotations){
        searchAnnotations.clearListeners();
        var targetId=$routeParams.targetId;
        loginService._loadState();
        $location.path(encodeURIComponent(targetId) + '/annotations/');
    }
]);

/**
 * A controller specific to the plugin header
 */
charme.web.controllers.controller('HeaderCtrl', ['$scope',
function ($scope){
    $scope.close = function(){
        charme.web.close();
    };
}]);

/**
 * List the results of an annotation search.
 */
charme.web.controllers.controller('ListAnnotationsCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$timeout', '$filter', 'fetchTargetType', 'fetchAnnotationsForTarget', 'loginService', 'searchAnnotations', 
    function ($rootScope, $scope, $routeParams, $location, $timeout, $filter, fetchTargetType, fetchAnnotationsForTarget, loginService, searchAnnotations){
        $scope.listAnnotationsFlag=true;
        $scope.loading=true;
        
        /*
         * Check if already logged in
         */

        $scope.loggedIn=loginService.isLoggedIn();
        if($scope.loggedIn) {
            $scope.userName = 'Loading...';
        
            var auth = loginService.getAuth();
            if(auth && auth.user) {
                $scope.userName=auth.user.first_name + ' ' + auth.user.last_name;
                $scope.email=auth.user.email;
            }
        }
        
        /*
         * Register a login listener for future login events
         */
        loginService.addLoginListener(function(authToken){
            $scope.$apply(function(){
                $scope.loggedIn=authToken.token ? true : false;
                var user = authToken.user;
                $scope.userName=user.first_name + ' ' + user.last_name;
                $scope.email=user.email;
            });
        });

        var targetId=$routeParams.targetId; 
		/**
		 * Onclick functions for buttons
		 */
        $scope.close = function(){
            charme.web.close();
        };

        $scope.newAnnotation = function(){
            $location.path(encodeURIComponent(targetId) + '/annotations/new/');
        };

        $scope.login = function(){
            window.addEventListener('message', loginService._loginEvent, false);
            window.open(charme.logic.urls.authRequest());
        };

        loginService.addLogoutListener(function(){
            $scope.loggedIn=false;
        });

        $scope.logout = function(){
            loginService.logout();
        };

		/**
		 * Listen for search events. Searches are triggered by asynchronous events in the faceted search bar.
		 */
        $scope.targetId=targetId;
        $scope.targetType = {};
        fetchTargetType(targetId).then(function(targetType) {
            $scope.targetType.desc = targetType[0];
        }, function(error) {
            $scope.$apply(function() {
                $scope.targetType.error = error;
            });
        });

        searchAnnotations.addListener(searchAnnotations.listenerTypes.BEFORE_SEARCH, function(){
            $scope.entries = [];
            $scope.loading = true;
            $scope.errorMsg = '';
        });

        searchAnnotations.addListener(searchAnnotations.listenerTypes.AFTER_SEARCH, function(){
            $scope.$apply(function(){
                $scope.loading = false;
            });
        });

        searchAnnotations.addListener(searchAnnotations.listenerTypes.SUCCESS, function(results, pages){
            $scope.$apply(function(){
                $scope.entries = results;
                $scope.pages = pages;
                
                angular.forEach($scope.entries, function(entry) {
                    //Double-escape URIs embedded within a URI in order to work with Angular routing
                    entry.uri = '#/' + encodeURIComponent(encodeURIComponent(targetId)) + '/annotation/' 
                                     + encodeURIComponent(encodeURIComponent(entry.id)) + '/';
                });
            });
        });

        searchAnnotations.addListener(searchAnnotations.listenerTypes.ERROR, function(errorMsg){
            $scope.$apply(function(){
                $scope.errorMsg = errorMsg;
            });
        });

		/**
		 * Search criteria are encoded in URL. This is a convenience function for retrieving search criteria from URL
		 * @type {{}}
		 */
        var criteria = {};
        var criteriaFromUrl = function() {
            var resultsPerPage = $location.search()['resultsPerPage'];
            var selectedRPP = $location.search()['selectedRPP'];
            if(typeof resultsPerPage === 'string')
                criteria.resultsPerPage = resultsPerPage;
            if(typeof selectedRPP === 'string'){
                if(selectedRPP === resultsPerPage)
                    criteria.selectedRPP = criteria.resultsPerPage;
                else
                    criteria.selectedRPP = selectedRPP;
            }
            
            //var listOrder = $location.search()['listOrder'];
            //if(typeof listOrder === 'string')
            //    criteria.listOrder = listOrder;
            
            return criteria;
        };
        
        criteria = criteriaFromUrl();
        
        $rootScope.$on('listOptions', function(event, newResultsPerPage, newSelectedRPP) {//, newListOrder) {
            criteria.resultsPerPage = newResultsPerPage;
            criteria.selectedRPP = newSelectedRPP;
            //criteria.listOrder = newListOrder;
        });
        
        // Store resultsPerPage and selectedRPP in the URL so they can be retrieved if user activates $scope.directSearch when viewing annotation
        $scope.viewAnnotation = function(annoId) {
            $timeout(function() {
                $location.search('resultsPerPage', criteria.resultsPerPage.toString())
                         .search('selectedRPP', criteria.selectedRPP.toString())
                         //.search('listOrder', criteria.listOrder.toString())
                         .replace();
            });
        };
        
        $scope.setPage = function(newPage){
            $rootScope.$broadcast('changePage', newPage, $scope.pages);
        };
        
        $scope.directSearch = function(facet, name, evt) {
            evt.preventDefault();
            $location.path(encodeURIComponent(targetId) + '/annotations/').search(facet, name);
        };
    }]);

/**
 * View details of individual annotation.
 */
charme.web.controllers.controller('ViewAnnotationCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$timeout', '$window', 'fetchTargetType', 'fetchAnnotation', 'fetchKeywords', 'fetchFabioTypes', 'fetchAllMotivations', 'searchAnnotations',
    function ($rootScope, $scope, $routeParams, $location, $timeout, $window, fetchTargetType, fetchAnnotation, fetchKeywords, fetchFabioTypes, fetchAllMotivations, searchAnnotations){
		$scope.viewAnnotationFlag=true;
        searchAnnotations.clearListeners();
        $scope.loading=true;
        var targetId=$routeParams.targetId;
        $scope.cancel = function(){
            //$location.path(encodeURIComponent(targetId) + '/annotations/');
            window.history.back();
        };
        var annoId=$routeParams.annotationId;
        $scope.annotationId=annoId;
        $scope.targetId=targetId;
        
        $scope.targetType = {};
        fetchTargetType(targetId).then(function(targetType) {
            $scope.targetType.desc = targetType[0];
        }, function(error) {
            $scope.$apply(function() {
                $scope.targetType.error = error;
            });
        });
        
        Promise.every(fetchKeywords(), fetchAnnotation(annoId), fetchFabioTypes(), fetchAllMotivations()).then(
            function (results){
                $scope.loading=false;
				//Create local alias to avoid having to use fully resolved name
				var annoType = jsonoa.types.Annotation;
                $scope.$apply(function(){
                    var categories = results[0];
                    var keywords = {};
                    var fabioTypes = results[2];
                    var motivations_catagories = results[3];
                    var motivation_keywords = {};
                    
                    // Need these lines?
                    //Process GCMD keywords
                    //angular.forEach(categories[0].keywords, function(keyword){
                    //    keywords[keyword.uri]=keyword.desc;
                    //});

                    //Process Motivation keywords
                    angular.forEach(motivations_catagories[0].keywords, function(keyword){
                        motivation_keywords[keyword.uri]=keyword.desc;
                    });
                    
                    var graph = results[1];
                    //Process graph
                    var annoList = graph.getAnnotations();
                    if (annoList.length > 0) {
                        var anno = annoList[0];
                        var motivations = anno.getValues(annoType.MOTIVATED_BY);
                        if (motivations && motivations.length > 0) {
                            $scope.motivationTags = [];
                        }
                        angular.forEach(motivations, function (motivation){
                            var motivURI =  motivation.getValue(motivation.ID);
                            $scope.motivationTags.push({uri: motivURI, desc: motivation_keywords[motivURI]});
                        });
                        var bodies = anno.getValues(annoType.BODY);
						//Create local alias to avoid having to use fully qualified name everywhere
						var textType = jsonoa.types.Text;
						var citoSpec = jsonoa.types.CitationAct;
                        angular.forEach(bodies, function(body){
                            if (body.hasType(textType.TEXT) || body.hasType(textType.CONTENT_AS_TEXT)){
                                $scope.comment = body.getValue(textType.CONTENT_CHARS);
                            }
                            else if (body.hasType(citoSpec.TYPE)) {
                                var citingEntity = body.getValue(citoSpec.CITING_ENTITY);
                                //Check if the returned value is an object, or a primitive (should be an object, but some historical data might have primitives in this field)
                                if (citingEntity.getValue){
                                    var citoURI = citingEntity.getValue(jsonoa.types.Common.ID);
                                    $scope.citation = {};
                                    $scope.citation.loading=true;
                                    $scope.citation.uri = citoURI;

                                    //Match the citation type to a text description.
                                    var citoTypes = citingEntity.getValues(citingEntity.TYPE_ATTR_NAME);
                                    angular.forEach(fabioTypes, function(fType){
                                        if (citoTypes.indexOf(fType.resource)>=0){
											if (!$scope.citation.types){
												$scope.citation.types = [];
											}
											$scope.citation.types.push(fType.label);
//                                            $scope.citation.citoTypeDesc = citoType.label;
                                        }
                                    });

                                    //Trim the 'doi:' from the front
                                    var doiTxt = citoURI.substring(charme.logic.constants.DXDOI_URL.length, citoURI.length);
                                    var criteria = {};
                                    criteria[charme.logic.constants.DXDOI_CRITERIA_ID]=doiTxt;
                                    charme.logic.fetchDxdoiMetaData(criteria).then(function(citation){
                                        $scope.$apply(function(){
                                            $scope.citation.text = citation;
                                            $scope.citation.loading=false;
                                        });
                                    }, function(error){
                                        $scope.$apply(function(){
                                            $scope.citation.text = citoURI;
                                            $scope.citation.error='Error: Could not fetch citation metadata';
                                            $scope.citation.loading=false;
                                        });
                                    });
                                } else {
                                    $scope.link.uri = citingEntity;
                                }
                            }
                            else if (body.hasType(jsonoa.types.SemanticTag.TYPE)){
                                if (!$scope.tags){
                                    $scope.tags = [];
                                }
                                var tagURI = body.getValue(jsonoa.types.Common.ID);
                                var prefLabel = body.getValue(jsonoa.types.SemanticTag.PREF_LABEL);
                                $scope.tags.push({uri: tagURI, desc: prefLabel});
                            } else {
                                //Match the citation type to a text description.
                                var type = body.getValue(body.TYPE_ATTR_NAME);
                                $scope.link = {};
                                $scope.link.uri = body.getValue(jsonoa.types.Common.ID);
                                angular.forEach(fabioTypes, function(fabioType){
                                    if (type === fabioType.resource){
                                        $scope.link.linkTypeDesc = fabioType.label;
                                    }
                                });
                            }

                        });

                        var authorDetails = anno.getValues(annoType.ANNOTATED_BY);
						var personSpec = jsonoa.types.Person;
						var organizationSpec = jsonoa.types.Organization;
                        angular.forEach(authorDetails, function(authorDetail){
                            if (authorDetail.hasType(personSpec.TYPE)){
                                $scope.author = authorDetail.getValue(personSpec.GIVEN_NAME) + ' ' + authorDetail.getValue(personSpec.FAMILY_NAME);
                                $scope.userName = authorDetail.getValue(personSpec.USER_NAME);
                            } else if (authorDetail.hasType(organizationSpec.TYPE)){
                                $scope.organizationName = authorDetail.getValue(organizationSpec.NAME);
                                $scope.organizationUri = authorDetail.getValue(organizationSpec.URI);
                            }
                        });

                        if (!$scope.comment){
                            $scope.noComment=true;
                        }
                    } else {
                        // $timeout used to avoid 'apply already in progress' error
                        $timeout(function() {
                            $scope.$apply(function(){
                                $scope.errorMsg='Error: No annotation returned';
                            });
                        });
                    }
                });
            },
            function(error){
                // $timeout used to avoid 'apply already in progress' error
                $timeout(function() {
                    $scope.$apply(function(){
                        $scope.errorMsg='Error: ' + error;
                    });
                });
            }
        );

        $scope.directSearch = function(facet, name) {
            $location.path(encodeURIComponent(targetId) + '/annotations/').search(facet, name);
        };
    }]);

/**
 * New annotation screen.
 */
charme.web.controllers.controller('NewAnnotationCtrl', ['$scope', '$routeParams', '$location', '$window', '$timeout', 'saveAnnotation', 'loginService', 'fetchTargetType', 'fetchAllMotivations', 'fetchKeywords', 'fetchFabioTypes', 'searchAnnotations', 
    function ($scope, $routeParams, $location, $window, $timeout, saveAnnotation, loginService, fetchTargetType, fetchAllMotivations, fetchKeywords, fetchFabioTypes, searchAnnotations){
        searchAnnotations.clearListeners();
        $scope.newAnnotationFlag=true;
        var targetId=$routeParams.targetId;
        $scope.targetId=targetId;
        
        $scope.anno = {};
        $scope.targetType = {};
        fetchTargetType(targetId).then(function(targetType) {
            $scope.anno.target = $scope.targetType.desc = targetType[0];

            if(!targetType[1])
                $scope.errorMsg = 'Error: ' + targetType[0];
        }, function(error) {
            $scope.$apply(function() {
                $scope.errorMsg = error;
            });
        });
        
        $scope.loggedIn=loginService.isLoggedIn();
        
        fetchAllMotivations().then(function(categories){
            $scope.$apply(function(){
                $scope.$broadcast('motivationCategoriesForNewAnno', categories);
            });
        });
        
        fetchKeywords().then(function(categories){
            $scope.$apply(function(){
                $scope.$broadcast('domainCategoriesForNewAnno', categories);
            });
        });
        
        fetchFabioTypes().then(function(types){
            var options = [];
            angular.forEach(types, function(type, innerKey){
                options.push({text: type.label, value: type.resource});
            });
            $scope.$apply(function(){
                $scope.citoTypes = options;
            });
        });
        
        /*fetchAllTargetTypes().then(function(types) {
            var options = [];
            angular.forEach(types, function(type){
                options.push({text: type.label, value: type.resource});
            });
            $scope.$apply(function(){
                $scope.targetTypes = options;
                $scope.anno.target = $scope.targetTypes[0].text;
            });
        });*/
        
        $scope.cancel = function(){
            if ($scope.loading)
                return;
            window.history.back();
        };
        $scope.changeURI = function(uri){
            $scope.anno.citoText='';
            var doiVal = charme.logic.findDOI(uri);
            if (doiVal){
                var criteria = {};
                criteria[charme.logic.constants.DXDOI_CRITERIA_ID]=doiVal;
                charme.logic.fetchDxdoiMetaData(criteria).then(function(citation){    
                    $scope.$apply(function(){
                        $scope.anno.citoText = citation;
                    });
                });
            }
        };
        $scope.login = function(){
            window.addEventListener('message', loginService._loginEvent, false);
            window.open(charme.logic.urls.authRequest());
            loginService.addLoginListener(function(authToken){
                $scope.$apply(function(){
                    $scope.loggedIn=authToken.token ? true : false;
                });
            });
        };

        $scope.save = function(annoModel){
            if ($scope.loading)
                return;
            $scope.loading=true;
            var auth = loginService.getAuth();
            saveAnnotation(annoModel, targetId, auth).then(
                function(){
                    $scope.$apply(function(){
                        $scope.loading=false;
                        $location.path(encodeURIComponent(targetId) + '/annotations/');

                        //Issue the refresh message
                        top.postMessage('refreshAnnotationCount' + ":::" + targetId, '*');

                    });
                },
                function(error){
                    $scope.$apply(function(){
                        if (error.status===401){
                            $scope.errorMsg='Authentication failed. Please login and try again.';
                            $scope.loggedIn=false;
                            loginService.logout();
                        } else {
                            $scope.errorMsg=error;
                        }
                        $scope.loading=false;
                    });
                });
        };
    }]);

charme.web.controllers.controller('SearchCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$window', '$timeout', 'fetchAllSearchFacets', 'searchAnnotations',
    function($rootScope, $scope, $routeParams, $location, $window, $timeout, fetchAllSearchFacets, searchAnnotations) {
        var targetId=$routeParams.targetId;
        
        $scope.loading = true;
        $scope.resultsPerPage = [10, 20, 30, 'All'];  // first value in this array must be a number (not 'All')
        //$scope.listOrderOptions = [{text: 'Newest', sortNum: -1}, {text: 'Oldest', sortNum: 1}];

        $scope.criteria = {
            selectedTargetTypes: [],
            selectedMotivations: [],
            selectedDomains: []
        };
        
        var criteria = {
            targets: [targetId]
            //count: 100000  // until the node can handle date queries, we must always retrieve all annotations
        };

        fetchAllSearchFacets(criteria).then(function(facetTypes){
            $scope.$apply(function(){
                var targetTypeKeywords = facetTypes[charme.logic.constants.FACET_TYPE_TARGET_TYPE];
                var targetTypeCategories = [{
                	name: 'Dummy Target Type',
                        keywords: targetTypeKeywords
                }];
                $scope.$broadcast('targetTypeCategoriesForSearch', targetTypeCategories);

                var motivationKeywords = facetTypes[charme.logic.constants.FACET_TYPE_MOTIVATION];
                var motivationCategories = [{
                	name: 'OA Motivation',
                        keywords: motivationKeywords
                }];
                $scope.$broadcast('motivationCategoriesForSearch', motivationCategories);

                var domainKeywords = facetTypes[charme.logic.constants.FACET_TYPE_DOMAIN];
                var domainCategories = [{
                        name: 'GCMD',
                        keywords: domainKeywords
                }];
                $scope.$broadcast('domainCategoriesForSearch', domainCategories);
                
                $scope.organizations = facetTypes[charme.logic.constants.FACET_TYPE_ORGANIZATION];
            });
        });
        
        var criteriaFromSearch = function(){
            $scope.loading = true;

            // In case facets are undefined in the URL, define them here
            criteria.targetTypes = criteria.motivations = criteria.domainsOfInterest = criteria.organization = criteria.creator = '';
            criteria.pageNum = 1;
            criteria.resultsPerPage = $scope.resultsPerPage[0];
            criteria.selectedRPP = $scope.resultsPerPage[0];
            //criteria.listOrder = $scope.listOrderOptions[0].sortNum;
            $scope.selectedRPP = criteria.selectedRPP;
            //$scope.selectedOrder = criteria.listOrder;

            var targetTypeParam = $location.search()[charme.web.constants.PARAM_TARGET_TYPES];
            if(typeof targetTypeParam === 'string')
                criteria.targetTypes = targetTypeParam.split(',');

            var motivationParam = $location.search()[charme.web.constants.PARAM_MOTIVATIONS];
            if(typeof motivationParam === 'string')
                criteria.motivations = motivationParam.split(',');
 
            var domainsParam = $location.search()[charme.web.constants.PARAM_DOMAINS];
            if(typeof domainsParam === 'string')
                criteria.domainsOfInterest = domainsParam.split(',');

            var organization = $location.search()[charme.web.constants.PARAM_ORGANIZATION];
            if(typeof organization === 'string')
                criteria.organization = organization;

            var creator = $location.search()[charme.web.constants.PARAM_CREATOR];
            if(typeof creator === 'string')
                criteria.creator = creator;
            
            $rootScope.$broadcast('newTargetTypes', criteria.targetTypes);
            $rootScope.$broadcast('newMotivations', criteria.motivations);
            $rootScope.$broadcast('newDomains', criteria.domainsOfInterest);
            $scope.criteria.selectedOrganization = criteria.organization;
            $scope.criteria.selectedCreator = criteria.creator;

            var pageNum = $location.search()['pageNum'];
            if(typeof pageNum === 'string')
                criteria.pageNum = parseInt(pageNum);

            // selectedRPP represents the option selected in the HTML - either a number or a string ('All') - and is used for CSS styling (so that the selected option is underlined)
            // resultsPerPage is the value sent to the node, and must be a number, not a string - see scope.setResultsPerPage below
            var resultsPerPage = $location.search()['resultsPerPage'];
            var selectedRPP = $location.search()['selectedRPP'];
            if(typeof resultsPerPage === 'string')
                criteria.resultsPerPage = parseInt(resultsPerPage);
            if(typeof selectedRPP === 'string'){
                if(selectedRPP === resultsPerPage)
                    $scope.selectedRPP = criteria.selectedRPP = criteria.resultsPerPage;
                else
                    $scope.selectedRPP = criteria.selectedRPP = selectedRPP;
                }

            //var listOrder = $location.search()['listOrder'];
            //if(typeof listOrder === 'string')
            //    $scope.selectedOrder = criteria.listOrder = parseInt(listOrder);
            
            $rootScope.$broadcast('listOptions', criteria.resultsPerPage, criteria.selectedRPP);//, criteria.listOrder);
            return criteria;
        };
 
        var loadCriteriaIntoModel = function(criteriaForLoad){
            if(typeof $scope.criteria === 'undefined')
                $scope.criteria = {};
            
            if(criteriaForLoad.targetTypes instanceof Array){
                var loadedTargetTypes = [];
                angular.forEach(criteriaForLoad.targetTypes, function(targetType){
                    loadedTargetTypes.push({value: targetType});
                });
                $scope.criteria.selectedTargetTypes = loadedTargetTypes;
            }
            
            if(criteriaForLoad.motivations instanceof Array){
                var loadedMotivations = [];
                angular.forEach(criteriaForLoad.motivations, function(motivation){
                    loadedMotivations.push({value: motivation});
                });
                $scope.criteria.selectedMotivations = loadedMotivations;
            }

            if(criteriaForLoad.domainsOfInterest instanceof Array){
                var loadedDomains = [];
                angular.forEach(criteriaForLoad.domainsOfInterest, function(domain){
                    loadedDomains.push({value: domain});
                });
                $scope.criteria.selectedDomains = loadedDomains;
            }
 
            if(typeof criteriaForLoad.organization !== 'undefined'){
                $scope.criteria.selectedOrganization = criteriaForLoad.organization;
            }

            if(typeof criteriaForLoad.creator !== 'undefined'){
                $scope.criteria.selectedCreator = criteriaForLoad.creator;
            }
        };

        var criteriaOnLoad = criteriaFromSearch();
        loadCriteriaIntoModel(criteriaOnLoad);
        searchAnnotations.searchAnnotations(criteriaOnLoad);
 
        var debounceHandle;
        $scope.$watch('criteria', function(newVal, oldVal){
            // After a watcher is registered with the scope, the listener function is called once, asynchronously, to initialize the watcher
            if(newVal === oldVal) {
                return;
            }
            
            if(typeof $scope.criteria !== 'undefined') {
                if (debounceHandle)
                    $timeout.cancel(debounceHandle);
 
                /*
                Set timeout here in order to 'debounce' input from text fields. This avoids a search being triggered on each keypress.
                Newer versions of angular provide this out of the box, but we are stuck supporting IE8. For now...
                */
                debounceHandle = $timeout(function() {
                    var selectedTargetTypes = [];
                    angular.forEach($scope.criteria.selectedTargetTypes,
                        function(selectedTargetType) {
                            selectedTargetTypes.push(selectedTargetType.value);
                        });
                    var currentTargetTypes = $location.search()[charme.web.constants.PARAM_TARGET_TYPES];
                    currentTargetTypes = typeof currentTargetTypes === 'undefined' ? '' : currentTargetTypes;
                    var newTargetTypes = selectedTargetTypes.join(',');
                    if(currentTargetTypes !== newTargetTypes)
                        $location.search(charme.web.constants.PARAM_TARGET_TYPES, newTargetTypes);

                    var selectedMotivations = [];
                    angular.forEach($scope.criteria.selectedMotivations,
                        function(selectedMotivation) {
                            selectedMotivations.push(selectedMotivation.value);
                        });
                    var currentMotivations = $location.search()[charme.web.constants.PARAM_MOTIVATIONS];
                    currentMotivations = typeof currentMotivations === 'undefined' ? '' : currentMotivations;
                    var newMotivations = selectedMotivations.join(',');
                    if(currentMotivations !== newMotivations)
                        $location.search(charme.web.constants.PARAM_MOTIVATIONS, newMotivations);
 
                    var selectedDomains = [];
                    angular.forEach($scope.criteria.selectedDomains, function (selectedDomain) {
                        selectedDomains.push(selectedDomain.value);
                    });
                    var currentDomains = $location.search()[charme.web.constants.PARAM_DOMAINS];
                    currentDomains = typeof currentDomains === 'undefined' ? '' : currentDomains;
                    var newDomains = selectedDomains.join(',');
                    if(currentDomains !== newDomains)
                        $location.search(charme.web.constants.PARAM_DOMAINS, newDomains);
 
                    var currentOrganization = $location.search()[charme.web.constants.PARAM_ORGANIZATION];
                    currentOrganization = typeof currentOrganization === 'undefined' ? '' : currentOrganization;
                    var newOrganization = $scope.criteria.selectedOrganization;
                    if(currentOrganization !== newOrganization)
                        $location.search(charme.web.constants.PARAM_ORGANIZATION, newOrganization);
 
                    var currentCreator = $location.search()[charme.web.constants.PARAM_CREATOR];
                    currentCreator = typeof currentCreator === 'undefined' ? '' : currentCreator;
                    var newCreator = $scope.criteria.selectedCreator;
                    if(currentCreator !== newCreator)
                        $location.search(charme.web.constants.PARAM_CREATOR, newCreator);
                    
                    criteria.pageNum = 1;
                    $location.search('pageNum', criteria.pageNum.toString());
                }, 500);
            }
        }, true);
        
        $scope.$on('$routeUpdate', function(){
            searchAnnotations.searchAnnotations(criteriaFromSearch());
        });

        $rootScope.$on('changePage', function(event, newPage, pages){
            var currentPage = criteria.pageNum;
            
            if(typeof newPage === "number")
                criteria.pageNum = newPage;
            else if(newPage === '-1' && criteria.pageNum > 1)
                criteria.pageNum--;
            else if(newPage === '+1' && criteria.pageNum < pages.length)
                criteria.pageNum++;

            if(criteria.pageNum !== currentPage) {
                $location.search('pageNum', criteria.pageNum.toString());
            }
        });

        var maxResults, firstSearchFlag = true;
        searchAnnotations.addListener(searchAnnotations.listenerTypes.SUCCESS, function(results, pages, totalResults){
            $scope.$apply(function() {
                $scope.numResults = totalResults;
                $scope.loading = false;
                
                // The first search, on loading, returns the total number of annotations in 'totalResults', and 
                // we store that number as 'maxResults' for future reference
                if(firstSearchFlag) {
                    firstSearchFlag = false;
                    maxResults = totalResults;
                }
            });
        });
        $scope.setResultsPerPage = function(rpp) {
            if(typeof rpp === "number")
                criteria.resultsPerPage = rpp;
            else if(typeof rpp === "string")
                criteria.resultsPerPage = maxResults;
                  
            $scope.selectedRPP = criteria.selectedRPP = rpp;
            criteria.pageNum = 1;
            $location.search('pageNum', criteria.pageNum.toString())
                     .search('resultsPerPage', criteria.resultsPerPage.toString())
                     .search('selectedRPP', criteria.selectedRPP.toString());
        };
        
        //$scope.setListOrder = function(sortNum) {
        //    $scope.selectedOrder = criteria.listOrder = sortNum;
        //    criteria.pageNum = 1;
        //    $location.search('pageNum', criteria.pageNum.toString())
        //             .search('listOrder', criteria.listOrder.toString());
        //};
        
        // Function to ensure correct CSS colour (grey) for placeholder text is applied immediately
        changeOrganisation = function() {
            var orgSelect = document.getElementById("chooseOrganisation");
            if(orgSelect.value === "")
                orgSelect.className += " select-placeholder";
            else
                orgSelect.className = orgSelect.className.replace(/\sselect-placeholder/g, '');
        };
        
        $scope.reset = function() {
            $rootScope.$broadcast('reset');
            criteria.pageNum = 1;
            $scope.criteria.selectedTargetTypes = '';
            $scope.criteria.selectedMotivations = '';
            $scope.criteria.selectedDomains = '';
            $scope.criteria.selectedOrganization = '';
            $scope.criteria.selectedCreator = '';
        };
    }]);
