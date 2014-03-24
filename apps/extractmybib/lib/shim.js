if ("function" != typeof(Function.prototype.bind)) {
	Function.prototype.bind = function(scope) {
		var fn = this;
		return function() {
			return fn.apply(scope, arguments);
		};
	};
}

Function.prototype.defer = function defer() {
	var fn = this;
	var args = arguments
	return window.setTimeout(function() {
		return fn.apply(this, args)
	}.bind(this), defer._interval || 25);
}
Function.prototype.defer._interval = 25;

Object.extend = function(destination, source) {
	for (var property in source) {
		destination[property] = source[property];
	}
	return destination;
}

if ("function" != typeof(Object.freeze)) {
	Object.freeze = function(obj) {
		oryx.log.warn("Current JavaScript version does not support freezing variables, changes will apply.", obj);
	}
}

if ("function" != typeof(String.prototype.trim)) {
	String.prototype.trim = function(){
		return this.replace(/^\s*/,"").replace(/\s*$/,"");
	}
}