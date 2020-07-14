const path = require('path')
const http = require('http')
const Koa = require('koa');
const static = require('koa-static')
const app = new Koa();
//WebServer默认端口
const port = 3000;
app.use(static( path.join(__dirname,'./lib'), {"hidden":false} ));
const server = http.createServer(app.callback())
server.listen(process.env.PORT || port, () => {
     console.log(`koa server run at : http://127.0.0.1:${port}`);
})