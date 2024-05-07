const mongoose =require("mongoose");

require('dotenv').config();

const connect =async()=>{
    try {
        const a = await mongoose.connect(process.env.DB_CONNECTION);
        console.log("connect");
    } catch (error) {
        console.log(error)
        
    }
}

module.exports = connect;