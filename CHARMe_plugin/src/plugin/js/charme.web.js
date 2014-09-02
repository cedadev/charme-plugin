var charme;
charme.web={};
charme.web.constants = {
    CHARME_TK: 'CHARME_AT',
 	PARAM_MOTIVATIONS: 'motivations',
 	PARAM_DOMAINS: 'domains',
 	PARAM_ORGANIZATION: 'organization',
 	PARAM_CREATOR: 'userName'
};

charme.web._closeListeners = [];

charme.web._miniaturiseListeners = [];
charme.web._maximiseListeners = [];

//charme.web._dsSelectionListeners = [];
//charme.web._dsDeselectionListeners = [];

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
            }).when('/:targetId/annotations/new/', {
                    templateUrl: 'templates/newannotation.html',
                    controller: 'NewAnnotationCtrl'
            }).when('/:targetId/annotations/', {
                    templateUrl: 'templates/listannotations.html',
                    controller: 'ListAnnotationsCtrl',
                    reloadOnSearch: false
            }).when('/:targetId/annotation/:annotationId/', {
                    templateUrl: 'templates/viewannotation.html',
                    controller: 'ViewAnnotationCtrl'
            });
    }
]);

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
	loginService._loginEvent({data: msgStr, origin: originStr});
};



charme.web.miniaturise = function(){
    angular.forEach(charme.web._miniaturiseListeners, function(miniaturiseFunc, key){
        miniaturiseFunc();
    });
};

charme.web.maximise = function(){
    angular.forEach(charme.web._maximiseListeners, function(maximiseFunc, key){
        maximiseFunc();
    });
};


charme.web.removeMiniaturiseListener = function (miniaturiseFunc){
    charme.web._miniaturiseListeners.splice(charme.web._miniaturiseListeners.indexOf(miniaturiseFunc),1);
};

charme.web.addMiniaturiseListener = function (miniaturiseFunc){
    charme.web._miniaturiseListeners.push(miniaturiseFunc);
};

charme.web.removeMaximiseListener = function (maximiseFunc){
    charme.web._maximiseListeners.splice(charme.web._maximiseListeners.indexOf(maximiseFunc),1);
};

charme.web.addMaximiseListener = function (maximiseFunc){
    charme.web._maximiseListeners.push(maximiseFunc);
};
