charme.web.controllers = angular.module('charmeControllers', ['charmeServices']);

charme.web.controllers.controller('InitCtrl', ['$scope', '$routeParams', '$location', '$filter', 'loginService', 'persistence',
	function ($scope, $routeParams, $location, $filter, loginService, persistence){                                           
		var targetId=$routeParams.targetId;
		loginService._loadState();
		$location.path(encodeURIComponent(targetId) + '/annotations/');
	}
]);

/**
 * List all annotations for target.
 */
charme.web.controllers.controller('ListAnnotationsCtrl', ['$scope', '$routeParams', '$location', '$filter', 'fetchAnnotationsForTarget', 'loginService', 'persistence',
function ($scope, $routeParams, $location, $filter, fetchAnnotationsForTarget, loginService, persistence){
	$scope.loading=true;

	/*
	 * Check if already logged in
	 */
	$scope.loggedIn=loginService.isLoggedIn();
	var auth = loginService.getAuth();
	if (auth && auth.user){
		$scope.userName=auth.user.first_name + ' ' + auth.user.last_name; 
		$scope.email=auth.user.email; 
	}

	/*
	 * Register a login listener for future login events
	 */
	/**
	 * Add a login listener
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

	$scope.close = function(){
		charme.web.close();
	};
	
	$scope.newAnnotation = function(){
		$location.path(encodeURIComponent(targetId) + '/annotations/new/');
	};
	
	$scope.viewAnnotation = function(annoId){
		$location.path(encodeURIComponent(targetId) + '/annotation/' + encodeURIComponent(annoId) + '/');
	};
	$scope.login = function(){
		window.addEventListener('message', loginService._loginEvent, false);
		window.open(charme.logic.authRequest());
	};
	
	loginService.addLogoutListener(function(){
		$scope.loggedIn=false;
	});
	
	$scope.logout = function(){
		loginService.logout();
	};
	
	$scope.targetId=targetId;
	
	fetchAnnotationsForTarget(targetId).then(
		function(feed){
			$scope.$apply(function(){
				$scope.entries=[];
				//Prepare the model for the view
				angular.forEach(feed.entries, function(value, key){
					var anno = value.annotation;
					var title = $filter('shortAnnoTitle')(anno);
					var updated = value.updated;
					var person = anno.getValue(anno.ANNOTATED_BY);
					var author = '';
					var email = '';
					if (person){
						author = person.getValue(person.NAME);
						email = person.getValue(person.MBOX).getValue(person.ID);
					}
					$scope.entries.push(
						{
							'id': value.id, 
							'title': title,
							'updated': updated,
							'author': author,
							'email' : email
						}
					);
				});
				$scope.loading=false;
			});
		},
		function(error){
			$scope.$apply(function(){
				$scope.errorMsg='Error: ' + error;
				$scope.loading=false;
			});
		}
	);
}]);

/**
 * View details of individual annotation.
 */
charme.web.controllers.controller('ViewAnnotationCtrl', ['$scope', '$routeParams', '$location', '$window', 'fetchAnnotation', 'fetchKeywords', 'fetchFabioTypes',
      function ($scope, $routeParams, $location, $window, fetchAnnotation, fetchKeywords, fetchFabioTypes){
		var targetId=$routeParams.targetId;
		$scope.cancel = function(){
			$location.path(encodeURIComponent(targetId) + '/annotations/');
		};
		var annoId=$routeParams.annotationId;
		$scope.annotationId=annoId;
		$scope.targetId=targetId;
		
		Promise.every(fetchKeywords(), fetchAnnotation(annoId), fetchFabioTypes()).then(
				function (results){
					$scope.$apply(function(){
						var categories = results[0];
						var keywords = {};
						var fabioTypes = results[2];
						//Process GCMD keywords
						angular.forEach(categories[0].keywords, function(keyword){
							keywords[keyword.uri]=keyword.desc;
						});
						
						var graph = results[1];
						//Process graph
						var annoList = graph.getAnnotations();
						if (annoList.length > 0) {
							var anno = annoList[0];
							var bodies = anno.getValues(anno.BODY);
							angular.forEach(bodies, function(body){
								if (body instanceof jsonoa.types.TextBody){
									$scope.comment = body.getValue(body.CONTENT_CHARS);
								} 
								else if (body instanceof jsonoa.types.Publication) {
									var citingEntity = body.getValue(body.CITING_ENTITY);
									//Check if the returned value is an object, or a primitive (should be an object, but some historical data might have primitives in this field)
									if (citingEntity.getValue){
										var citoURI = citingEntity.getValue(citingEntity.ID);
										$scope.citation = {};
										$scope.citation.loading=true;
										$scope.citation.uri = citoURI;
										
										//Match the citation type to a text description.
										var citoTypeId = citingEntity.getValue(citingEntity.TYPE);
										angular.forEach(fabioTypes, function(citoType){
											if (citoTypeId === citoType.resource){
												$scope.citation.citoTypeDesc = citoType.label;
											}
										});	
										
										//Trim the 'doi:' from the front
										var doiTxt = citoURI.substring(charme.logic.constants.DOI_PREFIX.length, citoURI.length);
										var criteria = {};
										criteria[charme.logic.constants.CROSSREF_CRITERIA_DOI]=doiTxt;
										charme.logic.fetchCrossRefMetaData(criteria).then(function(citation){
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
										$scop.link.uri = citingEntity;
									}
								}
								else if (body instanceof jsonoa.types.SemanticTag){
									if (!$scope.tags){
										$scope.tags = [];
									}
									var tagURI = body.getValue(body.PAGE).getValue(body.ID);
									$scope.tags.push({uri: tagURI, desc: keywords[tagURI]});
								} else {
									//Match the citation type to a text description.
									var type = body.getValue(body.TYPE);
									$scope.link = {};
									$scope.link.uri = body.getValue(body.ID);
									angular.forEach(fabioTypes, function(fabioType){
										if (type === fabioType.resource){
											$scope.link.linkTypeDesc = fabioType.label;
										}
									});	
								}
														
							});
							
							var author = anno.getValue(anno.ANNOTATED_BY);
							if (author){
								$scope.author = author.getValue(author.NAME);
								$scope.email = author.getValue(author.MBOX);
							}	
							
							if (!$scope.comment){
								$scope.noComment=true;
							}
						} else {
							$scope.$apply(function(){
								$scope.errorMsg='Error: No annotations returned';
							});
						}
					});
		},
		function(error){
			$scope.$apply(function(){
				$scope.errorMsg='Error: ' + error;
			});
		}
	);
}]);

/**
 * New annotation screen.
 */
charme.web.controllers.controller('NewAnnotationCtrl', ['$scope', '$routeParams', '$location', '$window', '$timeout', 'saveAnnotation', 'loginService', 'fetchFabioTypes',
function ($scope, $routeParams, $location, $window, $timeout, saveAnnotation, loginService, fetchFabioTypes){
	var targetId=$routeParams.targetId;
	$scope.targetId=targetId;
	$scope.loggedIn=loginService.isLoggedIn();
	fetchFabioTypes().then(function(types){
		var options = [];
		angular.forEach(types, function(type, innerKey){
			options.push({text: type.label, value: type.resource});
		});
		$scope.$apply(function(){
			$scope.citoTypes = options;
		});
	});
	
	$scope.cancel = function(){
		if ($scope.loading)
			return;
		$location.path(encodeURIComponent(targetId) + '/annotations/');
	};
	$scope.changeURI = function(uri){
		$scope.anno.citoText='';
		var doiVal = charme.logic.findDOI(uri);
		if (doiVal){
			var criteria = {};
			criteria[charme.logic.constants.CROSSREF_CRITERIA_DOI]=uri;
			charme.logic.fetchCrossRefMetaData(criteria).then(function(citation){
				$scope.$apply(function(){
					$scope.anno.citoText = citation;
				});
			});
		}
	};
	$scope.login = function(){
		window.addEventListener('message', loginService._loginEvent, false);
		window.open(charme.logic.authRequest());
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

charme.web.controllers.controller('SearchCtrl', ['$scope', '$routeParams', '$location', '$window', 'fetchFabioTypes', 'fetchMotivations',
function($scope, $routeParams, $location, $window, fetchFabioTypes, fetchMotivations) {
    var targetId=$routeParams.targetId;
    
    //$scope.datasets = ['data1', 'data2', 'data3', 'data4', 'data5', 'data6'];
	$scope.datasets = ['MY1DMM_CHLORA_2003-02.JPEG',
                       'MY1DMM_CHLORA_2003-03.JPEG',
                       'MY1DMM_CHLORA_2003-04.JPEG',
                       'MY1DMM_CHLORA_2003-05.JPEG',
                       'MY1DMM_CHLORA_2003-06.JPEG'];
	var shortDataset = targetId.substring(targetId.lastIndexOf('/') + 1);
	$scope.datasets.push(shortDataset);
	$scope.myDataset = shortDataset;
    
    fetchMotivations().then(function(types){
        var options = [];
	angular.forEach(types, function(type){
            options.push({text: type.label, value: type.resource});
        });
        $scope.$apply(function(){
            $scope.motivations = options;
        });
    });
    
    fetchFabioTypes().then(function(types){
        var options = [];
	angular.forEach(types, function(type){
            options.push({text: type.label, value: type.resource});
        });
        $scope.$apply(function(){
            $scope.citoTypes = options;
        });
    });
    
    $scope.cancel = function(){
        if ($scope.loading)
            return;
        
        $location.path(encodeURIComponent(targetId) + '/annotations/');
	};
}]);