// start code
if ("function" != typeof(require)) {
	throw "modules library required";
}

(function(context) {
	
	//var Mustache = require('mustache');
	
	var Bibtex = function(raw) {
		this.raw = raw;
		this.records = [];
	};
	
	// isntance properties
	Object.extend(Bibtex.prototype, {
		
		// public properties
		raw: '',
		records: [],
				
		// public methods
		parse: function() {
			this.records = parseCollection(this.raw);
		}
	});
	
	// static properties
	Object.extend(Bibtex, {
		/**
		 * Prints bibtex records, uses mustache.js for rendering
		 * @see http://mustache.github.com/#demo
		 *
		 * accepts a lot
		 *
		 * string --> bibtex (uses default pattern)
		 * string, string --> bibtex, pattern 
		 *
		 * object --> record (uses default pattern)
		 * object, string --> record, pattern
		 *
		 * array --> records (uses default pattern)
		 * object, object, ... --> records (used default pattern)
		 *
		 * array, string --> records, pattern
		 * object, object, object, ..., string  --> records, pattern
		 */
		format: function(record, pattern) {
			
Log.info("Bibtex#format", record);
			
			var Mustache = require('mustache'), // require again for faster scope resolution
				records = [],
			    args = Array.apply(Array, arguments), // make arguments a proper array
			
			   	ptn = "<p>{{author}}. "+
			          "<em> {{title}}. </em> "+
			          "{{#booktitle}}In {{booktitle}}. {{/booktitle}}"+
			          "{{#pages}} pages {{pages}}, {{/pages}}"+
			          "{{#publisher}} {{publisher}}, {{/publisher}}"+
			          " {{year}}</p>"; // default pattern;
			
			// extract a provided pattern, if provided
			if (args.length > 1) {
				var last = args[args.length-1];
				if (isString(last)) {
					ptn = args.pop();
				}
			}
			
			// map different format of args to array of records
			if (args.length > 1) { // object, object, ...
				records = args;
			}
			else if (args.length == 1) {
				if (isString(args[0])) { // string
					var b = new Bibtex(args[0]);
					b.parse();
					records = b.records;
				}
				else if (isArray(args[0])) { // arrray
					records = args[0]
				}
				else { // object
					records = [args[0]];
				}
			}
			else {
				args = [];
			}
			
			// remove empty records
			records = records.filter(function(i){return !isNot(i)});
			
			// do not try to render empty or undefined list of records
			if (0 == records.length) {
				return "";
			}
			
			return records.map(function(r) {
				for (var k in r) {
					if ("editor" == k || "author" == k) {
						r[k] = formatAuthor(r[k])
					}
					else if ("_raw" == k) {
						// ignore
					}
					else {
						r[k] = cleanValue(r[k]);
					}
				}
				
				return Mustache.render(ptn, r);
			}).join("");
		}
	});
	
	function isNot(o) {
		return null === o || "undefined" == typeof(o);
	}
	
	function isString(o) {
		return !isNot(o) && "function" == typeof(o.substring);
	}
	
	function isArray(o) {
		return !isNot(o) && "function" == typeof(o.slice);
	}

	function cleanValue(string) {
		// TODO replace umlauts
		return string
//			.trim()
			.replace(/^[\{\s]*/,"").replace(/[\s\}]*$/,"")
			.replace(/\{?\\"\{?a\}*}/g, "ä").replace(/\{?\\"\{?o\}*}/g, "ö").replace(/\{?\\"\{?u\}*}/g, "ü")
			.replace(/\{?\\"\{?A\}*}/g, "Ä").replace(/\{?\\"\{?O\}*}/g, "Ö").replace(/\{?\\"\{?U\}*}/g, "Ü")
			.replace(/[~ ]-- /g, " &ndash; ")
			.replace(/[\n\r]{2,}/g,"<br/>");
	}
	
	function formatAuthor(authors) {
		// TODO: make sure authors are in correc torder: first last vs. last, first
		
		authors = authors.split(" and ");
		return authors.map(function(a){
			return cleanValue(a);
		}).join(", ");
	}

	function parseCollection(raw) {
		var records = [],
		    current = '',
		    last = '',
			open = 0,
			record = false,
			buffer = '';
		
		for (var i=0; i < raw.length; i++) {
			current = raw.charAt(i);
			
			if (0 == open && '@' == current) { // new record
				record = true;
			}
			else if (record && '{' == current && '\\' != last) { // open a bracket
				open++;
			}
			else if (record && '}' == current && '\\' != last) { // close a bracket
				open--;
				
				if (0 > open) {
					// TODO add line number support
					throw "More brackets were closed than opened";
				}
				
				if (0 == open) { // close a record
					record = false;
					records.push(parseRecord(buffer+current));
					buffer = '';
				}
			}
			
			if (record) {
				buffer += current;
			}
			last = current;
			
		}
		
		if (record) {
			throw "unterminated record: \n" + buffer;
		}
		
		if (open) {
			throw "unblanaced paranthesis: \n" + buffer;
		}
		
		return records;
	}
	
	function parseRecord(raw) {
		
		var record = {_raw:raw},
			open = 0,
			current = ''
			last = '',
			key = false,
			value = false,
			buffer = '',
			_void = null;
	
		// extract type and label
		var tl = raw.match(/@([^\{]+)\s*\{\s*([^,]+),/);
		if (null == tl) {return null;}
		record._type = tl[1];
		record._label = tl[2];
		
		// start parsing
		for (var i = tl[0].length; i<raw.length;i++) {
			current = raw.charAt(i);
			
			if (!key && !value && "=" != current) { // start of a key
				key = true;
			}
			else if (key && !value && 0 == open && "=" == current) { // end of a key
				// store key
				key = buffer.trim().toLowerCase();
				buffer = '';
				
				// start value
				value = true;
				continue;
			}
			else if (value && 0 == open && "," == current && "\\" != last) { // end of a value
				// store entry
				record[key] = buffer.trim();
				buffer = '';
				
				// clean key and close value
				key = false;
				value = false;
				continue;
			}
			else if ((key || value) && "{" == current && "\\" != last) {
				open++;
			}
			else if ((key || value) && "}" == current && "\\" != last) {
				open--;
				if (0 > open) {
					if (i == raw.length -1) {
						record[key] = (buffer+current).trim();
					}
					break;
				}
			}
			
			if (key || value) {
				buffer += current;
				last = current;
			}
		}	
		
		return record;
	}
	
	function formatAuthors(authors){}
	
	context['bibtex'] = Bibtex;
})(require.modules);