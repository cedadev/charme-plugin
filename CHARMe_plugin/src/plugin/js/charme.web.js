var charme;
charme.web={};
charme.web.constants = {
	CHARME_TK: 'CHARME_AT'	
};

charme.web._closeListeners = [];

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
		$routeProvider.when('/:targetId/init', {
			templateUrl: 'templates/init.html',
			controller: 'InitCtrl'
		}).
		when('/:targetId/annotations/new/', {
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

charme.web.close = function(){
	angular.forEach(charme.web._closeListeners, function(closeFunc, key){
		closeFunc();
	});
};

charme.web.removeCloseListener = function (closeFunc){
	charme.web._closeListeners.splice(charme.web._closeListeners.indexOf(closeFunc),1);
};

charme.web.addCloseListener = function (closeFunc){
	charme.web._closeListeners.push(closeFunc);
};

charme.web.postMessageProxy = function(msgStr, originStr){
	var injector = angular.element(document).injector();
	var loginService = injector.get('loginService');
	loginService._loginEvent({data: msgStr});
};