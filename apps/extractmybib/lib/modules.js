(function(context) {

	var require = function req(identifier) {
		var module = req.modules[identifier] || context[identifier] || (window && window[identifier]);
		if (!module) {
			throw new Error("(cjs) module not defined: " + identifier);
		}
		return module;
	};

	require.modules = {};
	
	context['require'] = require;

})(this); // this == window at this point
