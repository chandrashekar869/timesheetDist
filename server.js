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
mongoose.connect("mongodb://localhost:27017/timsheetDB");
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
.post(verifyToken,function(req,res){
    var userData=JSON.parse(req.body.userData);
    var obj={
        "data" : new Array(),
        "name" : userData.name,
        "emailId" :userData.email,
        "phone" :userData.mobile,
        "password" : userData.password,
        "department" : userData.selectedDepartment,
        "forceLogOut":false,
        "role" : {
            "name" : "User",
            "canApprove" : (userData.canApproved?1:0)
        }
    };

model.collection.insert(obj,function(err,record){
    if (err) {
        res.status(500).send(err);
     } 
     else
     res.send({ message: record,data:obj }); 
});
/*    var p = new model();
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
    });*/
})

//GET ALL USER DATA
.get(verifyToken,function(req,res){
    if(typeof(req.query.model)!="undefined" && req.query.model=="Report"){
        adminModel.find(JSON.parse(req.query.condition),function(err,users){
            if(err)
            res.status(500).send(err);
            else
            {
                model.find(JSON.parse(req.query.condition),function(err,userData){
                    if(err)
                    res.send(err);
                    else
                    res.send({"admin":users,"userData":userData});
                });        
            }
        });
    }
    else if(typeof(req.query.model)!="undefined" && req.query.model=="Admin"){
        adminModel.find(JSON.parse(req.query.condition),function(err,users){
            if(err)
            res.status(500).send(err);
            else
            res.send(users);
        });
    }
    else if(typeof(req.query.model)!="undefined" && req.query.model=="None"){
        model.find(JSON.parse(req.query.condition),function(err,users){
            if(err)
            res.status(500).send(err);
            else
            res.send(users);
        });
    }
    else if(req.query.condition=="Init"){
        console.log("check1",req.query.emailId);
        adminModel.find({},function(err,admin){
            if(err)
            res.status(500).send(err);
            else
            {
                admin=admin[0];
                var DepartmentList=admin["DepartmentList"];
                var email=req.query.emailId;
                var listPresentIn={};
                admin["Departments"].map(function(element,index){
     var keysTaskApprover=Object.keys(element[DepartmentList[index]].TaskApprover);
     if(keysTaskApprover.length>0){               
     keysTaskApprover.map(function(Task,taskIndex){
                        if(element[DepartmentList[index]]["TaskApprover"][Task]==email)
                        {
                            if(listPresentIn.hasOwnProperty(DepartmentList[index]))
                            listPresentIn[DepartmentList[index]].push(Task);
                            else{
                                listPresentIn[DepartmentList[index]]=[];
                                listPresentIn[DepartmentList[index]].push(Task);
                            }
                        }
                        if(taskIndex==keysTaskApprover.length-1 && index==admin["Departments"].length-1)
                        {
                           // res.send(listPresentIn);
                           var conditionArray=[];
                           var orArray={"$or":[]};
                           var orArrayLast={"$or":[]};
                           
                           Object.keys(listPresentIn).map(function(key,index){
                                    orArray["$or"].push({"department":key});
                                        listPresentIn[key].map(function(task,taskIndex){
                                            orArrayLast["$or"].push({"data.Taskname":task,"department":key});
                                            if(index==Object.keys(listPresentIn).length-1 && taskIndex==listPresentIn[key].length-1)
                                            {
                                                conditionArray.push({"$match":orArray});
                                                conditionArray.push({"$unwind":{"path":"$data","includeArrayIndex":"index"}});
                                                conditionArray.push({"$match":orArrayLast});
                                                model.aggregate(conditionArray,function(err,result){
                                                    if(err)
                                                    res.send(err);
                                                    else
                                                    {   
                                                        var Objectindex=[];
                                                        var responseObject=[];
                                                        if(result.length>0){
                                                            result.map(function(eachRes,resIndex){
                                                                 if(Objectindex.indexOf(eachRes["_id"].toString())!=-1)
                                                                 responseObject[Objectindex.indexOf(eachRes["_id"].toString())]["data"].push(eachRes.data);
                                                                else{
                                                                    Objectindex.push(eachRes["_id"].toString());
                                                                    var tempObj=eachRes['data'];
                                                                    eachRes['data']=[tempObj];
                                                                    responseObject.push(eachRes);
                                                                }
                                                                if(resIndex==result.length-1)
                                                                {
                                                                    res.json({"userData":responseObject,"adminData":listPresentIn});}
                                                            });
                                                        }
                                                        else
                                                        res.status(500).send("NO_DATA");
                                                    }
                                                    //res.send(result);
                                                });
                                            }
                                        
                                        
                                        });
                                    
                                });
                        }    
                    });
                }
                else{

                    if(index==admin["Departments"].length-1)
                    {
                       // res.send(listPresentIn);
                       var conditionArray=[];
                       var orArray={"$or":[]};
                       var orArrayLast={"$or":[]};
                       
                       Object.keys(listPresentIn).map(function(key,index){
                                orArray["$or"].push({"department":key});
                                    listPresentIn[key].map(function(task,taskIndex){
                                        orArrayLast["$or"].push({"data.Taskname":task,"department":key});
                                        if(index==Object.keys(listPresentIn).length-1 && taskIndex==listPresentIn[key].length-1)
                                        {
                                            conditionArray.push({"$match":orArray});
                                            conditionArray.push({"$unwind":{"path":"$data","includeArrayIndex":"index"}});
                                            conditionArray.push({"$match":orArrayLast});
                                            model.aggregate(conditionArray,function(err,result){
                                                if(err)
                                                res.send(err);
                                                else
                                                {   
                                                    var Objectindex=[];
                                                    var responseObject=[];
                                                    if(result.length>0){
                                                        result.map(function(eachRes,resIndex){
                                                             if(Objectindex.indexOf(eachRes["_id"].toString())!=-1)
                                                             responseObject[Objectindex.indexOf(eachRes["_id"].toString())]["data"].push(eachRes.data);
                                                            else{
                                                                Objectindex.push(eachRes["_id"].toString());
                                                                var tempObj=eachRes['data'];
                                                                eachRes['data']=[tempObj];
                                                                responseObject.push(eachRes);
                                                            }
                                                            if(resIndex==result.length-1)
                                                            {
                                                                res.json({"userData":responseObject,"adminData":listPresentIn});}
                                                        });
                                                    }
                                                    else
                                                    res.status(500).send("NO_DATA");
                                                }
                                                //res.send(result);
                                            });
                                        }
                                    
                                    
                                    });
                                
                            });
                    }   
                }
                });
            }
        });
    }
    /*
    else if(typeof(req.query.condition!="undefined")){
        model.find(JSON.parse(req.query.condition),function(err,users){
            if(err)
            res.send(err);
            else
            res.send(users);
        });
    }*/
    else{
        res.status(500).send("NO_USERS_FOUND");
}
})

//update user data
.put(verifyToken,function(req,res){
    model.findOne(JSON.parse(req.body.condition),function(err,data){
        if(err)
        res.send(err);
        else 
        {   if(data!=null){
            var bodyData=JSON.parse(req.body.data);
            var bodyParam=JSON.parse(req.body.param);
            console.log(bodyParam);
            bodyParam.map(function(element,index){
                console.log(element);

                if(element=="role.canApprove"){
                data["role"]["canApprove"]=bodyData[index];
                data.markModified("role");
            console.log("matched", data["role"]["canApprove"]);}
                else
                data[element]=bodyData[index];
                if(index==bodyParam.length-1)
                {
                    data.save(function(err){
                        if(err)
                        res.send(err);
                        else
                        res.json({message:"SUCCESS",data:data});
                    });
                }
            });
            }
            else
            res.status(500).send("NOT_EXISTS");
        }
    });
})

.delete(verifyToken,function(req,res){
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
                model.update({"emailId":req.query.emailId},{"forceLogOut":false},function(err,raw){
                    if(err)
                    res.status(500).send(err);
                    else
                    res.send(resData);

                });
            });
            }
            else 
            res.sendStatus(401);
        }
    });
});

router.route("/manageDepartment")
.put(verifyToken,function(req,res){
    adminModel.findOne(JSON.parse(req.body.condition),function(err,data){
        if(err)
        res.status(500).send(err);
        else 
        {   
            if(data==null || data["DepartmentList"].indexOf(req.body.departmentName)==-1)
            {
                var obj={};
                obj[req.body.departmentName]={"Projects" : [],"Stages" : [],"Tasks" : [],"TaskApprover":{}};
                data["DepartmentList"].push(req.body.departmentName);
                data["Departments"].push(obj);
                console.log(data);
                data.markModified("Departments");
                data.markModified("DepartmentList");
                data.save(function(err){
                    if(err)
                    res.status(500).send(err);
                    else
                    res.send(data);
               });
            }
            else
            res.status(500).send("DUPLICATE_ENTRY");
        }
    });
})
.delete(verifyToken,function(req,res){
    if(typeof(req.query.departmentName)!="undefined"){
    adminModel.findOne(JSON.parse(req.query.condition),function(err,data){
        if(err)
        res.status(500).send(err);
        else 
        {   
            if(data["DepartmentList"].indexOf(req.query.departmentName)!=-1)
            {
                data["DepartmentList"].splice(data["DepartmentList"].indexOf(req.query.departmentName),1);
                data["Departments"].map(function(element,index){
                   if(element.hasOwnProperty(req.query.departmentName))
                   data["Departments"].splice(index,1);
                });
                console.log(data);
                data.markModified("Departments");
                data.markModified("DepartmentList");
                data.save(function(err){
                    if(err)
                    res.status(500).send(err);
                    else
                    res.send(data);
               });
            }
            else
            res.status(500).send("NOT_EXISTS");
        }
    });
}
});

router.route("/editDepartment")
.put(verifyToken,function(req,res){
    adminModel.find({},function(err,adminData){
        if(err)
        res.status(500).send(err);
        else{
            var initIndex=0;
            if(adminData!=null){
                adminData=adminData[0];
                adminData["DepartmentList"][adminData["DepartmentList"].indexOf(req.body.department)]=req.body.newDepartment;
                if(adminData["DepartmentList"].lastIndexOf(req.body.newDepartment)==adminData["DepartmentList"].indexOf(req.body.newDepartment))
                {
                    adminData["Departments"].map(function(element,depindex){
                    if(adminData["Departments"][depindex].hasOwnProperty(req.body.department)){
                        Object.defineProperty(adminData["Departments"][depindex],req.body.newDepartment,Object.getOwnPropertyDescriptor(adminData["Departments"][depindex],req.body.department));
                delete adminData["Departments"][depindex][req.body.department];
                console.log(element);
                }
                if(depindex==adminData["Departments"].length-1){
                    adminData.markModified("Departments");
                    adminData.markModified("DepartmentList");
                    adminData.save(function(err){
                        if(err)
                        res.status(500).send(err);
                        else{
                            model.update({"department":req.body.department},{"department":req.body.newDepartment,"forceLogOut":true}, {multi: true},function(err,raw){
                                if(err)
                                res.status(500).send(err);
                                else
                                res.send({"message":"SUCCESS","data":raw});
                            });
                        }
                    });
                }
                });}
                else{
                    adminData["DepartmentList"][adminData["DepartmentList"].indexOf(req.body.newDepartment)]=req.body.department; 
                    console.log("message");
                    res.send({"message":"DUPLICATE"});
                   }
            }
            else
            res.status(500).send("NO_DATA");
        }
    });
});



router.route("/projectAdmin")
.put(verifyToken,function(req,res){
    adminModel.findOne({},function(err,data){
    if(err)
    res.status(500).send(err);
    else{
        var reqData=JSON.parse(req.body.projectData);
        if(data["DepartmentList"].indexOf(reqData.selectedDepartment)!=-1){
            data["Departments"].map(function(element,index){
                if(element.hasOwnProperty(reqData.selectedDepartment))
                {
                    if(data["Departments"][index][reqData.selectedDepartment]["Projects"].indexOf(reqData.projectName)==-1){
                        data["Departments"][index][reqData.selectedDepartment]["Projects"].push(reqData.projectName);
                        data.markModified("Departments");
                        data.save(function(err){
                            if(err)
                            res.status(500).send(err);
                            else
                            res.send({"data":data,"indexOf":index});
                       });
                    }
                    else
                    res.status(500).send("DUPLICATE_ENTRY");
                }
            });
        }
        else
        res.status(500).send("Department not found");
    }
    });
})
.delete(verifyToken,function(req,res){
    if(typeof(req.query.projectData)!="undefined"){
        adminModel.findOne({},function(err,data){
            if(err)
            res.status(500).send(err);
            else{
                var reqData=JSON.parse(req.query.projectData);
                if(data["DepartmentList"].indexOf(reqData.selectedDepartment)!=-1){
                    data["Departments"].map(function(element,index){
                        if(element.hasOwnProperty(reqData.selectedDepartment))
                        {
                            var projectIndex=data["Departments"][index][reqData.selectedDepartment]["Projects"].indexOf(reqData.projectName);
                            if(projectIndex!=-1){
                                data["Departments"][index][reqData.selectedDepartment]["Projects"].splice(projectIndex,1);
                                data.markModified("Departments");
                                data.save(function(err){
                                    if(err)
                                    res.status(500).send(err);
                                    else
                                    res.send({"data":data,"indexOf":index});
                               });
                            }
                            else
                            res.status(500).send("NOT_EXISTS");
                        }
                    });
                }
                else
                res.status(500).send("Department not found");
            }
            });
    }
});

router.route("/stageAdmin")
.put(verifyToken,function(req,res){
    adminModel.findOne({},function(err,data){
    if(err)
    res.status(500).send(err);
    else{
        var reqData=JSON.parse(req.body.stageData);
        console.log(reqData);
        if(data["DepartmentList"].indexOf(reqData.selectedDepartment)!=-1){
            data["Departments"].map(function(element,index){
                if(element.hasOwnProperty(reqData.selectedDepartment))
                {
                    if(data["Departments"][index][reqData.selectedDepartment]["Stages"].indexOf(reqData.stageName)==-1){
                        data["Departments"][index][reqData.selectedDepartment]["Stages"].push(reqData.stageName);
                        data.markModified("Departments");
                        data.save(function(err){
                            if(err)
                            res.status(500).send(err);
                            else
                            res.send({"data":data,"indexOf":index});
                       });
                    }
                    else
                    res.status(500).send("DUPLICATE_ENTRY");
                }
            });
        }
        else
        res.status(500).send("Department not found");
    }
    });
})
.delete(verifyToken,function(req,res){
    if(typeof(req.query.stageData)!="undefined"){
        adminModel.findOne({},function(err,data){
            if(err)
            res.status(500).send(err);
            else{
                var reqData=JSON.parse(req.query.stageData);
                console.log(reqData);
                if(data["DepartmentList"].indexOf(reqData.selectedDepartment)!=-1){
                    data["Departments"].map(function(element,index){
                        if(element.hasOwnProperty(reqData.selectedDepartment))
                        {  console.log(element);
                            var stageIndex=data["Departments"][index][reqData.selectedDepartment]["Stages"].indexOf(reqData.stageName);
                            if(stageIndex!=-1){
                                console.log(data["Departments"][index]);
                                data["Departments"][index][reqData.selectedDepartment]["Stages"].splice(stageIndex,1);
                                data.markModified("Departments");
                                data.save(function(err){
                                    if(err)
                                    res.status(500).send(err);
                                    else
                                    res.send({"data":data,"indexOf":index});
                               });
                            }
                            else
                            res.status(500).send("NOT_EXISTS");
                        }
                    });
                }
                else
                res.status(500).send("Department not found");
            }
            });
    }
});

router.route("/taskAdminEdit")
.put(verifyToken,function(req,res){
var reqData=JSON.parse(req.body.data);
adminModel.find({},function(err,data){
if(err)
res.status(500).send(err);
else{
    data=data[0];   
    data["Departments"].map(function(element,index){
        if(element.hasOwnProperty(reqData.department))
        {
            if(element[reqData.department]["TaskApprover"].hasOwnProperty(reqData.task)){
            element[reqData.department]["TaskApprover"][reqData.task]=reqData.emailId;
            }
        }
        if(index==data["Departments"].length-1)
        {
            data.markModified("Departments");
            data.save(function(err,data){
                if(err)
                res.status(500).send(err);
                else
                res.send(data);
            })
        }
    });
}
});
});


router.route("/taskAdmin")
.put(verifyToken,function(req,res){
    adminModel.findOne({},function(err,data){
    if(err)
    res.status(500).send(err);
    else{
        var reqData=JSON.parse(req.body.taskData);
        console.log(reqData);
        if(data["DepartmentList"].indexOf(reqData.selectedDepartment)!=-1){
            data["Departments"].map(function(element,index){
                if(element.hasOwnProperty(reqData.selectedDepartment))
                {
                    if(data["Departments"][index][reqData.selectedDepartment]["Tasks"].indexOf(reqData.taskName)==-1){
                        data["Departments"][index][reqData.selectedDepartment]["Tasks"].push(reqData.taskName);
                        data["Departments"][index][reqData.selectedDepartment]["TaskApprover"][reqData.taskName]=reqData.Approver;
                        data.markModified("Departments");
                        data.save(function(err){
                            if(err)
                            res.status(500).send(err);
                            else
                            res.send({"data":data,"indexOf":index});
                       });
                    }
                    else
                    res.status(500).send("DUPLICATE_ENTRY");
                }
            });
        }
        else
        res.status(500).send("Department not found");
    }
    });
})
.delete(verifyToken,function(req,res){
    if(typeof(req.query.taskData)!="undefined"){
        adminModel.findOne({},function(err,data){
            if(err)
            res.status(500).send(err);
            else{
                var reqData=JSON.parse(req.query.taskData);
                console.log(reqData);
                if(data["DepartmentList"].indexOf(reqData.selectedDepartment)!=-1){
                    data["Departments"].map(function(element,index){
                        if(element.hasOwnProperty(reqData.selectedDepartment))
                        {  console.log(element);
                            var taskIndex=data["Departments"][index][reqData.selectedDepartment]["Tasks"].indexOf(reqData.taskName);
                            if(taskIndex!=-1){
                                console.log(data["Departments"][index]);
                                data["Departments"][index][reqData.selectedDepartment]["Tasks"].splice(taskIndex,1);
                                delete data["Departments"][index][reqData.selectedDepartment]["TaskApprover"][reqData.taskName];
                                data.markModified("Departments");
                                data.save(function(err){
                                    if(err)
                                    res.status(500).send(err);
                                    else
                                    res.send({"data":data,"indexOf":index});
                               });
                            }
                            else
                            res.status(500).send("NOT_EXISTS");
                        }
                    });
                }
                else
                res.status(500).send("Department not found");
            }
            });
    }
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
                    if(element.EntryForDate==reqData.EntryForDate && element.ProjectName==reqData.ProjectName && element.StageName==reqData.StageName && element.Taskname==reqData.Taskname && (element.Rejected==1 || req.body.updateFlag==1))
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
.get(verifyToken,function(req,res){
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
                res.status(500).send("ERROR");
                else{
                    res.send({"timesheetData":data2[0]["data"],"data":data[0]});         
                }
            }catch(err){
                res.status(500).send("ERROR");
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
    console.log(data);
if(data.length>=0){
model.findById(data[0]["_id"],function(err,result){
    if(err)
    res.status(500).send("ERROR");
    else{
        console.log(result);
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
        {
            var adminData=JSON.parse(req.body.admin);
            var task=adminData[result.department];
            var tempData=[];
            result.data.map(function(data,dataIndex){
                if(task.indexOf(data.Taskname)!=-1)
                tempData.push(data);
                //                result["data"].splice(dataIndex,1);
                if(dataIndex==result.data.length-1){
                    result.data=tempData;
                    res.send(result);
                }
            });
        }
      });
  }  
    });
}
});
}
else
res.status(500).send("ERROR");
}
function approver(req,res,data,approve,reject){
    var toUpdateApproved="data."+data[0]["index"]+".Approved";
        var toUpdateRejected="data."+data[0]["index"]+".Rejected";
        var obj={};
        var adminData=JSON.parse(req.body.admin);
        obj[toUpdateApproved]=0;
        obj[toUpdateRejected]=0;
    if(data[0].data.Approved==0 && data[0].data.Rejected==0){
        obj[toUpdateApproved]=approve;
        obj[toUpdateRejected]=reject;
        model.update({"_id":data[0]["_id"]},{$set:obj},function(err,raw){
            if(err)
                     res.status(500).send("ERROR");
            else{
                if(raw["ok"]==1){
                    model.find({"_id":{"$in":JSON.parse(req.body["_id"])}},function(err,allAdata){
                        if(err)
                        res.status(500).send("ERROR");
                        else
                        {
                            allAdata.map(function(obj,index){
                                var task=adminData[obj["department"]];
                                var tempData=[];
                                obj.data.map(function(data,dataIndex){
                                    if(task.indexOf(data.Taskname)!=-1)
                                    tempData.push(data);
                                    if( dataIndex==obj.data.length-1){
                                        allAdata[index]["data"]=tempData;
                                        if(index==allAdata.length-1 )
                                        res.send(allAdata);
                                    }
                                });
                            });
                        }
                        //                        
                    });
                }
                else
                  res.status(500).send("ERROR");
            }
        });}
}
function verifyToken(req,res,next){
    var authHeader=req.headers["authorization"];
    var forceLogOut=req.headers["verifylogout"];
    const token=authHeader.split(" ")[1];
    const emailforLogOut=forceLogOut.split(" ")[1];
    console.log(forceLogOut);
    console.log(token);
    jwt.verify(token,key,function(err,authData){
        if(err)
        res.sendStatus(401);
        else
        {
            model.find({"_id":emailforLogOut},function(err,data){
                if(err)
                res.sendStatus(401);
                else{
                    if(data!=null){
                   data=data[0];
                    if(data.forceLogOut==true)
                    res.sendStatus(405);
                    else if(data.forceLogOut==false)
                    next();
                }
                }
            });
        }
    });

}
app.listen(port);














