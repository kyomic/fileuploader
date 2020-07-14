var fs = require('fs')
var path = require('path')
try{
	console.log(__dirname)
	let file = path.resolve(__dirname, './lib/index.js');
	console.log(file)
	let mit  = fs.readFileSync('./LICENSE').toString();
	let code = fs.readFileSync( file ).toString();
	code = code.replace("/\*[\s\S]*\*/ig","");
	let license = [];
	license.push("/*****************")
	license.push(mit)
	license.push("@license")
	license.push("*****************/")
	license.push(code);
	fs.writeFileSync( file, license.join("\r\n") )
}catch(e){
	console.error(e);
}
