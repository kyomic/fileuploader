import EventEmitter from './EventEmitter.js'
import TaskProcessor from './taskprocessor';
import hex_sha1 from './sha1';
const FileUploadOptions = {
	files:'',
	lazy:false, //惰性，需要用户触发upload函数上传,
	//同时运行的任务个数
	taskCount:2,
	//一个任务被切分的线程数
	taskThreadCount:3,
	//文件分块大小
	blockSize:-1,
	blockSize:1027*1024,
	/* form  payload
	------WebKitFormBoundary29A9TQ28jRkaW0ou
	Content-Disposition: form-data; name="file"; filename="blob"
	Content-Type: application/octet-stream
	....
	*/


	type:'binary',　//上传方式 form(封装成Form),base64,binary(二进制编码)
	fileid:""
}

class FileStream{
	constructor( file, config ){
		console.log(file)
		this.name = file.name;
		this.lastModified = file.lastModified || '';
		this.size = file.size;
		this.config = config;
		this.file = file;
		if( !file.extension ){
			this.extension = this.name.substring( this.name.lastIndexOf(".")+1);
		}
		if( file instanceof Blob ){
			this.type = 'blob';
			let slice = file.slice || file.webkitSlice || file.mozSlice;
			this.blob = file;
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
	}

	get id(){
		if( !this._id ){
			if( typeof this.config.fileid == 'function'){
				this._id = this.config.fileid( this.file )
			}else{
				this._id =  hex_sha1( [this.name,this.lastModified, this.size].join('') );
			}			
		}
		return this._id;		
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
	}

	set injectUploadParams( func ){
		this._injectUploadParams = func;
	}
	get injectUploadParams(){
		return this._injectUploadParams;
	}

	set injectUploadHeader( func ){
		this._injectUploadHeader = func;
	}
	get injectUploadHeader(){
		return this._injectUploadHeader;
	}


	set option( opt ){
		this._option = Object.assign( Object.assign({}, FileUploadOptions ), opt || {});
		this._autoupload = !this._option.lazy;
		let files = this._option.files;
		if( !files ){
			return;
		}
		if( typeof files == 'object' && files.nodeType ==1 ){
			this.fileReference = files;
		}
		console.log("option", this._option)
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

	async checkRemoteFileExist(){

	}
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
		if( typeof config == 'function'){
			console.log(config)
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
			console.log('tasks管理器在初始化.')
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


export { FileUpload };