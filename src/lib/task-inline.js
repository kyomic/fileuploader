/***********************************************************************

The MIT License (MIT)

Copyright 2020 (c) kyomic <kyomic@163.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
***********************************************************************/
;(function( context ){
  var emitter = require('./EventEmitter.js');
  var utils = require('./utils');
  var stringToFunction = utils.stringToFunction;
  var removeItemFromArray = utils.removeItemFromArray;
  var DEBUG = false;
  var createXHR = function(){
    if(typeof XMLHttpRequest!="undefined"){ 
      XMLHttpRequest.prototype.sendAsBinaryString = function(datastr) {
    　　function byteValue(x) {
    　　     return x.charCodeAt(0) & 0xff;
    　　}
    　　var ords = Array.prototype.map.call(datastr, byteValue);
    　　var ui8a = new Uint8Array(ords);
    　　this.send(ui8a.buffer);
  　　}
      if (!XMLHttpRequest.prototype.sendAsBinary) {
        XMLHttpRequest.prototype.sendAsBinary = function (sData) {
          var nBytes = sData.length, ui8Data = new Uint8Array(nBytes);
          for (var nIdx = 0; nIdx < nBytes; nIdx++) {
            ui8Data[nIdx] = sData.charCodeAt(nIdx) & 0xff;
          }
          /* send as ArrayBufferView...: */
          this.send(ui8Data);
          /* ...or as ArrayBuffer (legacy)...: this.send(ui8Data.buffer); */
        };
      }
      return new XMLHttpRequest();
    }
    return null;
  }

  var fixFunction = function( func ){
    if( typeof func == 'string'){
      var fun = '';
      try{
        fun = stringToFunction( func );
      }catch( e ){}
      if( typeof fun == 'function'){
        return fun;
      }else{
        return '';
      }
    }
    return func;
  }

  /**
   * @param {blob/base64} blob - 数据块
   */
  var processer = function( task, blob, index, option, onsuccess, onfail, onprogress ){
    var xhr = createXHR();
    var self = this;
    self.index = index;
    var upload = function(){
      if( self._aborted ) return;
      DEBUG && console.log("上传开始", task, '序号', self.index)
      var method = option.method;
      var url = option.url;
      var type = option.type || 'form'
      var pack = option.pack || 'url'
      var dataName = option.data || 'file'
      var dataFileName = option.dataname || 'filename'
      if( !xhr ){
        onfail({code:100});
        return;
      }
      var data = null;
      var file = task.file;
      var uploader = task.uploader;
      var params = {}
      params[ dataName ] = blob;
      params[ dataFileName ] = file.name;

      let func = fixFunction( uploader.injectUploadParams );
      if( func ){  
        var injectParams = func.call( uploader,  file, blob, index );
        params = Object.assign( params, injectParams || {})
      }else{
        params.index = index;
      }
      func = fixFunction( uploader.injectUploadHeader );
      if( func ){
        var injectHeader = func.call( uploader,  file, blob, index );
        for(var i in injectHeader ){
          try{
            xhr.setRequestHeader(i, injectHeader[i]);
          }catch(e){
            console.warn('injectHeader' + i + " is valid header");
          }
        }        
      }
      if( uploader.injectUploadComplete ){
        params.fileid = file.id;
      }
      switch( type ){
        case 'form':
          data = new FormData();    
          for(var i in params ){
            data.append( i, params[i] )
          }
          break;
        case 'binary':
          data = file.data
          break;
        case 'base64':
          if( pack == 'url'){
            let tmp = [];
            for(var i in params){
              tmp.push( i + "=" + params[i] )
            }
            data = tmp.join("&");
          }else{
            data = JSON.stringify(params)
          }
          break;
      }
      
        xhr.onload = function (evt) {
          if( self._aborted ) return;
            if (this.readyState == 4) {
              if( this.status >= 200 && this.status < 300  ){
                onsuccess && onsuccess.call(self, this.responseText, this )
              }              
            };
        }
        xhr.onerror = function(evt){
          console.error('xhr error',evt)
          if( self._aborted ) return;
          onfail && onfail( this.responseText, this )
        }
        xhr.ontimeout = function (evt) {
            //obj.onfail && obj.onfail(xhr);
        };
        xhr.onprogress = function(evt){
            //console.log("下载进度",evt.loaded, evt.total, evt)
        };
        xhr.upload.onprogress = function(xhr){
            return function(evt){
                var isready = false;
                var text = xhr.responseText;
                if( self._aborted ) return;
                if( evt.lengthComputable ){
                  //console.log("上传进度",evt.loaded, evt.total, evt)
                    onprogress && onprogress.call(self, evt.loaded, evt.total, text, this );
                }
            }
        }( xhr );
        xhr.upload.onloadstart = function(){
        };
        xhr.open( method , url, true);
      //xhr.setRequestHeader('Content-type', 'application/json')
        //xhr.withCredentials = true // 使外部脚本中的post请求头携带当前域的Cookies
      //xhr.timeout = 10000;
        xhr.send( data );
    }
    if( option.type == 'base64'){
      if( typeof blob == 'string'){
        //base64 blob
        upload();
      }else{
        var reader = new FileReader();
        reader.readAsDataURL( blob );
        reader.onload = function(){
          var base64 = reader.result;
          let arr = base64.split(','), mime = arr[0].match(/:(.*?);/)[1];
          blob = arr[1];
          upload();
        };
      }
      
    }else{
      upload();
    }
    /*
    this.abort = function(){
      if(  xhr ){

        try{
          xhr.abort();
        }catch(e){}
        
      }
    }*/
  }
  processer.prototype.abort = function(){
    this._aborted = true;
  }
  
  var task_inline = function( context, file, option ){
    emitter( this );
    var self = this;
    this.uploader = context;
    this.file = file;
    this.option = option;
    this.working = [];
    this.workingCurrent = null;

    this.maxthread = 0;
    this.loadIndex = 0;
    this.blocksize = -1;
    this.bytesLoaded = 0;
    this.bytesTotal = 0;
    this.id = file.id || file._id; //Worker读id

    //上传完成进度
    this.loadProgress = [];
    //忽略的文件块索引
    this.ignoreFragsIndex = [];

    var uploadOption = this.uploader.option || this.uploader._option;
    DEBUG = !!uploadOption.debug;
    if( uploadOption.blockSize >0 ){
      this.blocksize = uploadOption.blockSize;
    }
    if( uploadOption.taskThreadCount ){
      this.maxthread = uploadOption.taskThreadCount;
    }
    DEBUG && console.log('执行任务:',file, option,"线程数", this.maxthread)
    

    var blob = file.blob;
    if( !blob ){
      DEBUG && console.error("找不到数据块");
      return;
    }
    var frags = this.frags = [];
    if( blob instanceof Blob ){
      if( this.blocksize <0 ){
        this.blockcount = 1;
      }else{
        this.blockcount = Math.ceil(blob.size / this.blocksize);
      }
      this.bytesTotal = blob.size;
    }else{
      this.blockcount = 1;
    }

    if( file.type == 'base64'){
      frags.push( blob );
    }else{
      var slice = blob.slice || blob.webkitSlice || blob.mozSlice;
      for(var i=0;i< this.blockcount;i++){
        frags[i] = slice.call( blob, i* this.blocksize, Math.min(file.size, (i+1)*this.blocksize ));
      }
    }
    DEBUG && console.log("frags", frags, self)
    var fun = fixFunction( self.uploader.injectUploadCompleteStatus )
    if( fun ){
      self.workingCurrent = new processer( self, file.blob, 0, self.option, function( response, xhr ){
        var res = null;
        try{
          res = fun( file, response )
        }catch( e ){}
        if( res ){
          if( typeof res == 'boolean' ){
            for(let i=0;i<frags.length;i++){
              self.updateLoadProgress( frags[i].size, frags[i].size, i);
            }
            self.emit('progress', {
              type:'progress',
              target: self,
              data:self.loadProgress        
            })

            self.emit('complete',{type:'complete', target: self, data: {
              file:file,
              response: response
            } })
          }else{
            self.ignoreFragsIndex = res.concat();
            for( let i=0;i<frags.length;i++){
              if( self.ignoreFragsIndex.indexOf(i)!=-1 ){
                self.updateLoadProgress( frags[i].size, frags[i].size, i);
              }
            }
            self.emit('progress', {
              type:'progress',
              target: self,
              data:self.loadProgress        
            })
            self.run();    
          }      
        }else{
          self.run();
        }
      } , function( response, xhr ){
        self.emit('error',{type:'error', target:self, data:xhr })
        self.run();
      })
    }else{
      self.run();
    }
  }

  task_inline.prototype.removeProcess = function( processer ){
    var working = this.working;
    if( working ){
      var idx = working.indexOf( processer );
      if( idx !=-1){
        working.splice(idx,1);
      }
    }
  }

  task_inline.prototype.updateLoadProgress = function( loaded, total, index ){
    let taskProgress = this.loadProgress[ index ];
    if( !taskProgress ){
      taskProgress = {};
      this.loadProgress[index] = taskProgress;
    }
    taskProgress.loaded = loaded;
    taskProgress.total  = total;
    taskProgress.index = index;
    taskProgress.count = this.blockcount;
    return this.loadProgress;
  }

  /**
   * 运行下一个任务
   * @param {processer} toberemove - 已经完成和处理过程
   * @param {string} response - 当前完成的过程的服务端响应文本
   * @param {XMLHTTPRequest} xhr - 当前完成的过程的requeset实例
   */
  task_inline.prototype.run = function( toberemove, response, xhr  ){
    var working = this.working;
    if( toberemove ){
      this.removeProcess( toberemove );
    }
    var self = this;
    var frags = this.frags;
    var ingoreIndexs = this.ignoreFragsIndex;
    while( working.length <3){
      var frag = null;
      while( true ){
        frag = frags.shift();
        if( ingoreIndexs.indexOf( this.loadIndex )==-1){
          break;
        }
        if( !frag ){
          break;
        }
        this.loadIndex += 1;
      }
      if( !frag ){
        break;
      }
      var pro = new processer( this, frag, this.loadIndex, this.option, function( response, xhr ){
        //this指向 processer
        self.run( this, response );
      } , function( response, xhr ){
        self.emit('error',{type:'error', target:self, data:xhr })
        self.run( this, response );
      }, function( loaded, total, response,xhr ){
        self.updateLoadProgress( loaded, total, this.index );
        if( self.blockcount >0 ){
          var blockLoaded = 0;
          for( var i=0;i<self.loadProgress.length;i++){
            blockLoaded += self.loadProgress[i] ? self.loadProgress[i].loaded :0;
          }
          self.bytesLoaded = blockLoaded;
        }else{
          self.bytesLoaded = loaded;
        }
        
        //fix
        //base64或blob上传时total有可能大于文件大小
        if( total > self.bytesTotal ){          
          self.bytesTotal = Math.max( total, self.bytesTotal );
        }        
        self.emit('progress', {
          type:'progress',
          target: self,
          data:self.loadProgress        
        })
      })
      working.push( pro )
      this.loadIndex += 1;
    }
    if( !working.length && toberemove ){
      DEBUG && console.log("上传完毕")
      this.emit('complete',{type:'complete', target: this, data:{
        file: this.file,
        response:response
      }})
          
    }
  }
  
  task_inline.prototype.abort = function(){
    if( this.workingCurrent ){
      this.workingCurrent.abort();
    }
    for(var i=0;i< this.working.length;i++){
      this.working[i].abort();
    }
  }
  //兼容CommonJs规范
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = task_inline;
    }
    //兼容AMD/CMD规范
    if (typeof define === 'function'){
        define(function() { return task_inline; });
    }
})(self);