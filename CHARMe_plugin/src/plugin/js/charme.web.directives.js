charme.web.app.directive('targetTypeKeywords', function($timeout) {
    return {
        restrict: 'A',
        require: '?ngModel',
        scope: {targetTypesToShow: '@'},
        link: function ($scope, element, attrs, $ngModel) {
            $scope.$on($scope.targetTypesToShow, function(event, categories) {
                var optgroups = [];
                var options = [];
                angular.forEach(categories, function (cat) {
                    optgroups.push({value: cat.name, label: cat.name + ' Keywords'});
                        angular.forEach(cat.keywords, function (kword) {
                            if(kword.hasOwnProperty('desc')) {
                                options.push({text: kword.desc, value: kword.uri, optgroup: cat.name, $order: kword.desc});
                            }
                            else if(kword.hasOwnProperty('label')) {
                                if(kword.label instanceof Array)
                                    options.push({text: kword.label[0].trim(), value: kword.uri, optgroup: cat.name, $order: kword.label[0].trim()});
                                else
                                    options.push({text: kword.label.trim(), value: kword.uri, optgroup: cat.name, $order: kword.label.trim()});
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

                $scope.$on('newTargetTypes', function(event, newTargetTypes) {
                    // $timeout used to avoid 'apply already in progress' error
                    $timeout(function() {
                        el.clear();
                        el.refreshItems();
                        angular.forEach(newTargetTypes, function(value) {
                            el.addItem(value);
                        });
                    });
                });

                $scope.$on('reset', function() {
                    // $timeout used to avoid 'apply already in progress' error
                    $timeout(function() {
                        el.clear();  // Input box reset here with .clear(), view value reset in the controller
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
}).directive('domainKeywords', function ($timeout) {
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
                                        options.push({text: kword.desc, textLong: kword.desc, textShort: charme.logic.shortDomainLabel(kword.desc), value: kword.uri, optgroup: cat.name, $order: kword.desc});
                                    }
                                    else if(kword.hasOwnProperty('label')) {
                                        if(kword.label instanceof Array)
                                            options.push({text: kword.label[0], textLong: kword.label[0], textShort: charme.logic.shortDomainLabel(kword.label[0]), value: kword.uri, optgroup: cat.name, $order: kword.label[0].trim()});
                                        else
                                            options.push({text: kword.label, textLong: kword.label, textShort: charme.logic.shortDomainLabel(kword.label), value: kword.uri, optgroup: cat.name, $order: kword.label.trim()});
                                    }
                            });
                    });
                    var el = $(element).selectize({
                            persist: false,
                            options: options,
                            optgroups: optgroups,
                            maxOptions: options.length,
                            onItemAdd: function(value) {
                                var updatedObj = $.extend({}, this.options[value], {text: this.options[value].textShort});
                                this.updateOption(value, updatedObj);
                            },
                            onItemRemove: function(value) {
                                var updatedObj = $.extend({}, this.options[value], {text: this.options[value].textLong});
                                this.updateOption(value, updatedObj);
                            }
                            // We $.extend() into a new, empty object, rather than modify this.options directly, because Brian 'Selectize' Reavis says: 
                            // "It's not a good idea to modify this.items or this.options—it could lead to unexpected behavior"
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
                            el.clear();  // Input box reset here with .clear(), view value reset in the controller
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
                                        options.push({text: kword.desc, value: kword.uri, optgroup: cat.name, $order: kword.desc});
                                    }
                                    else if(kword.hasOwnProperty('label')) {
                                        if(kword.label instanceof Array)
                                            options.push({text: kword.label[0].trim(), value: kword.uri, optgroup: cat.name, $order: kword.label[0].trim()});
                                        else
                                            options.push({text: kword.label.trim(), value: kword.uri, optgroup: cat.name, $order: kword.label.trim()});
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
                            el.clear();  // Input box reset here with .clear(), view value reset in the controller
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
})
        
/*.directive('charmeCito', ['fetchFabioTypes', function (fetchFabioTypes) {
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
})*/

;
