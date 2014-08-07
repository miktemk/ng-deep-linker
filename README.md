ng-deep-linker
==============

Helper class for changing the query string dynamically using AngularJS ui-router.

## Initialization

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
			alwaysPutIntoUrl: true,
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

As you can see the chain of field() functions takes all sorts of parameters:

 - name: name of object property param
 - urlName: (optional) name of the param in url (if not specified, dafaults to name)
 - mapTo: (optional) map from obj to URL param
 - mapFrom: (optional) map from URL param to obj
 - isArray: (optional) the obj param is an array
 - defaultValue: (optional) if == to this value, param is excluded
 - alwaysPutIntoUrl: (optional) always put this param into URL on updateUrl()
 - compareFunc: (optional) returns true of this x1 is equal x2 in compareFunc(x1, x2)

## Trigger functions

 - checkUrlNow: will call the callback you passed in onUrlUpdated
 - updateUrl: given an object, change the Url according to our mapping

## Helper functions

 - hasAnyParams: do we have any params in $location.search() that we are interested in?
 - forceUrlUpdatedCallback: just calls the callback you passed in onUrlUpdated
 - forceConvertToObj: returns the mapped object from current Url parameters
 - compareObjects: returns true if they are equal with the utmost careful equality comparison.
