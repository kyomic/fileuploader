"use strict";
(function(){
	var lib = require('./src/lib/index.js');
    var FileUpload = lib;
    if( lib && lib.default ) FileUpload = lib.default; 
	//兼容CommonJs规范
	if (typeof module !== 'undefined' && module.exports) {
    	module.exports = FileUpload;
    }
    //兼容AMD/CMD规范
    if (typeof define === 'function'){
    	define(function() { return FileUpload; });
    }
    self.FileUpload = FileUpload;    
})( self )