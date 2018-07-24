const express = require("express");
const app = express();
const mysql= require("mysql");
const mongodb = require("mongodb").MongoClient;
const bodyParser= require("body-parser");
const mul = require("multer");
const sharp = require("sharp"); 
const storage = mul.diskStorage({
    destination: function(req,file,cb){
        cb(null,__dirname);
    },
    filename: function(req,file,cb){
        cb(null,file.originalname);
    }
});
var upload = mul({storage: storage});
var dbo;

app.use(bodyParser.json({
    strict: false
}));
app.use(bodyParser.urlencoded({extended: true}));

var connection = mysql.createConnection({
    host:"localhost",
    user: "root",
    password : "",
    database: "rabbiter_online"
});

var mongoDBCon = mongodb.connect("mongodb://localhost:27017/rabbiter_online",{useNewUrlParser: true},function(err,db){
    if(err) throw err;
    dbo = db.db("rabbiter_online");
});
connection.connect(function(err){
    if(err) throw err;
    console.log("DB WORKS");
});
app.get("/",function(req,res){
    res.send("greetings stranger");
});

app.get("/allEntries",function(req,res){
    connection.query("SELECT * FROM entries",function(err,result,fields){
        if(err) throw err;
        console.log("allEntries request has been sent and served");
        res.status(200).json(result);
    });
    
});
app.post("/seekPastEvents",function(req,res){
    connection.query("SELECT * FROM events WHERE name = ? AND  NOT notificationState = 0",req.body,function(err,result,fields){
        if(err) throw err;
        res.status(200).json(result);
    });
});
app.post("/seekSingleEntry",function(req,res){
    connection.query("SELECT * FROM entries WHERE entryID = ?",req.body,function(err,result,fields){
        if(err) throw err;
        console.log(result);
        res.status(200).json(result);
    });
});
app.post("/updateEntry",function(req,res){
    connection.query("UPDATE entries SET mergedEntryName = ? WHERE mergedEntry = ?",[req.body.mergedEntryName,req.body.entryID],function(err,result,fields){
        if(err) throw err;
        console.log(result);
        res.send("DONE");
    });
    connection.query("UPDATE entries SET ? WHERE entryID = "+req.body.entryID, req.body, function(err,result,fields){
        if(err) throw err;
        console.log("UPDATE RESULT "+ result);
        res.send("FINISHED");
    });
});
app.post("/updateEvents",function(req,res){
    connection.query("UPDATE events SET ? WHERE eventUUID = ?",[req.body,req.body.eventUUID],function(err,result,fields){
        if(err) throw err;
        console.log(result);
        res.send("FINISHED");
    });
});
app.post("/createNewEntry",upload.single("entryImage"),function(req,res){
    var jsonparsed = JSON.parse(req.body.postEntry);
    console.log(req.file);
    if(req.file != null){
        jsonparsed.entryPhLoc = req.file.originalname;
    }
    connection.query("INSERT INTO entries SET ?",jsonparsed,function(err,result,fields){
        if(err) throw err;
        console.log(result);
        res.send("FINISHED");
    });
});
    app.post("/seekParentOf",function(req,res){
    connection.query("SELECT * FROM entries WHERE (chooseGender = \"Male\" AND matedWithOrParents = ?) OR (secondParent = ? AND chooseGender = \"Female\")",[req.body.parent,req.body.parent],function(err,result,fields){
        if(err) throw err;
        res.json(result);
    } );
});

app.get("/seekChildMergedEntries",function(reqmain,resmain){
    connection.query("SELECT * FROM entries WHERE isChildMerged = 0",function(err,result,fields){
        if(err) throw err;
        console.log("seekChildMergedEntries: ");
        console.log(result);
        resmain.status(200).json(result);
    });
});
app.post("/searchForImage",function(req,res){
    if(req.body != ""){
        sharp(req.body)
           .resize( 256,256)
           .toBuffer(function(err,buffer,info){
               if(err) throw err;
               console.log(info);
               res.send(buffer);
           });  
    }
    else{
        res.send("FECK");
    }
});
app.post("/createNewEvent",function(req,res){
    connection.query("INSERT INTO events SET ?",req.body,function(err,result,fields){
        if(err) throw err;
        console.log(result);
    });
});
app.post("/getAddBirthReq",function(req,res){
    connection.query("SELECT * FROM events WHERE eventUUID = ?",req.body,function(err,result,fields){
        if(err) throw err;
        console.log(result);
        res.status(200).json(result);
    });
});
app.post("/seekEventsName",function(req,res){
    connection.query("SELECT * FROM events WHERE name = ?",req.body,function(err,result,fields){
        if(err) throw err;
        console.log(result);
        res.status(200).json(result);
    });
});
app.post("/deleteEntry",function(req,res){
    connection.query("DELETE FROM entries WHERE entryID = ?",req.body,function(err,result,fields){
        if(err) throw err;
        console.log(result);
    });
});
app.post("/deleteEvent",function(req,res){
    connection.query("DELETE FROM events WHERE eventUUID = ?",req.body,function(err,result,fields){
        if(err) throw err;
        console.log(result);
    });
});
app.post("/seekEventsByNameType",function(req,res){
    connection.query("SELECT * FROM events WHERE name = ? AND typeOfEvent = 0 OR secondParent = ? AND typeOfEvent = 0 ORDERBY dateOfEvent ASC",[req.body,req.body],function(err,result,fields){
        if(err) throw err;
        console.log(result);
        res.status(200).json(result);
    });
});
app.get("/seekEventsNotAlerted",function(req,res){
    connection.query("SELECT * FROM events WHERE notificationState = 0 ORDER BY dateOfEventMilis ASC",function(err,result,fields){
        if(err) throw err;
        res.json(result);
    });
});
app.post("/seekAlertUUID",function(req,res){
    connection.query("SELECT * FROM events WHERE entryUUID = ?",req.body,function(err,result,fields){
        if(err) throw err;
        res.status(200).json(result);
    });
});
app.post("/moveOnlineEntry",upload.single("entryImage"),function(req,res){
    var entryJson = JSON.parse(req.body.entry);
    entryJson.entryPhLoc = req.file.originalname;
    console.log(entryJson);
    connection.query("INSERT INTO entries SET ?",entryJson,function(err,result,fields){
        if(err) throw err;
        console.log("shit works");
        console.log(result);
    });
});
app.post("/moveOnlineEntryNoFile",function(req,res){
    connection.query("INSERT INTO entries SET ?",req.body,function(err,result,fields){
        if(err) throw err;
        console.log(result);
    });
});
app.post("/moveOnlineEvent",function(req,res){
    connection.query("INSERT INTO events SET ?",req.body,function(err,result,fields){
        if(err) throw err;
        console.log("event inserted");
        console.log(result);
    });
});
app.get("/migrateToMilis",function(req,res){
    connection.query("SELECT * FROM events",function(err,result,fields){
        if(err) throw err;
        /*for(var i = 0;i<result.length;i++){
        }*/
        result.array.forEach(element => {
            var date = new Date(element.dateOfEvent);
            console.log(date.getTime());
            connection.query("UPDATE events SET dateOfEventMilis  = ? WHERE eventUUID = ?",[date.getTime(),element.eventUUID] ,function(errw,resultw,fieldsw){
                if(errw) throw errw;
                console.log(resultw);
            }); 
        });
    });
    res.send("OK");
});
app.post("/NotifBroadcast",(req,res)=>{
    connection.query("SELECT * FROM events WHERE eventUUID = ? AND notificationState = 0",req.body,(err,result,fields)=>{
        if(err) throw err;
        console.log(result);
    });
});
app.post("/findNotAlertedEvent",(req,res)=>{
    connection.query("SELECT * FROM events WHERE eventUUID = ? AND notificationState = 0",req.body,(err,result,fields)=>{
        if(err) throw err;
        console.log(result);
    });
});
app.listen(8081,function(){
    console.log("listening on 8081");
});
