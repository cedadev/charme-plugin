var charme;
charme.web={};
/**
 * Register CHARMe app, and define its modular dependencies
 */
charme.web.app=angular.module('charmePlugin', [
	'ngRoute',
    'charmeControllers'
]);

/**
 * Define routing to the different pages in the app
 */
charme.web.app.config(['$routeProvider',
    function($routeProvider){
		$routeProvider.when('/:targetId/annotations/new/', {
			templateUrl: 'templates/newannotation.html',
			controller: 'NewAnnotationCtrl'
		}).when('/:targetId/annotations/', {
			templateUrl: 'templates/listannotations.html',
			controller: 'ListAnnotationsCtrl'			
			}
		).when('/:targetId/annotation/:annotationId/', {
			templateUrl: 'templates/viewAnnotation.html',
			controller: 'ViewAnnotationCtrl'			
			}
		);
	}
]
);