"use strict";
(function(){
	let {FileUpload} = require('./src/lib/index.js');
    console.log("%c"+"fileuploader ver:"+FileUpload.version+" build:"+ FileUpload.build +"%c kyomic@163.com","color:#666;font-size:9px", "color:#f86400");

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