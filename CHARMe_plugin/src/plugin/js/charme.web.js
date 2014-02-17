(function() {
    angular.module('angular-selectize', []);

    angular.module('angular-selectize').directive('selectize', function($timeout) {
        return {
            // Restrict it to be an attribute in this case
            restrict: 'A',
            // responsible for registering DOM listeners as well as updating the DOM
            link: function(scope, element, attrs) {
                $timeout(function() {
                    $(element).selectize(scope.$eval(attrs.selectize));
                });
            }
        };
    });
}).call(this);

var charme;
charme.web={};
/**
 * Register CHARMe app, and define its modular dependencies
 */
charme.web.app=angular.module('charmePlugin', [
	'ngRoute',
    'charmeControllers',
    'angular-selectize'
]);

/**
 * Define routing to the different pages in the app
 */
charme.web.app.config(['$routeProvider',
    function($routeProvider){
		$routeProvider.
		when('/:targetId/annotations/new/', {
			templateUrl: 'templates/newannotation.html',
			controller: 'NewAnnotationCtrl'
		}).
		when('/:targetId/annotations/', {
			templateUrl: 'templates/listannotations.html',
			controller: 'ListAnnotationsCtrl'			
			}
		).
		when('/:targetId/annotation/:annotationId/', {
			templateUrl: 'templates/viewAnnotation.html',
			controller: 'ViewAnnotationCtrl'			
			}
		);
	}
]
);