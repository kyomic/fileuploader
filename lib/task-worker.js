(function( context ){
	var task_inline = require("./task-inline.js");
	var task_worker = function(){

	}
	var task = null;
	var onTaskEvent = function( evt ){
		console.log("----taskevent", evt)
		self.postMessage( evt );
		switch( evt.type ){
			case 'complete':
				self.close();
				break;
		}
	}
	self.addEventListener('message',function( evt ){
		var data = evt.data;
		console.log("message", evt)
		switch( data.cmd ){
			case 'init':
				console.log("worki init.")
				task = new task_inline( data.context, data.file, data.option );
				task.on('complete', onTaskEvent );
				task.on('error', onTaskEvent );
				task.on('progress', onTaskEvent );
				break;
		}
	})
	//兼容CommonJs规范
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = task_worker;
    }
    //兼容AMD/CMD规范
    if (typeof define === 'function'){
        define(function() { return task_worker; });
    }
})(self);