/***********************************************************************

The MIT License (MIT)

Copyright 2020 (c) kyomic <kyomic@163.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
***********************************************************************/
;(function(){
  var emitter = require('./EventEmitter.js');
  var work = require('webworkify-webpack');
  var task_inline = require('./task-inline.js');
  var utils = require('./utils');
  var removeItemFromArray = utils.removeItemFromArray;
  var DEBUG = false;
  /**
   * @param {Uploader} context - 上传对象
   * @param {FileStream} file - 文件流数据
   * @param {Object} option - 上传服务器配置信息,参考Uploader.option
   */
  var task = function( context, file, option ){
    emitter(this);
    this.observer = null;
    var self = this;
    DEBUG = !!context.option.debug;
    this.worker = null; 
    this.file = file;
    this.context = context;
    this.running = true;
    this.evtOnWorkerMessage = this.onWorkerMessage.bind(this);
    if( typeof Worker !='undefined' && context.option.worker ){
      DEBUG && console.log('开启Workder');
      try{
        this.worker = work( require.resolve('./task-worker.js'));
        this.worker.addEventListener('message', this.evtOnWorkerMessage )
        this.worker.onerror = function( evt ){
          self.running = false;
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
        this.observer = new task_inline( context, file, option );
      }      
    }else{
      this.observer = new task_inline( context, file, option );
    }
    if( this.observer ){
      ['complete','error','progress'].map(evt=>{
        this.observer.on(evt, this.onTaskMessage.bind(this) );
      })
      
    }
  };
  task.prototype.onWorkerMessage = function( evt ){
    //target is taskprocessor
    var target = evt.target;
    DEBUG && console.log("onWorkerMessage---------", evt, this)
    var evt = evt.data;
    this.emit( evt.type, evt );
    switch( evt.type ){
      case 'complete':
      case 'error':
        if( evt.type == 'complete'){
          this.complete = true;
        }
        this.running = false;
        this.abort();
        break;
    }
  };
  task.prototype.onTaskMessage = function( evt ){
    switch( evt.type ){
      case 'complete':
      case 'error':
        if( evt.type == 'complete'){
          this.complete = true;
        }
        this.running = false;
    }
    this.emit( evt.type, evt );
  };
  task.prototype.abort = function(){
    if( this.running ){
      if( this.worker ){
        this.worker.terminate();
      }
      if( this.observer ){
        this.observer.abort();
      }
      if( !this.complete ){
        this.emit('error',{type:'error',code:5001,message:'user abort'})
      }
    }
    this.running = false;
    
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