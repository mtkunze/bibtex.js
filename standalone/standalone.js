	// load modules
var Ajax = require('ajax'),
    Bibtex = require('bibtex'),

	// mustache.js pattern to render bibtex records
	pattern = 
		"<li id='{{_label}}'>{{author}}. "+
		"<em> {{{title}}}. </em> "+
		"{{#booktitle}}In {{booktitle}}. {{/booktitle}}"+
		"{{#pages}} pages {{pages}}, {{/pages}}"+
		"{{#publisher}} {{publisher}}, {{/publisher}}"+
		" {{year}}."+
		"<small>"+
		"{{#abstract}} <a href='#{{_label}}' onclick='toggle(\"{{_label}}_abstract\");return false;'>abstract</a> |{{/abstract}}"+
		"{{#url}} <a target='_top' href='{{url}}'>paper</a> |{{/url}}"+
		" <a href='#{{_label}}' onclick='toggle(\"{{_label}}_bibtex\");return false;'>bibtex</a>"+
		"</small>"+
		"{{#abstract}}<p class='toggle' style='display:none' id='{{_label}}_abstract' title='abstract'>{{{abstract}}}</p>{{/abstract}}"+
		"<pre class='toggle' style='display:none' id='{{_label}}_bibtex' title='bibtex'>{{_raw}}</pre>"+
		"</li>",
	
	// toggle display function as required by the pattern	
	toggle = function toggle(id) {
		var d = document.getElementById(id) && document.getElementById(id).style.display;
		if (d) {
			if (d == "none" || d == "") {
				d = "block"
			}
			else {
				d = "none";
			}
		}
	},
	
	// categories and keywords to be found in type attribute of bibtex record
	categories = {
		"Book": /book/,
		"Book Chapter": "/bookchapter|chapter/",
		"Journal": /journal|article|jnl/,
		"Conference": /conference|conf/,
		"Workshop": /workshop|ws/,
		"Miscellaneous": /.*/
	},
	
	// variables
    bibsrc = null,
	selected_categories = null,
	container = document.getElementById("bibliography");

// read configuration
// <script src="sa.bibtex.js?path/to/pub.bib|Book|Journal|Conference|Workshop|Miscellaneous"></script>
Array.prototype.forEach.call(document.getElementsByTagName("script"), function(script){
	var m = script.src.match(/sa\.bibtex\.js\?([^\|]+)(.*)/);
	if (m) {
		bibsrc = m[1];
		selected_categories = m[2].split("|").filter(function(c){return c.trim().length > 0})
	}
});

if (null == bibsrc) {
	alert("Unable to load publication list.");
	throw "Unable to load publication list"
}

new Ajax.Request(bibsrc, {
	onSuccess: function(xhr) {
		var b = new Bibtex(xhr.responseText),
			groups = {};
		
		b.parse();
		b.records.reverse();
		
		if (selected_categories.length > 0) {
			// group records by type, leave out those not mentioned
			b.records.forEach(function(r) {
				// remove leading and trailing curly braces and trim whitespaces
				var t = (r.type || "").replace(/^[\{\s]*/,"").replace(/[\s\}]*$/,"").trim();
				
				for (var i=0; i<selected_categories.length;i++) {
					
					// trim whitespaces and remove leading !
					var c = unescape(selected_categories[i].trim().replace(/^!/g,""));
					
					// match to group
					if (t.match(categories[c])) {
						groups[c] = groups[c] || [];
						groups[c].push(r);
						break;
					}
				}
			});
						
			// print on page
			selected_categories.forEach(function(c) {
				
				// print group if not empty or not forced (by leading !)
				if (c.match(/^!/) || "undefined" != typeof(groups[c])) {
					var h = document.createElement("h3");
					    h.innerHTML = unescape(c.replace(/^!/,""));
					var l = document.createElement("ul");
         			    l.className = "bib"
					    l.innerHTML = Bibtex.format(groups[c.replace(/^!/,"")], pattern)
				
					container.appendChild(h);
					container.appendChild(l);					
				}
			});
		}
		else {
			// print on page without grouping
			var l = document.createElement("ul");
			    l.className = "bib"
			    l.innerHTML = Bibtex.format(b.records, pattern)
			container.appendChild(l);
		}
	}
});