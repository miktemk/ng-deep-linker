// From: https://github.com/mrharel/Object-Helper/blob/master/helper-object.js
/**
 * Compare two objects.
 * @method isEqual
 * @param o1 {Object} the object that is compared to
 * @param o2 {Object} the object that is compared with
 * @param cfg {Object} configuration settings:
 * 	exclude {Object} key/val map where the key is properties names we want
 * 	to exclude from the comparison. 
 * 	strictMode [Boolean] if true then === will be used to compare premitive types, otherwise
 * 	== will be used.
 * 	noReverse {Boolean} if this is true then the method will avoid of the reverse comparison. 
 * 		this will improve the efficiency and speed of the function but could cause to unwanted 
 * 		results. For example, o1={a:1}; o2={a:1,b:2}; then if we compare o2 to o1 it will match
 * 		because o2 has property 'a' that has the value 1, but if we compare o1 to o2 it will fail.
 * 		this is why we are doing a reverse compare. but the price for the reverse is in performance, 
 * 		since it is not implemented in the best way and it could reverse the same sub-objects more than 
 * 		once. 
 * @reverse - internal use of the recursion. do not use.
 * @return {Boolean} true if the object are equal.
 */
$.isEqual = function (o1, o2, cfg, reverse) {
	cfg = cfg || {};
	cfg.exclude = cfg.exclude || {};

	//first we check the reference. we don't care if null== undefined        
	if (cfg.strictMode) {
		if (o1 === o2) return true;
	}
	else {
		if (o1 == o2) return true;
	}

	if (typeof o1 == "number" || typeof o1 == "string" || typeof o1 == "boolean" || !o1 ||
		typeof o2 == "number" || typeof o2 == "string" || typeof o2 == "boolean" || !o2) {
		return false;
	}

	if (((o1 instanceof Array) && !(o2 instanceof Array)) ||
		((o2 instanceof Array) && !(o1 instanceof Array))) return false;

	for (var p in o1) {
		if (cfg.exclude[p] || !o1.hasOwnProperty(p)) continue;
		if (!$.isEqual(o1[p], o2[p], cfg)) return false;
	}
	if (!reverse && !cfg.noReverse) {
		reverse = true;
		return $.isEqual(o2, o1, cfg, reverse);
	}
	return true;
}

// elements of the array could be out of order so we do an unordered comparision to check
// they contain the same set of elements.
// if compareFunc is not specified, == is used.
// Well, more like, == is used first and then compareFunc, if specified
$.isArrayEqualUnordered = function (a1, a2, compareFunc) {
	if (!a1 && !a2)
		return true;
	if ((a1 && !a2) || (!a1 && a2))
		return false;
	if (a1.length != a2.length)
		return false;
	for (var i = 0; i < a1.length; i++) {
		var x1 = a1[i];
		var x2 = $.firstOrDefault(a2, function (x, i) {
			if (x1 == x)
				return true;
			if (compareFunc && compareFunc(x1, x))
				return true;
			return false;
		});
		if ((x1 && !x2) || (!x1 && x2)) // 2nd can never happen
			return false;
	}
	return true;
}

// Find this on GitHub https://github.com/miktemk/ng-deep-linker
function NgDeepLinker($location, $rootScope, $state) {
	var self = this;
	var fields = [];
	var oldUrl = $location.path();
	var oldParams = {}; // begin with empty to trigger callback on first call of checkUrlNow
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
				if (!params[field.urlName] || (field.defaultValue && obj[field.name] == field.defaultValue && !field.alwaysPutIntoUrl))
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
			if (field.includeUnmapped)
				obj[field.nameUnmapped] = params[field.urlName];
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
	///    alwaysPutIntoUrl: (optional) always put this param into URL on updateUrl()
	///    compareFunc: (optional) returns true of this x1 is equal x2 in compareFunc(x1, x2)
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
	self.setInitialParams = function (obj) {
		oldParams = convertToParams(obj);
	};
	self.checkUrlNow = function () {
		// strip $location.search() down to just the fields we are interested in
		var newParams = {};
		var allParams = $location.search();
		$.each(fields, function (i, field) {
			if (allParams[field.urlName])
				newParams[field.urlName] = allParams[field.urlName];
		});
		// if changed, proceed
		if (!$.isEqual(newParams, oldParams)) {
			oldParams = newParams;
			var newObj = convertToObj(newParams);
			if (self.onUrlUpdated_callback)
				self.onUrlUpdated_callback(newObj);
		}
		return self;
	};
	self.updateUrl = function (obj) {
		// convert obj to URL parameters
		var newParams = convertToParams(obj);
		// if changed, proceed
		if (!$.isEqual(newParams, oldParams)) {
			oldParams = newParams;

			// merge existing params with mine
			var existingParams = $.extend({}, $location.search(), true);
			$.each(fields, function (i, field) {
				delete existingParams[field.urlName];
			});
			newParams = $.extend(existingParams, newParams, true);

			// update query string
			UrlUpdatingProgrammatically = true;
			$location.search($.param(newParams));
		}
		return self;
	};
	// maps just 1 field, by name
	self.mapFieldFromParam = function (name) {
		var q = $.grep(fields, function (x, i) { return x.name == name; });
		if (q.length == 0)
			return;
		return _mapFieldToObj(q[0], $location.search());
	};

	//------------------------------------------------------------------
	// other helpers
	self.arrayFromUrlParam = function (name) {
		var params = $location.search();
		var sss = params[name];
		if (!sss)
			sss = '';
		return sss.split(',');
	};
	// do we have any params in $location.search() that we are interested in?
	self.hasAnyParams = function () {
		var allParams = $location.search();
		var result = false;
		$.each(fields, function (i, field) {
			if (allParams[field.urlName])
				result = true;
		});
		return result;
	};
	self.forceUrlUpdatedCallback = function (obj) {
		if (self.onUrlUpdated_callback)
			self.onUrlUpdated_callback(obj);
		return self;
	};
	// converts $location.search() to obj
	self.forceConvertToObj = function () {
		var newParams = {};
		var allParams = $location.search();
		$.each(fields, function (i, field) {
			if (allParams[field.urlName])
				newParams[field.urlName] = allParams[field.urlName];
		});
		return convertToObj(newParams);
	}
	self.compareObjects = function (obj1, obj2) {
		for (var i = 0; i < fields.length; i++) {
			var field = fields[i];
			var val1 = obj1[field.name];
			var val2 = obj2[field.name];
			if (field.isArray) {
				if (!$.isArrayEqualUnordered(val1, val2, field.compareFunc))
					return false;
				continue;
			}
			if (!val1 && !val2)
				return true;
			if ((val1 && !val2) || (!val1 && val2))
				return false;
			if (field.compareFunc) {
				if (!field.compareFunc(val1, val2))
					return false;
				continue;
			}
			if (val1 != val2)
				return false;
		}
	}

	var unreg_locationChangeSuccess = $rootScope.$on("$locationChangeSuccess", function (event, current, previous) {
		if (UrlUpdatingProgrammatically) {
			UrlUpdatingProgrammatically = false;
			return;
		}
		// we are not even on this page!
		if ($location.path() != oldUrl)
			return;
		self.checkUrlNow();
	});

	self.unregister = function () {
		unreg_locationChangeSuccess();
	};
}

// helper functions
NgDeepLinker.toStringBasic = function (x) {
	if (x == null || x == undefined)
		return "";
	return "" + x;
};
NgDeepLinker.parseIntNull = function (x) {
	if (x == null || x == undefined)
		return null;
	var p = parseInt(x);
	if (!p && p != 0)
		return null;
	return p;
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
NgDeepLinker.compareFunc_moment = function (x1, x2) {
	return x1 && x2 && x1.diff(x2) == 0;
}
NgDeepLinker.compareFunc_momentSeconds = function (x1, x2) {
	return x1 && x2 && x1.diff(x2) <= 999;
}
