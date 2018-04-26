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
//app.use('/', express.static(__dirname + '/dist'));

app.use("/restAPI",router);

//app.get('*',(req,res)=>{
  //  res.sendFile(path.join(__dirname + '/dist/index.html'));
   // });
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
    if(typeof(req.query.condition!="undefined")){
        model.find(JSON.parse(req.query.condition),function(err,users){
            if(err)
            res.send(err);
            else
            res.send(users);
        });
      }
    else{
        res.status(500).send("NO_USERS_FOUND");
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
    model.find(JSON.parse(req.body.condition),function(err,data){
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
                console.log(data);
                data=data[0];
                data["data"].some((element,index) => {
                    console.log(element.EntryForDate,reqData.EntryForDate);
                    if(element.EntryForDate==reqData.EntryForDate && element.ProjectName==reqData.ProjectName && element.StageName==reqData.StageName && element.Taskname==reqData.Taskname && element.Rejected==1)
                    {
                        data["data"][index]["Rejected"]=0;
                        data["data"][index]["Approved"]=0;
                        data["data"][index]["TaskData"]["hours"]=reqData.TaskData.hours;
                        data["data"][index]["TaskData"]["minutes"]=reqData.TaskData.minutes;
                        data["data"][index]["TaskData"]["comments"]=reqData.TaskData.comments;
                        console.log(data["data"][index]["TaskData"]);
                        console.log("check 1");
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
                    else if(element.EntryForDate==reqData.EntryForDate && element.ProjectName==reqData.ProjectName && element.StageName==reqData.StageName && element.Taskname==reqData.Taskname && element.Rejected==0 && element.Approved!=0) {
                        console.log("check",element);
                        res.status(500).send("DUPLICATE_ENTRY");
                        return true;
                    }
                });
            }   
        }
        catch(err)
        {
            console.log(err);
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

router.route('/approver')
.put(verifyToken,function(req,res){
    model.aggregate(JSON.parse(req.body.userCondition)).exec(function(err,data){
        switch(req.body.paramType)
        {
            case "accept":approver(req,res,data,1,0);
            break;
            case "reject":approver(req,res,data,0,1);
            break;
            case "acceptAll":approverForAll(req,res,data,1,0);
            break;
            case "rejectAll":approverForAll(req,res,data,0,1);
            break;
        }
    });
    
});

function approverForAll(req,res,data,approve,reject){
if(data.length>=0){
model.findById(data[0]["_id"],function(err,result){
    if(err)
    res.sendStatus(500).send("ERROR");
    else{
    data.map(function(element,i){
    result.data[element.index]["Approved"]=approve;
    result.data[element.index]["Rejected"]=reject;
    console.log(   result.data[element.index]);
//        console.log(result.data[element.index]);
  if(i==data.length-1)
  {
      result.markModified("data");
      console.log(result);
      result.save(function(err){
        if(err)
        throw err;
        else
        res.send(result);
      });
  }  
    });
}
});
}
else
res.sendStatus(500).send("ERROR");
}
function approver(req,res,data,approve,reject){
    var toUpdateApproved="data."+data[0]["index"]+".Approved";
        var toUpdateRejected="data."+data[0]["index"]+".Rejected";
        var obj={};
        obj[toUpdateApproved]=0;
        obj[toUpdateRejected]=0;
    if(data[0].data.Approved==0 && data[0].data.Rejected==0){
        obj[toUpdateApproved]=approve;
        obj[toUpdateRejected]=reject;
        model.update({"_id":data[0]["_id"]},{$set:obj},function(err,raw){
            if(err)
            res.sendStatus(500).send("ERROR");
            else{
                if(raw["ok"]==1){
                    model.find({"department":req.body.department},function(err,allAdata){
                        if(err)
                        res.sendStatus(500).send("ERROR");
                        else
                        res.send(allAdata);
                    });
                }
                else
                res.sendStatus(500).send("ERROR");
            }
        });}
}
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














