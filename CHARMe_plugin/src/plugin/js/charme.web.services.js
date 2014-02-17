charme.web.services = angular.module('charmeServices', []);

/**
 * Register charme.logic methods as service methods
 */
charme.web.services.factory('fetchAnnotationsForTarget', function(){ 
		return charme.logic.fetchAnnotationsForTarget;
	}
);

charme.web.services.factory('fetchAnnotation', function(){ 
	return charme.logic.fetchAnnotation;
}
);

charme.web.services.factory('saveAnnotation', function(){ 
	return function(annoModel, targetId){
		
		var graph = new jsonoa.types.Graph();
		var anno = graph.createNode(jsonoa.types.Annotation, charme.logic.constants.ATN_ID_PREFIX + 'annoID');
		var bodyId = charme.logic.constants.BODY_ID_PREFIX + 'bodyID';
		if (annoModel.comment){
			var comment = graph.createNode(jsonoa.types.TextBody, bodyId);
			comment.setValue(comment.CONTENT_CHARS, annoModel.comment);
			anno.setValue(anno.BODY, comment);
		} else if (annoModel.type){
			var type = annoModel.type;
			if (type==='jsonoa.types.Publication'){
				var publication = graph.createNode(jsonoa.types.Publication, bodyId);
				publication.setValue(publication.CITED_ENTITY, graph.createStub(targetId));
				var doiVal = annoModel.uri;
				if (!doiVal.match('^' + charme.logic.regExpEscape(charme.logic.constants.DOI_PREFIX))){
					doiVal = charme.logic.constants.DOI_PREFIX + doiVal;
				}
				publication.setValue(publication.CITING_ENTITY, graph.createStub(doiVal));
				anno.setValue(anno.BODY, publication);
			} else {
				var uriVal = annoModel.uri;
				if (!uriVal.match('^' + charme.logic.regExpEscape(charme.logic.constants.URL_PREFIX))){
					uriVal = charme.logic.constants.URL_PREFIX + uriVal;
				}
				anno.setValue(anno.BODY, graph.createStub(uriVal));
			}
			
		}
		
		var person = graph.createNode(jsonoa.types.Person, 'http://localhost/' + charme.logic.generateGUID());
		person.setValue(person.MBOX, graph.createStub('mailto:a.henry@cgi.com'));
		person.setValue(person.NAME, 'Andrew Henry');
		anno.setValue(anno.ANNOTATED_BY, person);
		
		var target = graph.createNode(jsonoa.types.DatasetTarget, targetId);
		anno.setValue(anno.TARGET, target);
		
		return charme.logic.saveGraph(graph);
	};
}
);

charme.web.services.factory('fetchKeywords', function(){
	return function(annoModel, targetId){	
		var promise = new Promise(function(resolver){
			var categories = [];
			charme.logic.fetchGCMDVocab().then(function(keywords){
				categories.push({
					name: 'GCMD',
					keywords: keywords
				});
				resolver.fulfill(categories);
			});
		}, function(error){
			resolver.reject(error);
		});
		return promise;
	};
});