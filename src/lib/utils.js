/***********************************************************************

The MIT License (MIT)

Copyright 2020 (c) kyomic <kyomic@163.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
***********************************************************************/
/**
 * canvas转地址数据
 * @param {Canvas} canvas 画布
 * @param {string} format mime信息
 * @param {number} quality 图片画质(0-1)
 */
function canvasToDataUrl( canvas, format='image/png', quality = 1.0 ){
	return canvas.toDataURL(format||'image/jpeg', quality||1.0);
}



/** 
 * 图片base64 URL转canvas
 */
async function dataURLToCanvas( url ){
	return new Promise((resolve,reject)=>{
		let canvas = document.createElement('canvas');
		let ctx = canvas.getContext('2d');
		let img = new Image();
		img.onload = function(){
			canvas.width = img.width;
			canvas.height = img.height;
			try{
				ctx.drawImage(img, 0, 0);
				resolve( canvas );
			}catch( err ){
				reject( err )
			}
			
		};
		img.src = url;
	})	
}

async function imageURLToCanvas( url ){
	return await dataURLToCanvas( url );
}

async function blobToDataUrl( blob ){
	return new Promise((resolve)=>{
		var reader = new FileReader();
		reader.readAsDataURL( blob );
		reader.onload = function(){
			resolve( reader.result )
		};
	})
}
async function imageURLToBlob( url ){
	let canvas = await imageURLToCanvas( url );
	let dataurl = canvasToDataUrl( canvas );
	return dataURLToBlob( dataurl );
}

function dataURLtoFile(dataurl, filename) {//将base64转换为文件
	var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
	bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
	while(n--){
		u8arr[n] = bstr.charCodeAt(n);
	}
	return new File([u8arr], filename, {type:mime});
}

function dataURLToBlob ( dataurl ) {
	var arr = dataurl.split(',');
	var mime = arr[0].match(/:(.*?);/)[1];
	var bstr = atob(arr[1]);
	var n = bstr.length;
	var u8arr = new Uint8Array(n);
	while(n--){
		u8arr[n] = bstr.charCodeAt(n);
	}
	return new Blob([u8arr], {type:mime});
}

let deepClone = ( obj ) =>{	
	if( typeof obj == 'object' && isPlainObject(obj)){
		let res = {};
		if(Array.isArray(obj)){
			res = [];
		}
		for(let key in obj){
			if (obj[key] && typeof obj[key] === 'object'){
				res[key] = deepClone(obj[key]);
			}else{
				res[key] = obj[key];
			}
		}
		return res;
	}else{
		return obj;
	}
}
function isPlainObject(obj){
    let prototype;
    return Object.prototype.toString.call(obj) === '[object Object]' 
        && (prototype = Object.getPrototypeOf(obj), prototype === null || 
        prototype == Object.getPrototypeOf({}))
}

let stringToFunction = (str)=>{
	str = str.replace(/\n/,'');
	let reg = /.*function.*\(([^)]+)\)[^\{]*{([\s\S]*)}.*/i;
	let res = reg.exec(str);
	if( res ){
		let args = res[1].split(",");

		args = args.map( value =>{
			//清空格
			value = value.toString().replace(/\s*/ig,'');
			return value;
		})
		args = args.filter( (value,index)=>{
			return Boolean( value );
		})
		let context = res[2];
		if( args.length ){
			switch( args.length){
				case 1:
					return new Function(args[0], context);
					break;
				case 2:
					return new Function(args[0], args[1], context);
					break;
				case 3:
					return new Function(args[0], args[1], args[2], context);
					break;
				case 4:
					return new Function(args[0], args[1], args[2], args[3], context);
					break;
				case 5:
					return new Function(args[0], args[1], args[2], args[3], args[4], context);
					break;
				case 6:
					return new Function(args[0], args[1], args[2], args[3], args[4], args[5], context);
					break;
				case 7:
					return new Function(args[0], args[1], args[2], args[3], args[4], args[5], args[6], context);
					break;
				case 8:
					return new Function(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], context);
					break;
				case 9:
					return new Function(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], context);
					break;
				default:
					throw new Error("arguments length is too long,max is 9");
			}
		}else{
			return new Function( context );
		}		
	}
	throw new Error( str + ' is not function')
}

let lib = {
	canvasToDataUrl,	
	imageURLToCanvas,
	imageURLToBlob,
	blobToDataUrl,	
	dataURLToCanvas,
	dataURLtoFile,
	dataURLToBlob,
	deepClone,
}
self.lib = lib;
export {
	canvasToDataUrl,	
	imageURLToCanvas,
	imageURLToBlob,
	blobToDataUrl,	
	dataURLToCanvas,
	dataURLtoFile,
	dataURLToBlob,
	deepClone,
	stringToFunction
};