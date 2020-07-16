export const filterCallback = (callback) => {
	if (Object(callback) !== callback) return _.is(callback);
	if (typeof callback === "function") return callback;

	return (object) => {
		for (let [key, _callback] of Object.entries(callback)) {
			if (typeof _callback !== "function") _callback = _.is;
			if (_callback(object[key])) return true;
		}
		return false;
	}
};

export const mapCallback = (callback) => {
	if (Object(callback) !== callback) return callback;
	if (typeof callback === "function") return callback;

	return (object) => {
		object = {...object};
		for (let [key, _callback] of Object.entries(callback)) {
			if (typeof _callback !== "function") {
				object[key] = _callback;
			}
			else {
				object[key] = _callback(object[key]);
			}
		}

		return object;
	}
};


/// fp
export const _ = () => {};

/// Common
_.noop = () => {};
_.identity = (value) => value;
_.pipe = (...pipes) => (value) => pipes.reduce((f, g) => g(f), value);
_.go = (value, ...pipes) => _.pipe(...pipes)(value);
_.itself = _.always = (value) => () => value;

_.is = (a) => (b) => Object.is(a, b);
_.isUndefined = (value) => value === undefined;
_.isTrue = (value) => value === true;
_.isFalse = (value) => value === false;
_.isNumber = (value) => +value === value;
_.isNumberLike = (value) => _.isNumber(+value);
_.isBoolean = (value) => typeof value === "boolean";
_.isString = (value) => typeof value === "string";
_.isStringLike = (value) => _.isString(value) || _.isNumber(value);
_.isFunction = (value) => typeof value === "function";
_.isArray = (value) => Array.isArray(value);
_.isArrayLike = (value) => Array.isArray(value) || Object(value) === value && "number" === typeof value.length;
_.isObject = (value) => Object(value) === value;
_.isNil = (value) => value === undefined || value === null;

_.isNot = (a) => (b) => !Object.is(a, b);

_.hasLength = (value) => value.length && value.length > 0;
_.instanceof = (constructor) => (object) => (object instanceof constructor);


/// Object
_.cloneObject = (obj) => {
	const type = _.typeof(obj);
	if ("object" === type || "array" === type) {
		if ("function" === typeof obj.clone) {
			return obj.clone();
		}

		let clone = "array" === type ? [] : {}, key;
		for (key in obj) {
			clone[key] = _.cloneObject(obj[key]);
		}
		return clone;
	}

	return obj;
};

_.merge = (object) => (source) => ({...source, ...object});
_.defaults = (object) => (source) => ({...object, ...source});
_.mapValues = (callback) => (object) => Object.fromEntries(Object.entries(object).map(([key, value]) => [key, mapCallback(callback)(value)]));


/// Function
_.apply = (func, thisObj) => (args) => Function.prototype.apply.call(func, thisObj, args);
_.not = (func) => (...args) => !func(...args);
_.spread = (callback) => (array) => callback(...array);
_.memoize1 = (func) => {
	const cache = Object.create(null);
	return (key, ...args) => {
		return (cache[key] = key in cache ? cache[key] : func(key, ...args));
	};
};


/// Util
_.typeof = (value) => {
	const s = typeof value;

	if ("object" === s) {
		if (value) {
			if (value instanceof Array) {
				return "array";
			}
			if (value instanceof Object) {
				return s;
			}

			const className = Object.prototype.toString.call(value);

			if ("[object Window]" === className) {
				return "object";
			}

			if ("[object Array]" === className || "number" == typeof value.length && "undefined" != typeof value.splice && "undefined" != typeof value.propertyIsEnumerable && !value.propertyIsEnumerable("splice")) {
				return "array";
			}

			if ("[object Function]" === className || "undefined" != typeof value.call && "undefined" != typeof value.propertyIsEnumerable && !value.propertyIsEnumerable("call")) {
				return "function";
			}
		}
		else {
			return "null";
		}
	}
	else {
		if ("function" === s && "undefined" == typeof value.call) {
			return "object";
		}
	}

	return s;
};

_.identity = _.exist = (value) => value;
_.toType = (obj) => ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
_.castArray = (a) => _.isArray(a) ? a : [a];
_.with = _.alias = (...args) => (callback) => callback(...args);
_.throw = (error) => () => { throw error; };
_.if = (cond, callback, elseCallback = _.itself) => (value) => cond(value) ? callback(value) : elseCallback(value);
_.cond = (pairs) => (value) => {
	for (const [predicate, transform] of pairs) {
		if (predicate(value)) {
			return transform(value);
		}
	}
	return value;
};
_.switch = (table) => (id) => table[id];
_.if = (cond, callback, elseCallback = _.identity) => (value) => cond(value) ? callback(value) : elseCallback(value);


/// Effect
_.log = (...args) => console.log.bind(console, ...args);
_.warn = (...args) => console.warn.bind(console, ...args);


/// JSON
_.json = {};
_.json.parse = JSON.parse.bind(JSON);
_.json.stringify = JSON.stringify.bind(JSON);


/// localStorage
_.localStorage = {};
_.localStorage.getItem = (key, defaults) => JSON.parse(localStorage.getItem(key)) || defaults;
_.localStorage.setItem = (key) => (value) => localStorage.setItem(key, JSON.stringify(value));


/// requestAnimationFrame
_.rAF = window.requestAnimationFrame.bind(window);
_.rAF.cancel = window.cancelAnimationFrame.bind(window);


/// window
_.alert = (...args) => window.alert(...args);


