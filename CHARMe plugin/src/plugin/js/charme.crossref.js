charme.crossref = {};

charme.crossref.constants = {
	XPATH_TITLE: '//title',
	XPATH_DOI:'//doi_data//doi',
	//XPATH_AUTHORS: '//person_name/given_name|//person_name/surname',
	XPATH_AUTHORS: '//contributors/person_name',
	XPATH_AUTHOR_SNAME: 'surname',
	XPATH_AUTHOR_GNAME: 'given_name'
};

/**
 * Parses an XML document (text or DOM object) and returns a javascript object with the following structure:
 *
 * charme.crossref.MetaData = {
 *    doi: '',
 *    title: '',
 *    authors: [{
 *       givenName: '',
 *       surname: ''	  
 *    }],
 * }
 */
charme.crossref.MetaData = function(xmlDoc) {
	if (typeof xmlDoc === 'string'){
		xmlDoc = $.parseXML(xmlDoc);
	}
	//First, check that a DOI exists in the response
	var doiNode = document.evaluate(charme.crossref.constants.XPATH_DOI, xmlDoc, null, XPathResult.ANY_TYPE).iterateNext();
	if (doiNode == null){
		throw "The provided DOI did not match any records";
	}
	this.doi=doiNode.textContent;
	this.doi = $.trim(this.doi);
	this.title=document.evaluate(charme.crossref.constants.XPATH_TITLE, xmlDoc, null, XPathResult.ANY_TYPE).iterateNext().textContent.replace(/\s\s*/g, ' ');
	this.title = $.trim(this.title);

	this.authors=(function (){
		var authorData = [];
		var xmlAuthors = document.evaluate(charme.crossref.constants.XPATH_AUTHORS, xmlDoc, null, XPathResult.ANY_TYPE);
		var author = xmlAuthors.iterateNext();
		while(author){
			var a = {};
			a.givenName = document.evaluate(charme.crossref.constants.XPATH_AUTHOR_GNAME, author, null, XPathResult.ANY_TYPE).iterateNext().textContent;
			a.surname = document.evaluate(charme.crossref.constants.XPATH_AUTHOR_SNAME, author, null, XPathResult.ANY_TYPE).iterateNext().textContent;
			authorData.push(a);
			author = xmlAuthors.iterateNext();
		}
		return authorData;
	})();
};

//'${authors[${surname}, ${name}]}'
/*
 * A formatter function that prints the values of the properties of an object in the specified format
 * The format string can be anything, where the value of a given property will be substitued for {propertyName}.
 * An array property can be specified with {propertyName[]}. Within the [] you can specify a subformat with the same formatting
 * rules, which will be applied to the properties on each of the array elements. Additionally, a sequence may be defined following an array substitution
 * that will be substituted after each array element EXCEPT the last one. Using {propertyName[]}(substitution)
 * eg.
 * var fmt = '{field1}, {field2}, {arrField[{prop1}, {prop2}](; )}, {field2} {field3}';
 * 	var obj = {
		field1: 'Value of field 1',
		field2: 'Value of field 2',
		field3: 'Value of field 3',
		something: 'Something',
		arrField: [{prop1:'Arr1 Prop 1', prop2:'Arr1 Prop2', arrProp:[{rProp1:'Value of rProp1', rProp2:'Value of rProp2'}]}, {prop1:'Arr2 Prop 1', prop2:'Arr2 Prop2'}]
	};
 * Current limitations:
 *    - Can not handle complex object types, except as array elements
 *    - Will not substitute a property multiple times
 *    - Will only handle array substitutions 1 level deep.
 */
charme.crossref.format = function(metaData, style){
	var text=style;
	$.each(metaData, function(key, val){
		if ($.isArray(val)){
			var regex = new RegExp('\\{' + key + '\\[(.*)\\](\\((.*)\\))?\\}');
			if (!regex.test(style)){
				return;
			}
			var regexArr = regex.exec(style);
			var elTerm = typeof regexArr[3] === 'undefined' ? '' : regexArr[3];
			var subStyle = regexArr[1]; // If this matches multiple times, it doesn't matter. Just take the first one, .replace will apply it to all matches anyway
			text = text.replace(regex, (function(){
				//Execute the regex, and return the 2nd element. The 2nd element is the 
				var res = '';
				$(val).each(function(ix, el){
					res+=charme.crossref.format(el, subStyle);
					if (ix < (val.length-1)){
						res+=elTerm;
					}
				})
				return res;
			})());
		} else {
			text = text.replace(new RegExp('\\{' + key + '\\}'), val);
		}
	});
	return text;

};