(function(){
	var emitter = require('./EventEmitter.js');
	var work = require('webworkify-webpack');
	var task_inline = require('./task-inline.js');
	var utils = require('./utils');

	/**
	 * @param {Uploader} context - 上传对象
	 * @param {FileStream} file - 文件流数据
	 * @param {Object} option - 上传服务器配置信息,参考Uploader.option
	 */
	var task = function( context, file, option ){
		emitter(this);
		this.observer = null;
		var self = this;
		this.worker = null; 

		this.context = context;
		this.evtOnWorkerMessage = this.onWorkerMessage.bind(this);
		console.log('task', arguments)
		if( typeof Worker !='undefined' && context.option.worker ){
			console.log('开启Workder');
			try{
				this.worker = work( require.resolve('./task-worker.js'));
				console.log('wk',this.worker)
				this.worker.addEventListener('message', this.evtOnWorkerMessage )
				this.worker.onerror = function( evt ){
					console.log('worker error:', evt)
					self.emit('error',{type:'error'});
				}
				var target = utils.deepClone( context );
				var up = {};
				var injects = [];
				for(var i in target){
					if( typeof target[i]!='function' ){
						up[i] = target[i];
					}else{
						//var blob = new Blob([ target[i].toString() ], { type: "text/javascript" })
						up[i] = target[i].toString()
					}
				}
				delete up._fileReference;
				delete up._option.files;
				delete up._option.serverConfig;
				delete up.tasks
				console.log('target',up)
				this.worker.postMessage({ 
					cmd: 'init',  
					context:up, 
					file:file, 
					option:option
				});
				for(var i=0;i<injects.length;i++){
					this.worker.postMessage({
						cmd:'inject',
						fun:injects[i]
					})
				}

			}catch( e ){
				console.log(e)
				//this.observer = new task_inline( context, file, option );
			}			
		}
	};
	task.prototype.onWorkerMessage = function( evt ){
		//target is taskprocessor
		var target = evt.target;
		console.log("onWorkerMessage---------", evt, this)
		var evt = evt.data;
		this.emit( evt.type, evt );
		switch( evt.type ){
			case 'complete':
			case 'error':
				if( this.worker ){
					this.worker.terminate();
				}
				break;
		}
	};
	//兼容CommonJs规范
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = task;
    }
    //兼容AMD/CMD规范
    if (typeof define === 'function'){
        define(function() { return task; });
    }
})();