const express = require("express");
const app = express();
const mongodb = require("mongodb").MongoClient;
const bodyParser= require("body-parser");
const mul = require("multer");
const sharp = require("sharp"); 
const storage = mul.diskStorage({
    destination: function(req,file,cb){
        cb(null,"/photos/");
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
var mongoURL;
if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
    var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
        mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
        mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
        mongoDatabase = process.env.MONGODB_DATABASE,
        mongoPassword = process.env.MONGODB_PASSWORD,
        mongoUser = process.env.MONGODB_USER;

    if (mongoHost && mongoPort && mongoDatabase) {
      mongoURLLabel = mongoURL = 'mongodb://';
      if (mongoUser && mongoPassword) {
        mongoURL += mongoUser + ':' + mongoPassword + '@';
      }
      // Provide UI label that excludes user id and pw
      mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
      mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;
  
  }
}
console.log(mongoURL);
console.log("the new directory");
var mongoDBCon = mongodb.connect(mongoURL,{useNewUrlParser: true},function(err,db){
    if(err) throw err;
    dbo = db.db("rabbiter_online");
});
app.get("/",function(req,res){
    res.send("greetings stranger");
});

app.get("/allEntries",function(req,res){
    dbo.collection("entries").find({}).toArray(function(err,result){
        if(err) throw err;
        console.log(result);
        res.status(200).json(result);
    });
});
app.post("/seekPastEvents",function(req,res){
    dbo.collection("events").find({name: req.body, notificationState: 0}).toArray(function(err,result){
        if(err) throw err;
        console.log(result);
        res.status(200).json(result);
    });
});
app.post("/seekSingleEntry",function(req,res){
    dbo.collection("entries").findOne({entryID: req.body},function(err,result){
        if(err) throw err;
        console.log(result);
        res.status(200).json(result);
    });
});
app.post("/updateEntry",function(req,res){
    dbo.collection("entries").updateOne({mergedEntry: req.body.entryID},{$set: {mergedEntryName: req.body.mergedEntryName}},function(err,result){
        if(err) throw err;
        console.log(result);
        res.send("DONE");
    });
    dbo.collection("entries").updateOne({entryID: req.body.entryID},req.body,function(err,result){
        if(err) throw err;
        console.log(result);
        res.send("FINISHED");
    });
});
app.post("/updateEvents",function(req,res){
    dbo.collection("events").updateOne({eventUUID: req.body.eventUUID},req.body,function(err,result){
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
    dbo.collection("entries").insertOne(jsonparsed,function(err,result){
        if(err) throw err;
        console.log(result);
        res.send("FINISHED");
    });
});
app.post("/seekParentOf",function(req,res){
    dbo.collection("entries").find({
        $or:[
            {$and:[
                {chooseGender:"Male"},
                {matedWithOrParents: req.body.parent},
            ]},
            {$and:[
                {secondParent: req.body.parent},
                {chooseGender:"Female"},
            ]}
        ]
        },function(err,result){
            if(err) throw err;
            console.log(result);
            res.json(result);
        });
});

app.get("/seekChildMergedEntries",function(reqmain,resmain){
    dbo.collection("entries").find({isChildMerged: false}).toArray(function(err,result){
        if(err) throw err;
        console.log(result);
        resmain.status(200).json(result);
    });
});
app.post("/searchForImage",function(req,res){
    console.log(req.body);
    if(req.body != ""){
        sharp("/photos/"+req.body)
           .resize(256,256)
           .toBuffer(function(err,buffer,info){
               if(err) throw err;
               console.log(info);
               res.send(buffer);
           });  
    }
    else{
        res.send("FUCK");
    }
});
app.post("/createNewEvent",function(req,res){
    dbo.collection("events").insertOne(req.body,function(err,result){
        if(err) throw err;
        console.log(result);
    });
});
app.post("/getAddBirthReq",function(req,res){
    dbo.collection("events").findOne({eventUUID: req.body},function(err,result){
        if(err) throw err;
        console.log(result);
        res.status(200).json(result);
    });
});
app.post("/seekEventsName",function(req,res){
    dbo.collection("events").find({name: req.body}).toArray(function(err,result){
        if(err) throw err;
        console.log(result);
        res.status(200).json(result);
    });
});
app.post("/deleteEntry",function(req,res){
    dbo.collection("entries").deleteOne({entryID: req.body},function(err,result){
        if(err) throw err;
        console.log(result);
    });
});
app.post("/deleteEvent",function(req,res){
    dbo.collection(events).deleteOne({eventUUID:req.body},function(err,result){
        if(err) throw err;
        console.log(result);
    });
});
app.post("/seekEventsByNameType",function(req,res){
    dbo.collection("events").find(
    {
        $or:[
            {$and:
                [
                    {name: req.body},
                    {typeOfEvent:0}
                ]
            },
            {$and:
                [
                    {secondParent: req.body},
                    {typeOfEvent:0}
                ]   
            }
        ]
    }).sort({dateOfEvent: 1}).toArray(function(err,result){
        if(err) throw err;
        console.log(result);
        res.status(200).json(result);
    });
});
app.get("/seekEventsNotAlerted",function(req,res){
    dbo.collection("events").find({notificationState: 0}).sort({dateOfEvent:1}).toArray(function(err,result){
        if(err) throw err;
        res.json(result);
    });
});
app.post("/seekAlertUUID",function(req,res){
    dbo.collection("events").findOne({eventUUID: req.body},function(err,result){
        if(err) throw err;
        res.status(200).json(result);
    });
});
app.post("/moveOnlineEntry",upload.single("entryImage"),function(req,res){
    var entryJson = JSON.parse(req.body.entry);
    entryJson.entryPhLoc = req.file.originalname;
    console.log(entryJson);
    dbo.collection("entries").insertOne(entryJson,function(err,result){
        if(err) throw err;
        console.log(result);
    });
});
app.post("/moveOnlineEntryNoFile",function(req,res){
    dbo.collection("entries").insertOne(req.body,function(err,result){
        if(err) throw err;
        console.log(result);
    });
});
app.post("/moveOnlineEvent",function(req,res){
    dbo.collection("events").insertOne(req.body,function(err,result){
        if(err) throw err;
        console.log("event inserted");
        console.log(result);
    });
});
app.get("/migrateToMilis",function(req,res){
    dbo.collection(events).find({}).toArray(function(err,result){
        if(err) throw err;
        result.array.forEach(element => {
            var date = new Date(element.dateOfEvent);
            console.log(date.getTime());
            dbo.collection("events").updateOne({eventUUID:element.eventUUID},{dateOfEventMilis: date.getTime()},function(err,result){
                if(err) throw err;
                console.log(result);
            });
        });
    });
    res.send("OK");
});
app.post("/NotifBroadcast",(req,res)=>{
    dbo.collection("events").findOne({$and:[{eventUUID: req.body},{notificationState:0}]},(err,result)=>{
        if(err) throw err;
        console.log(result);
        res.status(200).json(result);
    });
});
app.post("/findNotAlertedEvent",(req,res)=>{
    dbo.collection("events").findOne({$and:[{eventUUID: req.body},{notificationState: 0}]},(err,result)=>{
        if(err) throw err;
        console.log(result);
    });
});
app.listen(8080,function(){
    console.log("listening on 8080");
});
