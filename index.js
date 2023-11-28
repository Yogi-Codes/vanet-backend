
//libraies
const express = require("express");
const http = require("http");

const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const DOMPurify = require('isomorphic-dompurify');
var Filter = require('bad-words'),
    filter = new Filter();
    const extractUrls = require("extract-urls");
//DB Models
const User = require("./models/User");
const Chat = require("./models/Chat");
const Broadcast = require("./models/Broadcast");
const Location = require("./models/Location");

//Environment Variables
require("dotenv/config");

//Initialize the server
const port = 5000; //Default port
const app = express(); //Define the express app
const server = http.createServer(app); 
 

//Enabling JSON parser
app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

//DB Connection
mongoose.connect(
  process.env.DB_CONNECTION,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    console.log("Connected to DB");
  }
);

/**API Declaration */

//User login API
app.post("/login", async (req, res) => {
  console.log(req.body);
  const query =  User.find({ name: req.body.name,password:req.body.password });
  query
    .exec()
    .then(data => {
      if (data.length === 0) {
        // const user = new User({
        //   name: req.body.name,
        //   password: req.body.password,
        //   // photo: req.body.photo
        // });

        res.status(404).json("User not Found");
 
      } else {
        res.json(data[0]);
      }
    })
    .catch(error => {
      res.json(error);
    });
});

app.get("/", (req, res) => {
 res.status(200).json({
  text:"hello world!"
 })
});
app.post("/saveLocation", async (req, res) => {
  const { id, lat, lng, title, content } = req.body;

  try {
    // Try to find the location by ID
    let existingLocation = await Location.findOne({ id });

    if (existingLocation) {
      // If location exists, update it
      existingLocation.lat = lat;
      existingLocation.lng = lng;
      existingLocation.title = title;
      existingLocation.content = content;
      await existingLocation.save();
    } else {
      // If location does not exist, create a new one
      await Location.create({ id, lat, lng, title, content });
    }

    res.status(200).json({ message: "Location saved/updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Endpoint to fetch the latest information by ID
app.get("/getAllLocations", async (req, res) => {
  try {
    const locations = await Location.find({});

    if (locations.length > 0) {
      res.status(200).json(locations);
    } else {
      res.status(200).json({ message: "Locations not found." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// Route: POST /mobLogout
app.post('/mobLogout', async (req, res) => {
  try {
    const locationId = req.body.id;

    // Retrieve location document
    const location = await Location.findOneAndDelete({ id: locationId });

    // Validate location existence
    console.log(location);
    if (!location ||  location.length==0) {
      console.error('Location not found:', locationId);
      return res.status(404).json({ message: 'Location not found.' });
    }

    console.log('Location deleted successfully:', location);
    res.status(200).json({ message: 'Location deleted successfully.' });

  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});







//New chat message API
app.post("/chats", (req, res) => {




  const extractedText = req.body.messages[req.body.messages.length - 1].text
  let urls = extractUrls(extractedText);

  const clean = DOMPurify.sanitize(extractedText);
  

  req.body.messages[req.body.messages.length - 1].text = filter.clean(clean)

  console.log(urls);
    



  const query = Chat.findOne({
    $or: [
      { reciever: req.body.reciever, sender: req.body.sender },
      { reciever: req.body.sender, sender: req.body.reciever }
    ]
  });
  query
    .exec()
    .then(data => {
      if (data === null) {
        const chat = new Chat({
          sender: req.body.sender,
          reciever: req.body.reciever,
          messages: req.body.messages
        });

        chat
          .save()
          .then(data => {
            res.json(data);
          })
          .catch(error => {
            res.json(error);
          });
      } 
      else 
      {
        const updateChat = Chat.updateOne(
          {
            $or: [
              { reciever: req.body.reciever, sender: req.body.sender },
              { reciever: req.body.sender, sender: req.body.reciever }
            ]
          },
          {
            $set: {
              sender: req.body.newSender || req.body.sender,
              reciever: req.body.newreciever || req.body.reciever,
              messages: req.body.newMessages || req.body.messages
            }
          }
        );
        updateChat
          .exec()
          .then(data => {
            res.json(data);
          })
          .catch(error => {
            res.json(error);
          });
      }
    })
    .catch(error => {
      res.json(error);
    });
});
app.post("/signup", (req, res) => {
  const query = User.find({ name: req.body.name });

  query
    .exec()
    .then(data => {
      if (data.length === 0) {
        const user = new User({
          name: req.body.name,
          password: req.body.password,
          // photo: req.body.photo
        });

        user
          .save()
          .then(savedUser => {
            res.json(savedUser);
          })
          .catch(error => {
            res.status(500).json({ error: "Unable to create a new user" });
          });
      } else {
        res.status(400).json({ error: "User already exists" });
      }
    })
    .catch(error => {
      res.status(500).json({ error: "Internal server error" });
    });
});

//Chat messages getter API
app.get("/chats/:sender/:reciever", (req, res) => {

  const chat = Chat.findOne({
    $or: [
      { reciever: req.params.reciever, sender: req.params.sender },
      { reciever: req.params.sender, sender: req.params.reciever }
    ]
  });


  chat.exec().then(data => {
    if (data === null) {
      res.json([]);
    } else {
      res.json(data.messages);
    }
  });
});

//Chatrooms getter API
app.get("/chats/:userId", (req, res) => {
  const chat = Chat.find({
    $or: [{ reciever: req.params.userId }, { sender: req.params.userId }]
  });

  chat.exec().then(data => {
    if (data.length === 0) {
      res.json([]);
    } else {
      res.json(data);
    }
  });
});

//New Broadcast Messages API
app.post("/broadcast", async (req, res) => {
  console.log(req.body);
  try {
    const messaged = new Chat({
      sender: req.body.id,
      receiver: "", // Corrected typo in "reciever" to "receiver"
      text: "Broadcast : "+req.body.message
    });
    Chat.updateMany(
      {
        _idd: { $ne: 0 } 
      },
      {
        $push: {
          messages: messaged
        }
      }
    )
      .then((result) => {
        if (result.nModified === 0) {
          return res.status(404).send({ error: 'No matching chats found' });
        }
        res.send({ message: 'Message broadcast successfully', result });
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send({ error: 'Error broadcasting message' });
      });
    


  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error broadcasting message', details: error.message });
  }
});





//Broadcast Message getter API
app.get("/broadcast", (req, res) => {
  const chat = Broadcast.find();

  chat.exec().then(data => {
    if (data === null) {
      res.json(data);
    } else {
      res.json(data);
    }
  });
});

//User finder API
app.get("/find/:id", (req, res) => {
  const user = User.find({ id: req.params.id });
  user.exec().then(data => {
    res.json(data[0]);
  });
});

//Active users finder API
app.get("/users/active", (req, res) => {
  const users = User.find({ isActive: true });
  users.exec().then(data => {
    res.json(data);
  });
});

//Inactive users finder API
app.get("/users/inactive", (req, res) => {
  const users = User.find({ isActive: false });
  users.exec().then(data => {
    res.json(data);
  });
});
app.get("/users/all", (req, res) => {
  const users = User.find({ });
  users.exec().then(data => {
    res.json(data);
  });
});


//Let the server to listen
server.listen(port, () => console.log(`Listening on port ${port}`));
