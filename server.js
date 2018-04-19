var express=require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();
var mongoose = require('mongoose');
var jwt=require('jsonwebtoken');
var key="TIMESHEET_DEVELOPMENT_KEY";
var model = require('./model');
var path = require('path');
var adminModel=require('./adminModel');
app.use(bodyParser.urlencoded({
    extended:true
}));
app.use(bodyParser.json());
var port = 3000;
var router = express.Router();
mongoose.connect("mongodb://localhost:27017/testDB");
app.use(cors());
app.use('/', express.static(__dirname + '/dist'));

app.use("/restAPI",router);

app.get('*',(req,res)=>{
    res.sendFile(path.join(__dirname + '/dist/index.html'));
    });
router.use(function(req,res,next){
//First to recieve the request hence request logging can be done here
    next();
});
//All user CRUD done in the below route http://localhost:port/restAPI/user
router.route("/user")
//CREATE OR ADD A USER TO THE DB
.post(function(req,res){
    var p = new model();
    p.name=req.body.name,
    p.emailId=req.body.emailId,
    p.phone=req.body.phone,
    p.password=req.body.password,
    p.address=req.body.address,
    p.department=req.body.department,
    p.role=req.body.role,
    p.data=req.body.userdata;
    p.save(function (err) {
        if (err) {
           res.sendStatus(500);
        } 
        res.send({ message: 'Product Created ' })
    console.log("Created");
    });
})

//GET ALL USER DATA
.get(function(req,res){
    if(typeof(req.query.type!="undefined") && req.query.type=="findOne"){
        model.find({"name":"ChandraShekar"},{data:0},function(err,users){
            if(err)
            res.send(err);
            else
            res.send(users);
        });
      }
    else{
    model.find(function(err,users){
        if(err)
        res.send(err);
        else
        res.send(users);
    });
}
})

//update user data
.put(function(req,res){
    model.findOne(req.body.condition,function(err,data){
        if(err)
        res.send(err);
        else 
        {   
            data[req.body.param]=req.body.data;
            data.save(function(err){
                if(err)
                res.send(err);
                else
                res.send(data);
            });
        }
    });
})

.delete(function(req,res){
    model.remove(req.body.condition,function(err){
        if(err)
        res.send(err);
        else 
        res.send("Deletion successfull");
    });
});

router.route("/login")
.get(function(req,res){
    model.find({"$and":[{"emailId":req.query.emailId},{"password":req.query.password}]},function(err,users){
        if(err)
        res.send(err);
        else{
            if(users.length!=0){
            jwt.sign({payload:users.emailId},key,function(err,token){
                var resData={};
                resData.token=token;
                resData.payload=users[0];
                res.send(resData);
            });
            }
            else 
            res.sendStatus(401);
        }
    });
});

router.route("/updateTimeSheet")
.put(verifyToken,function(req,res){

    console.log("triggered update",req.body.condition);
    model.findOne(JSON.parse(req.body.condition),function(err,data){
        if(err)
        res.send(err);
        else 
        {   
        try{   
            if(data==null || data.length==0){
                model.findOne(JSON.parse(req.body.userCondition),function(err,data){
                    if(err)
                    res.status(500).send("ERROR");
                    else {
                      console.log(req.body.data);
                    data["data"].push(JSON.parse(req.body.data));
                    data.save(function(err){
                        if(err)
                        res.status(500).send("ERROR");
                        else
                        res.json({"status":"SUCCESS","data":data["data"]});
                    });
                    }                    
                });
               
            }
            else{
                var reqData=JSON.parse(req.body.data);
                data["data"].some((element,index) => {
                    if(element.ProjectName==reqData.ProjectName && element.StageName==reqData.StageName && element.Taskname==reqData.Taskname && element.Rejected==1)
                    {
                        data["data"][index]["Rejected"]=0;
                        data["data"][index]["Approved"]=0;
                        data["data"][index]["TaskData"]["hours"]=reqData.TaskData.hours;
                        data["data"][index]["TaskData"]["minutes"]=reqData.TaskData.minutes;
                        data["data"][index]["TaskData"]["comments"]=reqData.TaskData.comments;
                        console.log(data["data"][index]["TaskData"]);
                        data.markModified('data');
                        data.save(function(err){
                        if(err){
                        res.status(500).send("ERROR");
                        return true;
                        }
                        else{
                        res.json({"status":"SUCCESS","data":data["data"]});
                        return true;    
                    }
                    });
                    }
                    else if(element.ProjectName==reqData.ProjectName && element.StageName==reqData.StageName && element.Taskname==reqData.Taskname && element.Rejected==0 && element.Approved!=0) {
                        console.log("check",element.ProjectName);
                        res.status(500).send("DUPLICATE_ENTRY");
                        return true;
                    }
                });
            }   
        }
        catch(err)
        {
            res.status(500).send("ERROR");
            }
        }
    });
});

router.route("/getInitData")
.get(function(req,res){
    adminModel.find({},function(err,data){
        if(err)
        res.status(500).send("ERROR");
        else{
            try{
                if(data==null || data.length==0)
                res.status(500).send("ERROR");
                else{
            
        model.find({"$and":[{"emailId":req.query.emailId},{"department":req.query.department}]},function(err,data2){
        if(err)
        res.status(500).send("ERROR");
        else{
            try{
                if(data2==null || data2.length==0)
                res.sendStatus(500).send("ERROR");
                else{
                    res.send({"timesheetData":data2[0]["data"],"data":data[0]});         
                }
            }catch(err){
                res.sendStatus(500).send("ERROR");
            }
        }
         });
                }
            }
            catch(err){
            res.status(500).send("ERROR");}
        
        }
    });
});

function verifyToken(req,res,next){
    var authHeader=req.headers["authorization"];
    const token=authHeader.split(" ")[1];
    console.log(token);
    jwt.verify(token,key,function(err,authData){
        if(err)
        res.sendStatus(401);
        else
        next();
    });

}
app.listen(port);














