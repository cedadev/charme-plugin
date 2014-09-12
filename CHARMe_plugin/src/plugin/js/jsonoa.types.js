if (!jsonoa.types){
	jsonoa.types = {};
}
/**
 * JSON-LD node type definitions.
 * Type definitions consist of two parts, the declaration of any type specific constants,
 * and the definition of a template. The template is used for _creating_ new nodes of the specified type.
 * The TYPE is used for identifying nodes, and may be an array if the node is always specified with more than one type (eg. Text nodes)
 * Node definitions also define any constants used for accessing the values in them.
 */
jsonoa.types.Annotation=(function Annotation(){
	Annotation.TYPE='http://www.w3.org/ns/oa#Annotation';
	Annotation.MOTIVATED_BY='http://www.w3.org/ns/oa#motivatedBy';
	Annotation.ANNOTATED_BY='http://www.w3.org/ns/oa#annotatedBy';
	Annotation.BODY='http://www.w3.org/ns/oa#hasBody';
	Annotation.TARGET='http://www.w3.org/ns/oa#hasTarget';
	Annotation.DATE='http://www.w3.org/ns/oa#annotatedAt';

	Annotation.TEMPLATE={
		"@id": "?",
		"@type": [Annotation.TYPE],
		"http://www.w3.org/ns/oa#motivatedBy": [],
		"http://www.w3.org/ns/oa#hasBody": [],
		"http://www.w3.org/ns/oa#hasTarget": []
	};
	return Annotation;
})();
jsonoa.types.CitationAct=(function CitationAct(){
	CitationAct.TYPE='http://purl.org/spar/cito/CitationAct';
	CitationAct.CITING_ENTITY='http://purl.org/spar/cito/hasCitingEntity';
	CitationAct.CITED_ENTITY='http://purl.org/spar/cito/hasCitedEntity';

	CitationAct.TEMPLATE = {
		"@id":"?",
		"@type":[CitationAct.TYPE],
		"http://purl.org/spar/cito/hasCitationEvent": {"@id":"http://purl.org/spar/cito/citesAsDataSource"},
		"http://purl.org/spar/cito/hasCitedEntity":{"@id":"?"},
		"http://purl.org/spar/cito/hasCitingEntity":{"@id":"?"}
	};
	return CitationAct;
})();
jsonoa.types.Text=(function Text(){
	Text.CONTENT_AS_TEXT = 'http://www.w3.org/2011/content#ContentAsText';
	Text.TEXT = 'http://purl.org/dc/dcmitype/Text';
	Text.TYPE=[Text.TEXT, Text.CONTENT_AS_TEXT];
	Text.CONTENT_CHARS='http://www.w3.org/2011/content#chars';

	Text.TEMPLATE=
	{
		"@id": "?",
		"@type": [
			//Text bodies defined with two types for some reason
			Text.TYPE[0],
			Text.TYPE[1]
		],
		"http://purl.org/dc/elements/1.1/format": "text/plain",
		"http://www.w3.org/2011/content#chars": "?"
	};
	return Text;
})();
jsonoa.types.Person=(function Person(){
	Person.TYPE='http://xmlns.com/foaf/0.1/Person';
	Person.USER_NAME = 'http://xmlns.com/foaf/0.1/accountName';
	Person.FAMILY_NAME = 'http://xmlns.com/foaf/0.1/familyName';
	Person.GIVEN_NAME = 'http://xmlns.com/foaf/0.1/givenName';

	Person.TEMPLATE = {
		"@id":"?",
		"@type":[Person.CITATION_ACT],
		"http://purl.org/spar/cito/hasCitationEvent": {"@id":"http://purl.org/spar/cito/citesAsDataSource"},
		"http://purl.org/spar/cito/hasCitedEntity":{"@id":"?"},
		"http://purl.org/spar/cito/hasCitingEntity":{"@id":"?"}
	};
	return Person;
})();
jsonoa.types.SemanticTag=(function SemanticTag(){
	SemanticTag.TYPE='http://www.w3.org/ns/oa#SemanticTag';
	SemanticTag.PREF_LABEL='http://www.w3.org/2004/02/skos/core#prefLabel';

	SemanticTag.TEMPLATE = {
		"@id": "?",
		"@type": [SemanticTag.TYPE],
		"http://www.w3.org/2004/02/skos/core#prefLabel": "?"
	};
	return SemanticTag;
})();
jsonoa.types.Organization=(function Organization(){
	Organization.TYPE='http://xmlns.com/foaf/0.1/Organization';
	Organization.URI='@id';
	Organization.NAME='http://xmlns.com/foaf/0.1/name';

	Organization.TEMPLATE={
		"@id": "?",
		"@type": Organization.TYPE,
		"http://xmlns.com/foaf/0.1/name": "?"
	};
	return Organization;
})();
jsonoa.types.Dataset=(function Dataset(){
	Dataset.TYPE = 'http://purl.org/dc/dcmitype/Dataset';
        //Dataset.DESC = 'Dataset'; // xxxdesc
        Dataset.TEMPLATE = {"@id": "?", "@type": [Dataset.TYPE]};
	//Dataset.TEMPLATE = {"@id": "?", "@type": [Dataset.TYPE], "@desc": [Dataset.DESC]}; // xxxdesc
	return Dataset;
})();
jsonoa.types.TechnicalReport=(function TechnicalReport(){
	TechnicalReport.TYPE='http://purl.org/spar/fabio/TechnicalReport';
        //TechnicalReport.DESC = 'Technical Report'; // xxxdesc
        TechnicalReport.TEMPLATE = {"@id": "?", "@type": [TechnicalReport.TYPE]};
	//TechnicalReport.TEMPLATE = {"@id": "?", "@type": [TechnicalReport.TYPE], "@desc": [TechnicalReport.DESC]}; // xxxdesc
	return TechnicalReport;
})();
jsonoa.types.DatasetCollection=(function DatasetCollection(){
	DatasetCollection.TYPE='http://purl.org/spar/fabio/MetadataDocument';
	DatasetCollection.TEMPLATE={"@id": "?", "@type": [DatasetCollection.TYPE]};
	return DatasetCollection;
})();
jsonoa.types.DiscoveryMetadata=(function DiscoveryMetadata(){
	DiscoveryMetadata.TYPE='http://purl.org/spar/fabio/MetadataDocument';
	DiscoveryMetadata.TEMPLATE={"@id": "?", "@type": [DiscoveryMetadata.TYPE]};
	return DiscoveryMetadata;
})();
jsonoa.types.BrowseMetadata=(function BrowseMetadata(){
	BrowseMetadata.TYPE='http://purl.org/spar/fabio/MetadataDocument';
	BrowseMetadata.TEMPLATE={"@id": "?", "@type": [BrowseMetadata.TYPE]};
	return BrowseMetadata;
})();
jsonoa.types.ConferencePaper=(function ConferencePaper(){
	ConferencePaper.TYPE='http://purl.org/spar/fabio/ConferencePaper';
	ConferencePaper.TEMPLATE = {"@id": "?", "@type": [ConferencePaper.TYPE]};
	return ConferencePaper;
})();
jsonoa.types.JournalArticle=(function JournalArticle(){
	JournalArticle.TYPE='http://purl.org/spar/fabio/JournalArticle';
	JournalArticle.TEMPLATE={"@id": "?", "@type": [JournalArticle.TYPE]};
	return JournalArticle;
})();
jsonoa.types.Article=(function Article(){
	Article.TYPE='http://purl.org/spar/fabio/Article';
	Article.TEMPLATE={"@id": "?", "@type": [Article.TYPE]};
	return Article;
})();
jsonoa.types.MetadataDocument=(function MetadataDocument(){
	MetadataDocument.TYPE='http://purl.org/spar/fabio/MetadataDocument';
	MetadataDocument.TEMPLATE={"@id": "?", "@type": [MetadataDocument.TYPE]};
	return MetadataDocument;
})();
jsonoa.types.AcademicProceedings=(function AcademicProceedings(){
	AcademicProceedings.TYPE='http://purl.org/spar/fabio/AcademicProceedings';
	AcademicProceedings.TEMPLATE = {"@id": "?", "@type": [AcademicProceedings.TYPE]};
	return AcademicProceedings;
})();
jsonoa.types.Instrument=(function Instrument(){
	Instrument.TYPE='http://blah.org/blah/Instrument';
	Instrument.TEMPLATE = {"@id": "?", "@type": [Instrument.TYPE]};
	return Instrument;
})();
jsonoa.types.Platform=(function Platform(){
	Platform.TYPE='http://blah.org/blah/Platform';
	Platform.TEMPLATE = {"@id": "?", "@type": [Platform.TYPE]};
	return Platform;
})();