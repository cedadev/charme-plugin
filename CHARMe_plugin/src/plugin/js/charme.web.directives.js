charme.web.app.
	directive('domainKeywords', ['fetchKeywords', function(fetchKeywords){
	return {restrict: 'A',
		link: function($scope, element, attrs){
			fetchKeywords().then(
				function(categories){
					$scope.$apply(function(){
						var optgroups = [];
						var options = [];
						angular.forEach(categories, function(cat, key){
							optgroups.push({value: cat.name, label: cat.name + ' Keywords'});
							angular.forEach(cat.keywords, function(kword, innerKey){
								options.push({text: kword.desc, value: kword.uri, optgroup: cat.name});
							});
						});
						$(element).selectize({
							persist: false,
							options: options,
							optgroups: optgroups
						});
					});
				},
				function(error){
					$scope.$apply(function(){
						$scope.errorMsg='Error: ' + error;
					});
				}
			);
		},
	};
}]);