charme.atom = {};
charme.atom.xpath = function(){
		this.NS_OPENSEARCH_URI		= 'http://a9.com/-/spec/opensearch/1.1/';

		/*
		 * Paths to elements in the XML Document
		 */
		this.XPATH_BASE				= '//atm:feed';
		this.XPATH_ID				= this.XPATH_BASE + '/atm:id';

		//Paging links
		this.XPATH_FIRST			= this.XPATH_BASE + '/atm:link[@rel="first"]';
		this.XPATH_FIRST_HREF		= this.XPATH_FIRST + '/@href';
		this.XPATH_NEXT				= this.XPATH_BASE + '/atm:link[@rel="next"]';
		this.XPATH_NEXT_HREF		= this.XPATH_NEXT + '/@href';
		this.XPATH_PREVIOUS			= this.XPATH_BASE + '/atm:link[@rel="previous"]';
		this.XPATH_PREVIOUS_HREF	= this.XPATH_PREVIOUS + '/@href';
		this.XPATH_LAST				= this.XPATH_BASE + '/atm:link[@rel="last"]';
		this.XPATH_LAST_HREF		= this.XPATH_LAST + '/@href';
		
		//Results metadata
		this.XPATH_TOTAL_RESULTS	= this.XPATH_BASE + '/os:totalResults';
		this.XPATH_START_INDEX		= this.XPATH_BASE + '/os:startIndex';
		this.XPATH_INDEX_PER_PAGE	= this.XPATH_BASE + '/os:indexPerPage';
		
		//Entries
		this.XPATH_ENTRY_BASE		= '//atm:entry';
		this.XPATH_ENTRIES			= this.XPATH_BASE + this.XPATH_ENTRY_BASE;
		this.XPATH_ENTRY_ID			= 'atm:id';
		this.XPATH_ENTRY_TITLE		= 'atm:title';
		this.XPATH_ENTRY_UPDATED	= 'atm:updated';
		this.XPATH_ENTRY_CONTENT	= 'atm:content';		
};

charme.atom.nsResolver = function(prefix){
	var ns = {
			'atm' : 'http://www.w3.org/2005/Atom',
			'os': 'http://a9.com/-/spec/opensearch/1.1/'
	};
	return ns[prefix] || null;
};

/**
 * A 'coercible type'. This function will take an XML node as an input, and populate itself.
 */
charme.atom.entry = function(atomDoc){
	var xpathConst = new charme.atom.xpath();
	
	this.id = atomDoc.asString(xpathConst.XPATH_ENTRY_ID);
	this.title = atomDoc.asString(xpathConst.XPATH_ENTRY_TITLE);
	this.updated = atomDoc.asString(xpathConst.XPATH_ENTRY_UPDATED);
	this.content = atomDoc.asString(xpathConst.XPATH_ENTRY_CONTENT);
};

charme.atom.result = function(xmlDoc){
		/*
		 * Init
		 */
		var xpathConst = new charme.atom.xpath();
		
		var atomDoc = charme.xml.evaluate(xmlDoc, charme.atom.nsResolver);
		
		/*
		 * Attributes 
		 */
		this.id=atomDoc.asString(xpathConst.XPATH_ID);
		this.first = {
				href: atomDoc.asString(xpathConst.XPATH_FIRST_HREF)
		};
		this.next = {
				href: atomDoc.asString(xpathConst.XPATH_NEXT_HREF)
		};
		this.previous = {
				href: atomDoc.asString(xpathConst.XPATH_PREVIOUS_HREF)
		};
		this.last = {
				href: atomDoc.asString(xpathConst.XPATH_LAST_HREF)
		};
		this.totalResults = atomDoc.asNumber(xpathConst.XPATH_TOTAL_RESULTS);
		this.startIndex = atomDoc.asNumber(xpathConst.XPATH_START_INDEX);
		this.indexPerPage = atomDoc.asNumber(xpathConst.XPATH_INDEX_PER_PAGE);
		this.entries = atomDoc.asComplexList(xpathConst.XPATH_ENTRIES, charme.atom.entry);
};