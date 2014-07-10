charme.web.app.directive('domainKeywords', ['fetchKeywords', function (fetchKeywords) {
		return {
			restrict: 'A',
			require: '?ngModel',
			link: function ($scope, element, attrs, $ngModel) {
				fetchKeywords().then(function (categories) {
						$scope.$apply(function () {
							var optgroups = [];
							var options = [];
							angular.forEach(categories, function (cat) {
								optgroups.push({value: cat.name, label: cat.name + ' Keywords'});
								angular.forEach(cat.keywords, function (kword) {
									options.push({text: kword.desc, value: kword.uri, optgroup: cat.name});
								});
							});
							var el = $(element).selectize({
								persist: false,
								options: options,
								optgroups: optgroups
							})[0].selectize;

							function applyChange() {
								var selectedOptions = [];
								var values = el.getValue();
								angular.forEach(options, function (option) {
									if (values.indexOf(option.value) >= 0) {
										selectedOptions.push(option);
									}
								});
								$ngModel.$setViewValue(selectedOptions);
							};
							el.on('change', function () {
								$scope.$apply(applyChange);
							});

							//Load initial values
							if ($ngModel.$modelValue instanceof Array){
								angular.forEach($ngModel.$modelValue, function(value){
									el.addItem(value.value);
								})
							}

						});
					}, function (error) {
						$scope.$apply(function () {
							$scope.errorMsg = 'Error: ' + error;
						});
					});
			},
		};
	}]).directive('motivationKeywords', ['fetchAllMotivations', function (fetchAllMotivations) {
		return {
			restrict: 'A',
			require: '?ngModel',
			link: function ($scope, element, attrs, $ngModel) {
				fetchAllMotivations().then(function (categories) {
						$scope.$apply(function () {
							var optgroups = [];
							var options = [];
							angular.forEach(categories, function (cat) {
								optgroups.push({value: cat.name, label: cat.name + ' Keywords'});
								angular.forEach(cat.keywords, function (kword) {
									options.push({text: kword.desc, value: kword.uri, optgroup: cat.name});
								});
							});
							var el = $(element).selectize({
								persist: false,
								options: options,
								optgroups: optgroups
							})[0].selectize;

                            function applyChange() {
								var selectedOptions = [];
								var values = el.getValue();
								angular.forEach(options, function (option) {
									if (values.indexOf(option.value) >= 0) {
										selectedOptions.push(option);
									}
								});
								$ngModel.$setViewValue(selectedOptions);
							};
							el.on('change', function () {
								$scope.$apply(applyChange);
							});

							//Load initial values
							if ($ngModel.$modelValue instanceof Array){
								angular.forEach($ngModel.$modelValue, function(value){
									el.addItem(value.value);
								})
							}

						});
					}, function (error) {
						$scope.$apply(function () {
							$scope.errorMsg = 'Error: ' + error;
						});
					});
			},
		};
	}]).directive('charmeCito', ['fetchFabioTypes', function (fetchFabioTypes) {
		return {
			restrict: 'A',
			require: '?ngModel',
			link: function ($scope, element, attrs, $ngModel) {
				fetchFabioTypes().then(function (types) {
						$scope.$apply(function () {
							var options = [];
							angular.forEach(types, function (type, innerKey) {
								options.push({text: type.label, value: type.resource});
							});
							var el = $(element).selectize({
								persist: false,
								options: options,
								onInitialize: applyChange
							});

							function applyChange() {
								$ngModel.$setViewValue(element[0].value);
							};
							el.on('change', function (event) {
								$scope.$apply(applyChange);
							});

						});
					}, function (error) {
						$scope.$apply(function () {
							$scope.errorMsg = 'Error: ' + error;
						});
					});
			},
		};
	}]).directive('charmeSelect', function () {
		return {
			restrict: 'A',
			require: '?ngModel',
			link: function ($scope, element, attrs, $ngModel) {
				var el = $(element).selectize({
					persist: false,
					onInitialize: applyChange
				});

				function applyChange() {
					$ngModel.$setViewValue(element[0].value);
				};
				el.on('change', function (event) {
					$scope.$apply(applyChange);
				});

			},
		};
	});
