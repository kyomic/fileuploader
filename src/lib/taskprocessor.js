/***********************************************************************

The MIT License (MIT)

Copyright 2020 (c) kyomic <kyomic@163.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
***********************************************************************/
import EventEmitter from './EventEmitter.js'

import task from './task.js'
import {blob2DataUrl} from './utils.js'
import {TaskProcessorOption} from './options.js'


class TaskProcessor{
	/** 
	 * 构造器
	 * @param {TaskProcessorOption} option - 任务处理选项参数
	 * @param {Uploader} context - 上传实例
	 */
	constructor( option, context ){
		EventEmitter(this)
		this.context = context; //UploadInstance
		this.option = Object.assign(Object.assign({}, TaskProcessorOption), option||{});
		this.files = [];
		this.tasks = [];

		this.bytesStart = 0; //下载开始字节位置
		this.bytesLoaded = 0; //总共下载字节
		this.evtOnTaskEvent = this.onTaskEvent.bind( this );
	}
	/**
	 * 添加文件流任务
	 * @param {FileStream} file - 文件流，类似File对象 
	 */
	addTask( file ){
		this.files.push( file )
	}
	/**
	 * 移除文件流任务
	 * @param {FileStream} file - 文件流，类似File对象 
	 */
	removeTask( file ){
		let idx = this.files.indexOf( file );
		if( idx !=-1){
			this.files.splice( idx, 1);
		}
	}


	onTaskEvent( evt ){
		let task = evt.target;
		let contextEvent = {
			type:evt.type,
			target: this.context
		}
		switch( evt.type ){
			case 'complete':
				this.remove( task );
				contextEvent.data = {
					taskid: task.id,
					tasknum: task.blockcount,
					detail: evt.data,
					loaded: task.bytesTotal,
					total:  task.bytesTotal
				}
				this.context.emit( evt.type, contextEvent )		
				this.next();
				break;
			case 'progress':
				let loaded = this.tasks.reduce(function( total, currentValue, currentIndex, arr ){
					return total + currentValue.bytesLoaded;
				}, 0);
				contextEvent.data = {
					taskid: task.id,
					tasknum: task.blockcount,
					detail: evt.data,
					loaded: task.bytesLoaded,
					total:  task.bytesTotal
				}
				this.context.emit( evt.type,  contextEvent )
		}
	}

	remove( task ){
		if( this.working ){
			let idx = this.working.indexOf( task );
			if( idx !=-1){
				this.working.splice( idx, 1);
			}
		}
	}

	next(){
		if( !this.working ){
			this.working = [];
		}
		let opt = this.context.option;
		let taskCount = 0;
		if( opt.taskCount > 0){
			taskCount = opt.taskCount;
		}
		while( this.working.length < taskCount ){
			let file = this.files.pop();
			if( !file ){
				break;
			}
			
			let proc = new task( this.context, file, this.option );
			proc.on('complete', this.evtOnTaskEvent );
			proc.on('error', this.evtOnTaskEvent );
			proc.on('progress', this.evtOnTaskEvent );
			this.working.push( proc );
			this.tasks.push( proc );
			
		}
		if( !this.working.length ){
			this.context.emit('finished', {type:'finished',target: this.context});
		}
		
	}
	run(){
		this.next();
	}
}

export default TaskProcessor