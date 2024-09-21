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
    res.json(user);
  } catch (err) {
    console.log(err);
  }
});

// GET list of all users
app.get('/api/users', async (req, res) => {
  const users = await User.find().select('_id username');

  if (users) {
    res.json(users);
  } else {
    res.send('No users found');
  }
})

// POST method to save an exercise to the Mongo DB
app.post('/api/users/:_id/exercises', async (req, res) => {
  const idParam = req.params._id;
  const {description, duration, date} = req.body;

  try {
    const user = await User.findById(idParam);
    if (!user) {
      res.send('User not found');
    } else {
      const exerciseObj = new Exercise({
        userId: user._id,
        description: description,
        duration: duration,
        date: date ? new Date(date) : new Date()
      });
      const exercise = await exerciseObj.save();

      // Fix date conversion issue due to different time zones
      let daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      let d = exercise.date;
      // format the date correctly
      d = daysOfWeek[d.getUTCDay() - 1] + " " + months[d.getUTCMonth()] + " " + (d.getUTCDate() < 10 ? '0' + d.getUTCDate() : d.getUTCDate()) + " " + d.getUTCFullYear();
      
      res.json({
        _id: user._id,
        username: user.username,
        date: d,
        duration: exercise.duration,
        description: exercise.description
      });
    }
  } catch (err) {
    console.log(err);
    res.send('Error while saving exercise');
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const idParam = req.params._id;
  const user = await User.findById(idParam);

  if (user) {
    let dateObj = {};

    // Mongo Comparison Queries to filter logs based on date
    // $gte = greater than or equal to
    // $lte = less than or equal to
    if (from) {
      dateObj['$gte'] = new Date(from);
    }
    if (to) {
      dateObj['$lte'] = new Date(to);
    }

    let filter = {
      userId: user._id
    };

    if (from || to) {
      filter.date = dateObj;
    }

    const exercises = await Exercise.find(filter).limit(parseInt(limit) ?? 999999);

    res.json({
      username: user.username,
      count: exercises.length,
      _id: user._id,
      log: exercises.map(x => ({
        description: x.description,
        duration: x.duration,
        date: x.date.toDateString()
      }))
    });
  } else {
    res.send('User not found');
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
