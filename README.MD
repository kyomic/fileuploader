# FileUploader

FileUploader 是一个通用的上传模块，兼容AMD,CMD规范，支持单文件、多文件，支持分块上传，断点上传，秒传，支持配置服务器接收参数，让上传变得如此简单。

##### 演示地址
[index.html](https://kyomic.github.io/fileuploader/lib/index.html "Editor.md")


#### 1.简单示例

```html
<input type="file" multiple="multiple" />
var FileUpload = require("fileupload-lite")
var uploader = new self.FileUpload({
  files:example.querySelector("input[type=file]"),
  serverConfig: {url:"apiurl"}
})
```

## 技术文档



#### 1.配置上传参数(option)

```javascript
{
  files:'',
  lazy:false, //惰性，需要用户触发upload函数上传,
  //是否开启worker
  worker:false,
  serverConfig:null,  //function or { serverConfig }
  //同时运行的任务个数
  taskCount:10,
  //一个任务被切分的线程数 
  taskThreadCount:10,
  //文件分块大小
  blockSize:-1, 
  // 空串 / function( file ) (通过自定义函数生成文件id)
  fileid:""
}
```
#### 2.配置上传服务器参数(serverConfig)
```javascript
{
  method:'post',
  url:'',
  /* 
  type=form    payload为
  ------WebKitFormBoundary29A9TQ28jRkaW0ou
  Content-Disposition: form-data; name="file"; filename="blob"
  Content-Type: application/octet-stream
  ....

    type=base64/binary   payload为相应的流数据
  
  type:'binary',　//上传方式 form(封装成Form),base64,binary(二进制编码)
  */
  type:"form",//发送至服务端的方式，支持form,binary,base64
  data:"file",//默认的数据字段
  dataname:"filename",
  pack:'url', //payload数据的封装方式，对非form方式可以设定payload格式，支持json和url
}
```

```javascript
# 动态上传地址
var uploader = new self.FileUpload({
  serverConfig: function(){
    return new Promise(function(resolve,reject){
      //wait server
      setTimeout(function(){
        resolve("http://new api")
      },3000)
    });
  }
})
```

```javascript
# 配置线程数，任务数
var uploader = new self.FileUpload({
  taskCount:10,//任务数
  taskThreadCount:10// 单任务线程数
})
```
#### 3.上传接口
```javascript
# 动态添加文件
/** 
 *@param {FileBlob} file - fileinput响应的file数据
 */
upload.addFile( file )
```

```javascript
# 动态添加文件块
/**
 * @param {Blob} blob - Blob数据块
 * @param {string} name - 保存文件名
 */
upload.addFile( blob, name )
```


```javascript
# 文件上传(手动上传时，请将option.lazy设置为1)
upload.upload( blob, name )
```

#### 4.上传事件
```javascript
//载入文件准备上传
upload.on('load', function(evt){
  //evt.data {files}
})
//上传进度
upload.on('load', function(evt){
  //整体进度，和单个文件块的进度信息
  //evt.data {loaded,total,detal}
})
//单个文件完成事件
upload.on('complete', function(evt){
  //evt.data {fileid,}
})
//所有文件完成事件
upload.on('finished', function(evt){
  //evt.data {fileid,}
})
//所有文件完成事件
upload.on('error', function(evt){
 
})
```

HomePage
<http://www.shareme.cn>

[mailto:kyomic@163.com](mailto:kyomic@163.com)
> @kyomic

### End