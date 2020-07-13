(function(){

	let {FileUpload } = require('./lib/index.js');
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