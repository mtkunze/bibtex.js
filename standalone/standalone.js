var Ajax = require('ajax'),
    Bibtex = require('bibtex'),
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
    bibsrc = null,
	container = document.getElementById("bibliography");

Array.prototype.forEach.call(document.getElementsByTagName("script"), function(script){
	var m = script.src.match(/minsa\.bibtex\.js\?(.*)/);
	if (m) {
		bibsrc = m[1];
	}
});

if (null == bibsrc) {
	alert("Unable to load publication list.");
	throw "Unable to load publication list"
}

function toggle(id) {
	var e = document.getElementById(id);
	if (e) {
		if (e.style.display == "none" || e.style.display == "") {
			e.style.display = "block"
		}
		else {
			e.style.display = "none";
		}
	}
}

new Ajax.Request(bibsrc, {
	onSuccess: function(xhr) {
		var b = new Bibtex(xhr.responseText),
			Log = require('log');
		
		b.parse();
		b.records.reverse();
		
		var groups = {
			"Conference": [],
			"Workshop": [],
			"Miscellaneous": []
		};
		
		b.records.forEach(function(r){
			var t = (r.type || "").replace(/^[\{\s]*/,"").replace(/[\s\}]*$/,"");
			
			if (-1 < ["conference", "conf", "c"].indexOf(t)) {
				groups["Conference"].push(r);
			}
			else if (-1 < ["workshop", "ws"].indexOf(t)) {
				groups["Workshop"].push(r);
			}
			else {
				groups["Miscellaneous"].push(r);
			}
		});
		
		if (0 == groups["Conference"].length && 0 == groups["Workshop"].length) {
			var l = document.createElement("ul");
			    l.className = "bib"
			    l.innerHTML = Bibtex.format(groups["Miscellaneous"], pattern)
			container.appendChild(l);
		}
		else {
			for (t in groups) {
				if (groups[t].length > 0) {
					var h = document.createElement("h3");
					    h.innerHTML = t;
					var l = document.createElement("ul");
         			    l.className = "bib"
					    l.innerHTML = Bibtex.format(groups[t], pattern)
				
					container.appendChild(h);
					container.appendChild(l);
				}
			}
		}
	}
});