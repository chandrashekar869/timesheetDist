var mongoose = require('mongoose');
var model = require('./model');
var adminModel=require('./adminModel');
mongoose.connect("mongodb://localhost:27017/timesheetDB");
console.log("Run Async...");
model.find({}).cursor()
.on('data', function(doc){
    console.log("Retrieving user data...");
    console.log("User data retrieved...");
    if(doc.data.length>0)
    {
        doc.forceLogOut=true;
        model.update({"_id": doc._id}, doc, function(err, updated) {
            console.log("Updating user data...");
            if(err) throw err;
     });      
        }/*
        doc.data.map(function(element,index){
            if(element.Taskname=="Design mamagemant & co-ordination"){
                console.log(doc);
                doc.data[index].Taskname="Design management & co-ordination";
            }
            if(element.department=="IT & Documantation"){
                doc.data[index].department="IT & Documentation";
            }
            else if(element.department=="Managemant"){
                doc.data[index].department="Management";
            }
            else if(element.department=="Fecility managemant"){
                doc.data[index].department="Facility Management";
            }
if(index==doc.data.length-1){
            model.update({"_id": doc._id}, doc, function(err, updated) {
                console.log("Updating user data...");
                if(err) throw err;
         });  
         });
    }*/
})
.on('error', function(err){
    console.log("Error occured while updating user data",error);
})
.on('end', function(){
    console.log("User data updated...");
});

adminModel.find({}).cursor()
.on('data', function(doc){
    console.log("Retrieving admin model...");
    console.log("Admin model retrieved...");
  /*  doc["DepartmentList"].map(function(element,index){
        if(element=="IT & Documantation"){
            doc["DepartmentList"][index]="IT & Documentation";
        }
        else if(element=="Managemant"){
            doc["DepartmentList"][index]="Management";
        }
        else if(element=="Fecility managemant"){
            doc["DepartmentList"][index]="Facility Management";
        }
         if(index==doc["DepartmentList"].length-1)
        {
            
           adminModel.update({"_id": doc._id}, doc, function(err, updated) {
            if(err) throw err;
            });
        }
    });*/
    doc["Departments"].map(function(element,index){
        console.log("Updating department "+(index+1)+"/"+doc["Departments"].length+" ...");
        var key=Object.keys(element).pop();
        /*if(key=="IT & Documantation"){
            var temp=element[key];
            delete(element[key]);
            element["IT & Documentation"]=temp;
        }
        else if(key=="Managemant"){
            var temp=element[key];
            delete(element[key]);
            element["Management"]=temp;
        }
        else if(key=="Fecility managemant"){
            var temp=element[key];
            delete(element[key]);
            element["Facility management"]=temp;
        }*/
        if(index==doc["Departments"].length-1)
        {
            
           adminModel.update({"_id": doc._id}, doc, function(err, updated) {
            if(err) throw err;
            });
        }
    });
})
.on('error', function(err){
    console.log("Error occured while updating admin data",error);
})
.on('end', function(){
    console.log("Admin model updated");
});