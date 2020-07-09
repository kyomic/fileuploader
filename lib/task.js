(function(){
	var emitter = require('./EventEmitter.js');
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


	/**
	 * @param {blob/base64} blob - 数据块
	 */
	var processer = function( task, blob, index, option, onsuccess, onfail, onprogress ){
		var xhr = createXHR();
		var self = this;
		self.index = index;
		var upload = function(){
			console.log("_____上传开始", task, '序号', self.index)
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

			if( uploader.injectUploadParams ){
				var injectParams = uploader.injectUploadParams.call( uploader,  file, blob, index );
				params = Object.assign( params, injectParams || {})
			}else{
				params.index = index;
			}
			if( uploader.injectUploadHeader ){
				var injectHeader = uploader.injectUploadHeader.call( uploader,  file, blob, index );
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
		        if (this.readyState == 4) {
		        	if( this.status >= 200 && this.status < 300  ){
		        		onsuccess && onsuccess.call(self, this.responseText, this )
		        	}	            
		        };
		    }
		    xhr.onerror = function(evt){
		    	onfail && onfail( this.responseText, this )
		    }
		    xhr.ontimeout = function (evt) {
		        //obj.onfail && obj.onfail(xhr);
		    };
		    xhr.onprogress = function(evt){
		        console.log("下载进度",evt.loaded, evt.total, evt)
		    };
		    xhr.upload.onprogress = function(xhr){
		        return function(evt){
		            var isready = false;
		            var text = xhr.responseText;
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
	}
	
	var task = function( context, file, option, onsuccess, onfail, onprogress ){
		emitter( this );
		var self = this;
		this.uploader = context;
		this.file = file;
		this.option = option;
		this.working = [];
		this.maxthread = 0;
		this.loadIndex = 0;
		this.blocksize = -1;
		this._bytesLoaded = 0;
		this._bytesTotal = 0;
		this.id = file.id;
		this.loadProgress = [];

		console.log('执行任务:',file, option)
		var uploadOption = this.uploader.option;
		if( uploadOption.blockSize >0 ){
			this.blocksize = uploadOption.blockSize;
		}
		if( uploadOption.taskThreadCount ){
			this.maxthread = uploadOption.taskThreadCount;
		}
		console.log("线程数", this.maxthread)
		

		var blob = file.blob;
		if( !blob ){
			console.error("找不到数据块");
			return;
		}
		frags = [];
		if( blob instanceof Blob ){
			if( this.blocksize <0 ){
				this.blockcount = 1;
			}else{
				this.blockcount = Math.ceil(blob.size / this.blocksize);
			}
			this._bytesTotal = blob.size;
		}

		if( file.type == 'base64'){
			frags.push( blob );
		}else{
			var slice = blob.slice || blob.webkitSlice || blob.mozSlice;
			for(var i=0;i< this.blockcount;i++){
				frags[i] = slice.call( blob, i* this.blocksize, Math.min(file.size, (i+1)*this.blocksize ));
			}
		}
		console.log("frags", frags, self)
		
		if( self.uploader.injectUploadComplete ){
			console.log("尝试秒传")
			new processer( self, file.blob, 0, self.option, function( response, xhr ){
				var res = null;
				try{
					res = self.uploader.injectUploadComplete( file, response )
				}catch( e ){

				}
				if( res ){
					console.log("上传完毕")
					console.log("秒传")
					self.emit('complete',{type:'complete', target: self, data: {
						file:file,
						response: response
					} })
					onsuccess && onsuccess( file )
				}else{
					console.log("_____self", self)
					self.run();
				}
			} , function(err){
				//error
				console.error(err)

				self.run();
			})
		}else{
			self.run();
		}
	}

	task.prototype.bytesLoaded = function(){
		return this._bytesLoaded;
	}
	task.prototype.bytesTotal = function(){
		return Math.max( this._bytesTotal, this._bytesLoaded);
	}

	/**
	 * 运行下一个任务
	 * @param {processer} toberemove - 已经完成和处理过程
	 * @param {string} response - 当前完成的过程的服务端响应文本
	 * @param {XMLHTTPRequest} xhr - 当前完成的过程的requeset实例
	 */
	task.prototype.run = function( toberemove, response, xhr  ){
		var working = this.working;
		if( toberemove ){
			var idx = working.indexOf( toberemove );
			if( idx !=-1){
				working.splice(idx,1);
			}
			console.log("REMOVE>...........",toberemove, working)
		}
		var self = this;

		while( working.length <3){
			var frag = frags.shift();
			if( !frag ){
				break;
			}
			var pro = new processer( this, frag, this.loadIndex, this.option, function( response, xhr ){
				//this指向frag
				self.run( this, response );
			} , function( response, xhr ){
				self.run( this, response );
			}, function( loaded, total, response,xhr ){
				self._bytesLoaded += loaded;
				//fix
				//base64或blob上传时total有可能大于文件大小
				if( total > self._bytesTotal ){
					self._bytesLoaded = total;
				}
				let taskProgress = self.loadProgress[ this.index ];
				if( !taskProgress ) taskProgress = {};
				taskProgress.loaded = loaded;
				taskProgress.total  = total;
				taskProgress.index = this.index;
				taskProgress.count = self.blockcount;
				self.loadProgress[ this.index ] = taskProgress

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
			console.log("上传完毕")
			this.emit('complete',{type:'complete', target: this, data:{
				file: this.file,
				response:response
			}})
					
		}
	}
	
	//兼容CommonJs规范
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = task;
    }
    //兼容AMD/CMD规范
    if (typeof define === 'function'){
        define(function() { return task; });
    }
})(self)