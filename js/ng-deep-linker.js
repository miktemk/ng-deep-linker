// Find this on GitHub https://github.com/miktemk/ng-deep-linker

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
				if (!params[field.urlName] || (field.defaultValue && obj[field.name] == field.defaultValue))
					delete params[field.urlName];
			}
		});
		return params;
	}

	/// from URL params to obj for a single field
	function _mapFieldToObj(field, params) {
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
			return arrResult;
		}
		else {
			var result = field.defaultValue ? field.defaultValue : null;
			if (params[field.urlName]) {
				result = field.mapFrom
					? field.mapFrom(params[field.urlName])
					: params[field.urlName];
			}
			return result;
		}
	}

	/// from URL params to obj
	function convertToObj(params) {
		var obj = {};
		$.each(fields, function (i, field) {
			obj[field.name] = _mapFieldToObj(field, params);
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
	///    defaultValue: (optional) if == to this value, param is excluded
	/// }
	self.field = function (opts) {
		if (!opts.urlName)
			opts.urlName = opts.name;
		fields.push(opts);
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
	self.mapFieldFromParam = function (name) {
		var q = $.grep(fields, function (x, i) { return x.name == name; });
		if (q.length == 0)
			return;
		return _mapFieldToObj(q[0], $location.search());
	}

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
// NOTE: requires date.js (http://datejs.org)
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
	if (date == null)
		return null;
	return date.toString("yyyyMMddHHmmss");
};
// NOTE: requires moment.js (http://momentjs.com/docs/)
NgDeepLinker.mapFromUrl_moment = function (param) {
	if (!param)
		return null;
	var date = NgDeepLinker.mapFromUrl_date(param);
	return moment(date);
};
NgDeepLinker.mapToUrl_moment = function (mmm) {
	if (mmm == null)
		return null;
	var date = mmm.toDate();
	return NgDeepLinker.mapToUrl_date(date);
};
