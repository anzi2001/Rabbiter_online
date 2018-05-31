var http = require("http").createServer(listener);
var io = require("socket.io")(http);
var mysql= require("mysql");
http.listen(8080);

var connection = mysql.createConnection({
    host:"localhost",
    user: "root",
    password: ""
});

connection.connect(function(err){
    if(err) throw err;
    console.log("DB WORKS");
});

function listener(req,res){
    req.writeHead(200,{"content type":"text/html"});
    res.end("end");
}
io.on("connected",function(){
    console.log("user connected");
});