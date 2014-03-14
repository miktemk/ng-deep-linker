var app = angular.module('tesddd', ['ng', 'ngRoute', 'ui.router']);
app.config(function ($stateProvider, $urlRouterProvider) {
	$urlRouterProvider.otherwise("/test");
	$stateProvider
		.state('goto', { url: '/goto', templateUrl: 'test-goto.html', controller: gotoTest })
		.state('test', { url: '/test', templateUrl: 'test-form.html', controller: test })
		//.state('test1', { url: '/test1' })
	;
});


function test($scope, $rootScope, $location, $state) {
	$scope.form = {
		a: '',
		ddd: '',
		birdSelection: []
	};
	
	var deepLinker = new NgDeepLinker($location, $rootScope, $state);
	deepLinker
		.field({ name: 'a' })
		.field({
			name: 'ddd',
			mapTo: NgDeepLinker.mapToUrl_date,
			mapFrom: NgDeepLinker.mapFromUrl_date
		})
		.field({
			name: 'birdSelection',
			urlName: 'birds',
			isArray: true,
			mapTo: function (bird) {
				if (bird == "Peacock") return 1;
				if (bird == "Quail") return 2;
				if (bird == "Rooster") return 3;
				return null;
			},
			mapFrom: function (param) {
				param = parseInt(param);
				switch (param) {
					case 1: return "Peacock";
					case 2: return "Quail";
					case 3: return "Rooster";
				}
				return null;
			}
		})
		.onUrlUpdated(function (newForm) {
			$scope.form = newForm;
		})
		.checkUrlNow()
	;
	
	$scope.doSearch = function () {
		deepLinker.updateUrl($scope.form);
	};
}

function gotoTest($scope, $rootScope, $location, $state) {
	$scope.deepLinkTest = function () {
		// go to #/test?a=fromButton&ddd=20140310190000&birds=3,2
		$location.path("/test").search({
			a: 'fromButton',
			ddd: '20140310190000',
			birds: '3,2'
		});
	};
}