//Tests that do not generate any requests to remote sites
module(' Non-network Tests');
	test( "UT-001: Generate web service query for presence of annotations against dataset", function () {
		deepEqual(charme.logic.existRequest('stable'), 'http://charme-dev.cems.rl.ac.uk/index/stable?format=json-ld');
	});
	
	asyncTest( "UT-003: Parse JSON-LD response for listing all nodes", function () {
		var graphSrc = 
			'{																			' +
			'	"@graph": [																' +
			'		{																	' +
			'			"@id": "http://localhost/bodyID",								' +
			'			"@type": [														' +
			'				"http://www.w3.org/2011/content#ContentAsText",				' +
			'				"http://purl.org/dc/dcmitype/Text"							' +
			'			],																' +
			'			"http://purl.org/dc/elements/1.1/format": "text/plain",			' +
			'			"http://www.w3.org/2011/content#chars": "hello there!"			' +
			'		},																	' +
			'		{																	' +
			'			"@id": "http://localhost/annoID",								' +
			'			"@type": "http://www.w3.org/ns/oa#Annotation",					' +
			'			"http://www.w3.org/ns/oa#hasBody": {							' +
			'				"@id": "http://localhost/bodyID"							' +
			'			},																' +
			'			"http://www.w3.org/ns/oa#hasTarget": {							' +
			'				"@id": "http://one.remote.host.io/ca960608.dm3"				' +
			'			},																' +
			'			"http://www.openannotation.org/spec/core/motivatedBy": {		' +
			'				"@id": "http://www.openannotation.org/spec/core/linking"	' +
			'			}																' +
			'		},																	' +
			'		{																	' +
			'			"@id": "http://one.remote.host.io/ca960608.dm3",				' +
			'			"http://purl.org/dc/elements/1.1/format": "html/text"			' +
			'		}																	' +
			'	]																		' +
			'}																			';
		var graph = new jsonoa.types.Graph();
		graph.load(graphSrc).then(function (annoGraph){
			var annotations = annoGraph.getAnnotations();
			equal(annotations.length, 1);
			var anno = annotations[0];
			deepEqual(anno.getValue(anno.ID), 'http://localhost/annoID');
			var body = anno.getValue(anno.BODY);
			ok(body instanceof jsonoa.types.TextBody);
			deepEqual(body.getValue(body.ID), 'http://localhost/bodyID');
			deepEqual(body.getValue(body.CONTENT_CHARS), 'hello there!');
			deepEqual(anno.getValue(anno.MOTIVATED_BY).getValue(anno.ID), 'http://www.openannotation.org/spec/core/linking');
			var target = anno.getValue(anno.TARGET);
			deepEqual(target.getValue(target.ID), 'http://one.remote.host.io/ca960608.dm3');
			start();
		}, function(msg){ok( false, msg ); start();});
	});
	
	asyncTest( "UT-004: Parse JSON-LD response for listing all nodes (second run)", function () {
		var graphSrc = 
			'{ "@graph": [ { "@id": "http://charme-dev.cems.rl.ac.uk/resource/b302b85fdd054db9a7fae83ec7df17d1", "@type": "http://www.w3.org/ns/oa#Annotation", "http://www.w3.org/ns/oa#hasBody": { "@id": "http://charme-dev.cems.rl.ac.uk/resource/dcb638111c094e83a2bfe6888e5d8bfe" }, "http://www.w3.org/ns/oa#hasTarget": { "@id": "http://dx.doi.org/10.1029/00EO00172" } }, { "@id": "http://charme-dev.cems.rl.ac.uk/resource/4bd253eef1cc4dbd8a1fe204e9dd4e30", "@type": "http://www.w3.org/ns/oa#Annotation", "http://www.w3.org/ns/oa#hasBody": { "@id": "http://charme-dev.cems.rl.ac.uk/resource/fdc1cd457b4743c3b670caf94f5531f2" }, "http://www.w3.org/ns/oa#hasTarget": { "@id": "http://dx.doi.org/10.1029/00EO00172" } }, { "@id": "http://charme-dev.cems.rl.ac.uk/resource/9a011320e88c4043a4d344bfe7c6d408", "@type": "http://www.w3.org/ns/oa#Annotation", "http://www.w3.org/ns/oa#hasBody": { "@id": "http://charme-dev.cems.rl.ac.uk/resource/f9aa92e9f98b45ab95867dcb5f5ac4ba" }, "http://www.w3.org/ns/oa#hasTarget": { "@id": "http://dx.doi.org/10.1029/00EO00172" } }, { "@id": "http://charme-dev.cems.rl.ac.uk/resource/a34ec911104443f6af05a06957401aff", "@type": "http://www.w3.org/ns/oa#Annotation", "http://www.w3.org/ns/oa#hasBody": { "@id": "http://charme-dev.cems.rl.ac.uk/resource/fb307faaa2f942d5884ccefca7b167dc" }, "http://www.w3.org/ns/oa#hasTarget": { "@id": "http://dx.doi.org/10.1029/00EO00172" } }, { "@id": "http://charme-dev.cems.rl.ac.uk/resource/a704ff53429a40068f8fb72cdbb62e69", "@type": "http://www.w3.org/ns/oa#Annotation", "http://www.w3.org/ns/oa#hasBody": { "@id": "http://charme-dev.cems.rl.ac.uk/resource/b822aa74f7f94e0d9b18621261721c98" }, "http://www.w3.org/ns/oa#hasTarget": { "@id": "http://dx.doi.org/10.1029/00EO00172" } }, { "@id": "http://charme-dev.cems.rl.ac.uk/resource/0d664faf886c4cc9a665fb128b6d2c93", "@type": "http://www.w3.org/ns/oa#Annotation", "http://www.w3.org/ns/oa#hasBody": { "@id": "http://charme-dev.cems.rl.ac.uk/resource/9bf1ba86f3b445a28c063ea847fda726" }, "http://www.w3.org/ns/oa#hasTarget": { "@id": "http://dx.doi.org/10.1029/00EO00172" } }, { "@id": "http://charme-dev.cems.rl.ac.uk/resource/6e6cde860779494ba716d3d285391532", "@type": "http://www.w3.org/ns/oa#Annotation", "http://www.w3.org/ns/oa#hasBody": { "@id": "http://charme-dev.cems.rl.ac.uk/resource/1b14df2bef85422b851fc34b03525eb6" }, "http://www.w3.org/ns/oa#hasTarget": { "@id": "http://dx.doi.org/10.1029/00EO00172" } } ] }';

		var graph = new jsonoa.types.Graph();
		
		graph.load(graphSrc).then(function(annoGraph){
			var annotations = annoGraph.getAnnotations();
			equal(annotations.length, 7);
			var anno = annoGraph.getNode('http://charme-dev.cems.rl.ac.uk/resource/b302b85fdd054db9a7fae83ec7df17d1');
			deepEqual(anno.getValue(anno.ID), 'http://charme-dev.cems.rl.ac.uk/resource/b302b85fdd054db9a7fae83ec7df17d1');
			var body = anno.getValue(anno.BODY);
			deepEqual(body.getValue(body.ID), 'http://charme-dev.cems.rl.ac.uk/resource/dcb638111c094e83a2bfe6888e5d8bfe');
			var target = anno.getValue(anno.TARGET);
			deepEqual(target.getValue(target.ID), 'http://dx.doi.org/10.1029/00EO00172');
			
			var anno2 = annoGraph.getNode('http://charme-dev.cems.rl.ac.uk/resource/9a011320e88c4043a4d344bfe7c6d408');
			deepEqual(anno2.getValue(anno2.ID), 'http://charme-dev.cems.rl.ac.uk/resource/9a011320e88c4043a4d344bfe7c6d408');
			var body2 = anno2.getValue(anno2.BODY);
			deepEqual(body2.getValue(body2.ID), 'http://charme-dev.cems.rl.ac.uk/resource/f9aa92e9f98b45ab95867dcb5f5ac4ba');
			deepEqual(anno2.getValue(anno2.TARGET).getValue(anno.ID), 'http://dx.doi.org/10.1029/00EO00172');
			
			var anno3 = annoGraph.getNode('http://charme-dev.cems.rl.ac.uk/resource/0d664faf886c4cc9a665fb128b6d2c93');
			deepEqual(anno3.getValue(anno3.ID), 'http://charme-dev.cems.rl.ac.uk/resource/0d664faf886c4cc9a665fb128b6d2c93');
			var body3 = anno3.getValue(anno.BODY);
			deepEqual(body3.getValue(body3.ID), 'http://charme-dev.cems.rl.ac.uk/resource/9bf1ba86f3b445a28c063ea847fda726');
			deepEqual(anno3.getValue(anno3.TARGET).getValue(anno3.ID), 'http://dx.doi.org/10.1029/00EO00172');
			start();
		}, function(msg){ok( false, msg ); start();});
	});
	
	asyncTest( "UT-006: Parse JSON-LD for single free-text metadata", function () {
		var graphSrc =
			'{																						' +
			'		"@graph": [																		' +
			'			{																			' +
			'				"@id": "http://localhost/bodyID",										' +
			'				"@type": [																' +
			'					"http://www.w3.org/2011/content#ContentAsText",						' +
			'					"http://purl.org/dc/dcmitype/Text"									' +
			'				],																		' +
			'				"http://purl.org/dc/elements/1.1/format": "text/plain",					' +
			'				"http://www.w3.org/2011/content#chars": "Basic free text metadata"		' +
			'			},																			' +
			'			{																			' +
			'				"@id": "http://localhost/freeTextAnnoId",								' +
			'				"@type": ["http://www.w3.org/ns/oa#Annotation"],						' +
			'				"http://www.w3.org/ns/oa#hasBody": {									' +
			'					"@id": "http://localhost/bodyID"									' +
			'				},																		' +
			'				"http://www.w3.org/ns/oa#hasTarget": {									' +
			'					"@id": "http://one.remote.host.io/ca960608.dm3"						' +
			'				},																		' +
			'				"http://www.openannotation.org/spec/core/motivatedBy": {				' +
			'					"@id": "http://www.openannotation.org/spec/core/linking"			' +
			'				}																		' +			
			'			},																			' +
			'			{																			' +
			'				"@id": "http://one.remote.host.io/ca960608.dm3",						' +
			'				"http://purl.org/dc/elements/1.1/format": "html/text"					' +
			'			}																			' +
			'		]																				' +
			'}																						';
		var graph = new jsonoa.types.Graph();
		graph.load(graphSrc).then(function(annoGraph){
			var annotations = annoGraph.getAnnotations();
			equal(annotations.length, 1);
			var annotation = annotations[0];
			deepEqual(annotation.getValue(annotation.ID), 'http://localhost/freeTextAnnoId');
			var body = annotation.getValue(annotation.BODY);
			ok(body instanceof jsonoa.types.TextBody);
			deepEqual(body.getValue(body.CONTENT_CHARS), 'Basic free text metadata');
			start();
		}, function(msg){ok( false, msg ); start();});
	});

	asyncTest( "UT-009: Parse JSON-LD response for single citation", function () {
		expect(8);
		var graphSrc = 
				'[																								' +
				'	{																							' +
				'		"@id": "http://charme-dev.cems.rl.ac.uk/resource/302b85fdd054db9a7fae83ec7df17b8",		' +
				'		"@type": "http://www.w3.org/ns/oa#Annotation",											' +
				'		"http://www.w3.org/ns/oa#hasBody": {													' +
				'			"@id": "http://charme-dev.cems.rl.ac.uk/resource/cb638111c094e83a2bfe6888e5d8bff"	' +
				'		},																						' +
				'		"http://www.w3.org/ns/oa#hasTarget": {													' +
				'			"@id": "http://dataprovider.org/datasets/sst"										' +
				'		},																						' +
				'		"http://www.openannotation.org/spec/core/motivatedBy": {								' +
				'			"@id": "http://www.openannotation.org/spec/core/linking"							' +
				'		}																						' +
				'	},																							' + 
				'	{																							' +
				'		"@id": "http://charme-dev.cems.rl.ac.uk/resource/cb638111c094e83a2bfe6888e5d8bff",		' +
				'		"@type": ["http://purl.org/spar/cito/CitationAct"],										' +
				'		"http://purl.org/spar/cito/hasCitationEvent": {											' +
				'			"@id": "http://purl.org/spar/cito/citesAsDataSource"								' +
				'		},																						' +
				'		"http://purl.org/spar/cito/hasCitedEntity": {											' +
				'			"@id": "http://dataprovider.org/datasets/sst"										' +
				'		},																						' +
				'		"http://purl.org/spar/cito/hasCitingEntity": {											' +
				'			"@id": "http://dx.doi.org/12345.678910"												' +
				'		}																						' +
				'	}																							' +
				']																								';
		var graph = new jsonoa.types.Graph();
		graph.load(graphSrc).then(function(annoGraph){
			var annotations = annoGraph.getAnnotations();
			equal(annotations.length, 1);
			var anno = annotations[0];
			deepEqual(anno.getValue(anno.ID), 'http://charme-dev.cems.rl.ac.uk/resource/302b85fdd054db9a7fae83ec7df17b8');
			var body = anno.getValue(anno.BODY);
			ok(body instanceof jsonoa.types.Publication);
			deepEqual(body.getValue(body.ID), 'http://charme-dev.cems.rl.ac.uk/resource/cb638111c094e83a2bfe6888e5d8bff');
			deepEqual(anno.getValue(anno.TARGET).getValue(anno.ID), 'http://dataprovider.org/datasets/sst');
			deepEqual(body.getValue(body.CITED_ENTITY).getValue(body.ID), 'http://dataprovider.org/datasets/sst');
			deepEqual(body.getValue(body.CITING_ENTITY).getValue(body.ID), 'http://dx.doi.org/12345.678910');
			deepEqual(body.getValues(body.TYPE), ['http://purl.org/spar/cito/CitationAct']);
			start();
		}, function(msg){ok( false, msg ); start();});
	});
	
	test( "UT-010: Create a publication annotation and marshall to JSON", function () {
		var jsonSrc = 
			'{"@graph":[																															' +
			'	{																																	' +
			'		"@id":"http://localhost/annoID",																								' +
			'		"@type":["http://www.w3.org/ns/oa#Annotation"],																					' +
			'		"http://www.openannotation.org/spec/core/motivatedBy":{"@id":"http://www.openannotation.org/spec/core/linking"},				' +
			'		"http://www.w3.org/ns/oa#annotatedBy":{"@id":"http://localhost/804eaa65d370"},													' +			
			'		"http://www.w3.org/ns/oa#hasBody":{"@id":"http://localhost/bodyID"},															' +
			'		"http://www.w3.org/ns/oa#hasTarget":{"@id":"http://localhost:8090/DAV/NASA/Chlorophyl/2003/MY1DMM_CHLORA_2003-03.JPEG"}			' +
			'	},																																	' +
			'	{																																	' +
			'		"@id":"http://localhost/bodyID",																								' +
			'		"@type":["http://purl.org/spar/cito/CitationAct"],																				' +
			'		"http://purl.org/spar/cito/hasCitationEvent":{"@id":"http://purl.org/spar/cito/citesAsDataSource"},								' +
			'		"http://purl.org/spar/cito/hasCitedEntity":{"@id":"http://localhost:8090/DAV/NASA/Chlorophyl/2003/MY1DMM_CHLORA_2003-03.JPEG"},	' +
			'		"http://purl.org/spar/cito/hasCitingEntity":{"@id":"http://dx.doi.org/10.1890/13-0133.1"}										' +
			'	},																																	' +
			'	{																																	' +
			'		"@id":"http://localhost/804eaa65d370",																							' +
			'		"@type":["http://xmlns.com/foaf/0.1/Person"],																					' +
			'		"http://xmlns.com/foaf/0.1/mbox":{"@id":"mailto:akhenry@gmail.com"},															' +
			'		"http://xmlns.com/foaf/0.1/name":"Andrew Henry"																					' +
			'	},																																	' +
			'	{																																	' +
			'		"@id":"http://localhost:8090/DAV/NASA/Chlorophyl/2003/MY1DMM_CHLORA_2003-03.JPEG",														' +
			'		"@type": "http://purl.org/dc/dcmitype/Dataset"																					' +
			'	}																																	' +
			']																																		' +
			'}																																		';
		var graph = new jsonoa.types.Graph();
		var anno = graph.createNode(jsonoa.types.Annotation, 'http://localhost/annoID');
		var body = graph.createNode(jsonoa.types.Publication, 'http://localhost/bodyID'); 
		body.setValue(body.CITED_ENTITY, graph.createStub('http://localhost:8090/DAV/NASA/Chlorophyl/2003/MY1DMM_CHLORA_2003-03.JPEG'));
		body.setValue(body.CITING_ENTITY, graph.createStub('http://dx.doi.org/10.1890/13-0133.1'));
		anno.setValue(anno.BODY, body);
		var person = graph.createNode(jsonoa.types.Person, 'http://localhost/804eaa65d370');
		person.setValue(person.MBOX, graph.createStub('mailto:akhenry@gmail.com'));
		anno.setValue(anno.ANNOTATED_BY, person);
		var target = graph.createNode(jsonoa.types.DatasetTarget, 'http://localhost:8090/DAV/NASA/Chlorophyl/2003/MY1DMM_CHLORA_2003-03.JPEG');
		anno.setValue(anno.TARGET, target);
		var graphJSON = graph.toJSON();
		deepEqual(graphJSON.replace(/\s/g,''), jsonSrc.replace(/\s/g,''));
	});
	
	test( "UT-022: Create a text annotation and marshall to JSON", function () {
		var jsonSrc = 
			'{"@graph": [{																				' +
			'	"@id": "http://charme-dev.cems.rl.ac.uk/resource/5b3496263a454e1db06fc5088bb43cf4",		' +
			'	"@type": "http://www.w3.org/ns/oa#Annotation",											' +
			'	"http://www.openannotation.org/spec/core/motivatedBy": {								' +
			'		"@id": "http://www.openannotation.org/spec/core/linking"							' +
			'	},																						' +
			'	"http://www.w3.org/ns/oa#annotatedBy": {},												' +
			'	"http://www.w3.org/ns/oa#hasBody": {													' +
			'		"@id": "http://charme-dev.cems.rl.ac.uk/resource/03e8f39d7e2648729cb0cab6e032c3ce"	' +
			'	},																						' +
			'	"http://www.w3.org/ns/oa#hasTarget": {													' +
			'		"@id": "http://badc.nerc.ac.uk/view/badc.nerc.ac.uk__ATOM__dataent_namblex"			' +
			'	}																						' +
			'},																							' +
			'{																							' +
			'	"@id": "http://charme-dev.cems.rl.ac.uk/resource/03e8f39d7e2648729cb0cab6e032c3ce",		' +
			'	"@type": [																				' +
			'		"http://purl.org/dc/dcmitype/Text",													' +
			'		"http://www.w3.org/2011/content#ContentAsText"										' +
			'	],																						' +
			'	"http://purl.org/dc/elements/1.1/format": "text/plain",									' +
			'	"http://www.w3.org/2011/content#chars": "This is based on Envisat data"					' +
			'},																							' +
			'{																							' +
			'	"@id":"http://badc.nerc.ac.uk/view/badc.nerc.ac.uk__ATOM__dataent_namblex",				' +
			'	"@type": "http://purl.org/dc/dcmitype/Dataset"											' +
			'}																							' +
			']}																							';
		var graph = new jsonoa.types.Graph();
		var anno = graph.createNode(jsonoa.types.Annotation, 'http://charme-dev.cems.rl.ac.uk/resource/5b3496263a454e1db06fc5088bb43cf4');
		var body = graph.createNode(jsonoa.types.TextBody, 'http://charme-dev.cems.rl.ac.uk/resource/03e8f39d7e2648729cb0cab6e032c3ce'); 
		body.setValue(body.CONTENT_CHARS, 'This is based on Envisat data');
		anno.setValue(anno.BODY, body);
		var target = graph.createNode(jsonoa.types.DatasetTarget, 'http://badc.nerc.ac.uk/view/badc.nerc.ac.uk__ATOM__dataent_namblex');
		anno.setValue(anno.TARGET, target);
		var graphJSON = graph.toJSON();
		deepEqual(graphJSON.replace(/\s/g,''), jsonSrc.replace(/\s/g,''));
	});	
	
	test( "UT-024: Parse crossref metadata", function(){
		var xmlDoc = 
			'<?xml version="1.0" encoding="UTF-8"?>												' +
			'<doi_records>																		' +
			'	<doi_record owner="10.1080" timestamp="2011-12-08 13:28:43">					' +
			'	<crossref>																		' +
			'	<journal>																		' +
			'	<journal_metadata language="en">												' +
			'		<full_title>Journal of Aquatic Animal Health</full_title>					' +
			'		<abbrev_title>Journal of Aquatic Animal Health</abbrev_title>				' +
			'		<issn media_type="print">0899-7659</issn>									' +
			'		<issn media_type="electronic">1548-8667</issn>								' +
			'	</journal_metadata>																' +
			'	<journal_issue>																	' +
			'		<publication_date media_type="print">										' +
			'			<month>09</month>														' +
			'			<year>2003</year>														' +
			'		</publication_date>															' +
			'		<journal_volume>															' +
			'			<volume>15</volume>														' +
			'		</journal_volume>															' +
			'		<issue>3</issue>															' +
			'	</journal_issue>																' +
			'	<journal_article publication_type="full_text">									' +
			'		<titles>																	' +
			'			<title>																	' +
			'				Molecular and Phenotypic Characterization of Strains of				' +
			'				<i>Photobacterium damselae</i>										' +
			'				subsp.																' +
			'			<i>piscicida</i>														' +
			'			Isolated from Hybrid Striped Bass Cultured in Louisiana, USA			' +
			'			</title>																' +
			'		</titles>																	' +
			'		<contributors>																' +
			'			<person_name sequence="first" contributor_role="author">				' +
			'				<given_name>John P.</given_name>									' +
			'				<surname>Hawke</surname>											' +
			'			</person_name>															' +
			'			<person_name sequence="additional" contributor_role="author">			' +
			'				<given_name>Ronald L.</given_name>									' +
			'				<surname>Thune</surname>											' +
			'			</person_name>															' +
			'			<person_name sequence="additional" contributor_role="author">			' +
			'				<given_name>Richard K.</given_name>									' +
			'				<surname>Cooper</surname>											' +
			'			</person_name>															' +
			'			<person_name sequence="additional" contributor_role="author">			' +
			'				<given_name>Erika</given_name>										' +
			'				<surname>Judice</surname>											' +
			'			</person_name>															' +
			'			<person_name sequence="additional" contributor_role="author">			' +
			'				<given_name>Maria</given_name>										' +
			'				<surname>Kelly-Smith</surname>										' +
			'			</person_name>															' +
			'		</contributors>																' +
			'		<publication_date media_type="print">										' +
			'			<month>09</month>														' +
			'			<year>2003</year>														' +
			'		</publication_date>															' +
			'		<pages>																		' +
			'			<first_page>189</first_page>											' +
			'			<last_page>201</last_page>												' +
			'		</pages>																	' +
			'		<publisher_item>															' +
			'			<item_number item_number_type="sequence-number">1</item_number>			' +
			'			<identifier id_type="doi">10.1577/H02-043</identifier>					' +
			'		</publisher_item>															' +
			'		<doi_data>																	' +
			'			<doi>10.1577/H02-043</doi>												' +
			'			<resource>http://www.tandfonline.com/doi/abs/10.1577/H02-043</resource>	' +
			'		</doi_data>																	' +
			'	</journal_article>																' +
			'</journal>																			' +
			'</crossref>																		' +
			'</doi_record>																		' +
			'</doi_records>																		';
		var p = new DOMParser();
		//var criteria = {};
		//criteria[charme.logic.constants.CROSSREF_CRITERIA_DOI]='10.1577/H02-043';
		var metadata = new charme.crossref.MetaData(p.parseFromString(xmlDoc, 'application/xml'));
		deepEqual(metadata.authors.length, 5);
		//deepEqual(metadata.title,'Molecular and Phenotypic Characterization of Strains of Photobacterium damselae');
	});
	test( "UT-025: Generate Chicago format citation", function(){

		var metaData = {authors:[{surname: 'Hawke', givenName:'John P.'}, {surname: 'Thune', givenName:'Ronald L.'}, {surname: 'Cooper', givenName:'Richard K.'},{surname: 'Judice', givenName:'Erika'},{surname: 'Kelly-Smith', givenName:'Maria'}], doi: '10.1577/H02-043', title: 'Molecular and Phenotypic Characterization of Strains of Photobacterium damselae subsp. piscicida Isolated from Hybrid Striped Bass Cultured in Louisiana, USA'};
		var cmp = 'Hawke, John P.; Thune, Ronald L.; Cooper, Richard K.; Judice, Erika; Kelly-Smith, Maria. <em>Molecular and Phenotypic Characterization of Strains of Photobacterium damselae subsp. piscicida Isolated from Hybrid Striped Bass Cultured in Louisiana, USA</em>. doi: 10.1577/H02-043';
		var style = '{authors[{surname}, {givenName}](; )}. <em>{title}</em>. doi: {doi}';
		var fmtText = charme.crossref.format(metaData, style);
		deepEqual(fmtText, cmp);
	});
	asyncTest( "UT-026: Parse atom feed", function(){
		expect(6);
		var reqUrl = 'testData/charmetest.atom';
		$.ajax({
			url: reqUrl
		}).then(
			function(xmlResp){
				var result = new charme.atom.result(xmlResp);
				deepEqual(result.id, 'http://charme-dev.cems.rl.ac.uk:8027/searchatom');
				deepEqual(result.first.href, 'http://charme-dev.cems.rl.ac.uk:8027/search/atom/?&startIndex=1&status=submitted');
				deepEqual(result.next.href, 'http://charme-dev.cems.rl.ac.uk:8027/search/atom/?&startIndex=11&status=submitted');
				deepEqual(result.previous.href, 'http://charme-dev.cems.rl.ac.uk:8027/search/atom/?&startIndex=1&status=submitted');
				deepEqual(result.last.href, 'http://charme-dev.cems.rl.ac.uk:8027/search/atom/?&startIndex=181&status=submitted');
				equal(result.entries.length, 10);
				start();
			}, function(e){
				ok( false, e );
				start();
		});
	});
	asyncTest( "UT-027: Parse annotation from atom feed", function(){
		expect(13);
		var reqUrl = 'testData/simpleatomtest.atom';
		$.ajax({
			url: reqUrl
		}).then(
			function(xmlResp){
				var result = new charme.atom.result(xmlResp);
				deepEqual(result.id, 'http://charme-dev.cems.rl.ac.uk:8027/searchatom');
				deepEqual(result.first.href, 'http://charme-dev.cems.rl.ac.uk:8027/search/atom/?&startIndex=1&status=submitted');
				deepEqual(result.next.href, 'http://charme-dev.cems.rl.ac.uk:8027/search/atom/?&startIndex=11&status=submitted');
				deepEqual(result.previous.href, 'http://charme-dev.cems.rl.ac.uk:8027/search/atom/?&startIndex=1&status=submitted');
				deepEqual(result.last.href, 'http://charme-dev.cems.rl.ac.uk:8027/search/atom/?&startIndex=181&status=submitted');
				equal(result.entries.length, 1);
				var firstEntry = result.entries[0]; // Read first annotation
				var content = firstEntry.content;
				var graph = new jsonoa.types.Graph();
				graph.load(content).then(function(annoGraph){
					var annotations = annoGraph.getAnnotations();
					equal(annotations.length, 1);
					var anno = annotations[0]; 
					deepEqual(anno.getValue(anno.ID), 'http://charme-dev.cems.rl.ac.uk/resource/5e5d38442a7945f889f3afe1ed0ce7b1');
					var body = anno.getValue(anno.BODY);
					ok(body instanceof jsonoa.types.TextBody);
					deepEqual(body.getValue(body.ID), 'http://charme-dev.cems.rl.ac.uk/resource/c9379314d849485095c89241ca3ca49c');
					var target = anno.getValue(anno.TARGET);
					deepEqual(target.getValue(target.ID), 'http://localhost:8090/DAV/NASA/Chlorophyl/2002/MY1DMM_CHLORA_2002-10.JPEG');
					deepEqual(anno.getValue(anno.TYPE), 'http://www.w3.org/ns/oa#Annotation');
					deepEqual(anno.getValues(anno.TYPE), ['http://www.w3.org/ns/oa#Annotation']);
					start();
				});
				
			}, function(e){																		
				ok( false, e );
				start();
		});
	});	
//Tests that require a remote site
//module('Network Tests');
/*	asyncTest( 'UT-002: Generate request for presence of annotations, and receive non-error response', function () {
		var successCB = function(){
			ok(true, 'Success');
			start();
		};
		var failCB = function(resp, status, err){
			ok(false, 'Failed');
			start();
		};
		charme.logic.exists('submitted', successCB, failCB);
	});*/