/***********************************************************************

The MIT License (MIT)

Copyright 2020 (c) kyomic <kyomic@163.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
***********************************************************************/
import EventEmitter from './EventEmitter.js'
import TaskProcessor from './taskprocessor';
import hex_sha1 from './sha1';
import { deepClone } from './utils'
import {FileUploadOptions} from './options';

let DEBUG =false;
class FileStream{
	/**
	 * 构造函数
	 * @param {Blob/String} file - FileBlob或者Base64数据
	 * @param {FileUploadOptions} option - 上传组件选项配置
	 */
	constructor( file, config ){
		this.name = file.name;
		this.lastModified = file.lastModified || '';
		this.size = file.size;	

		this.config = deepClone( config );

		//Worker fix
		delete this.config.files;
		delete this.config.serverConfig;

		this.file = this.cloneFile(file);
		if( !file.extension ){
			this.extension = this.name.substring( this.name.lastIndexOf(".")+1);
		}
		if( file instanceof Blob ){
			this.type = 'blob';
			let slice = file.slice || file.webkitSlice || file.mozSlice;
			this.blob = this.file;
			this.data = slice.call( file, 0, this.size );
		}else{
			if( typeof file == 'object'){
				if( file.data instanceof Blob){
					this.type = 'blob';
					this.size = file.data.size;
					let slice = file.data.slice || file.data.webkitSlice || file.data.mozSlice;
					this.blob = file.data;
					this.data = slice.call( this.blob, 0, this.size );
				}else{
					this.type = 'base64';
					this.blob = file.data;
					this.data = file.data;
				}
			}else{
				throw new Error("未知的文件类型")
			}
		}
		if( !this._id ){
			if( typeof this.config.fileid == 'function'){
				this._id = this.config.fileid( this.file )
			}else{
				this._id =  hex_sha1( [this.name,this.lastModified, this.size].join('') );
			}			
		}
		this.id = this._id;
	}
	/** Worker里不支持DOM */
	cloneFile( file ){
		let blob = null;
		if( file instanceof Blob ){
			let slice = file.slice || file.webkitSlice || file.mozSlice;
			blob = slice.call( file, 0, file.size );
			for( let i in file ){
				try{
					blob[i] = file[i];
				}catch( e ){}
				
			}
		}else{
			blob = file;
		}
		return blob;
	}
}

const FileUploadStatus = {
	PEDDING:0,
	PROCESSING:3,
	LOADING:4,//载入流中
	UPLOADING:5, //上传中
	COMPLETE:1, // 上传完毕
}

class FileUpload{
	/** 
	 * 构造函数
	 * @param {FileUploadOptions} config - 上传组件配置参数
	 */
	constructor( config = null ){
		EventEmitter(this);
		//fileinput实例
		this._fileReference = null;
		
		this._files_tmp = [];
		this._files = [];

		//还未初始化
		this._server_config = null;
		this._status = FileUploadStatus.PEDDING;
		this.option = config;
		this.injectUploadParams = null;
		this.injectUploadHeader = null;
		this.injectUploadComplete = null;
	}

	set option( opt ){
		this._option = Object.assign( Object.assign({}, FileUploadOptions ), opt || {});
		if( this._option.debug ){
			DEBUG = true;
		}
		this._autoupload = !this._option.lazy;
		let files = this._option.files;
		if( !files ){
			return;
		}
		if( typeof files == 'object' && files.nodeType ==1 ){
			this.fileReference = files;
		}
		DEBUG && console.log("option", this._option)
		clearTimeout( this.timeoutId );
		this.timeoutId = setTimeout(_=>{
			if( this._autoupload ){
				this.upload();
			}			
		},100)
	}
	get option(){
		return this._option
	}

	set fileReference( ref ){
		this._fileReference = ref;
		if( this._fileReference ){
			this._fileReference.addEventListener('change', this.onFileReferenceEvent.bind(this) )
		}
	}

	formatServerConfig( config ){
		if( !config ){
			throw new Error('服务器配置不能为空')
		}
		if( !config.url ){
			throw new Error('服务器配置url不能为空')
		}
		if( !/(https?:\/\/)|(^\/\/.*)|(^\/[^\/]+)/.exec( config.url )){
			throw new Error( '服务器配置url格式不正确,目前为:' + config.url )
		}
		let c = Object.assign( {},config );
		c.method = c.method || 'post'
		return c;
	}
	/** 检测服务器配置 **/
	async getUploadServerConfig(){
		let config = this._option.serverConfig;
		if( typeof config == 'object'){
			return config;
		}
		if( typeof config == 'string'){
			return {
				host:config
			}
		}
	}
	// event 
	onFileReferenceEvent(evt){
		let streams = [];
		for(let i=0;i<evt.target.files.length;i++){
			let stream = new FileStream( evt.target.files[i], this._option )
			streams.push( stream )
			this.appendTask( stream );
		}
		if( this.tasks ){
			this.emit('load', {type:'load', data:streams })
			if( this._autoupload ){
				this.upload();
			}
		}
	}

	appendTask( task ){
		if( !this.tasks ){
			this._files_tmp.push( task );
			DEBUG && console.log('tasks管理器在初始化.')
			return;
		}else{
			this.tasks.addTask( task );
		}
	}

	get files(){

	}

	/**
	 * 添加File域中的文件数据
	 * @param {File} file - file域中的文件blob
	 */
	addFile( file ){
		let stream = new FileStream( file, this._option )
		this.appendTask( stream );
	}

	/**
	 * 添加Blob数据文件
	 * @param {any} blob/base64 - 数据块
	 * @param {string} filename - 文件名
	 */
	addBlob( blob, filename ){
		let stream = new FileStream( {
			data:blob,
			name:filename
		}, this._option );
		this.appendTask( stream );
	}

	doUpload(){		
		this.tasks.run();
	}

	async upload(){
		if( this._server_config ){
			this.doUpload();
		}else{
			let config = await this.getUploadServerConfig();
			this._server_config = this.formatServerConfig( config );
			if( !this.tasks ){
				this.tasks = new TaskProcessor( this._server_config, this );
			}
			if( this._files_tmp && this._files_tmp.length ){
				this._files_tmp.map( file =>{
					this.tasks.addTask( file );
				})
				this.emit('load', {type:'load', data:this._files_tmp })
				this._files_tmp = [];
				this.doUpload();
			}
		}
	}
}
FileUpload.version = "1.0.1";
FileUpload.build = "202007141404";
FileUpload.printVersion = function(){
	console.log("%c"+"fileuploader ver:"+FileUpload.version+" build:"+ FileUpload.build +"%c kyomic@163.com","color:#666;font-size:9px", "color:#f86400");
}
export {FileUpload};
export default FileUpload;