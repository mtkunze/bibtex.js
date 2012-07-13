create the minified standalone script:

  minify standalone.js > standalone.min.js
  minify ../bibtex.js > bibtex.min.js
  cat ../lib/shim.min.js ../lib/modules.min.js ../lib/log.min.js ../lib/ajax.min.js ../lib/mustache.min.js bibtex.min.js standalone.min.js > minsa.bibtex.js