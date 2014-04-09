/**
 * A filter designed for displaying annotations in a brief format suitable for display on the annotation list screen.
 */
charme.web.app.
	filter('shortAnnoTitle', function(){
		return function(input){
			var out='';
			var bodies = input.getValues(input.BODY);
			angular.forEach(bodies, function(body){
				if (body instanceof jsonoa.types.TextBody){
					out=body.getValue(body.CONTENT_CHARS);
				} else if (body instanceof jsonoa.types.Publication && out.length===0){
					out=body.getValue(body.CITING_ENTITY).getValue(body.ID);
				}
			});
			return out;
		};
	}).
	filter('truncate', ['$filter', function($filter){
		return function(input, length){
			var out='';
			if (!input)
				return out;
			out = $filter('limitTo')(input, length);
			if (out.length!=input.length)
				out+='...';
			return out;
		};
	}]);