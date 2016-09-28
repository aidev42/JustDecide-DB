var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors')

// Init app
var app = express();

// Connect with Mongo DB
var mongoUri =  process.env.MONGODB_URI || 'mongodb://localhost/JustDecide';
mongoose.connect(mongoUri);

//Init the middle-ware
app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//MIDDLEWARE FOR TROUBLESHOOTING
app.use(function(req,res,next){ //console logs url calls
  console.log(req.method + " " + req.url);
  next();
});

//View Engine
app.set( 'views', path.join(__dirname, 'views'));
app.set( 'view engine', 'jade');

//User model and database
var User = require('./model/user');

app.options('/retrieve', cors());
app.post('/retrieve', function (req, res, done) {
  var dataReturn = {}
  console.log('user email is: ', req.body.email)
  console.log('password is:', req.body.password)
  User.findOne({
      'email': "test@aol.com"
    },
    function(err, user){
      if(err || req.body.password == undefined){ return done(err); }

      if(!user){
        console.log('no user found')
        return done(err)
      }
      console.log('user is: ', user)
      //check password
      var hash = user.generateHash(req.body.password)
      console.log(hash)
      if (!(user.validPassword(req.body.password))) {
        console.log('bad password')
        return done(err);
      } else {
        dataReturn = {
          'Favorites': user.favorites,
          'Decisions': user.decisions
        }
      }
    console.log('data to be sent: ', dataReturn)
    res.send(dataReturn);
  });
});

app.options('/', cors());
app.post('/', function (req, res, done) {

  User.findOne({
      'email': req.body.email
    },
    function(err, user){
      if(err || req.body.password == undefined){ return done(err); }

      if(!user){
        var user = new User({
          'email': req.body.email,
          'password': '',
          'favorites': req.body.userData.favorites,
          'decisions': req.body.userData.decisions
        });
        user.save(function(err){
          if(err) console.log('error saving user' + err);
          return done(err, user);
        });
        user.password = user.generateHash(req.body.password);
        user.save(function(err){
          if(err) console.log('error saving user' + err);
          return done(err, user);
        });
      } else if (user.validPassword(req.body.password)) {
          // update user's existing data
          user.favorites = req.body.userData.favorites;
          user.decisions = req.body.userData.decisions;
          user.save(function(err){
            if(err) console.log('error saving user' + err);
            return done(err, user);
          });
      }
  });
  res.send('done')
});

// listen
app.listen(process.env.PORT || 3000 )