/******************************************************************************
 * Filedrop -- converts any HTML element to accept files dropped by the user,
 *             e.g., to upload files, or process them directly in JS
 *
 *
 * usage
 * - new Filedrop(element [,options]); // has no properties
 * // TODO support disabling
 *
 * provides a number of functions for configuration, pass as options
 *
 * - onEnter(event) ... fired when a file is dragged over the element
 * - onExit(event)  ... fired when the file is dragged away from the element
 * - onDrop(event)  ... fired when the file is dropped on the element
 * - filter(event)  ... implement a custom filter to accept files, 
 *                      return true if a file shall be accepted, otherwise false
 *                      Default implementation can be used within customer 
 *                      Implementation by calling Filedrop.filter(event);
 *
 */
(function(context){
	
	// little helper function
	function _extend(src, dst) {
		for (var prop in src) {
			if (!dst[prop]) {
				dst[prop] = src[prop];
			}
		}
		return dst;
	}
	
	/**
	 * constructor
     */
	var Filedrop = function(element, options) {
		if ("function" == typeof(options)) {
			options = {onDrop: options}
		}
		
		// set default options and overwrite with provided ones
		_extend(Filedrop.def, options);
		
		// setup droptarget
		var el = element.nodeType > 0 ? element : document.getElementById(element);

		// required to enable dropping
		el.addEventListener("dragover", function(e) {
			if (options.filter(e)) {
				// execute callback
				try {
					options.onEnter(e);
				} catch(e){}
				
				// enable dropping
				e.preventDefault();
				return false;				
			}
		});

		el.addEventListener("drop", function(e){
			
			// only accept files and filtered values
			if(e.dataTransfer.files.length > 0 
			   && options.filter(e)) 
			{
				// execute callback
				try {
					options.onDrop(e);
				} catch(e){}
			
				// prevent browser behavior
				e.preventDefault();
				return false;				
			}
		});
		
		el.addEventListener("dragleave", function(e){
			// execute callback
			try {
				options.onExit(e);
			} catch(e){}
			
			// prevent brower behavior
			e.preventDefault();
			return false;
		});
	}
	
	Filedrop.def = {
		onDrop: function(){},
		onEnter: function(){},
		onExit: function(){},
		filter:function(e) {
			// TODO check implementation for browsers
			var support = ["Files"]; // FF,Safari,Chrome
			var types = e.dataTransfer.types;
					
			for (var t in types) {
				if (-1 != support.indexOf(types[t])) {
					return true;
				}
			}
			return false;
		}
	};
	
	/**
	 * tests whether filedrop is supported
	 */
	Filedrop.test = function () {
		return true
			// Drag and Drop Events present
		 && "draggable" in document.createElement('span') 
			
			// event subscription
		 && "function" == typeof(document.createElement('span').addEventListener)
	}
	
	if (!Filedrop.test()) {
		Log.error("Filedrop not supported");
		FileDrop = function(){}; // creates empty constructor that does nothing
	}
	
	context['filedrop'] = Filedrop;
})(require.modules);
