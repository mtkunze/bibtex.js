/******************************************************************************
 * Bibtex parser
 *
 * this is work inprogress and only accepts the most common bibtex files
 *
 * for completeness, compare with:
 * http://maverick.inria.fr/~Xavier.Decoret/resources/xdkbibtex/bibtex_summary.html
 *
 */

// start code
if ("function" != typeof(require)) {
	throw "modules library required";
}

(function(context) {
	
	//var Mustache = require('mustache');

	
	var Log = require('log');
	
	var Bibtex = function(raw) {
		this.raw = raw;
		this.records = [];
	};
	
	// isntance properties
	Object.extend(Bibtex.prototype, {
		
		// public properties
		raw: '',
		
		records: [], // raw set of reords, includes duplicates etc
		
		getRecords: function() {
			var records = {};
			this.records.forEach(function(r){
				if (r) {
					records[r._label] = r;
				}
			});
			return records;
		},
				
		// public methods
		parse: function(log) {
			if (!!log && "function" == typeof(log.warn)) {
				Log = log;
			} 
			this.records = parseCollection(this.raw);
		},
		
		// TODO: escaping of delimiters and quotes, preserving of special characters and line feeds
		// See http://tools.ietf.org/html/rfc4180
		toCSV: function() {
			var keys = isArray(arguments[0]) ? arguments[0] : Array.apply(Array, arguments);
			return this.records.map(function(r) {
				return keys.map(function(k) {
					if ("function" == typeof(k)) {
						return k(r);
					} // else
					return Bibtex.cleanValue(r[k]);
				}).map(function(f){
					// TODO escape delimiters and special charactes
					return "\""+f.replace(/\"/g, "\"\"")+"\"";
				}).join(Bibtex.CSV_FIELD_DELIMITER);
			}).join(Bibtex.CSV_RECORD_DELIMITER);
		}
	});
	
	// static properties
	Object.extend(Bibtex, {
		
		/*
		 * configuration settings 
		 */
		CSV_FIELD_DELIMITER : ";",
		CSV_RECORD_DELIMITER : "\n",
		
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
						r[k] = Bibtex.formatAuthor(r[k])
					}
					else if ("_raw" == k) {
						// ignore
					}
					else {
						r[k] = Bibtex.cleanValue(r[k]);
					}
				}
				
				return Mustache.render(ptn, r);
			}).join("");
		},
		
		cleanValue: function (string) {
			if ("undefined" == typeof(string) || "function" != typeof(string.toString)) {
				return "";
			}
			
			// TODO replace umlauts
			return string.toString()
	//			.trim()
				.replace(/^[\{\s]*/,"").replace(/[\s\}]*$/,"")
				.replace(/\{?\\"\{?a\}*/g, "ä").replace(/\{?\\"\{?o\}*/g, "ö").replace(/\{?\\"\{?u\}*/g, "ü")
				.replace(/\{?\\"\{?A\}*/g, "Ä").replace(/\{?\\"\{?O\}*/g, "Ö").replace(/\{?\\"\{?U\}*/g, "Ü")
				.replace(/\{?\\'\{?\\i\}*/g, "í").replace(/\{\\~n\}*/g, "ñ")
				.replace(/[~ ]-- /g, " &ndash; ")
				.replace(/[\n\r]{2,}/g,"<br/>");
		},

		formatAuthor: function(author) {
			// TODO: make sure authors are in correct order: first last vs. last, first
			
			if ("undefined" == typeof(author) || "function" != typeof(author.toString)) {
				return "";
			}
			

			author = author.toString().split(" and ");
			return author.map(function(a){
				return Bibtex.cleanValue(a);
			}).join(", ");
		}
	});
	
	function isNot(o) {
		return null === o || "undefined" == typeof(o);
	}
	
	function isString(o) {
		return !isNot(o) && "function" == typeof(o.substring);
	}
	
	function isArray(o) {
		return !isNot(o) && "function" == typeof(o.forEach);
	}

	function parseCollection(raw) {
		var records = [],
		    current = '',
		    last = '',
			open = 0,
			record = false,
			buffer = '',
			lastStart = Infinity;
			
		var i = 0;
		
		while(lastStart > -1) {
			try {
			
				for (; i < raw.length; i++) {
					current = raw.charAt(i);
			
					if ('@' == current) { 
						if (0 == open){ 
							// new record, everything is fine
							record = true;
							lastStart = Infinity;
						}
						else { 
							// we found an @, where we didn't expect it
							// it could be part of a field's value though
							lastStart = Math.min(i, lastStart);
						}
					}
					else if (record && '{' == current && '\\' != last) { // open a bracket
						open++;
					}
					else if (record && '}' == current && '\\' != last) { // close a bracket
						open--;
			
						if (0 > open) {
							// this can never happen, can it?
							throw "More brackets were closed than opened";
						}
			
						if (0 == open) { // close a record
							record = false;
							records.push(parseRecord(buffer+current));
					
							buffer = '';
							lastStart = Infinity;
						}
					}
		
					if (record) {
						buffer += current;
					}
					last = current;
				}
			
				// if there are leftovers
				if (record) {
					throw("unterminated record");
				}
		
				if (open) {
					throw("unblanaced paranthesis");
				}
				
				// everything is fine
				lastStart = -1;
				
			} catch (e) {
				// try to recover from last found @
				Log.warn(e + buffer);
			
				record = false;
				open = 0;
				buffer = '';
				last = '';
				i = lastStart;
			}
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
			else if (value && 0 == open && "," == current && "\\" != last) { 
				// end of a value
				
				// store entry
				if (key.length > 0) {
					record[key] = buffer.trim();
					buffer = '';
				}
				
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
					if (i == raw.length -1 && // we're at the end of the record
						isString(key) && key.length >  0) // the key must not be empty
						{
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
	
	context['bibtex'] = Bibtex;
})(require.modules);