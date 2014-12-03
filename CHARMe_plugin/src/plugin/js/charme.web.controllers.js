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

charme.web.controllers = angular.module('charmeControllers', ['charmeServices']);

charme.web.controllers.controller('InitCtrl', ['$scope', '$routeParams', '$location', '$filter', 'loginService', 'targetService', 'searchBarService', 'searchAnnotations',
    function ($scope, $routeParams, $location, $filter, loginService, targetService, searchBarService, searchAnnotations){
        searchAnnotations.clearListeners();
        var targetId = $routeParams.targetId;
        loginService._loadState();

        // call the getSelectedTargets() function on charme.js
        var selectedTargets = window.parent.charme.plugin.getSelectedTargets();
        targetService.targets = selectedTargets;
        
        /*if(selectedTargets.hasOwnProperty(charme.common.ALL_TARGETS)) {
            //targetService.targets = {};
            //targetService.targets[charme.common.ALL_TARGETS] = selectedTargets[charme.common.ALL_TARGETS];
            //searchBarService.isSearchOpen = true;
            targetService.targets = selectedTargets;
        }
        else
            targetService.targets = selectedTargets;*/
        
        $location.path(encodeURIComponent(targetId) + '/annotations/');
    }
]);

/**
 * A controller specific to the plugin header
 */
charme.web.controllers.controller('HeaderCtrl', ['$scope', 'targetService', 'minimisedService', '$routeParams',
function ($scope, targetService, minimisedService, $routeParams){
    $scope.close = function() {
        //var targetId = $routeParams.targetId;
        var targetId = targetService.listViewTarget;
        charme.web.close($.map(targetService.targets, function(value, index){return index;}).length === 1, targetId);
    };

    $scope.size = 'max';
    $scope.minimise = function(){
        $scope.size = 'min';
        $scope.headerBorderBottomStyle = $('#charmeDragHandle').css('border-bottom');
        $('#charmeDragHandle').css('border-bottom', 'none');
        $('.modal-body').hide();
        $('.modal-footer').hide();
        minimisedService.isMinimised = true;
        charme.web.minimise(top.document.getElementById('charme-plugin-frame').offsetTop);
    };
    $scope.maximise = function(){
        $scope.size = 'max';
        $('#charmeDragHandle').css('border-bottom', $scope.headerBorderBottomStyle);
        $('.modal-body').show();
        $('.modal-footer').show();
        minimisedService.isMinimised = false;
        charme.web.maximise();
    };
    
    $scope.back = function() {
        window.history.back();
    };
    $scope.forward = function() {
        window.history.forward();
    };
    //$scope.reload = function() {
    //    location.reload(true);
    //};
    
    // If data provider allows the plugin GUI to be dragged, make header element the handle for dragging
    var plugin = window.parent.document.getElementById('charme-placeholder');
    if(plugin.className === 'charme-draggable')
        document.onLoad = dragIF_addHandle(document.getElementById('charmeDragHandle'), window);
}]);
charme.web.controllers.controller('FooterCtrl', ['$rootScope', '$scope', '$timeout',
function($rootScope, $scope, $timeout){
    $scope.confirmingDelete = false;
    
    $rootScope.$on('noDelete', function() {
        $scope.confirmingDelete = false;
    });
    $rootScope.$on('noModify', function() {
        $scope.confirmingModify = false;
    });
    
    //$('.shift-anno-buttons-holder').css('right', ($('.modal-footer').outerWidth() - $('.shift-anno-buttons-holder').outerWidth()) / 2);
    $rootScope.$on('shiftButtons', function() {
        $timeout(function() {
            $scope.$apply(function() {
                $('.shift-anno-buttons-holder').css('right', ($('.modal-footer').outerWidth() - $('.shift-anno-buttons-holder').outerWidth()) / 2);
            });
        });
    });
}]);

/**
 * List the results of an annotation search.
 */
charme.web.controllers.controller('ListAnnotationsCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$filter', '$timeout', 'fetchAnnotationsForTarget', 'loginService', 'searchAnnotations', 'targetService', 'searchBarService', 'shiftAnnoService', 'minimisedService',
    function ($rootScope, $scope, $routeParams, $location, $filter, $timeout, fetchAnnotationsForTarget, loginService, searchAnnotations, targetService, searchBarService, shiftAnnoService, minimisedService){
        $scope.listAnnotationsFlag=true;
       	$scope.allTargets = targetService.targets[charme.common.ALL_TARGETS];
        $scope.loadingList = $scope.loadingFacets = true;
        $scope.targets = targetService.targets;
        $scope.close = function() {
            var targetId = $routeParams.targetId;
            charme.web.close($.map(targetService.targets, function(value, index){return index;}).length === 1, targetId);
        };
        
        $scope.isSearchOpen = searchBarService.isSearchOpen;
        if(searchBarService.targetDropdownFlag) {
            $scope.searchOpen = 'open';
            searchBarService.targetDropdownFlag = false;
        }
        else
            $scope.searchOpen = $scope.isSearchOpen ? 'opened' : 'collapsed';

        $scope.smallSpan = top.window.innerWidth < charme.common.LARGE_WINDOW ? 'span5' : 'span7';
        $scope.largeSpan = 'span12';
        if($scope.isSearchOpen)
            $timeout(function() {
                $('#chooseTarget').removeClass($scope.largeSpan).addClass($scope.smallSpan);
            });

        var cachedIsSearchOpen = $scope.isSearchOpen;
        
        $scope.setSearchOpen = function() {
            if($scope.searchOpen === 'open' || $scope.searchOpen === 'opened') {
                $scope.searchOpen = 'collapse';
                searchBarService.isSearchOpen = $scope.isSearchOpen = false;
                $('#chooseTarget').removeClass($scope.smallSpan).addClass($scope.largeSpan);
            }
            else {
                $scope.searchOpen = 'open';
                searchBarService.isSearchOpen = $scope.isSearchOpen = true;
                $('#chooseTarget').removeClass($scope.largeSpan).addClass($scope.smallSpan);
            }
        };
        
        // Adjust GUI width to fit user's window size, with debounce to avoid function calls stacking up
        var pluginWidthResize = charme.logic.debounce(function() {
            if(minimisedService.isMinimised)
                return;
            
            $scope.$apply(function(){
                if($scope.searchOpen === 'open' || $scope.searchOpen === 'opened')
                    $('#chooseTarget').removeClass($scope.smallSpan);
                
                $scope.smallSpan = top.window.innerWidth < charme.common.LARGE_WINDOW ? 'span5' : 'span7';
                
                if($scope.searchOpen === 'open' || $scope.searchOpen === 'opened')
                    $('#chooseTarget').addClass($scope.smallSpan);
                
                var plugin = top.window.document.getElementById('charme-plugin-frame');
                if(top.window.innerWidth <= charme.common.SMALL_WINDOW)
                    plugin.style.width = plugin.style.minWidth = charme.common.SMALL_WIDTH + 'px';
                else if(top.window.innerWidth >= charme.common.LARGE_WINDOW)
                    plugin.style.minWidth = charme.common.LARGE_WIDTH + 'px';
                else
                    plugin.style.minWidth = top.window.innerWidth + 'px';
            });
        }, 1000);

        top.window.addEventListener('resize', pluginWidthResize);

        /*
         * Check if already logged in
         */
        $scope.loggedIn=loginService.isLoggedIn();
        if($scope.loggedIn) {
            $scope.author = 'Loading...';
        
            var auth = loginService.getAuth();
            if(auth && auth.user) {
                $scope.author=auth.user.first_name + ' ' + auth.user.last_name;
                $scope.userName = auth.user.username;
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
                $scope.author=user.first_name + ' ' + user.last_name;
                $scope.userName = user.username;
                $scope.email=user.email;
            });
        });

        var targetId = $routeParams.targetId;
        targetService.listViewTarget = targetId;

        // Remove the empty option from the dropdown by initialising the model value...
        $scope.selectedTarget = targetId;
        // ... then, after HTML rendering, ensure the correct option is shown as being selected
        $timeout(function() {
            var targetSelect = document.getElementById("chooseTarget");
            targetSelect.value = targetId;
            // Avoid selected option being shown twice (doesn't happen in IE, but don't need to check if browser is IE here)
            targetSelect.options[targetSelect.options.selectedIndex].style.display = 'none';
        });

        /**
         * Onclick functions for buttons
         */

        $scope.viewTargets = function() {
            $location.path(encodeURIComponent(targetId) + '/annotations/datasets/');
        };

        $scope.refreshTargetSelection = function() {
            //var targetSelect = document.getElementById("chooseTarget");

            searchBarService.isSearchOpen = cachedIsSearchOpen;
            $location.path(encodeURIComponent($scope.selectedTarget) + '/annotations/');
        };

        $scope.newAnnotation = function(){
            $location.path(encodeURIComponent(targetId) + '/annotations/new/');
        };

        $scope.login = function(){
            //window.addEventListener('message', loginService._loginEvent, false);
            window.addEventListener('message', loginService.handshake, false);
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

        searchAnnotations.addListener(searchAnnotations.listenerTypes.BEFORE_SEARCH, function(){
            $scope.entries = [];
            $scope.loadingList = true;
            $scope.errorMsg = '';
        });

        searchAnnotations.addListener(searchAnnotations.listenerTypes.AFTER_SEARCH, function(){
            $scope.$apply(function(){
                $scope.loadingList = false;
            });
        });

        searchAnnotations.addListener(searchAnnotations.listenerTypes.SUCCESS, function(results, pages, pageNum, lastPage){
            $scope.$apply(function(){
                $scope.entries = results;
                $scope.pages = pages;
                
                if(pageNum <= Math.ceil(charme.logic.constants.NUM_PAGE_BUTTONS / 2) || lastPage <= charme.logic.constants.NUM_PAGE_BUTTONS)
                    $scope.offset = 1;
                else if(pageNum >= lastPage - Math.floor(charme.logic.constants.NUM_PAGE_BUTTONS / 2))
                    $scope.offset = lastPage - charme.logic.constants.NUM_PAGE_BUTTONS + 1;
                else
                    $scope.offset = pageNum - Math.floor(charme.logic.constants.NUM_PAGE_BUTTONS / 2);

                $scope.lastPage = lastPage;
                $scope.pageIncrement = Math.ceil(lastPage / 10);

                angular.forEach($scope.entries, function(entry) {
                    //Double-escape URIs embedded within a URI in order to work with Angular routing
                    entry.uri = '#/' + encodeURIComponent(encodeURIComponent(targetId)) + '/annotation/' 
                                     + encodeURIComponent(encodeURIComponent(entry.id)) + '/';
                });

                shiftAnnoService.annoList[targetId] = $scope.entries;
            });
        });

        searchAnnotations.addListener(searchAnnotations.listenerTypes.ERROR, function(errorMsg){
            $scope.$apply(function(){
                $scope.errorMsg = errorMsg;
                
                if($scope.pages) {
                    for(var i = 0; i < $scope.pages.length; i++) {
                        if(i === criteria.pageNum - $scope.offset)
                            $scope.pages[i] = {status: 'current'};
                        else
                            $scope.pages[i] = {status: 'notCurrent'};
                    }
                }
            });
        });
        
        $rootScope.$on('facetsFetched', function() {
            $scope.loadingFacets = false;
        });

        /**
         * Search criteria are encoded in URL. This is a convenience function for retrieving search criteria from URL
         * @type {{}}
         */
        var criteria = {};
        var criteriaFromUrl = function() {
            criteria.targetTypes = $location.search()[charme.web.constants.PARAM_TARGET_TYPES];
            criteria.citingTypes = $location.search()[charme.web.constants.PARAM_CITING_TYPES];
            criteria.motivations = $location.search()[charme.web.constants.PARAM_MOTIVATIONS];
            criteria.domainsOfInterest = $location.search()[charme.web.constants.PARAM_DOMAINS];
            criteria.organization = $location.search()[charme.web.constants.PARAM_ORGANIZATION];
            criteria.creator = $location.search()[charme.web.constants.PARAM_CREATOR];
            criteria.resultsPerPage = $location.search()['resultsPerPage'];
            criteria.selectedRPP = $location.search()['selectedRPP'];
            criteria.pageNum = $location.search()['pageNum'];

            return criteria;
        };
        
        criteria = criteriaFromUrl();
        
        var onNewCriteria = $rootScope.$on('newCriteria', function(event, newCriteria) {//, newListOrder) {
            criteria.targetTypes = newCriteria.targetTypes;
            criteria.citingTypes = newCriteria.citingTypes;
            criteria.motivations = newCriteria.motivations;
            criteria.domainsOfInterest = newCriteria.domainsOfInterest;
            criteria.organization = newCriteria.organization;
            criteria.creator = newCriteria.creator;
            criteria.resultsPerPage = newCriteria.resultsPerPage;
            criteria.selectedRPP = newCriteria.selectedRPP;
            criteria.pageNum = newCriteria.pageNum;
        });
        $scope.$on('$destroy', function() {
            onNewCriteria(); // Remove listener
        });
        
        // Store resultsPerPage and selectedRPP in the URL so they can be retrieved if user invokes $scope.directSearch when viewing annotation
        $scope.viewAnnotation = function(annoId) {
            $timeout(function() {
                criteria.targetTypes = criteria.targetTypes === '' ? '' : criteria.targetTypes.join(',');
                criteria.citingTypes = criteria.citingTypes === '' ? '' : criteria.citingTypes.join(',');
                criteria.motivations = criteria.motivations === '' ? '' : criteria.motivations.join(',');
                criteria.domainsOfInterest = criteria.domainsOfInterest === '' ? '' : criteria.domainsOfInterest.join(',');
                criteria.organization = criteria.organization === '' ? '' : criteria.organization.toString();
                criteria.creator = criteria.creator === '' ? '' : criteria.creator.toString();
                criteria.resultsPerPage = criteria.resultsPerPage === '' ? '' : criteria.resultsPerPage.toString();
                criteria.selectedRPP = criteria.selectedRPP === '' ? '' : criteria.selectedRPP.toString();
                //criteria.listOrder = criteria.listOrder === '' ? '' : criteria.listOrder.toString();
                criteria.pageNum = criteria.pageNum === '' ? '' : criteria.pageNum.toString();
                
                $location.search(charme.web.constants.PARAM_TARGET_TYPES, criteria.targetTypes)
                         .search(charme.web.constants.PARAM_CITING_TYPES, criteria.citingTypes)
                         .search(charme.web.constants.PARAM_MOTIVATIONS, criteria.motivations)
                         .search(charme.web.constants.PARAM_DOMAINS, criteria.domainsOfInterest)
                         .search(charme.web.constants.PARAM_ORGANIZATION, criteria.organization)
                         .search(charme.web.constants.PARAM_CREATOR, criteria.creator)
                         .search('resultsPerPage', criteria.resultsPerPage)
                         .search('selectedRPP', criteria.selectedRPP)
                         //.search('listOrder', criteria.listOrder)
                         .search('pageNum', criteria.pageNum)
                         .replace();
            });
        };
        
        $scope.setPage = function(newPage){
            $rootScope.$broadcast('changePage', newPage, $scope.lastPage, $scope.pages);
        };
        
        $scope.directSearch = function(facet, name, evt) {
            evt.preventDefault();
            $location.path(encodeURIComponent(targetId) + '/annotations/').search(facet, name).search('pageNum', '1');
        };

        var cachedTarget;
        var waitAnotherClickFlag = true;
        $('#chooseTarget')
            .focus(function() {
                cachedIsSearchOpen = $scope.isSearchOpen;
                cachedTarget = $scope.selectedTarget;

                if($scope.isSearchOpen) {
                    searchBarService.targetDropdownFlag = true;
                    $(this).removeClass($scope.smallSpan).addClass($scope.largeSpan);

                    $scope.$apply(function() {
                        $scope.searchOpen = 'collapse';
                        searchBarService.isSearchOpen = $scope.isSearchOpen = false;
                        $location.replace();
                    });

                    // In this particular case, the initial click to give focus to the dropdown doesn't fire 
                    // the .click function, only the .focus function. When the search bar is closed, or with 
                    // other browsers, both the .focus and .click functions fire with the initial click.
                    if(charme.common.isChrome)
                        $(this).click();
                }
            })
            .blur(function() {
                waitAnotherClickFlag = true;
        
                if(cachedIsSearchOpen) {
                    searchBarService.targetDropdownFlag = false;
                    $(this).removeClass($scope.largeSpan).addClass($scope.smallSpan);
                    
                    $scope.$apply(function() {
                        $scope.searchOpen = 'open';
                        searchBarService.isSearchOpen = $scope.isSearchOpen = true;
                        $location.replace();
                    });
                }
            })
            .click(function() {
                debounceDropdownClick();
            });
            
            var debounceDropdownClick = charme.logic.debounce(function() {
                if(waitAnotherClickFlag)
                    waitAnotherClickFlag = false;
                else if($scope.selectedTarget === cachedTarget)
                    $('#chooseTarget').blur(); 
            }, 200);
    }]);

/**
 * View details of individual annotation.
 */
charme.web.controllers.controller('ViewAnnotationCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$timeout', '$window', 'fetchTargetTypeVocab', 'fetchAnnotation', 'fetchKeywords', 'fetchAllMotivations', 'searchAnnotations', 'deleteAnnotation', 'loginService', 'shiftAnnoService', 'targetService', 'replyToAnnoService', 
    function ($rootScope, $scope, $routeParams, $location, $timeout, $window, fetchTargetTypeVocab, fetchAnnotation, fetchKeywords, fetchAllMotivations, searchAnnotations, deleteAnnotation, loginService, shiftAnnoService, targetService, replyToAnnoService){
        $scope.viewAnnotationFlag=true;
		$scope.allTargets = targetService.targets[charme.common.ALL_TARGETS];
        searchAnnotations.clearListeners();
        $scope.loading=true;
        var targetId = $routeParams.targetId;
        $scope.loggedIn=loginService.isLoggedIn();
        $scope.shortTitleLength = charme.common.shortTargetTitle;
        
        var criteria = {};
        var criteriaFromUrl = function() {
            criteria.targetTypes = $location.search()[charme.web.constants.PARAM_TARGET_TYPES];
            criteria.citingTypes = $location.search()[charme.web.constants.PARAM_CITING_TYPES];
            criteria.motivations = $location.search()[charme.web.constants.PARAM_MOTIVATIONS];
            criteria.domainsOfInterest = $location.search()[charme.web.constants.PARAM_DOMAINS];
            criteria.organization = $location.search()[charme.web.constants.PARAM_ORGANIZATION];
            criteria.creator = $location.search()[charme.web.constants.PARAM_CREATOR];
            criteria.resultsPerPage = $location.search()['resultsPerPage'];
            criteria.selectedRPP = $location.search()['selectedRPP'];
            criteria.pageNum = $location.search()['pageNum'];

            return criteria;
        };
        
        $timeout(function() {
            criteria = criteriaFromUrl();
        });
        
        $scope.flag = function(){
            alert('Flag annotation as inappropriate (for review by moderator): this functionality will be enabled in a future iteration of CHARMe');
        };
        
        $scope.returnToList = function(){
            $location.path(encodeURIComponent(targetService.listViewTarget) + '/annotations/')
                     .search(charme.web.constants.PARAM_TARGET_TYPES, criteria.targetTypes)
                     .search(charme.web.constants.PARAM_CITING_TYPES, criteria.citingTypes)
                     .search(charme.web.constants.PARAM_MOTIVATIONS, criteria.motivations)
                     .search(charme.web.constants.PARAM_DOMAINS, criteria.domainsOfInterest)
                     .search(charme.web.constants.PARAM_ORGANIZATION, criteria.organization)
                     .search(charme.web.constants.PARAM_CREATOR, criteria.creator)
                     .search('resultsPerPage', criteria.resultsPerPage)
                     .search('selectedRPP', criteria.selectedRPP)
                     .search('pageNum', criteria.pageNum);
        };
        
        var annoId=$routeParams.annotationId;
        $scope.annotationId=annoId;
        $scope.targetId=targetId;
        
        $scope.viewAnnotation = function(annoId) {
            $timeout(function() {
                $location.search(charme.web.constants.PARAM_TARGET_TYPES, criteria.targetTypes)
                         .search(charme.web.constants.PARAM_CITING_TYPES, criteria.citingTypes)
                         .search(charme.web.constants.PARAM_MOTIVATIONS, criteria.motivations)
                         .search(charme.web.constants.PARAM_DOMAINS, criteria.domainsOfInterest)
                         .search(charme.web.constants.PARAM_ORGANIZATION, criteria.organization)
                         .search(charme.web.constants.PARAM_CREATOR, criteria.creator)
                         .search('resultsPerPage', criteria.resultsPerPage)
                         .search('selectedRPP', criteria.selectedRPP)
                         .search('pageNum', criteria.pageNum)
                         .replace();
            });
        };
        
        Promise.every(fetchKeywords(), fetchAnnotation(annoId), fetchAllMotivations(), fetchTargetTypeVocab()).then(
            function (results){
                $scope.loading=false;
                //Create local alias to avoid having to use fully resolved name
                var annoType = jsonoa.types.Annotation;
                $scope.$apply(function(){
                    var categories = results[0];
                    var keywords = {};
                    var motivations_catagories = results[2];
                    var motivation_keywords = {};
                    
                    //Process Motivation keywords
                    angular.forEach(motivations_catagories[0].keywords, function(keyword){
                        motivation_keywords[keyword.uri]=keyword.desc;
                    });
                    
                    var graph = results[1];
                    var targetTypeVocab = results[3];
                    //Process graph
                    var annoList = graph.getAnnotations();
                    if (annoList.length > 0) {
                        //var anno = graph.getNode(annoId);
                        var anno = charme.logic.filterAnnoList(annoList, annoType);
                        anno = anno[0];

                        var motivations = anno.getValues(annoType.MOTIVATED_BY);
                        if (motivations && motivations.length > 0) {
                            $scope.motivationTags = [];
                        }
                        angular.forEach(motivations, function (motivation){
                            var motivURI =  motivation.getValue(motivation.ID);
                            $scope.motivationTags.push({uri: motivURI, desc: motivation_keywords[motivURI]});
                        });

                        //Retrieve citations if present
                        var citoSpec = jsonoa.types.CitationAct;
                        if(anno.hasType(citoSpec.TYPE))
                        {
                            var citingEntity = anno.getValue(citoSpec.CITING_ENTITY);

                            if (citingEntity.getValue){
                                var citoURI = citingEntity.getValue(jsonoa.types.Common.ID);
                                $scope.citation = {};
                                $scope.citation.loading=true;
                                $scope.citation.uri = citoURI;

                                //Match the citation type to a text description.
                                var citoTypes = citingEntity.getValues(citingEntity.TYPE_ATTR_NAME);
                                angular.forEach(targetTypeVocab, function(fType){
                                    if (citoTypes.indexOf(fType.resource)>=0){
                                        if (!$scope.citation.types){
                                            $scope.citation.types = [];
                                        }
                                        $scope.citation.types.push(fType.label);
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

                        var bodies = anno.getValues(annoType.BODY);
                        //Create local alias to avoid having to use fully qualified name everywhere
                        var textType = jsonoa.types.Text;
                        var citoSpec = jsonoa.types.CitationAct;
                        angular.forEach(bodies, function(body){
                            if (body.hasType(textType.TEXT) || body.hasType(textType.CONTENT_AS_TEXT)){
                                $scope.comment = body.getValue(textType.CONTENT_CHARS);
                            }
                            else if (body.hasType(jsonoa.types.SemanticTag.TYPE)){
                                if (!$scope.domainTags){
                                    $scope.domainTags = [];
                                }
                                var tagURI = body.getValue(jsonoa.types.Common.ID);
                                var prefLabel = body.getValue(jsonoa.types.SemanticTag.PREF_LABEL);
                                $scope.domainTags.push({uri: tagURI, desc: prefLabel});
                            } else {
                                //Match the citation type to a text description.
                                var type = body.getValue(body.TYPE_ATTR_NAME);
                                $scope.link = {};
                                $scope.link.uri = body.getValue(jsonoa.types.Common.ID);
                                angular.forEach(targetTypeVocab, function(targetType){
                                    if (type === targetType.resource){
                                        $scope.link.linkTypeDesc = targetType.label;
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

						//var annoDate = anno.getValue(annoType.DATE);
						//$scope.annoDate = annoDate[jsonoa.types.Common.VALUE];

						var modificationOf = anno.getValue(annoType.WAS_REVISION_OF);
						if (typeof modificationOf !== 'undefined'){
							$scope.modificationOf = modificationOf.getValue(jsonoa.types.Common.ID);
						}

                        //Extract the targetid(s) of the annotation
                        var targets = [];

                        //If a composite type is found, extract the multiple targets from the composite
                        //else just extract the single target
                        var composite = anno.getValue(annoType.TARGET);
                        if (composite.hasType(jsonoa.types.Composite.TYPE))
                            targets = composite.getValues(jsonoa.types.Composite.ITEM);
                        else
                            targets = anno.getValues(annoType.TARGET);
                        
                        if(targets && targets.length > 0)
                            $scope.targetList = [];
                        
                        //var date = anno.getValue(annoType.DATE);
                        //$scope.date = (date !== undefined && date.hasOwnProperty('@value')) ? date['@value'] : 'undefined';
                        var dates = anno.getValues(annoType.DATE);
                        $scope.date = charme.logic.filterDates(dates);

                        var validTargetTypeLabels = {};
                        for(var i = 0; i < targetTypeVocab.length; i++) {
                            var label = targetTypeVocab[i].label.replace(/ /g, "");
                            validTargetTypeLabels[label] = targetTypeVocab[i].label;
                        }
                        
                        angular.forEach(targets, function(target){
                            var targetHref = target.getValue(jsonoa.types.Common.ID);
                            var targetName = targetHref;//.substring(targetHref.lastIndexOf('/') + 1);

                            var targetType;
                            var targetTypes = (target.getValues(jsonoa.types.Common.TYPE));
                            var targetTypeLabel = charme.web.constants.UNKNOWN_TYPE;
                            if(typeof targetTypes !== 'undefined' && targetTypes.length > 0) {
                                targetType = targetTypes[0].substring(targetTypes[0].lastIndexOf('/') + 1);
                                targetType = targetType.substring(targetType.lastIndexOf('#') + 1);
                                targetTypeLabel = validTargetTypeLabels[targetType];
                                if(typeof targetTypeLabel === 'undefined') {
                                    console.error('Unknown target type ' + targetType);
                                }
                            } else {
                                console.error('No target type available for ' + targetHref);
                            }
                            
                            if(targetType !== 'Annotation')
                                $scope.targetList.push({uri: targetHref, name: targetName, desc: targetTypeLabel});
                            else {
                                var targetLoading = {uri: targetHref, name: 'Loading...', desc: 'Annotation'};
                                $scope.targetList.push(targetLoading);
                                
                                //targetName = charme.logic.fetchTargetComment(fetchAnnotation, targetHref, annoType);
                                var targetComment;
                                fetchAnnotation(targetHref).then(function(graph) {
                                    var annoList = graph.getAnnotations();
                                    if(annoList.length > 0) {
                                        //var anno = annoList[0];
                                        var anno = charme.logic.filterAnnoList(annoList, annoType);
                                        anno = anno[0];
                                        var bodies = anno.getValues(annoType.BODY);
                                        var textType = jsonoa.types.Text;
                                        targetComment = '(No comment)';
                                        angular.forEach(bodies, function(body){
                                            if(body.hasType(textType.TEXT) || body.hasType(textType.CONTENT_AS_TEXT)){
                                               targetComment = body.getValue(textType.CONTENT_CHARS);
                                            }
                                        });
                                   }
                                   
                                   targetComment = '"' + charme.logic.shortTargetName(targetComment, charme.common.shortTargetTitle - 2) + '"';
                                   var targetLoaded = {uri: targetHref, name: targetComment, desc: validTargetTypeLabels[targetType]};
                                   $scope.targetList.splice($scope.targetList.indexOf(targetLoading), 1, targetLoaded);
                                   $scope.$apply();
                                }, function(error) {
                                    var targetLoaded = {uri: targetHref, name: 'Error loading text', desc: validTargetTypeLabels[targetType]};
                                    $scope.targetList.splice($scope.targetList.indexOf(targetLoading), 1, targetLoaded);
                                    $scope.$apply();
                                });
                            }
                        });
                        
                        $timeout(function() {
                            if($scope.targetList.length > 1)
                                $scope.multipleTargets = true;
                            
                            if($scope.domainTags && $scope.domainTags.length > 1)
                                $scope.multipleDomains = true;
                            
                            if($scope.motivationTags && $scope.motivationTags.length > 1)
                                $scope.multipleMotivations = true;
                        });
                        
                        // Replying to annotation
                        $scope.replyToAnno = function() {
                            $location.path(encodeURIComponent(annoId) + '/annotations/new/');
                            replyToAnnoService.replying = true;
                            replyToAnnoService.comments = $scope.comment;
                        };

                        /*
                         Annotation deletion.
                         */
                        var auth = loginService.getAuth();
                        if($scope.loggedIn && auth && $scope.userName === auth.user.username) {
                                $scope.creatorOfAnnotationFlag = true;
                                $scope.modifyAnnotationFlag = true;
                                
                                $scope.confirmBoxContent = {
                                    message: 'Delete this annotation?',
                                    confirm: 'Yes',
                                    cancel: 'No'
                                };

                                $scope.modify = function () {
                                        $location.path('/' + encodeURIComponent(targetId) + '/annotations/' + encodeURIComponent(annoId) + '/edit/');
                                };

                                $scope.getConfirm = function() {
                                    $scope.confirmingDelete = true;
                                };
                                $scope.noDelete = function() {
                                    $scope.confirmingDelete = false;
                                    $rootScope.$broadcast('noDelete');
                                };
                                
                                $scope.deleteAnnotation = function () {
                                    $scope.confirmingDelete = false;
                                    $scope.processing=true;
                                    $('.ajaxModal').height($('.modal-body-view')[0].scrollHeight);
                                    $('.popover-visible').css('z-index', '0');
                                    
                                    deleteAnnotation(annoId, auth.token).then(function (response) {
                                        $scope.$apply(function() {
                                            $scope.processing=false;
                                            angular.forEach($scope.targetList, function(thisTarget) {
                                                window.top.postMessage('refreshAnnotationCount' +
                                                        ":::" + thisTarget.uri, '*');
                                            });
                                            
                                            // Don't use location.path with targetId, as targetId may be an annotation
                                            //$location.path(encodeURIComponent(targetId) + '/annotations/');
                                            window.history.back();
                                            });
                                        }, function (error) {
                                            $scope.$apply(function() {
                                                $scope.processing=false;
                                                $scope.errorMsg='Unable to delete annotation';
                                            });
                                        });
                                };
                        }

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
                
                // annoOnAnno code:
                var criteria = {
                    targets: [annoId],
                    pageNum: '1',
                    resultsPerPage: '100000',
                    targetIsAnno: true
                };
                
                var numSearchesStarted = 1, numSearchesCompleted = 0;
                $scope.loadingReplies = true;
                var annoList = [];
                
                // Fires twice: first time for searchAnnotations call in SearchCtrl, second time for searchAnnotations call in this Ctrl
                searchAnnotations.addListener(searchAnnotations.listenerTypes.SUCCESS, function(results, pages, pageNum, lastPage, totalResults, targetIsAnno){
                    if(targetIsAnno) {
                        $scope.$apply(function() {
                            numSearchesCompleted++;
                            
                            if(numSearchesCompleted === (numSearchesStarted + results.length)) {
                                var numAnnos = annoList.length;
                                var depth = 1;
                                var firstLevelAnnos = [];
                                var firstLevelReplyFlag;
                                var sortedAnnoList = [], newSortedAnnoList = [];
                                
                                for(var i = 0; i < annoList.length; i++) {
                                    firstLevelReplyFlag = false;
                                    for(var j = 0; j < annoList[i].targets.length; j++) {
                                        if(annoList[i].targets[j] === annoId) {
                                            firstLevelReplyFlag = true;
                                        }
                                    }
                                    if(firstLevelReplyFlag)
                                        sortedAnnoList.push(annoList[i]);
                                }
                                sortedAnnoList.sort(function(a, b) {return (Date.parse(b.date) - Date.parse(a.date));});
                                
                                for(var i = 0; i < sortedAnnoList.length; i++) {
                                    newSortedAnnoList.push(sortedAnnoList[i]);
                                    firstLevelAnnos.push(sortedAnnoList[i]);
                                }

                                threadedConvo = function(annoList, depth) {
                                    for(var i = 0; i < sortedAnnoList.length; i++) {
                                        var tempArr = [];
                                        for(var j = 0; j < annoList.length; j++) {
                                            if(annoList[j].targets[0] === sortedAnnoList[i].id) {
                                                tempArr.push(annoList[j]);
                                            }
                                        }

                                        var spaceIndent = '';
                                        for(var spaceNum = 0; spaceNum < depth; spaceNum++) {
                                            spaceIndent += '...';
                                        }

                                        tempArr.sort(function(a, b) {return (Date.parse(b.date) - Date.parse(a.date));});
                                        for(var k = 0; k < tempArr.length; k++) {
                                            var insertionPoint = newSortedAnnoList.indexOf(sortedAnnoList[i]) + 1;
                                            tempArr[k].title = spaceIndent + tempArr[k].title;
                                            newSortedAnnoList.splice(insertionPoint, 0, tempArr[k]);
                                        }
                                    }
                                    
                                    var sortedLength = sortedAnnoList.length;
                                    for(var i = 0; i < sortedLength; i++) {
                                        sortedAnnoList.pop();
                                    }
                                    
                                    for(var i = 0; i < newSortedAnnoList.length; i++) {
                                        sortedAnnoList.push(newSortedAnnoList[i]);
                                    }

                                    if(sortedAnnoList.length < numAnnos) {
                                        var _annoList = [];
                                        for(var i = 0; i < annoList.length; i++) {
                                            if(sortedAnnoList.indexOf(annoList[i]) < 0) {
                                                _annoList.push(annoList[i]);
                                            }
                                        }

                                        threadedConvo(_annoList, ++depth);
                                    }
                                };

                                threadedConvo(annoList, depth);
                                
                                var annoBlockStartPos = [];
                                for(var i = 0; i < firstLevelAnnos.length; i++) {
                                    annoBlockStartPos.push(newSortedAnnoList.indexOf(firstLevelAnnos[i]));
                                }
                                
                                var annoBlocks = [];
                                for(var i = annoBlockStartPos.length - 1; i >= 0; i--) {
                                    var annoBlockLength = newSortedAnnoList.length - annoBlockStartPos[i];
                                    annoBlocks.push(newSortedAnnoList.splice(annoBlockStartPos[i], annoBlockLength));
                                }
                                
                                for(var i = 0; i < annoBlocks.length; i++) {
                                    var dateArray = [];
                                    for(var j = 0; j < annoBlocks[i].length; j++) {
                                        dateArray.push(Date.parse(annoBlocks[i][j].date));
                                    }
                                    
                                    annoBlocks[i].latestDate = Math.max.apply(null, dateArray);
                                }
                                annoBlocks.sort(function(a, b) {return (b.latestDate - a.latestDate);});
                                
                                for(var i = 0; i < annoBlocks.length; i++) {
                                    for(j = 0; j < annoBlocks[i].length; j++) {
                                        newSortedAnnoList.push(annoBlocks[i][j]);
                                    }
                                }

                                $scope.entries = newSortedAnnoList;
                                shiftAnnoService.annoList[annoId] = $scope.entries;
                                $scope.loadingReplies = false;
                            }
                            else if(results.length > 0) {
                                criteria.targets = [];
                                angular.forEach(results, function(result) {
                                        criteria.targets.push(result.id);

                                        //Double-escape URIs embedded within a URI in order to work with Angular routing
                                        result.uri = '#/' + encodeURIComponent(encodeURIComponent(annoId)) + '/annotation/' 
                                                         + encodeURIComponent(encodeURIComponent(result.id)) + '/';

                                        annoList.push(result);
                                });
                                numSearchesStarted++;
                                searchAnnotations.searchAnnotations(criteria);
                            }
                        });
                    }
                });

                searchAnnotations.addListener(searchAnnotations.listenerTypes.ERROR, function(error) {
                    $scope.repliesErrorMsg = error;
                });

                searchAnnotations.searchAnnotations(criteria);
                
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

        $scope.directSearch = function(facet, name, evt) {           
            evt.preventDefault();
            $location.path(encodeURIComponent(targetService.listViewTarget) + '/annotations/').search(facet, name).search('pageNum', '1');
        };
        
        $scope.annoListPosition = shiftAnnoService.getPosition(targetId, $scope.annotationId);
        $scope.annoListLength = shiftAnnoService.getListLength(targetId);
        $scope.noShifting = ($scope.annoListLength === 1);
        $rootScope.$broadcast('shiftButtons');
        
        $scope.shiftAnno = function(direction) {
            var newAnno = shiftAnnoService.getNewAnno(targetId, $scope.annotationId, direction);
            $scope.annoListPosition = shiftAnnoService.getPosition(targetId, newAnno.id);

                var criteria = {};
                criteria.targetTypes = $location.search()[charme.web.constants.PARAM_TARGET_TYPES];
                criteria.citingTypes = $location.search()[charme.web.constants.PARAM_CITING_TYPES];
                criteria.motivations = $location.search()[charme.web.constants.PARAM_MOTIVATIONS];
                criteria.domainsOfInterest = $location.search()[charme.web.constants.PARAM_DOMAINS];
                criteria.organization = $location.search()[charme.web.constants.PARAM_ORGANIZATION];
                criteria.creator = $location.search()[charme.web.constants.PARAM_CREATOR];
                criteria.resultsPerPage = $location.search()['resultsPerPage'];
                criteria.selectedRPP = $location.search()['selectedRPP'];
                
                window.location.href = newAnno.uri;
                $timeout(function() {
                    $location.search(charme.web.constants.PARAM_TARGET_TYPES, criteria.targetTypes)
                             .search(charme.web.constants.PARAM_CITING_TYPES, criteria.citingTypes)
                             .search(charme.web.constants.PARAM_MOTIVATIONS, criteria.motivations)
                             .search(charme.web.constants.PARAM_DOMAINS, criteria.domainsOfInterest)
                             .search(charme.web.constants.PARAM_ORGANIZATION, criteria.organization)
                             .search(charme.web.constants.PARAM_CREATOR, criteria.creator)
                             .search('resultsPerPage', criteria.resultsPerPage)
                             .search('selectedRPP', criteria.selectedRPP)
                             //.search('listOrder', criteria.listOrder.toString());
                             .replace();
                });
        };
        
        $scope.$on('$destroy', function() {
            searchAnnotations.clearListeners();
        });
    }]);

/**
 * New annotation screen.
 */
charme.web.controllers.controller('EditAnnotationCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$window', '$timeout', 'saveAnnotation', 'loginService', 'fetchTargetTypeVocab', 'fetchAllMotivations', 'fetchKeywords', 'searchAnnotations', 'targetService', 'replyToAnnoService', 'fetchAnnotation', 'annotationService',
    function ($rootScope, $scope, $routeParams, $location, $window, $timeout, saveAnnotation, loginService, fetchTargetTypeVocab, fetchAllMotivations, fetchKeywords, searchAnnotations, targetService, replyToAnnoService, fetchAnnotation, annotationService){
        searchAnnotations.clearListeners();
        $scope.editAnnotationFlag=true;
        var targetId = $routeParams.targetId;
        $scope.targetId=targetId;
        $scope.shortTitleLength = charme.common.shortTargetTitle;
        $scope.commentMaxLength = charme.settings.COMMENT_LENGTH ? charme.settings.COMMENT_LENGTH : 500; // Maximum no. of characters for free text
            var annoId = $routeParams.annotationId;
            var pristineModel;
            $scope.anno = {motivation: [], targets: []};

            /*
             Add all selected targets to this annotation;
             */
            var addSelectedTargets = function(isFirstCall) {
                $scope.errorMsg = '';

                //var selectedTargets = targetService.targets;
                if(replyToAnnoService.replying && isFirstCall)
                    var selectedTargets = $scope.targetList;
                else
                    var selectedTargets = targetService.targets;
                
                //Iterate through each of the selected targets, and only add it if it's not already on the annotation
                for(var key in selectedTargets) {
                    //Check if the key is an object attribute
                    if(selectedTargets.hasOwnProperty(key)) {
                        //search the targets already defined on the annotations
                        var targetFound = false;
                        for(var i = 0; i < $scope.anno.targets.length; i++) {
                            if($scope.anno.targets[i].id === key) {
                                targetFound=true;
                                break;
                            }
                        }
                        if(!targetFound) {
                            var selectedTargetDetails = selectedTargets[key];
                            //$scope.anno.targets.push({id: selectedTargetDetails.name, typeId: jsonoa.types[selectedTargetDetails.label].TYPE});

                            if(key !== charme.common.ALL_TARGETS) {
                                var typeId = '';
                                if(jsonoa.types[selectedTargetDetails.label]) {
                                    typeId = jsonoa.types[selectedTargetDetails.label].TYPE;
                                }
                                else {
                                    console.error('Invalid target type defined for ' + key);
                                    $scope.errorMsg = 'Error: Invalid/undefined target type(s). Annotation may not be saved.';
                                }

                                $scope.anno.targets.push({id: key, name: selectedTargetDetails.name, typeId: typeId, label: selectedTargetDetails.label, desc: selectedTargetDetails.desc, unDeletable: selectedTargetDetails.unDeletable ? true : false});
                            }
                        }
                    }
                }
            };

        $scope.loggedIn=loginService.isLoggedIn();
        $scope.targetList = targetService.targets;

        if(replyToAnnoService.replying) {
            var annoName;
            
            if(replyToAnnoService.comments === '') {
                annoName = targetId;
            }
            else {
                annoName = replyToAnnoService.comments;
                annoName = '"' + charme.logic.shortTargetName(annoName, charme.common.shortTargetTitle - 2) + '"';
            }

            $scope.targetList = {};
            $scope.targetList[targetId] = {name: annoName, label: 'Annotation', desc: 'Annotation', unDeletable: true};
            replyToAnnoService.comments = '';
        }

        /*
         Validate data provider's targets, displaying an appropriate error message if unknown types exist
         */
        var validateTargets = function(types){
                //This fetches a short list of the known target types, and their labels. This is used for displaying the short name of targets attached to this annotation
                $scope.knownTargetTypeLabels = {};
                var citoTypeOptions = [];
                angular.forEach(types, function(type){
                    $scope.knownTargetTypeLabels[type.resource] = type.label;
                });

                /*
                 This code validates the targets that the user has selected to ensure they all have valid target types. This should be refactored to use the above knownTargetList
                 */
                //var validTargetTypeLabels = {};
                //$scope.targetList = targetService.targets;
                for(var i = 0; i < types.length; i++) {
                        //var label = types[i].label.replace(" ", "");
                        //validTargetTypeLabels[label] = '';
                        citoTypeOptions.push({text: types[i].label, value: types[i].resource});
                }
                $scope.citoTypes = citoTypeOptions;

                /*var numTargets = 0;
                for(var target in $scope.targetList) {
                    numTargets++;
                        if(!validTargetTypeLabels.hasOwnProperty($scope.targetList[target].label)){
                            console.error('Invalid target type defined for ' + target);
                            $scope.errorMsg = 'Error: Invalid/undefined target type(s). Annotation may not be saved.';
                        }
                };*/
        };

        // Validate the data provider's target types
        fetchTargetTypeVocab().then(function(types) {
                validateTargets(types);
        }, function(error) {
                $scope.$apply(function() {
                        $scope.errorMsg = error;
                });
        });

        //Pre-populate model if editing existing annotation.
        if (annoId){
                $scope.loading = true;
                $scope.modifying = true;
                Promise.every(fetchAnnotation(annoId), fetchTargetTypeVocab()).then(function(results){
                        var graph = results[0];
                        validateTargets(results[1]);
                        var annotation = graph.getNode(annoId);
                        var anno = annotationService.createSimpleAnnotationObject(annotation);
                        var targetCount = 0;
                        angular.forEach(anno.targets, function(target) {
                            if($scope.knownTargetTypeLabels[target.typeId])
                                target.desc = $scope.knownTargetTypeLabels[target.typeId];
                            else
                                target.desc = 'Invalid type';

                            target.label = target.desc.replace(/ /g, "");

                            if(target.label !== 'Annotation') {
                                target.name = target.id
                                targetCount++;
                            }
                            else {
                                var targetComment;
                                var annoType = jsonoa.types.Annotation;
                                fetchAnnotation(target.id).then(function(graph) {
                                    var annoList = graph.getAnnotations();
                                    if(annoList.length > 0) {
                                        var targetAnno = charme.logic.filterAnnoList(annoList, annoType);
                                        targetAnno = targetAnno[0];
                                        var bodies = targetAnno.getValues(annoType.BODY);
                                        var textType = jsonoa.types.Text;
                                        targetComment = '(No comment)';
                                        angular.forEach(bodies, function(body){
                                            if(body.hasType(textType.TEXT) || body.hasType(textType.CONTENT_AS_TEXT)){
                                               targetComment = body.getValue(textType.CONTENT_CHARS);
                                            }
                                        });
                                    }

                                    target.name = '"' + charme.logic.shortTargetName(targetComment, charme.common.shortTargetTitle - 2) + '"';
                                    targetCount++;

                                    if(targetCount === anno.targets.length) {
                                        pristineModel = angular.copy(anno);
                                        $scope.$apply(function() {
                                            $scope.anno = anno;
                                            $scope.loading = false;
                                        });
                                     }
                                }, function(error) {
                                    target.name = 'Error loading text';
                                    targetCount++;

                                    if(targetCount === anno.targets.length) {
                                        pristineModel = angular.copy(anno);
                                        $scope.$apply(function() {
                                            $scope.anno = anno;
                                            $scope.loading = false;
                                        });
                                    }
                                });
                            }
                        });

                        if(targetCount === anno.targets.length) {
                            pristineModel = angular.copy(anno);
                            $scope.$apply(function() {
                                $scope.anno = anno;
                                $scope.loading = false;
                            });
                        }
                }, function(error){
                        $scope.$apply(function() {
                                console.error(error);
                                $scope.errorMsg = 'Unable to fetch annotation';
                                $scope.loading = false;
                        });
                });
        } else {
                $scope.anno = annotationService.createSimpleAnnotationObject();
                addSelectedTargets(true);

                /*// Validate the data provider's target types
                fetchTargetTypeVocab().then(function(types) {
                        validateTargets(types);
                }, function(error) {
                        $scope.$apply(function() {
                                $scope.errorMsg = error;
                        });
                });*/
        }

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
        

        $scope.cancel = function(){
            if($scope.loading)
                return;
            
            window.history.back();
        };
        
		var changeURI = function(uri){
			$scope.citoText='';
			var doiVal = charme.logic.findDOI(uri);
			if (doiVal){
				var criteria = {};
				criteria[charme.logic.constants.DXDOI_CRITERIA_ID]=doiVal;
				charme.logic.fetchDxdoiMetaData(criteria).then(function(citation){
					$scope.$apply(function(){
						$scope.citoText = citation;
					});
				});
			}
		};

		$scope.changeType = function(){
			if (!$scope.anno.linkType) {
				$scope.anno.linkURI = '';
			}
		}

		/**
		 * Watch for changes in the URI entered and fetch cito data if available.
		 */
		$scope.$watch('anno.linkURI', changeURI);

		$scope.login = function(){
            //window.addEventListener('message', loginService._loginEvent, false);
            window.addEventListener('message', loginService.handshake, false);
            window.open(charme.logic.urls.authRequest());
            loginService.addLoginListener(function(authToken){
                $scope.$apply(function(){
                    $scope.loggedIn=authToken.token ? true : false;
                });
            });
        };

		var findTargetInList = function(targetToFind, listOfTargets){
			var matchIndex = -1;
			angular.forEach(listOfTargets, function(target, index){
				if (target.id === targetToFind.id){
					matchIndex = index;
				}
			});
			return matchIndex;
		};

                var deletedTargets = [];
		$scope.deleteTarget = function(targetsToDelete) {
                    if(targetsToDelete instanceof Array) {
                        //Delete all selected targets
                        var selectedTargets = angular.copy(targetsToDelete);
                        angular.forEach(selectedTargets, function(selectedTarget){
                            if(!selectedTarget.unDeletable) {
                                deletedTargets.push(selectedTarget);
                                var matchIndex = findTargetInList(selectedTarget, $scope.anno.targets);
                                $scope.anno.targets.splice(matchIndex, 1);
                            }
                        });
                    } else {
                        if(!targetsToDelete.unDeletable) {
                            deletedTargets.push(targetsToDelete);
                            var matchIndex = findTargetInList(targetsToDelete, $scope.anno.targets);
                            $scope.anno.targets.splice(matchIndex, 1);
                        }
                    }
                    
                    $scope.errorMsg = '';
                    for(var i = 0; i < $scope.anno.targets.length; i++) {
                        if($scope.anno.targets[i].id !== charme.common.ALL_TARGETS) {
                            if(!jsonoa.types[$scope.anno.targets[i].label]) {
                                $scope.errorMsg = 'Error: Invalid/undefined target type(s). Annotation may not be saved.';
                                break;
                            }
                        }
                    }
		};

		$scope.addSelected = function(){
                    addSelectedTargets(false);
		};

                if(annoId) {
                    $scope.getConfirm = function() {
                        $scope.confirmingModify = true;
                    };
                    $scope.noModify = function() {
                        $scope.confirmingModify = false;
                        $rootScope.$broadcast('noModify');
                    };
                    $scope.confirmBoxContent = {
                        message: 'Save this modified annotation?',
                        confirm: 'Yes',
                        cancel: 'No'
                    };
                }

		$scope.save = function(annoModel){
            if ($scope.loading)
                return;
            
            if(annoId)
                $scope.confirmingModify = false;
            
            $scope.processing = true;
            //$scope.loading=true;
            $('.ajaxModal').height($('.modal-body-new')[0].scrollHeight);
            
            replyToAnnoService.replying = false;
            var auth = loginService.getAuth();
			saveAnnotation(targetId, $scope.targetList, auth, annoModel, pristineModel).then(
                function(){
                    $scope.$apply(function(){
                        $scope.loading=false;
                        
                        // Don't use location.path with targetId, as targetId may be an annotation that you've just replied to
                        //$location.path(encodeURIComponent(targetId) + '/annotations/');
                        window.history.back();
                        
                        // Issue the refressch message(s)
                        for(var i = 0; i < annoModel.targets.length; i++) {
                            top.postMessage('refreshAnnotationCount' + ":::" + annoModel.targets[i].id, '*');
                        }
                        for(var i = 0; i < deletedTargets.length; i++) {
                            top.postMessage('refreshAnnotationCount' + ":::" + deletedTargets[i].id, '*');
                        }
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

charme.web.controllers.controller('SearchCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$window', '$timeout', 'fetchAllSearchFacets', 'fetchTargetTypeVocab', 'searchAnnotations',
    function($rootScope, $scope, $routeParams, $location, $window, $timeout, fetchAllSearchFacets, fetchTargetTypeVocab, searchAnnotations) {
        var targetId = $routeParams.targetId;
        targetId = targetId === charme.common.ALL_TARGETS ? '' : targetId;
        
        $scope.loading = true;
        $scope.resultsPerPage = [10, 20, 30];  // first value in this array must be a number (not 'All')
        //$scope.listOrderOptions = [{text: 'Newest', sortNum: -1}, {text: 'Oldest', sortNum: 1}];

        $scope.criteria = {
            selectedTargetTypes: [],
            selectedCitingTypes: [],
            selectedMotivations: [],
            selectedDomains: []
        };
        
        var criteria = {
            targets: [targetId]
            //count: 100000  // until the node can handle date queries, we must always retrieve all annotations
        };

        Promise.every(fetchAllSearchFacets(criteria), fetchTargetTypeVocab()).then(function(results){
            var facetTypes = results[0];
            var targetTypeVocab = results[1];
            
            var validTargetTypeLabels = {};
            for(var i = 0; i < targetTypeVocab.length; i++) {
               var label = targetTypeVocab[i].label.replace(/ /g, "");
               validTargetTypeLabels[label] = targetTypeVocab[i].label;
            }
            
            $scope.$apply(function(){
                var targetTypeKeywords = facetTypes[charme.logic.constants.FACET_TYPE_TARGET_TYPE];
                for(var targetType in targetTypeKeywords)
                    targetTypeKeywords[targetType].label = validTargetTypeLabels[targetTypeKeywords[targetType].label];
                
                var targetTypeCategories = [{
                	name: 'Target Types',
                        keywords: targetTypeKeywords
                }];
                $scope.$broadcast('targetTypeCategoriesForSearch', targetTypeCategories);
                
                var citingTypeKeywords = facetTypes[charme.logic.constants.FACET_TYPE_CITING_TYPE];
                for(var citingType in citingTypeKeywords)
                    citingTypeKeywords[citingType].label = validTargetTypeLabels[citingTypeKeywords[citingType].label];
                    // Valid citing types are same as valid target types
                
                var citingTypeCategories = [{
                	name: 'Link Types',
                        keywords: citingTypeKeywords
                }];
                $scope.$broadcast('citingTypeCategoriesForSearch', citingTypeCategories);

                var motivationKeywords = facetTypes[charme.logic.constants.FACET_TYPE_MOTIVATION];
                var motivationCategories = [{
                	name: 'OA Motivations',
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
                
                $rootScope.$broadcast('facetsFetched');
            });
        });
        
        var criteriaFromSearch = function(){
            $scope.loading = true;

            // In case facets are undefined in the URL, define them here
            criteria.targetTypes = criteria.citingTypes = criteria.motivations = criteria.domainsOfInterest = criteria.organization = criteria.creator = '';
            criteria.pageNum = 1;
            criteria.resultsPerPage = $scope.resultsPerPage[0];
            criteria.selectedRPP = $scope.resultsPerPage[0];
            //criteria.listOrder = $scope.listOrderOptions[0].sortNum;
            $scope.selectedRPP = criteria.selectedRPP;
            //$scope.selectedOrder = criteria.listOrder;

            var targetTypeParam = $location.search()[charme.web.constants.PARAM_TARGET_TYPES];
            if(typeof targetTypeParam === 'string')
                criteria.targetTypes = targetTypeParam.split(',');
            
            var citingTypeParam = $location.search()[charme.web.constants.PARAM_CITING_TYPES];
            if(typeof citingTypeParam === 'string')
                criteria.citingTypes = citingTypeParam.split(',');

            var motivationParam = $location.search()[charme.web.constants.PARAM_MOTIVATIONS];
            if(typeof motivationParam === 'string')
                criteria.motivations = motivationParam.split(',');

            var domainsParam = $location.search()[charme.web.constants.PARAM_DOMAINS];
            if(typeof domainsParam === 'string')
                criteria.domainsOfInterest = domainsParam.split(',');

            var organization = $location.search()[charme.web.constants.PARAM_ORGANIZATION];
            if(typeof organization === 'string')
                criteria.organization = organization;
                
            // Ensure correct colour for placeholder text when moving back and forward through browser history
            if(organization === '' || organization === undefined)
                $('#chooseOrganisation').addClass('select-placeholder');
            else
                $('#chooseOrganisation').removeClass('select-placeholder');

            var creator = $location.search()[charme.web.constants.PARAM_CREATOR];
            if(typeof creator === 'string')
                criteria.creator = creator;

            // Wait to broadcast if first load or returning from viewAnno or newAnno...
            var onFacetsFetched = $rootScope.$on('facetsFetched', function() {
                $rootScope.$broadcast('newTargetTypes', criteria.targetTypes);
                $rootScope.$broadcast('newCitingTypes', criteria.citingTypes);
                $rootScope.$broadcast('newMotivations', criteria.motivations);
                $rootScope.$broadcast('newDomains', criteria.domainsOfInterest);
            });
            // ... otherwise broadcast now
            $rootScope.$broadcast('newTargetTypes', criteria.targetTypes);
            $rootScope.$broadcast('newCitingTypes', criteria.citingTypes);
            $rootScope.$broadcast('newMotivations', criteria.motivations);
            $rootScope.$broadcast('newDomains', criteria.domainsOfInterest);
            
            $scope.$on('$destroy', function() {
                onFacetsFetched(); // Remove listener
            });
            
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
            
            //$rootScope.$broadcast('listOptions', criteria.resultsPerPage, criteria.selectedRPP);//, criteria.listOrder);
            $rootScope.$broadcast('newCriteria', criteria);
            
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
            
            if(criteriaForLoad.citingTypes instanceof Array){
                var loadedCitingTypes = [];
                angular.forEach(criteriaForLoad.citingTypes, function(citingType){
                    loadedCitingTypes.push({value: citingType});
                });
                $scope.criteria.selectedCitingTypes = loadedCitingTypes;
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
                    criteria.pageNum = 1;
                    
                    var selectedTargetTypes = [];
                    angular.forEach($scope.criteria.selectedTargetTypes,
                        function(selectedTargetType) {
                            selectedTargetTypes.push(selectedTargetType.value);
                        });
                    var currentTargetTypes = $location.search()[charme.web.constants.PARAM_TARGET_TYPES];
                    currentTargetTypes = typeof currentTargetTypes === 'undefined' ? '' : currentTargetTypes;
                    var newTargetTypes = selectedTargetTypes.join(',');
                    if(currentTargetTypes !== newTargetTypes)
                        $location.search(charme.web.constants.PARAM_TARGET_TYPES, newTargetTypes)
                                 .search('pageNum', criteria.pageNum.toString());
                         
                    var selectedCitingTypes = [];
                    angular.forEach($scope.criteria.selectedCitingTypes,
                        function(selectedCitingType) {
                            selectedCitingTypes.push(selectedCitingType.value);
                        });
                    var currentCitingTypes = $location.search()[charme.web.constants.PARAM_CITING_TYPES];
                    currentCitingTypes = typeof currentCitingTypes === 'undefined' ? '' : currentCitingTypes;
                    var newCitingTypes = selectedCitingTypes.join(',');
                    if(currentCitingTypes !== newCitingTypes)
                        $location.search(charme.web.constants.PARAM_CITING_TYPES, newCitingTypes)
                                 .search('pageNum', criteria.pageNum.toString());

                    var selectedMotivations = [];
                    angular.forEach($scope.criteria.selectedMotivations,
                        function(selectedMotivation) {
                            selectedMotivations.push(selectedMotivation.value);
                        });
                    var currentMotivations = $location.search()[charme.web.constants.PARAM_MOTIVATIONS];
                    currentMotivations = typeof currentMotivations === 'undefined' ? '' : currentMotivations;
                    var newMotivations = selectedMotivations.join(',');
                    if(currentMotivations !== newMotivations)
                        $location.search(charme.web.constants.PARAM_MOTIVATIONS, newMotivations)
                                 .search('pageNum', criteria.pageNum.toString());
 
                    var selectedDomains = [];
                    angular.forEach($scope.criteria.selectedDomains, function (selectedDomain) {
                        selectedDomains.push(selectedDomain.value);
                    });
                    var currentDomains = $location.search()[charme.web.constants.PARAM_DOMAINS];
                    currentDomains = typeof currentDomains === 'undefined' ? '' : currentDomains;
                    var newDomains = selectedDomains.join(',');
                    if(currentDomains !== newDomains)
                        $location.search(charme.web.constants.PARAM_DOMAINS, newDomains)
                                 .search('pageNum', criteria.pageNum.toString());
 
                    var currentOrganization = $location.search()[charme.web.constants.PARAM_ORGANIZATION];
                    currentOrganization = typeof currentOrganization === 'undefined' ? '' : currentOrganization;
                    var newOrganization = $scope.criteria.selectedOrganization;
                    if(currentOrganization !== newOrganization)
                        $location.search(charme.web.constants.PARAM_ORGANIZATION, newOrganization)
                                 .search('pageNum', criteria.pageNum.toString());
 
                    var currentCreator = $location.search()[charme.web.constants.PARAM_CREATOR];
                    currentCreator = typeof currentCreator === 'undefined' ? '' : currentCreator;
                    var newCreator = $scope.criteria.selectedCreator;
                    if(currentCreator !== newCreator)
                        $location.search(charme.web.constants.PARAM_CREATOR, newCreator)
                                 .search('pageNum', criteria.pageNum.toString());
                }, 500);
            }
        }, true);
        
        $scope.$on('$routeUpdate', function(){
            searchAnnotations.searchAnnotations(criteriaFromSearch());
        });

        $rootScope.$on('changePage', function(event, newPage, lastPage, pages) {
            var currentPage = criteria.pageNum;

            if(typeof newPage === "number")
                criteria.pageNum = newPage;
            else if(typeof newPage === "string") {
                var pageIncrement = parseInt(newPage);

                if(criteria.pageNum + pageIncrement > 0 && criteria.pageNum + pageIncrement <= lastPage)
                    criteria.pageNum += pageIncrement;
            }

            if(criteria.pageNum !== currentPage) {
                $location.search('pageNum', criteria.pageNum.toString());
            }
        });

        var maxResults, firstSearchFlag = true;
        searchAnnotations.addListener(searchAnnotations.listenerTypes.SUCCESS, function(results, pages, pageNum, lastPage, totalResults){
            $scope.$apply(function() {
                $scope.numResults = totalResults;
                $scope.loading = false;
                
                // The first search, on loading, returns the total number of annotations in 'totalResults', and 
                // we store that number as 'maxResults' for future reference
                if(firstSearchFlag) {
                    firstSearchFlag = false;
                    maxResults = totalResults > 0 ? totalResults : 1;  // Node doesn't like 'count=0'
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
        $scope.changeOrganisation = function(isReset) {
            var orgSelect = document.getElementById("chooseOrganisation");
            if(isReset)
                orgSelect.value = "";

            if(orgSelect.value === "")
                $(orgSelect).addClass('select-placeholder');
            else
                $(orgSelect).removeClass('select-placeholder');
        };
        
        $scope.reset = function() {
            $rootScope.$broadcast('reset');
            criteria.pageNum = 1;
            $scope.criteria.selectedTargetTypes = '';
            $scope.criteria.selectedCitingTypes = '';
            $scope.criteria.selectedMotivations = '';
            $scope.criteria.selectedDomains = '';
            $scope.criteria.selectedOrganization = '';
            $scope.changeOrganisation(true);
            $scope.criteria.selectedCreator = '';
        };

        $scope.xOverflow = function() {
            $('#searchContainer').removeClass('search-overflow-y');
        };
        $scope.yOverflow = function() {
            $('#searchContainer').addClass('search-overflow-y');
        };

        selectizeMixins.addToOnFocus('chooseDomainDiv', $scope.xOverflow);
        selectizeMixins.addToOnBlur('chooseDomainDiv', $scope.yOverflow);
        
        $scope.$on('$destroy', function(event) {
            selectizeMixins.removeFromOnFocus('chooseDomainDiv', $scope.xOverflow);
            selectizeMixins.removeFromOnBlur('chooseDomainDiv', $scope.yOverflow);
        });
    }]);
