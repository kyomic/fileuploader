const TaskProcessorOption = {
	type:"form",//发送至服务端的方式，支持form,binary,base64
	data:"file",//默认的数据字段
	dataname:"filename",
	pack:'url', //payload数据的封装方式，对非form方式可以设定payload格式，支持json和url
}
export {TaskProcessorOption}