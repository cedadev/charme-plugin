module(' JSON Open Annotations Tests');
	test( "UT-JOA-001: Create a text annotation and marshall to JSON", function () {
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
		anno.setValue(anno.TYPE, 'http://www.w3.org/ns/oa#Annotation');
		var body = graph.createNode(jsonoa.types.TextBody, 'http://charme-dev.cems.rl.ac.uk/resource/03e8f39d7e2648729cb0cab6e032c3ce'); 
		body.setValue(body.CONTENT_CHARS, 'This is based on Envisat data');
		anno.setValue(anno.BODY, body);
		var target = graph.createNode(jsonoa.types.DatasetTarget, 'http://badc.nerc.ac.uk/view/badc.nerc.ac.uk__ATOM__dataent_namblex');
		anno.setValue(anno.TARGET, target);
		var graphJSON = graph.toJSON();
		deepEqual(graphJSON.replace(/\s/g,''), jsonSrc.replace(/\s/g,''));
	});	
	asyncTest( "UT-JOA-002: Parse a Simple Text Annotation JSON-LD graph", function () {
		var jsonSrc = 
			'{"@graph": [{																				' +
			'	"@id": "http://charme-dev.cems.rl.ac.uk/resource/5b3496263a454e1db06fc5088bb43cf4",		' +
			'	"@type": "http://www.w3.org/ns/oa#Annotation",											' +
			'	"http://www.openannotation.org/spec/core/motivatedBy": {								' +
			'		"@id": "http://www.openannotation.org/spec/core/linking"							' +
			'	},																						' +
			'	"http://www.w3.org/ns/oa#annotatedBy": {												' +
			'		"@id": "http://charme-dev.cems.rl.ac.uk/personID"									' +
			'	},																						' +
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
			'}]}																						';
		var graph = new jsonoa.types.Graph();
		
		graph.load(jsonSrc).then(function(result){
			var annos = result.getAnnotations();
			deepEqual(annos.length, 1);
			var anno = annos[0];
			var body = anno.getValue(anno.BODY);
			deepEqual(body instanceof jsonoa.types.TextBody, true);
			deepEqual(body.getValue(body.CONTENT_CHARS), 'This is based on Envisat data');
			start();
		});
	});
	test( "UT-JOA-003: Create a publication annotation and marshall to JSON", function () {
		var jsonSrc = 
			'{"@graph":[																															' +
			'	{																																	' +
			'		"@id":"http://localhost/annoID",																								' +
			'		"@type":["http://www.w3.org/ns/oa#Annotation"],																					' +
			'		"http://www.w3.org/ns/oa#hasBody":{"@id":"http://localhost/bodyID"},															' +
			'		"http://www.w3.org/ns/oa#hasTarget":{"@id":"http://localhost:8090/DAV/NASA/Chlorophyl/2003/MY1DMM_CHLORA_2003-03.JPEG"},		' +
			'		"http://www.openannotation.org/spec/core/motivatedBy":{"@id":"http://www.openannotation.org/spec/core/linking"},				' +
			'		"http://www.w3.org/ns/oa#annotatedBy":{"@id":"http://localhost/804eaa65d370"}													' +
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
		anno.setValue(anno.TYPE, 'http://www.w3.org/ns/oa#Annotation');
		var body = graph.createNode(jsonoa.types.PublicationBody, 'http://localhost/bodyID'); 
		body.setValue(body.CITED_ENTITY, 'http://localhost:8090/DAV/NASA/Chlorophyl/2003/MY1DMM_CHLORA_2003-03.JPEG');
		body.setValue(body.CITING_ENTITY, 'http://dx.doi.org/10.1890/13-0133.1');
		anno.setValue(anno.BODY, body);
		var person = graph.createNode(jsonoa.types.Person, 'http://localhost/804eaa65d370');
		person.setValue(person.MBOX, jsonoa.types.createStub('mailto:akhenry@gmail.com'));
		var target = graph.createNode(jsonoa.types.DatasetTarget, 'http://localhost:8090/DAV/NASA/Chlorophyl/2003/MY1DMM_CHLORA_2003-03.JPEG');
		anno.setValue(anno.TARGET, target);
		var graphJSON = graph.toJSON();
		deepEqual(graphJSON.replace(/\s/g,''), jsonSrc.replace(/\s/g,''));
	});
	asyncTest( "UT-JOA-004: Parse a Simple Publication Annotation JSON-LD graph", function () {
		var jsonSrc = 
			'{"@graph": [{																				' +
			'	"@id": "http://charme-dev.cems.rl.ac.uk/resource/5b3496263a454e1db06fc5088bb43cf4",		' +
			'	"@type": "http://www.w3.org/ns/oa#Annotation",											' +
			'	"http://www.openannotation.org/spec/core/motivatedBy": {								' +
			'		"@id": "http://www.openannotation.org/spec/core/linking"							' +
			'	},																						' +
			'	"http://www.w3.org/ns/oa#annotatedBy": {												' +
			'		"@id": "http://charme-dev.cems.rl.ac.uk/personID"									' +
			'	},																						' +
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
			'}]}																						';
		var graph = new jsonoa.types.Graph();
		
		graph.load(jsonSrc).then(function(result){
			var annos = result.getAnnotations();
			deepEqual(annos.length, 1);
			var anno = annos[0];
			var body = anno.getValue(anno.BODY);
			deepEqual(body instanceof jsonoa.types.TextBody, true);
			deepEqual(body.getValue(body.CONTENT_CHARS), 'This is based on Envisat data');
			start();
		});
	});	
	test( "UT-JOA-005: Test template checking", function () {
		var graph = new jsonoa.types.Graph();
		var anno = graph.createNode(jsonoa.types.Annotation, 'http://localhost/annoID');
		try {
			anno.setValue(anno.TYPE, 'http://www.w3.org/ns/oa#Annotation');
			ok(false, "Template enforcement failed");
		} catch(e){
			ok(true, "Template enforcement succeeded");
		}
		
		var target = graph.createNode(jsonoa.types.DatasetTarget, 'http://localhost:8090/DAV/NASA/Chlorophyl/2003/MY1DMM_CHLORA_2003-03.JPEG');
		anno.setValue(anno.TARGET, target);
		var body = graph.createNode(jsonoa.types.Publication, 'http://localhost/bodyID'); 
		body.setValue(body.CITED_ENTITY, target);
		body.setValue(body.CITING_ENTITY, jsonoa.types.createStub('http://dx.doi.org/10.1890/13-0133.1'));
		anno.setValue(anno.BODY, body);
		var person = graph.createNode(jsonoa.types.Person, 'http://localhost/804eaa65d370');
		try {
			person.setValue(person.MBOX, 'mailto:akhenry@gmail.com');
			ok(false, "Type enforcement failed");
		} catch(e){
			ok(true, "Type enforcement succeeded");
		}
	});