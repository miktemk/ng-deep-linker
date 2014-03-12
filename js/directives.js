angular.module('ng').directive('ngSpinner', function () {
	function safeApply($scope, callback) {
		($scope.$$phase || $scope.$root.$$phase)
			? callback()
			: $scope.$apply(callback);
	}
	return {
		restrict: 'A',
		scope: {
			ngSpinner: '=',
			ngMin: '=',
			ngMax: '='
		},
		link: function (scope, element, attrs) {
			function checkBounds() {
				if (scope.ngMin != null && scope.ngMin != undefined && scope.ngSpinner < scope.ngMin)
					scope.ngSpinner = scope.ngMin;
				if (scope.ngMax != null && scope.ngMax != undefined && scope.ngSpinner > scope.ngMax)
					scope.ngSpinner = scope.ngMax;
			}
			element.val(scope.ngSpinner);
			element.spinner({
				min: scope.ngMin,
				max: scope.ngMax,
				spin: function (event, ui) {
					if (scope.ngSpinner != ui.value) {
						safeApply(scope, function () {
							scope.ngSpinner = ui.value;
						});
					}
				},
				change: function (event, ui) {
					if (event.handleObj && event.handleObj.type == "blur") {
						safeApply(scope, function () {
							scope.ngSpinner = element.spinner('value');
							checkBounds();
							// bounds check changed something! naughty naughty!
							if (scope.ngSpinner != element.spinner('value'))
								element.spinner('value', scope.ngSpinner);
						});
					}
				}
			});
			element.on('blur', function () {
				if (scope.ngSpinner != element.spinner('value')) {
					safeApply(scope, function () {
						scope.ngSpinner = element.spinner('value');
					});
				}
			});
			element.numeric();
			scope.$watch('ngSpinner', function (nv, ov) {
				if (nv != ov) {
					element.spinner('value', nv);
				}
			});
			scope.$watch('ngMin', function (nv, ov) {
				if (nv != ov || nv != element.spinner('option', 'min')) {
					element.spinner('option', 'min', nv);
					checkBounds();
				}
			});
			scope.$watch('ngMax', function (nv, ov) {
				if (nv != ov || nv != element.spinner('option', 'max')) {
					element.spinner('option', 'max', nv);
					checkBounds();
				}
			});
		}
	};
});
// from: http://stackoverflow.com/questions/14514461/how-can-angularjs-bind-to-list-of-checkbox-values
angular.module('ng').directive('checkList', function () {
    return {
        scope: {
            list: '=checkList',
            value: '@'
        },
        link: function (scope, elem, attrs) {
            var handler = function (setup) {
            	var checked = elem.prop('checked');
            	if (!scope.list)
            		return;

                var index = scope.list.indexOf(scope.value);

                if (checked && index == -1) {
                    if (setup) elem.prop('checked', false);
                    else scope.list.push(scope.value);
                } else if (!checked && index != -1) {
                    if (setup) elem.prop('checked', true);
                    else scope.list.splice(index, 1);
                }
            };

            var setupHandler = handler.bind(null, true);
            var changeHandler = handler.bind(null, false);

            elem.bind('change', function () {
                scope.$apply(changeHandler);
            });
            scope.$watch('list', setupHandler, true);
        }
    };
});
// pick-a-date (attribute)
angular.module('ng').directive('pickADate', function () {
    return {
        restrict: "A",
        scope: {
            pickADate: '=',
            minDate: '=',
            maxDate: '='
        },
        link: function (scope, element, attrs) {
            element.pickadate({
                onSet: function (e) {
                    if (scope.$$phase || scope.$root.$$phase) // we are coming from $watch or link setup
                        return;
                    var select = element.pickadate('picker').get('select'); // selected date
                    scope.$apply(function () {
                        if (e.hasOwnProperty('clear')) {
                            scope.pickADate = null;
                            return;
                        }
                        if (!scope.pickADate)
                            scope.pickADate = new Date(0);
                        scope.pickADate.setYear(select.obj.getYear() + 1900); // hello Y2K...
                        // It took me half a day to figure out that javascript Date object's getYear
                        // function returns the years since 1900. Ironically setYear() accepts the actual year A.D.
                        // So as I got the $#%^ 114 and set it, guess what, I was transported to ancient Rome 114 A.D.
                        // That's it I'm done being a programmer, I'd rather go serve Emperor Trajan as a sex slave.
                        scope.pickADate.setMonth(select.obj.getMonth());
                        scope.pickADate.setDate(select.obj.getDate());
                    });
                },
                onClose: function () {
                    element.blur();
                }
            });
            function updateValue(newValue) {
                if (newValue) {
                    scope.pickADate = (newValue instanceof Date) ? newValue : new Date(newValue);
                    // needs to be in milliseconds
                    element.pickadate('picker').set('select', scope.pickADate.getTime());
                } else {
                    element.pickadate('picker').clear();
                    scope.pickADate = null;
                }
            }
            updateValue(scope.pickADate);
            element.pickadate('picker').set('min', scope.minDate ? scope.minDate : false);
            element.pickadate('picker').set('max', scope.maxDate ? scope.maxDate : false);
            scope.$watch('pickADate', function (newValue, oldValue) {
                if (newValue == oldValue)
                    return;
                updateValue(newValue);
            }, true);
            scope.$watch('minDate', function (newValue, oldValue) {
                element.pickadate('picker').set('min', newValue ? newValue : false);
            }, true);
            scope.$watch('maxDate', function (newValue, oldValue) {
                element.pickadate('picker').set('max', newValue ? newValue : false);
            }, true);
        }
    };
});

// pick-a-time (attribute)
angular.module('ng').directive('pickATime', function () {
    return {
        restrict: "A",
        scope: {
            pickATime: '='
        },
        link: function (scope, element, attrs) {
            element.pickatime({
                onSet: function (e) {
                    if (scope.$$phase || scope.$root.$$phase) // we are coming from $watch or link setup
                        return;
                    var select = element.pickatime('picker').get('select'); // selected date
                    scope.$apply(function () {
                        if (e.hasOwnProperty('clear')) {
                            scope.pickATime = null;
                            return;
                        }
                        if (!scope.pickATime)
                            scope.pickATime = new Date(0);
                        // (attrs.setUtc)
                            // ? scope.pickATime.setUTCHours(select.hour)
                            // : scope.pickATime.setHours(select.hour);
                        scope.pickATime.setHours(select.hour);
                        scope.pickATime.setMinutes(select.mins);
                        scope.pickATime.setSeconds(0);
                        scope.pickATime.setMilliseconds(0);
                    });
                },
                onClose: function () {
                    element.blur();
                }
            });
            function updateValue(newValue) {
                if (newValue) {
                    scope.pickATime = (newValue instanceof Date) ? newValue : new Date(newValue);
                    // needs to be in minutes
                    var totalMins = scope.pickATime.getHours() * 60 + scope.pickATime.getMinutes();
                    element.pickatime('picker').set('select', totalMins);
                } else {
                    element.pickatime('picker').clear();
                    scope.pickATime = null;
                }
            }
            updateValue(scope.pickATime);
            scope.$watch('pickATime', function (newValue, oldValue) {
                if (newValue == oldValue)
                    return;
                updateValue(newValue);
            }, true);
        }
    };
});
