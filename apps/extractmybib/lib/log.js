(function(context) {
	
	var log = (function(levels) {
		levels = levels.split(" ");

		var log = {};
		var c_level = 0;

		log.setAppender = function(appender) {
			levels.forEach(function(level) {
				if ("function" == typeof(appender[level])) {
					log[level] = function(){
						appender[level].apply(appender, arguments);
					}
				}
				else {
					log[level] = function(){};
				}
			});

			return true;
		};

		log.setLevel = function(level) {
			var i = isNaN(level) ? levels.indexOf(level) : level;
			if (0 > i || levels.length -1 < i) {
				throw new TypeError("invalid log level: " +level );
			}
			c_level = i;
		};

		if (window && window.console) {
			log.setAppender(window.console);
		}
		else {
			log.setAppender({});
		}

		return log;

	})("error warn info debug log");
	
	context['log'] = log;
})(require.modules);