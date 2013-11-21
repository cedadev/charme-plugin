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
		if (a === "") return {};
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

/**
 * TODO: FIX THIS. Use classes etc.
 */
charme.web.fetchCheck = function(){
	if (charme.web.fetchCount === 0){
		var txtLoading = $('#text-loading');
		var refLoading = $('#ref-loading');
		var linkLoading = $('#link-loading');
		
		if (txtLoading.is(":visible") ){
			txtLoading.hide();
			$('#no-text-annos').show();
		}
		if (refLoading.is(":visible") ){
			refLoading.hide();
			$('#no-ref-annos').show();
		}
		if (linkLoading.is(":visible") ){
			linkLoading.hide();
			$('#no-link-annos').show();
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
	/**
	 * DIRTY HACK.
	 * This is intended to fetch DOI annotation metadata. This will not be necessary once this data is stored in the triplestore
	 * 
	 */
	if (annotation.body && annotation.body.length > 0 && annotation.body.getId().indexOf(charme.logic.constants.DOI_PREFIX)===0){
		var doiTxt = annotation.body.getId().substring(charme.logic.constants.DOI_PREFIX.length, annotation.body.getId().length);
		var criteria = {};
		criteria[charme.logic.constants.CROSSREF_CRITERIA_DOI]=doiTxt;

		charme.logic.fetchCrossRefMetaData(criteria).then(function(metaData){
			var html = 
				'<li class="annotation-row" id="annotation-row-' + annotation.getInternalId() + '">                           ' +
				'   ' + charme.crossref.chicagoStyle(metaData) + '                                                            ' +
				'	<a href="' + annotation.body.getId() + '">' + charme.web.truncateURI(annotation.body.getId(), 40) + '</a> ' +
				'</li>                                                                                                        ';
			var htmlObj = $(html);
			$('#ref-list:last').append(htmlObj);
			$('#no-ref-annos').hide();
			$('#ref-loading').hide();
			charme.web.fetched();
		}, function(){
				$('#annotations-error').show();
				charme.web.fetched();
		});
		return;
	}
	charme.logic.fetchAnnotation(
			annotation.getInternalId(),
			/*
			 * Success callback
			 */
			function(graph){
				//Hoisted variables
				var htmlStr='';
				var htmlObj = {};
				var fetchedAnno = graph.annotations[0];
				if (!annotation.body || !annotation.body.getId){
					//No body object present
				}
				else if (fetchedAnno.body.text){
					htmlStr = 
						'<li class="annotation-row" id="annotation-row-' + annotation.getInternalId() + '">  ' +
						'	' + fetchedAnno.body.text + '                                                    ' +
						'</li>                                                                               ';
					htmlObj = $(htmlStr);
					$('#text-list:last').append(htmlObj);
					$('#no-text-annos').hide();
					$('#text-loading').hide();
				} else if (fetchedAnno.body instanceof OA.OARefBody){
					htmlStr = 
						'<li class="annotation-row" id="annotation-row-' + annotation.getInternalId() + '">                           ' +
						'	<a href="' + annotation.body.getId() + '">' + charme.web.truncateURI(annotation.body.getId(), 40) + '</a> ' +
						'</li>                                                                                                        ';
					htmlObj = $(htmlStr);
					$('#ref-list:last').append(htmlObj);
					$('#no-ref-annos').hide();
					$('#ref-loading').hide();
				} else {
					htmlStr = 
						'<li class="annotation-row" id="annotation-row-' + annotation.getInternalId() + '">                           ' +
						'	<a href="' + annotation.body.getId() + '">' + charme.web.truncateURI(annotation.body.getId(), 40) + '</a> ' +
						'</li>                                                                                                        ';
					htmlObj = $(htmlStr);
					$('#link-list:last').append(htmlObj);
					$('#no-link-annos').hide();
					$('#link-loading').hide();
				}

				charme.web.fetched();
			},
			/*
			 * Error callback
			 */
			function() {
				$('#annotations-error').show();
				charme.web.fetched();
			}
	);
};

/*
 * Retrieve and show all annotations with a given state (eg. submitted, retired, etc.)
 * Parameters:
 *		state: Return all annotations that match this state
 *		targetId (optional): The id of a target on which to filter the results
 */
charme.web.showAnnotations=function(state, targetId){
	$('#annotations-error').hide();
	
	$('#no-text-annos').hide();
	$('#text-loading').show();
	$('#no-ref-annos').hide();
	$('#ref-loading').show();
	$('#no-link-annos').hide();
	$('#link-loading').show();
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
			$('#link-loading').hide();			
			$('#no-link-annos').show();		
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
	$('#no-link-annos').show();	
};

/**
 * Create a new annotation by saving the form, populating an annotation object, and serializing this into an ajax call
 */
charme.web.saveAnnotation=function(){
	var bodyObj = {};
	var doiVal = '';
	var form = $('#annotation-form')[0];
	
	//Clear all errors
	$('.alert').hide();
	
	//Create a new Annotation object
	var annotation = new OA.OAnnotation();
	//Fetch the the id from the form that was auto-generated.
	annotation.setId(charme.logic.constants.ATN_ID_PREFIX + 'annoID');
	
	//Create and populate a Target object.
	var target = new OA.OATarget();
	target.setId(charme.web.params.targetId);
	annotation.target = target;
	
	//The JSON-LD graph created will depend somewhat upon the type of annotation being created. This is abstracted in the js code by providing different types of
	//Annotation Body objects, depending on the type required.
	var typeSelect = $('#AnnoType');

	if (typeSelect.val()=='text'){
		bodyObj = OA.createTextBody();
		bodyObj.setId(charme.logic.constants.BODY_ID_PREFIX + 'bodyID');
		bodyObj.text=form.elements.bodyContentText.value;
		annotation.body = bodyObj;
	} else if (typeSelect.val() == 'url'){
		doiVal = form.elements.bodyContentURL.value;
		if (!doiVal.match('^' + charme.logic.regExpEscape(charme.logic.constants.URL_PREFIX))){
			doiVal = charme.logic.constants.URL_PREFIX + doiVal;
		}
		bodyObj = new OA.OABody();
		bodyObj.setId(doiVal);
		annotation.body = bodyObj;
	} else if (typeSelect.val() == 'cito'){
		doiVal = form.elements.bodyContentDOI.value;
		if (!doiVal.match('^' + charme.logic.regExpEscape(charme.logic.constants.DOI_PREFIX))){
			doiVal = charme.logic.constants.DOI_PREFIX + doiVal;
		}
		bodyObj = new OA.OARefBody();
		bodyObj.citedEntity=target.getId();
		bodyObj.citingEntity=doiVal;
		bodyObj.setId(doiVal);
		annotation.body = bodyObj;
	}
	charme.logic.createAnnotation(annotation, 
			function(){
				//Success callback
				$('#newAnnotation').addClass('hide');
				$('#dialogHolder').show();
				charme.web.clearAnnotations();
				charme.web.showAnnotations('submitted', annotation.target.getId());
			}, 
			function(){
				charme.web.clearAnnotations();
				charme.web.showAnnotations('submitted', annotation.target.getId());
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
	var state = el.id.substring(4);
	el = $(el);
	$('#state-tabs .active').removeClass('active');
	el.addClass('active');
	//clear all alerts when changing tab
	$('.alert').hide();
	charme.web.clearAnnotations();
	charme.web.showAnnotations(state);
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
		$('#AnnoBodyURL').hide();
	} else if (type=='text'){
		$('#AnnoBodyText').show();
		$('#AnnoBodyCito').hide();
		$('#AnnoBodyURL').hide();
	} else if (type=='url'){
		$('#AnnoBodyURL').show();
		$('#AnnoBodyCito').hide();
		$('#AnnoBodyText').hide();
	}
};

charme.web.doiSearch=function(e){
	var doiElement = $('#AnnoBodyCitoInput');
	var doi = $.trim(doiElement.val());

	var annoBodyCito = $('#AnnoBodyCito');
	annoBodyCito.removeClass('error');
	annoBodyCito.removeClass('success');
	doiElement.popover('destroy');
	
	if (doi.length===0){
		annoBodyCito.addClass('error');
		doiElement.attr('data-content', 'Please enter a DOI before searching');
		doiElement.popover('show');
		return true;
	} else {
		var criteria = {};
		criteria[charme.logic.constants.CROSSREF_CRITERIA_DOI] = doi;
		charme.logic.fetchCrossRefMetaData(criteria).then(
			function(data){
				//var fmtText = charme.crossref.chicagoStyle(data);
				//Disabling this for now. Instead, going to use the crossref citation formatter for wider support. If metadata is needed in XML format in the future, then this can be restored.
				var fmtText = data;
				$('#BibTextHolder').html(fmtText);
				$('#AnnoBodyBib').removeClass('hide');
				annoBodyCito.addClass('success');
			}, function(){
				annoBodyCito.addClass('error');
				doiElement.attr('data-content', 'Error retrieving publication metadata');
				doiElement.popover('show');
			});
	}
};

/**
 * Define behaviour of html elements through progressive enhancement
 */
charme.web.behaviour = function(){
	$('#newAnnotationButton').click(
			function(){
				$('#create-error').hide();
				$('#annotation-form')[0].reset();
				$('#dialogHolder').hide();
				$('#BibTextHolder').html('');
				$('#AnnoBodyBib').addClass('hide');
				var annoBodyCito = $('#AnnoBodyCito');
				annoBodyCito.removeClass('success');
				annoBodyCito.removeClass('error');
				$('#AnnoType').change();
				$('#newAnnotation').removeClass('hide'); 
			}
	);
	
	$('#CancelButton').click(
			function(){
				$('#newAnnotation').addClass('hide');
				$('#dialogHolder').show();
			}
	); 
	
	$('#annotation-form').submit( function(){
		return false;
	});
	
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
		
	$('#newAnnotation-CloseCross').on('click', function(){
		$('#newAnnotation').addClass('hide');
		$('#dialogHolder').show();
	});
	
	$('#SaveButton').on('click', charme.web.saveAnnotation);
	
	$('#AnnoType').change(charme.web.changeType);
	$('#AnnoType').change();

	$('#DOISearchButton').on('click', charme.web.doiSearch);
	$('#AnnoBodyCitoInput').on('change', function(){
				$('#BibTextHolder').html('');
				$('#AnnoBodyBib').addClass('hide');
				var annoBodyCito = $('#AnnoBodyCito');
				annoBodyCito.removeClass('success');
				annoBodyCito.removeClass('error');
	});
};

/**
 * An initialization function that is called when the DOM document is rendered, and ready.
 */
charme.web.init=function(){ 
	
	var targetId = charme.web.params.targetId; 
	if (targetId){
		charme.web.showAnnotations('submitted', targetId);
	}

	charme.web.behaviour();
};

$(document).ready(function(){
	charme.web.init();
});