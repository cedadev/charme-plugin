/**
 * A filter designed for displaying annotations in a brief format suitable for display on the annotation list screen.
 */
charme.web.app.
	filter('shortAnnoTitle', function(){
		return charme.logic.shortAnnoTitle;
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