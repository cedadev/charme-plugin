/**
 * charme.web.js
 * 
 * Functions relevant to the plugin frontend (eg. layout, user actions, etc.)
 * 
 * Note: main.js and charme.logic.js should be included in that order.
 * 
 */
if (!charme)
	var charme= {};
charme.web = {};

charme.web.params = 
	(function(a) {
	    if (a == "") return {};
	    var b = {};
	    for (var i = 0; i < a.length; ++i)
	    {
	        var p=a[i].split('=');
	        if (p.length != 2) continue;
	        b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
	    }
	    return b;
	})(window.location.search.substr(1).split('&'));

/**
 * If plugin is inside an iframe (which it always will be, unless in dev mode), then
 * including page will provide a callback to the plugin to be called when plugin is closed.
 * This is in order to allow the containing iframe to be hidden etc. without the plugin itself 
 * having to make any assumptions about the including page.
 */
charme.web.closeCallback = {};
charme.web.setCloseCallback = function(closeCallback){
	charme.web.closeCallback = closeCallback;
};

charme.web.setResizeFunction = function(func){
	//$('#dialogHolder').on('resize', func);
};

charme.web.truncateURI=function(uri, length){
	uri = $.trim(uri);
	if (uri.length <= length)
		return uri;
	else
		return uri.substring(0, length).trim(this) + "...";
};

/**
 * TODO: This 'fetch' stuff sucks and has to go. Replace with promises model
 */
charme.web.fetchCount= 0;

charme.web.fetching = function(){
	charme.web.fetchCount++;
};

charme.web.fetchCheck = function(){
	if (charme.web.fetchCount == 0){
		var txtLoading = $('#text-loading');
		var refLoading = $('#ref-loading');
		
		if (txtLoading.is(":visible") ){
			txtLoading.hide();
			$('#no-text-annos').show();
		}
		if (refLoading.is(":visible") ){
			refLoading.hide();
			$('#no-ref-annos').show();
		}		
	}
};

charme.web.fetched = function(){
	if (charme.web.fetchCount > 0){
		charme.web.fetchCount--;
	}
	charme.web.fetchCheck();
};

charme.web.fetchAdditionalData = function(annotation){
	charme.web.fetching();
	charme.logic.fetchAnnotation(
			annotation.getInternalId(),
			function(graph){
				var fetchedAnno = graph.annotations[0];
				
				if (fetchedAnno.body.text){
	        		var html = 
	        			'<li class="annotation-row" id="annotation-row-' + annotation.getInternalId() + '">  ' +
	        			'	' + fetchedAnno.body.text + '                                                    ' +
            			'</li>                                                                               ';
	        		var htmlObj = $(html);
	            	$('#text-list:last').append(htmlObj);
	            	$('#no-text-annos').hide();
	            	$('#text-loading').hide();
				} else {
	        		var html = 
	        			'<li class="annotation-row" id="annotation-row-' + annotation.getInternalId() + '">                           ' +
	        			'	<a href="' + annotation.body.getId() + '">' + charme.web.truncateURI(annotation.body.getId(), 40) + '</a> ' +
            			'</li>                                                                                                        ';
	        		var htmlObj = $(html);
	            	$('#ref-list:last').append(htmlObj);
	            	$('#no-ref-annos').hide();
	            	$('#ref-loading').hide();
				}
				charme.web.fetched();
			},
			function() {
				$('#annotations-error').show();
				charme.web.fetched();
			}
	);
};

/*
 * Retrieve and show all annotations with a given state (eg. submitted, retired, etc.)
 * Parameters:
 * 		state: Return all annotations that match this state
 * 		targetId (optional): The id of a target on which to filter the results
 */
charme.web.showAnnotations=function(state, targetId){
	$('#annotations-error').hide();
	
	$('#no-text-annos').hide();
	$('#text-loading').show();
	$('#no-ref-annos').hide();
	$('#ref-loading').show();	
	
	//Make a call to the lower-level charme.logic function that makes the ajax call to fetch the annotations
	charme.logic.fetchAnnotations(state,
		function(graph){
			
        	$.each(graph.annotations, function(i, annotation){
        		//Temporary hack in order to allow filtering by target
        		if (!targetId || annotation.target.getId()==targetId){
        			//For each annotation, go and fetch additional associated data.
        			charme.web.fetchAdditionalData(annotation);
        		}
        	});
        	charme.web.fetchCheck();
		},
		function(){
			$('#annotations-error').show();
			$('#text-loading').hide();
			$('#no-text-annos').show();
			$('#ref-loading').hide();
			$('#no-ref-annos').show();
		},
		targetId
	);
};

/**
 * Clear all of the annotation rows from the table.
 */
charme.web.clearAnnotations=function(){
	$('.annotation-row').remove();
	$('#no-text-annos').show();
	$('#no-ref-annos').show();
};

/**
 * Create a new annotation by saving the form, populating an annotation object, and serializing this into an ajax call
 */
charme.web.saveAnnotation=function(){
	var form = $('#annotation-form')[0];
	//Clear all errors
	$('.alert').hide();
	
	//Create a new Annotation object
	var annotation = new OA.OAnnotation();
	//Fetch the the id from the form that was auto-generated.
	annotation.setId(charme.logic.constants.ATN_ID_PREFIX + 'annoID');
	
	//Create and populate a Target object.
	var target = new OA.OATarget();
	target.setId(charme.web.params['targetId']);
	annotation.target = target;
	
	//The JSON-LD graph created will depend somewhat upon the type of annotation being created. This is abstracted in the js code by providing different types of
	//Annotation Body objects, depending on the type required.
	var typeSelect = $('#AnnoType');

	if (typeSelect.val()=='text'){
		var body = OA.createTextBody();
		body.setId(charme.logic.constants.BODY_ID_PREFIX + 'bodyID');
		body.text=form.elements['bodyContentText'].value;
		annotation.body = body;
	} else {
		var doiVal = form.elements['bodyContentDOI'].value;
		if (!doiVal.match('^' + charme.logic.regExpEscape(charme.logic.constants.DOI_PREFIX))){
			doiVal = charme.logic.constants.DOI_PREFIX + doiVal;
		}
		var body = new OA.OABody();
		body.setId(doiVal);
		annotation.body = body;
	}
	charme.logic.createAnnotation(annotation, 
			function(){
				//Success callback
				$('#newAnnotation').hide();
				$('#dialogHolder').show();
				charme.web.clearAnnotations();
				charme.web.showAnnotations('submitted', annotation.target.getId());
			}, 
			function(){
				$('#newAnnotation').hide();
				$('#dialogHolder').show();
				//Error callback
				$('#create-error').show();
			}
	);
	return false;
};
/**
 * Event handler fired when tabs are clicked. This will clear the annotations on the page, and issue an AJAX fetch for all annotations with the selected status
 */
charme.web.changeTab=function(e){
	var el = e.currentTarget;
	var state = el['id'].substring(4);
	el = $(el);
	$('#state-tabs .active').removeClass('active');
	el.addClass('active');
	//clear all alerts when changing tab
	$('.alert').hide();
	charme.web.clearAnnotations();
	charme.web.showAnnotations(state);
};

/**
 * This function is intended to highlight the annotation row with the given annotation id. This is useful after creation of a new annotation, so that it is clear to the user that an annotation has been successfully created.
 */
charme.web.highlight=function(internalId){
	//$('#annotation-row-' + internalId).animate({opacity: 0.25}, 500, function(){$('#annotation-row-' + internalId).animate({opacity: 1}, 500);});
	var row = $('#annotation-row-' + internalId);
	for (var i=0; i < 2; i++){
		row.animate({opacity: 0.25}, 500).animate({opacity: 1}, 500);
	}
};

/**
 * Change the state of the selected annotation. This issues a new ajax call to the necessary web service.
 */
charme.web.advanceState=function(annotationId, newState){
	charme.logic.advanceState(annotationId, newState,
		function(){
			$('#tab-' + newState).click();
		},
		function(){
			$('#state-error').show();
		}
	);
};

/**
 * When creating a new annotation, select the type of annotation to be created. On the UI, this changes the type of input field presented for the body. 
 * In the code, this affects how the Annotation object is initialized in charme.web.saveAnnotation
 */
charme.web.changeType=function(e){
	var type = e.currentTarget.value;
	if (type=='cito'){
		$('#AnnoBodyCito').show();
		$('#AnnoBodyText').hide();
	} else {
		$('#AnnoBodyText').show();
		$('#AnnoBodyCito').hide();
	}
};

/**
 * An initialization function that is called when the DOM document is rendered, and ready.
 */
charme.web.init=function(){ 
	
	var targetId = charme.web.params['targetId']; 
	if (targetId){
		charme.web.showAnnotations('submitted', targetId);
	}
	$('#newAnnotation').hide();
	
	$('#newAnnotationButton').click(
			function(){
				$('#create-error').hide();
				$('#annotation-form')[0].reset();
				$('#dialogHolder').hide();
				$('#newAnnotation').show(); 
			}
	);
	
	$('#CancelButton').click(
			function(){
				$('#newAnnotation').hide();
				$('#dialogHolder').show();
			}
	);
	
	$('#annotation-form').submit( function(){
		return false;
	});
	
	$('#DoneButton').unbind(charme.web.closeCallback);
	$('#DoneButton').on('click', function (){
		if (charme.web.closeCallback){
			charme.web.closeCallback();
		}
	});
	
	$('#CloseCross').on('click', function(){
		if (charme.web.closeCallback){
			charme.web.closeCallback();
		}
	});
	
	$('#SaveButton').unbind(charme.web.saveAnnotation).click(charme.web.saveAnnotation);
	
	$('#state-tabs li').unbind(charme.web.changeTab).click(charme.web.changeTab);
	$('#AnnoType').change(charme.web.changeType);
	$('#AnnoType').change();
	
	$('#dialogHolder').modal({backdrop: false});
};

$(document).ready(function(){
	charme.web.init();
});