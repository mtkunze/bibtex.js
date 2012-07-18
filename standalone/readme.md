# Standalone Application #

This small application showcases the bibtex.js library with the use case, for which I originally developed it. To render a bibtex file of my scientific publications on my research homepage, saving time and effort to render them and maintain them manually. I simply upload my bibtex file and the application takes care of the rest. 

Here I provide it for broad reuse. All that is required is to add a div and a script tag, where you want to render you bibliography.

	<div id="bibliography"></div>
	<script src="https://raw.github.com/mtkunze/bibtex.js/master/standalone/minsa.bibtex.js?path/to/your/?publications.bib|Book|Book Chapter|Journal|Conference|Workshop|Miscellaneous"></script>
	
This requires a file on the [same host](http://en.wikipedia.org/wiki/Same_origin_policy) as the page that shall show your bibliography and allows for some configuration.

## Configuration ##

After the url of the script, follows the configuration of the standalone bibtex application, separated by a question mark (which introduced the [URL query string](http://en.wikipedia.org/wiki/Query_string)).

1. The **path to your bibtex file** must follow immediately. It must be located on the same host as your web page, as it is loaded via Ajax.

2. Optionally following, separated by pipes ("|"), you add a list of categories, your papers should be grouped in.                                               The groups will appear in the same order as specified in the URL query string. Empty groups will not be shown, unless you prepend the name of the category with an exclamation mark ("!").                                                    This requires, that each of your bibtex records has a "_type_" attribute that is set to one of the following values, which will result in the according group:
 * Book: book
 * Book Chapter: bookchapter, chapter
 * Journal: journal, article
 * Conference: conference, conf
 * Workshop: workshop, ws
 * Miscellaneous: <anything else>
For example, the following configuration, will result in printing Conference and  Workshop papers if they are not empty. The Journal section will be shown always, no matter whether it's empty or not. Books, Book Chapters, and Miscellaneous will not be listed.
	<div id="bibliography"></div>
	<script src="https://raw.github.com/mtkunze/bibtex.js/master/standalone/minsa.bibtex.js?path/to/your/?publications.bib|!Journal|Conference|Workshop"></script>

3. If you want to use it in a reliable fashion, you should consider downloading the standalone file (sa.bibtex.js) and put it on your own host or the host.


## Compilation ##

Feel free to use this application and extend it to your needs. The application sources are in standalone.js and the following commands have been used to create the standalone version.

Be aware that the application requires knowledge of its own filename, i.e., to use it uncompressed or with a different filename than sa.bibtex.js, replace the following line in standalone.js.

	var m = script.src.match(/sa\.bibtex\.js\?([^\|]+)(.*)/);

To compress and assemble the files required for the standalone application, I use [yui-compressor](http://developer.yahoo.com/yui/compressor/) and [cat](http://unixhelp.ed.ac.uk/CGI/man-cgi?cat). (I use the alias "_minify_" to call the yui-compressor.)

	minify standalone.js > standalone.min.js && \
	minify ../src/bibtex.js > bibtex.min.js && \
	cat ../lib/shim.min.js ../lib/modules.min.js ../lib/log.min.js ../lib/ajax.min.js ../lib/mustache.min.js bibtex.min.js standalone.min.js > sa.bibtex.js ; \
	rm standalone.min.js ; \
	rm bibtex.min.js