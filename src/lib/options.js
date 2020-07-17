const FileUploadOptions = {
  files:'',
  lazy:false, //惰性，需要用户触发upload函数上传,
  //是否开启worker
  worker:false,
  serverConfig:null,
  //同时运行的任务个数
  taskCount:10,
  //一个任务被切分的线程数  
  taskThreadCount:10,
  //文件分块大小
  blockSize:-1,  
  //文件id,默认为：sha1(name+lastModified+size) 计算
  fileid:""
}
const TaskProcessorOption = {
  method:'post',
  url:'',
  /* 
  type=form    payload为
  ------WebKitFormBoundary29A9TQ28jRkaW0ou
  Content-Disposition: form-data; name="file"; filename="blob"
  Content-Type: application/octet-stream
  ....

    type=base64/binary   payload为相应的流数据
  */
  type:'binary',　//上传方式 form(封装成Form),base64,binary(二进制编码)

  type:"form",//发送至服务端的方式，支持form,binary,base64
  data:"file",//默认的数据字段
  dataname:"filename",
  pack:'url', //payload数据的封装方式，对非form方式可以设定payload格式，支持json和url
}
export {FileUploadOptions, TaskProcessorOption}