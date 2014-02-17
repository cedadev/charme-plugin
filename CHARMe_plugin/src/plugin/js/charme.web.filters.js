/**
 * A filter designed for displaying annotations in a brief format suitable for display on the annotation list screen.
 */
charme.web.app.
	filter('shortAnnoTitle', function(){
		return function(input){
			var out='';
			var body = input.getValue(input.BODY);
			if (body){
				/*
				 * Only handles one body at present 
				 */
				if (body instanceof jsonoa.types.TextBody){
					out+=body.getValue(body.CONTENT_CHARS);
				} else if (body instanceof jsonoa.types.Publication){
					out+=body.getValue(body.CITING_ENTITY).getValue(body.ID);
				} else {
					out+=body.getValue(body.ID);
				}
				
			}
			return out;
		};
	}).
	filter('truncate', ['$filter', function($filter){
		return function(input, length){
			var out='';
			out = $filter('limitTo')(input, length);
			if (out.length!=input.length)
				out+='...';
			return out;
		};
	}]);