var lastGo = null;

function NgDeepLinker($location, $rootScope, $state) {
	var self = this;
	var fields = [];
	var UrlUpdatingProgrammatically = false;
	
	/// from obj to URL params
	function convertToParams(obj) {
		var params = {};
		$.each(fields, function (i, field) {
			if (field.isArray) {
				var concatResult = '';
				var arr = obj[field.name];
				if (arr) {
					for (var i = 0; i < arr.length; i++) {
						if (concatResult.length > 0)
							concatResult += ',';
						var elem = field.mapTo
							? field.mapTo(arr[i])
							: arr[i];
						if (elem != null && elem != undefined)
							concatResult += elem;
					}
				}
				if (concatResult.length > 0)
					params[field.urlName] = concatResult;
			}
			else {
				if (obj[field.name]) {
					params[field.urlName] = field.mapTo
						? field.mapTo(obj[field.name])
						: obj[field.name];
				}
				if (!params[field.urlName])
					delete params[field.urlName];
			}
		});
		return params;
	}
	
	/// from URL params to obj
	function convertToObj(params) {
		var obj = {};
		$.each(fields, function (i, field) {
			if (field.isArray) {
				var arrResult = [];
				if (params[field.urlName]) {
					var arr = params[field.urlName].split(',');
					for (var i = 0; i < arr.length; i++) {
						var elem = field.mapFrom
							? field.mapFrom(arr[i])
							: arr[i];
						if (elem != null && elem != undefined)
							arrResult.push(elem);
					}
				}
				obj[field.name] = arrResult;
			}
			else {
				obj[field.name] = null;
				if (params[field.urlName]) {
					obj[field.name] = field.mapFrom
						? field.mapFrom(params[field.urlName])
						: params[field.urlName];
				}
			}
		});
		return obj;
	}

	/// accepts the following:
	/// {
	///    name: name of object property param
	///    urlName: (optional) name of the param in url (if not specified, dafaults to name)
	///    mapTo: (optional) map from obj to URL param
	///    mapFrom: (optional) map from URL param to obj
	///    isArray: (optional) the obj param is an array
	/// }
	self.field = function (opts) {
		if (!opts.urlName)
			opts.urlName = opts.name;
		fields.push(opts);
		return self;
	};
	self.updateUrl = function (obj) {
		// sanitize based on
		var newParams = convertToParams(obj);
		// compare objects
		console.log("TODO: compare ", newParams, " and ", $state.params);
		if (true) {
			UrlUpdatingProgrammatically = true;
			$location.search($.param(newParams));
		}
		//$location.path(urlBase).search(self.urlParam);
		return self;
	};
	self.onUrlUpdated = function (callback) {
		self.onUrlUpdated_callback = callback;
		return self;
	};
	self.checkUrlNow = function () {
		var newObj = convertToObj($location.search());
		if (self.onUrlUpdated_callback)
			self.onUrlUpdated_callback(newObj);
		return self;
	};
	
	$rootScope.$on("$locationChangeSuccess", function (event, current, previous) {
		if (UrlUpdatingProgrammatically) {
			UrlUpdatingProgrammatically = false;
			return;
		}
		self.checkUrlNow();
    });
}

// helper functions
NgDeepLinker.toStringBasic = function (x) {
	return "" + x;
};
// NOTE: you need date.js (datejs.org) to run these 2 functions:
NgDeepLinker.mapFromUrl_date = function (param) {
	if (!param)
		return null;
	if (param.length != 14)
		return null;
	var Y = parseInt(param.substring(0, 4));
	var M = parseInt(param.substring(4, 6));
	var D = parseInt(param.substring(6, 8));
	var h = parseInt(param.substring(8, 10));
	var m = parseInt(param.substring(10, 12));
	var s = parseInt(param.substring(12));
	if (M > 0) M--;
	if (M > 11) M = 11;
	return new Date(Y, M, D, h, m, s);
};
NgDeepLinker.mapToUrl_date = function (date) {
	return date.toString("yyyyMMddHHmmss");
};