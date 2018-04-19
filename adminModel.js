var mongoose=require("mongoose");
var Schema=mongoose.Schema;
var adminSchema=new Schema({
    "Departments":Array,
    "Projects":Array,
    "Stages":Array,
    "Tasks":Array
},{
    collection:"adminCollection"
});
module.exports=mongoose.model("adminCollection",adminSchema);
