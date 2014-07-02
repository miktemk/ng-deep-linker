ng-deep-linker
==============

Helper class for changing the query string dynamically using AngularJS ui-router.

#Usage

From within the AngularJS controller, do this.
(Of course $location, $rootScope, $state have to come from controller parameters)

    var deepLinkerMisc = new NgDeepLinker($location, $rootScope, $state);
	  deepLinkerMisc
	  .field({ name: 'SomeParam' })
		.field({
			name: 'selectedContactId',
			urlName: 'Detail',
			mapTo: NgDeepLinker.toStringBasic,
			mapFrom: NgDeepLinker.parseIntNull
		})
		.field({
			name: 'gridPageSize',
			urlName: 'PageSize',
			defaultValue: DEFAULT_ITEMS_PER_PAGE,
			mapTo: NgDeepLinker.toStringBasic,
			mapFrom: NgDeepLinker.parseIntNull
		})
		.field({
			name: 'gridSort',
			urlName: 'Sort',
			mapTo: function (x) {
				if (!x)
					return null;
				if (x.column == 0 && x.direction == "asc")
					return null;
				return x.column + ',' + ((x.direction == 'desc') ? "1" : "0");
			},
			mapFrom: function (param) {
				var res = { column: 0, direction: "asc" };
				if (param) {
					var splits = param.split(',');
					if (splits.length >= 2) {
						res.column = parseInt(splits[0]);
						if (splits[1] == "1")
							res.direction = "desc";
					}
				}
				return res;
			}
		})
		.onUrlUpdated(function (newObj) {
			$scope.safeApply(function () {
				$scope.paramz = $.extend($scope.paramz, newObj);
			});
		})
	;
