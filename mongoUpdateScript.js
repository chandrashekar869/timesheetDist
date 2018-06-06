var mongoose = require('mongoose');
var model = require('./model');
var adminModel=require('./adminModel');
mongoose.connect("mongodb://localhost:27017/timesheetDB");
console.log("Run Async...");
model.find({}).cursor()
.on('data', function(doc){
    console.log("Retrieving user data...");
    console.log("User data retrieved...");
    doc.data=[];
    model.update({"_id": doc._id}, doc, function(err, updated) {
        console.log("Updating user data...");
        if(err) throw err;
 });
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
    doc["Departments"].map(function(element,index){
        console.log("Updating department "+(index+1)+"/"+doc["Departments"].length+" ...");
        var key=Object.keys(element).pop();
        var approverKey=Object.keys(element[key]["TaskApprover"]);
        if(approverKey!=null && approverKey.length>0){
           approverKey.map(function(taskname,taskindex){
            doc["Departments"][index][key]["TaskApprover"][taskname]=[doc["Departments"][index][key]["TaskApprover"][taskname]];
        });
        }
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