let createXHR = ()=>{
	if(typeof XMLHttpRequest!="undefined"){ 
		return new XMLHttpRequest();
	}
	return null;
}

let upstream = ( host, method, { data, index, blocksize } = option ) => {
	
}

export default upstream;