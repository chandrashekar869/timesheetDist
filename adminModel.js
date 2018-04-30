var mongoose=require("mongoose");
var Schema=mongoose.Schema;
var adminSchema=new Schema({
    "Departments":Array,
    "DepartmentList":Array
},{
    collection:"adminCollection"
});
module.exports=mongoose.model("adminCollection",adminSchema);
