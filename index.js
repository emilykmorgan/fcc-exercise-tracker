const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

// MongoDB and Mongoose setup
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

// Setup User schema and model
const userSchema = new mongoose.Schema({
  username: String
});
const User = mongoose.model('User', userSchema);

// Setup Exercise schema and model
const exerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date,
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// POST method to save a user to the Mongo DB
app.post('/api/users', async (req, res) => {
  const userObj = new User({
    username: req.body.username
  });
  try {
    const user = await userObj.save();
    console.log(user);
    res.json(user);
  } catch (err) {
    console.log(err);
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
