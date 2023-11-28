

const mongoose = require("mongoose");

const LocationSchema = mongoose.Schema({
  id: String,
  lat: String,
  lng: String,
  title: String,
  content: String,
 
  isActive: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("Locations", LocationSchema);
