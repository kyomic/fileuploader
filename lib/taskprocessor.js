import EventEmitter from './EventEmitter.js'

import task from './task.js'
import {blob2DataUrl} from './utils.js'
import {TaskProcessorOption} from './options.js'


class TaskProcessor{
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
	addTask( file ){
		this.files.push( file )
	}
	removeTask( file ){
		let idx = this.files.indexOf( file );
		if( idx !=-1){
			this.files.splice( idx, 1);
		}
	}


	onTaskEvent( evt ){
		let task = evt.target;
		console.log('taskevent', evt, 'target',task)
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
					loaded: task.bytesTotal(),
					total:  task.bytesTotal()
				}
				this.context.emit( evt.type, contextEvent )		
				this.next();
				break;
			case 'progress':
				let loaded = this.tasks.reduce(function( total, currentValue, currentIndex, arr ){
					return total + currentValue.bytesLoaded();
				}, 0);
				contextEvent.data = {
					taskid: task.id,
					tasknum: task.blockcount,
					detail: evt.data,
					loaded: task.bytesLoaded(),
					total:  task.bytesTotal()
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
		console.log("working", this.working)
		if( !this.working.length ){
			console.log('all complete')
			this.context.emit('finished', {type:'finished',target: this.context})
		}
		
	}
	run(){
		this.next();
	}
}

export default TaskProcessor