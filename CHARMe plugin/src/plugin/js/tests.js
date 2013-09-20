//Tests that do not generate any requests to remote sites
module(' Non-network Tests');
	test( "UT-001: Generate web service query for presence of annotations against dataset", function () {
		deepEqual(charme.logic.existRequest('stable'), 'http://charme-dev.cems.rl.ac.uk/index/stable?format=json-ld');
	});
	
	asyncTest( "UT-003: Parse JSON-LD response for listing all nodes", function () {
		var graphSrc = 
			'{                                                                                     ' +
			'	  "@graph": [                                                                      ' +
			'	              {                                                                    ' +
			'	               "@id": "http://localhost/bodyID",                                   ' +
			'	               "@type": [                                                          ' +
			'	                        "http://www.w3.org/2011/content#ContentAsText",            ' +
			'	                        "http://purl.org/dc/dcmitype/Text"                         ' +
			'	                        ],                                                         ' +
			'	                "http://purl.org/dc/elements/1.1/format": "text/plain",            ' +
			'	                "http://www.w3.org/2011/content#chars": "hello there!"             ' +
			'	               },                                                                  ' +
			'	               {                                                                   ' +
			'	                "@id": "http://localhost/annoID",                                  ' +
			'	                "@type": "http://www.w3.org/ns/oa#Annotation",                     ' +
			'	                "http://www.w3.org/ns/oa#hasBody": {                               ' +
			'	                   "@id": "http://localhost/bodyID"                                ' +
			'	                 },                                                                ' +
			'	                 "http://www.w3.org/ns/oa#hasTarget": {                            ' +
			'	                   "@id": "http://one.remote.host.io/ca960608.dm3"                 ' +
			'	                 }                                                                 ' +
			'	                },                                                                 ' +
			'	                {                                                                  ' +
			'	                 "@id": "http://one.remote.host.io/ca960608.dm3",                  ' +
			'	                 "http://purl.org/dc/elements/1.1/format": "html/text"             ' +
			'	                }                                                                  ' +
			'	              ]                                                                    ' +
			'}                                                                                     ';
		var graphObj = $.parseJSON(graphSrc);
		
		OA.deserialize(graphObj).then(function(annoGraph){
			equal(annoGraph.annotations.length, 1);
			deepEqual(annoGraph.annotations[0].getId(), 'http://localhost/annoID');
			deepEqual(annoGraph.annotations[0].body.getId(), 'http://localhost/bodyID');
			deepEqual(annoGraph.annotations[0].body.text, 'hello there!');
			deepEqual(annoGraph.annotations[0].target.getId(), 'http://one.remote.host.io/ca960608.dm3');
			start();
		}, function(msg){ok( false, msg ); start();});
	});
	
	asyncTest( "UT-003: Parse JSON-LD response for listing all nodes (second run)", function () {
		var graphSrc = 
			'{ "@graph": [ { "@id": "http://charme-dev.cems.rl.ac.uk/resource/b302b85fdd054db9a7fae83ec7df17d1", "@type": "http://www.w3.org/ns/oa#Annotation", "http://www.w3.org/ns/oa#hasBody": { "@id": "http://charme-dev.cems.rl.ac.uk/resource/dcb638111c094e83a2bfe6888e5d8bfe" }, "http://www.w3.org/ns/oa#hasTarget": { "@id": "http://dx.doi.org/10.1029/00EO00172" } }, { "@id": "http://charme-dev.cems.rl.ac.uk/resource/4bd253eef1cc4dbd8a1fe204e9dd4e30", "@type": "http://www.w3.org/ns/oa#Annotation", "http://www.w3.org/ns/oa#hasBody": { "@id": "http://charme-dev.cems.rl.ac.uk/resource/fdc1cd457b4743c3b670caf94f5531f2" }, "http://www.w3.org/ns/oa#hasTarget": { "@id": "http://dx.doi.org/10.1029/00EO00172" } }, { "@id": "http://charme-dev.cems.rl.ac.uk/resource/9a011320e88c4043a4d344bfe7c6d408", "@type": "http://www.w3.org/ns/oa#Annotation", "http://www.w3.org/ns/oa#hasBody": { "@id": "http://charme-dev.cems.rl.ac.uk/resource/f9aa92e9f98b45ab95867dcb5f5ac4ba" }, "http://www.w3.org/ns/oa#hasTarget": { "@id": "http://dx.doi.org/10.1029/00EO00172" } }, { "@id": "http://charme-dev.cems.rl.ac.uk/resource/a34ec911104443f6af05a06957401aff", "@type": "http://www.w3.org/ns/oa#Annotation", "http://www.w3.org/ns/oa#hasBody": { "@id": "http://charme-dev.cems.rl.ac.uk/resource/fb307faaa2f942d5884ccefca7b167dc" }, "http://www.w3.org/ns/oa#hasTarget": { "@id": "http://dx.doi.org/10.1029/00EO00172" } }, { "@id": "http://charme-dev.cems.rl.ac.uk/resource/a704ff53429a40068f8fb72cdbb62e69", "@type": "http://www.w3.org/ns/oa#Annotation", "http://www.w3.org/ns/oa#hasBody": { "@id": "http://charme-dev.cems.rl.ac.uk/resource/b822aa74f7f94e0d9b18621261721c98" }, "http://www.w3.org/ns/oa#hasTarget": { "@id": "http://dx.doi.org/10.1029/00EO00172" } }, { "@id": "http://charme-dev.cems.rl.ac.uk/resource/0d664faf886c4cc9a665fb128b6d2c93", "@type": "http://www.w3.org/ns/oa#Annotation", "http://www.w3.org/ns/oa#hasBody": { "@id": "http://charme-dev.cems.rl.ac.uk/resource/9bf1ba86f3b445a28c063ea847fda726" }, "http://www.w3.org/ns/oa#hasTarget": { "@id": "http://dx.doi.org/10.1029/00EO00172" } }, { "@id": "http://charme-dev.cems.rl.ac.uk/resource/6e6cde860779494ba716d3d285391532", "@type": "http://www.w3.org/ns/oa#Annotation", "http://www.w3.org/ns/oa#hasBody": { "@id": "http://charme-dev.cems.rl.ac.uk/resource/1b14df2bef85422b851fc34b03525eb6" }, "http://www.w3.org/ns/oa#hasTarget": { "@id": "http://dx.doi.org/10.1029/00EO00172" } } ] }';
		var graphObj = $.parseJSON(graphSrc);
		
		annoGraph = OA.deserialize(graphObj).then(function(annoGraph){
			equal(annoGraph.annotations.length, 7);
			deepEqual(annoGraph.annotations[0].getId(), 'http://charme-dev.cems.rl.ac.uk/resource/b302b85fdd054db9a7fae83ec7df17d1');
			deepEqual(annoGraph.annotations[0].body.getId(), 'http://charme-dev.cems.rl.ac.uk/resource/dcb638111c094e83a2bfe6888e5d8bfe');
			deepEqual(annoGraph.annotations[0].target.getId(), 'http://dx.doi.org/10.1029/00EO00172');
			deepEqual(annoGraph.annotations[2].getId(), 'http://charme-dev.cems.rl.ac.uk/resource/9a011320e88c4043a4d344bfe7c6d408');
			deepEqual(annoGraph.annotations[2].body.getId(), 'http://charme-dev.cems.rl.ac.uk/resource/f9aa92e9f98b45ab95867dcb5f5ac4ba');
			deepEqual(annoGraph.annotations[2].target.getId(), 'http://dx.doi.org/10.1029/00EO00172');
			deepEqual(annoGraph.annotations[5].getId(), 'http://charme-dev.cems.rl.ac.uk/resource/0d664faf886c4cc9a665fb128b6d2c93');
			deepEqual(annoGraph.annotations[5].body.getId(), 'http://charme-dev.cems.rl.ac.uk/resource/9bf1ba86f3b445a28c063ea847fda726');
			deepEqual(annoGraph.annotations[5].target.getId(), 'http://dx.doi.org/10.1029/00EO00172');
			start();
		}, function(msg){ok( false, msg ); start();});
	});
	
	asyncTest( "UT-006: Parse JSON-LD for single free-text metadata", function () {
		var graphSrc =
			'{                                                                                     ' +
			'	  "@graph": [                                                                      ' +
			'	              {                                                                    ' +
			'	               "@id": "http://localhost/bodyID",                                   ' +
			'	               "@type": [                                                          ' +
			'	                        "http://www.w3.org/2011/content#ContentAsText",            ' +
			'	                        "http://purl.org/dc/dcmitype/Text"                         ' +
			'	                        ],                                                         ' +
			'	                "http://purl.org/dc/elements/1.1/format": "text/plain",            ' +
			'	                "http://www.w3.org/2011/content#chars": "Basic free text metadata" ' +
			'	               },                                                                  ' +
			'	               {                                                                   ' +
			'	                "@id": "http://localhost/freeTextAnnoId",                          ' +
			'	                "@type": ["http://www.w3.org/ns/oa#Annotation"],                   ' +
			'	                "http://www.w3.org/ns/oa#hasBody": {                               ' +
			'	                   "@id": "http://localhost/bodyID"                                ' +
			'	                 },                                                                ' +
			'	                 "http://www.w3.org/ns/oa#hasTarget": {                            ' +
			'	                   "@id": "http://one.remote.host.io/ca960608.dm3"                 ' +
			'	                 }                                                                 ' +
			'	                },                                                                 ' +
			'	                {                                                                  ' +
			'	                 "@id": "http://one.remote.host.io/ca960608.dm3",                  ' +
			'	                 "http://purl.org/dc/elements/1.1/format": "html/text"             ' +
			'	                }                                                                  ' +
			'	              ]                                                                    ' +
			'}                                                                                     ';
		var graphObj = $.parseJSON(graphSrc);
		OA.deserialize(graphObj).then(function(annoGraph){
			equal(annoGraph.annotations.length, 1);
			deepEqual(annoGraph.annotations[0].getId(), 'http://localhost/freeTextAnnoId');
			deepEqual(annoGraph.annotations[0].body.text, 'Basic free text metadata');
			start();
		}, function(msg){ok( false, msg ); start();});
	});

	asyncTest( "UT-009: Parse JSON-LD response for single citation", function () {
		expect(7);
		var graphSrc = 
				'[{                                                                                       ' +
				'	  "@id": "http://charme-dev.cems.rl.ac.uk/resource/302b85fdd054db9a7fae83ec7df17b8",  ' +
				'	  "@type": "http://www.w3.org/ns/oa#Annotation",                                      ' +
				'	  "http://www.w3.org/ns/oa#hasBody": {                                                ' +
				'	    "@id": "http://charme-dev.cems.rl.ac.uk/resource/cb638111c094e83a2bfe6888e5d8bff" ' +
				'	  },                                                                                  ' +
				'	  "http://www.w3.org/ns/oa#hasTarget": {                                              ' +
				'	    "@id": "http://dataprovider.org/datasets/sst"                                     ' +
				'	  }                                                                                   ' +
				'	}, {                                                                                  ' +
				'	  "@id": "http://charme-dev.cems.rl.ac.uk/resource/cb638111c094e83a2bfe6888e5d8bff",  ' +
				'	  "@type": ["http://purl.org/spar/cito/CitationAct"],                                 ' +
				'	  "http://purl.org/spar/cito/hasCitationEvent": {                                     ' +
				'	    "@id": "http://purl.org/spar/cito/citesAsDataSource"                              ' +
				'	  },                                                                                  ' +
				'	  "http://purl.org/spar/cito/hasCitedEntity": {                                       ' +
				'	    "@id": "http://dataprovider.org/datasets/sst"                                     ' +
				'	  },                                                                                  ' +
				'	  "http://purl.org/spar/cito/hasCitingEntity": {                                      ' +
				'	    "@id": "http://dx.doi.org/12345.678910"                                           ' +
				'	  }                                                                                   ' +
				'	}]                                                                                    ';
		graphObj = $.parseJSON(graphSrc);
		OA.deserialize(graphObj).then(function(annoGraph){
			equal(annoGraph.annotations.length, 1);
			deepEqual(annoGraph.annotations[0].getId(), 'http://charme-dev.cems.rl.ac.uk/resource/302b85fdd054db9a7fae83ec7df17b8');
			deepEqual(annoGraph.annotations[0].body.getId(), 'http://charme-dev.cems.rl.ac.uk/resource/cb638111c094e83a2bfe6888e5d8bff');
			deepEqual(annoGraph.annotations[0].target.getId(), 'http://dataprovider.org/datasets/sst');
			deepEqual(annoGraph.annotations[0].body.citedEntity, 'http://dataprovider.org/datasets/sst');
			deepEqual(annoGraph.annotations[0].body.citingEntity, 'http://dx.doi.org/12345.678910');
			deepEqual(annoGraph.annotations[0].body.types, ['http://purl.org/spar/cito/CitationAct']);
			start();
		}, function(msg){ok( false, msg ); start();});
	});
	
	test( "UT-010: Create JSON-LD payload for new citation creation", function() {
		var jsonComp = 
			'[{                                                                                       ' +
			'	  "@id": "http://localhost/annoID",                                                   ' +
			'	  "@type": ["http://www.w3.org/ns/oa#Annotation"],                                    ' +
			'	  "http://www.w3.org/ns/oa#hasBody": {                                                ' +
			'	    "@id": "http://localhost/bodyID"                                                  ' +
			'	  },                                                                                  ' +
			'	  "http://www.w3.org/ns/oa#hasTarget": {                                              ' +
			'	    "@id": "http://dataprovider.org/datasets/sst"                                     ' +
			'	  }                                                                                   ' +
			'  },                                                                                     ' +
			'  {                                                                                      ' +
			'	  "@id": "http://localhost/bodyID",                                                   ' +
			'	  "@type": ["http://purl.org/spar/cito/CitationAct"],                                 ' +
			'	  "http://purl.org/spar/cito/hasCitationEvent": {                                     ' +
			'	    "@id": "http://purl.org/spar/cito/citesAsDataSource"                              ' +
			'	  },                                                                                  ' +
			'	  "http://purl.org/spar/cito/hasCitedEntity": {                                       ' +
			'	    "@id": "http://dataprovider.org/datasets/sst"                                     ' +
			'	  },                                                                                  ' +
			'	  "http://purl.org/spar/cito/hasCitingEntity": {                                      ' +
			'	    "@id": "http://dx.doi.org/12345.678910"                                           ' +
			'	  }                                                                                   ' +
			'  }]                                                                                     ';

		var newAnno = new OA.OAnnotation();
		newAnno.setId('http://localhost/annoID');
		
		var newBody = new OA.OARefBody();
		newBody.setId('http://localhost/bodyID');
		newBody.citedEntity='http://dataprovider.org/datasets/sst';
		newBody.citingEntity='http://dx.doi.org/12345.678910';
		newAnno.body = newBody;
		
		var newTarget = new OA.OATarget();
		newTarget.setId('http://dataprovider.org/datasets/sst');
		newAnno.target = newTarget;
		
		var annoSrc = JSON.stringify(newAnno.serialize());
		deepEqual(annoSrc.replace(/[\s\t]/g,''), jsonComp.replace(/[\s\t]/g,''));
		
	});
	
	test( "UT-022: Generate valid JSON-LD payload for text annotation", function(){
		var jsonComp = '[{"@id":"http://localhost/resource/1a71a7783f10","@type":["http://www.w3.org/ns/oa#Annotation"],"http://www.w3.org/ns/oa#hasBody":{"@id":"http://localhost/resource/9966bc8bb5d1"},"http://www.w3.org/ns/oa#hasTarget":{"@id":"http://ericleads.com/h5validate/"}},{"@id":"http://localhost/resource/9966bc8bb5d1","@type":["http://www.w3.org/2011/content#ContentAsText","http://purl.org/dc/dcmitype/Text"],"http://purl.org/dc/elements/1.1/format":"text/plain","http://www.w3.org/2011/content#chars":"Some text here"}]';
		
		var newAnno = new OA.OAnnotation();
		newAnno.setId('http://localhost/resource/1a71a7783f10');
		
		var newBody = OA.createTextBody();
		newBody.setId('http://localhost/resource/9966bc8bb5d1');
		newBody.text='Some text here';
		newAnno.body = newBody;
		
		var newTarget = new OA.OATarget();
		newTarget.setId('http://ericleads.com/h5validate/');
		newAnno.target=newTarget;
		
		var annoSrc = JSON.stringify(newAnno.serialize());
		deepEqual(annoSrc, jsonComp);
	});

//Tests that require a remote site
module('Network Tests');
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