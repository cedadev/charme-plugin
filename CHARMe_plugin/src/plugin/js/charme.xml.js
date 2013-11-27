charme.xml={};

charme.xml.evaluate = function(xmlDoc, nsResolver){
	if (typeof xmlDoc === 'string'){
		xmlDoc = $.parseXML(xmlDoc);
	}
	var xmlEval = xmlDoc;
	if (typeof xmlEval.evaluate === 'undefined'){
		xmlEval = document;
	}
	return new charme.xml.wrapDoc(xmlDoc, xmlEval, nsResolver);
};

charme.xml.wrapDoc = function(xmlDoc, xmlEval, nsResolver){
	this.asString = function(xpath){
		return xmlEval.evaluate(xpath, xmlDoc, nsResolver, XPathResult.STRING_TYPE, null).stringValue;
	};
	this.asNumber = function(xpath){
		return xmlEval.evaluate(xpath, xmlDoc, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
	};
	/**
	 * This function will return a list of complex objects. The second parameter defines the type of 
	 * objects returned in the list. This will be a user defined type that knows how to populate itself given an XML node.
	 */
	this.asComplexList = function(xpath, coercibleType){
		var resultList = [];
		var resultDoc = xmlEval.evaluate(xpath, xmlDoc, nsResolver, XPathResult.ANY_TYPE, null);
		var nextNode = null;
		while((nextNode = resultDoc.iterateNext())){
			var atomDoc = charme.xml.evaluate(nextNode, charme.atom.nsResolver);
			resultList.push(new coercibleType(atomDoc));
		}
		return resultList;
	};
};