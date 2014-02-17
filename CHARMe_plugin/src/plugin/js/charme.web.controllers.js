charme.web.controllers = angular.module('charmeControllers', ['charmeServices']);

/**
 * List all annotations for target.
 */
charme.web.controllers.controller('ListAnnotationsCtrl', ['$scope', '$routeParams', '$location', '$filter', 'fetchAnnotationsForTarget',
function ($scope, $routeParams, $location, $filter, fetchAnnotationsForTarget){
	var targetId=$routeParams.targetId;
	$scope.newAnnotation = function(){
		$location.path(encodeURIComponent(targetId) + '/annotations/new/');
	};
	
	$scope.viewAnnotation = function(annoId){
		$location.path(encodeURIComponent(targetId) + '/annotation/' + encodeURIComponent(annoId) + '/');
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
 * View details of individual annotation.
 */
charme.web.controllers.controller('ViewAnnotationCtrl', ['$scope', '$routeParams', '$location', '$window', 'fetchAnnotation',
      function ($scope, $routeParams, $location, $window, fetchAnnotation){
		var targetId=$routeParams.targetId;
		$scope.cancel = function(){
			$window.history.back();
		};
		var annoId=$routeParams.annotationId;
		$scope.annotationId=annoId;
		$scope.targetId=targetId;

		fetchAnnotation(annoId).then(
			function(graph){
				var annoList = graph.getAnnotations();
				if (annoList.length > 0) {				
					$scope.$apply(function(){
						var anno = annoList[0];
						var body = anno.getValue(anno.BODY);
						if (body instanceof jsonoa.types.TextBody){
							$scope.comment = body.getValue(body.CONTENT_CHARS);
						} else {
							$scope.link = body.getValue(body.ID);
						}
						var author = anno.getValue(anno.ANNOTATED_BY);
						if (author){
							$scope.author = author.getValue(author.NAME);
							$scope.email = author.getValue(author.MBOX);
						}
					});
				} else {
					$scope.$apply(function(){
						$scope.errorMsg='Error: No annotations returned';
					});
				}
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
charme.web.controllers.controller('NewAnnotationCtrl', ['$scope', '$routeParams', '$location', '$window', '$timeout', 'saveAnnotation', 'fetchKeywords', 
function ($scope, $routeParams, $location, $window, $timeout, saveAnnotation, fetchKeywords){
	var targetId=$routeParams.targetId;
	
	$scope.cancel = function(){
		$window.history.back();
	};
	$scope.save = function(annoModel){
		$scope.showModal=true;
		saveAnnotation(annoModel, targetId).then(
			function(){
				$scope.$apply(function(){
					$scope.showModal=false;
					$location.path(encodeURIComponent(targetId) + '/annotations/');
				});
			},
			function(error){
				$scope.$apply(function(){
					$scope.errorMsg='Error: ' + error;
					$scope.showModal=false;
				});
			});
	};
	
	fetchKeywords().then(
			function(keywords){
				$scope.$apply(function(){
					$scope.keywords = keywords;
				});
			},
			function(error){
				$scope.$apply(function(){
					$scope.errorMsg='Error: ' + error;
				});
			}
		);
}]);