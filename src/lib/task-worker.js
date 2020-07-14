/***********************************************************************

The MIT License (MIT)

Copyright 2020 (c) kyomic <kyomic@163.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
***********************************************************************/
;(function( context ){
	var task_inline = require("./task-inline.js");
	var task_worker = function(){

	}
	var task = null;
	var onTaskEvent = function( evt ){
		self.postMessage( evt );
		switch( evt.type ){
			case 'complete':
				self.close();
				break;
		}
	}
	self.addEventListener('message',function( evt ){
		var data = evt.data;
		switch( data.cmd ){
			case 'init':
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