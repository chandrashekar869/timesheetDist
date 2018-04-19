var mongoose=require('mongoose');
var Schema=mongoose.Schema;
var UserSchema=new Schema({
"name":String,
"emailId":String,
"phone":String,
"password":String,
"address":String,
"department":String,
"role":Object,
"data":Array,
},
{
    collection:'testCollection'
}
);
module.exports=mongoose.model("testCollection",UserSchema);
