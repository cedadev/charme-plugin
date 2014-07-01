charme.xml={};

charme.xml.evaluate = function(xml, nsResolver, xmlEval){
	var xmlDoc;
	if (typeof xml === 'string'){
        if(typeof XPathResult !== 'undefined')
        { 
            var parser = new DOMParser();
            xmlDoc = parser.parseFromString(xml, "text/xml");
        }
        else // Internet Explorer
        {
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = false;
            xmlDoc.loadXML(xml); 
			xmlDoc.setProperty('SelectionLanguage', 'XPath');
			var ns = nsResolver;
			xmlDoc.setProperty('SelectionNamespaces', 'xmlns:atm="' + ns('atm') + '" xmlns:os="' + ns('os') + '" xmlns="' + ns('atm') + '"');
        }
	} else 
		xmlDoc = xml;
	if (typeof xmlEval==='undefined'){
		xmlEval = xmlDoc;
	}
	return new charme.xml.wrapDoc(xmlDoc, xmlEval, nsResolver);
};

charme.xml.wrapDoc = function(xmlDoc, xmlEval, nsResolver){
	this.asString = function(xpath){
		if(typeof XPathResult !== 'undefined'){
			return xmlEval.evaluate(xpath, xmlDoc, nsResolver, XPathResult.STRING_TYPE, null).stringValue;	
		} else {
			return xmlDoc.selectSingleNode(xpath).text;
		}
	};
	this.asNumber = function(xpath){
		if(typeof XPathResult !== 'undefined'){
			return xmlEval.evaluate(xpath, xmlDoc, nsResolver, XPathResult.NUMBER_TYPE, null).numberValue;
		} else {
			return parseInt(xmlDoc.selectSingleNode(xpath).text);
		}
	};
	/**
	 * This function will return a list of complex objects. The second parameter defines the type of 
	 * objects returned in the list. A coercible type is simple any user defined type that knows how to populate itself if passed an XML node.
	 */
	this.asComplexList = function(xpath, coercibleType){
		var resultList = [];
		var resultDoc;
		if(typeof XPathResult !== 'undefined'){
			resultDoc = xmlEval.evaluate(xpath, xmlDoc, nsResolver, XPathResult.ANY_TYPE, null);
			var nextNode = null;
			while((nextNode = resultDoc.iterateNext())){
				var atomDoc = charme.xml.evaluate(nextNode, charme.atom.nsResolver, xmlDoc);
				resultList.push(new coercibleType(atomDoc));
			}
		} else {
			resultDoc = xmlEval.selectNodes(xpath);
			for (var i=0; i < resultDoc.length; i++){
				var atomDoc = charme.xml.evaluate(resultDoc[i], charme.atom.nsResolver, xmlDoc);
				resultList.push(new coercibleType(atomDoc));
			}
		}
		return resultList;
	};
};