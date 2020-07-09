

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
		img.src = dataurl;
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

export {
	canvasToDataUrl,	
	imageURLToCanvas,
	imageURLToBlob,
	blobToDataUrl,	
	dataURLToCanvas,
	dataURLtoFile,
	dataURLToBlob
}