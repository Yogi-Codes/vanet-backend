/**
 * ORM Model for Broadcast Messages
 * The schema defines each message's structure
 */

const mongoose = require("mongoose");

const BroadcastSchema = mongoose.Schema(
  {
    _id: String, 
    text: String, 
    createdAt: String,
    userid:String,
    username:String 

 
  },
  {
    strict: false //There may be some problems in type casting. So disable strict mode.
  }
);

module.exports = mongoose.model("Broadcasts", BroadcastSchema);
