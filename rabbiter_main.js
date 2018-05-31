var http = require("http").createServer(listener);
var io = require("socket.io")(http);
http.listen(8080);

function listener(req,res){
    req.writeHead(200,{"content type":"text/html"});
    res.end("end");
}
io.on("connected",function(){
    console.log("user connected");
})