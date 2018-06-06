var mongoose=require('mongoose');
var Schema=mongoose.Schema;
var UserSchema=new Schema({
"name":String,
"emailId":String,
"phone":String,
"password":String,
"address":String,
"department":Array,
"role":Object,
"data":Array,
"forceLogOut":Boolean
},
{
    collection:'userCollection'
}
);
module.exports=mongoose.model("userCollection",UserSchema);
