charme.web.app.directive('domainKeywords', function ($timeout) {
		return {
			restrict: 'A',
			require: '?ngModel',
                        scope: {keywordsToShow: '@'},
			link: function ($scope, element, attrs, $ngModel) {
                            $scope.$on($scope.keywordsToShow, function(event, categories){
                                var optgroups = [];
                                var options = [];
                                angular.forEach(categories, function (cat) {
                                        optgroups.push({value: cat.name, label: cat.name + ' Keywords'});
                                        angular.forEach(cat.keywords, function (kword) {
                                                if(kword.hasOwnProperty('desc')) {
                                                    options.push({text: kword.desc, value: kword.uri, optgroup: cat.name});
                                                }
                                                else if(kword.hasOwnProperty('label')) {
                                                    if(kword.label instanceof Array)
                                                        options.push({text: kword.label[0], value: kword.uri, optgroup: cat.name});
                                                    else
                                                        options.push({text: kword.label, value: kword.uri, optgroup: cat.name});
                                                }
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
                                    $timeout(function() {
                                        $scope.$apply(applyChange);
                                    });
                                });
                                
                                $scope.$on('newDomains', function(event, newDomains) {
                                    // $timeout used to avoid 'apply already in progress' error
                                    $timeout(function() {
                                        el.clear();
                                        el.refreshItems();
                                        angular.forEach(newDomains, function(value) {
                                            el.addItem(value);
                                        });
                                    });
                                });
                                
                                $scope.$on('reset', function() {
                                    // $timeout used to avoid 'apply already in progress' error
                                    $timeout(function() {
                                        el.clear();  // input box reset here with .clear(), view value reset in the controller
                                    });
                                });

                                //Load initial values
                                if ($ngModel.$modelValue instanceof Array){
                                    angular.forEach($ngModel.$modelValue, function(value){
                                        el.addItem(value.value);
                                    });
                                }
                            });
			}
		};
	}).directive('motivationKeywords', function ($timeout) {
		return {
			restrict: 'A',
			require: '?ngModel',
                        scope: {motivationsToShow: '@'},
                        link: function ($scope, element, attrs, $ngModel) {
                            $scope.$on($scope.motivationsToShow, function(event, categories){
                                var optgroups = [];
                                var options = [];
                                angular.forEach(categories, function (cat) {
                                        optgroups.push({value: cat.name, label: cat.name + ' Keywords'});
                                        angular.forEach(cat.keywords, function (kword) {
                                                if(kword.hasOwnProperty('desc')) {
                                                    options.push({text: kword.desc, value: kword.uri, optgroup: cat.name});
                                                }
                                                else if(kword.hasOwnProperty('label')) {
                                                    if(kword.label instanceof Array)
                                                        options.push({text: kword.label[0], value: kword.uri, optgroup: cat.name});
                                                    else
                                                        options.push({text: kword.label, value: kword.uri, optgroup: cat.name});
                                                }
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
                                    $timeout(function() {
                                        $scope.$apply(applyChange);
                                    });
                                });

                                $scope.$on('newMotivations', function(event, newMotivations) {
                                    // $timeout used to avoid 'apply already in progress' error due to el.on('change') function
                                    $timeout(function() {
                                        el.clear();
                                        el.refreshItems();
                                        angular.forEach(newMotivations, function(value) {
                                            el.addItem(value);
                                        });
                                    });
                                });

                                $scope.$on('reset', function() {
                                    // $timeout used to avoid 'apply already in progress' error due to el.on('change') function
                                    $timeout(function() {
                                        el.clear();  // input box reset here with .clear(), view value reset in the controller
                                    });
                                });

                                //Load initial values
                                if ($ngModel.$modelValue instanceof Array){
                                        angular.forEach($ngModel.$modelValue, function(value){
                                                el.addItem(value.value);
                                        });
                                }
                            });
			}
		};
	}).directive('charmeCito', ['fetchFabioTypes', function (fetchFabioTypes) {
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
			}
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
			}
		};
	});
