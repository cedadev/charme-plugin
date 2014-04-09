charme.web.app.
	directive('domainKeywords', ['fetchKeywords', function(fetchKeywords){
	return {
		restrict: 'A',
		require: '?ngModel',
		link: function($scope, element, attrs, $ngModel){
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
						var el = $(element).selectize({
							persist: false,
							options: options,
							optgroups: optgroups
						})[0].selectize;
						function applyChange(){
							$ngModel.$setViewValue(el.getValue());
						};
						el.on('change', function(){$scope.$apply(applyChange);});
						
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
}]).directive('charmeCito', ['fetchFabioTypes', function(fetchFabioTypes){
	return {
		restrict: 'A',
		require: '?ngModel',
		link: function($scope, element, attrs, $ngModel){
			fetchFabioTypes().then(
				function(types){
					$scope.$apply(function(){
						var options = [];
						angular.forEach(types, function(type, innerKey){
							options.push({text: type.label, value: type.resource});
						});
						var el = $(element).selectize({
							persist: false,
							options: options,
							onInitialize: applyChange
						});
						function applyChange(){
							$ngModel.$setViewValue(element[0].value);
						};
						el.on('change', function(event){$scope.$apply(applyChange);});
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
}]).directive('charmeSelect', function(){
	return {
		restrict: 'A',
		require: '?ngModel',
		link: function($scope, element, attrs, $ngModel){
			var el = $(element).selectize({
				persist: false,
				onInitialize: applyChange
			});
			function applyChange(){
				$ngModel.$setViewValue(element[0].value);
			};
			el.on('change', function(event){$scope.$apply(applyChange);});

		},
	};
});