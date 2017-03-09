// https://scotch.io/tutorials/authenticate-a-node-js-api-with-json-web-tokens

let express     = require('express');
let app         = express();
let bodyParser  = require('body-parser');
let morgan      = require('morgan');
let mongoose    = require('mongoose');

let jwt    = require('jsonwebtoken');
let db     = 'mongodb://localhost:27017/token';
let User   = require('./models/user'); // get our mongoose model

//let port = process.env.PORT || 8080; // used to create, sign, and verify tokens
let port = 3000;
mongoose.connect(db); // connect to database
app.set('superSecret', 'superTopSecretNinja'); // secret letiable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

app.get('/setup', (req, res)=>{

  // create a sample user
  let tmpUsr = new User({
    name: 'Administrateur',
    password: 'azerty',
    admin: true
  });

  User.findOne({name: 'Administrateur'}, (err, doc)=>{
    if(!doc) {
      tmpUsr.save((err)=>{
        if (err) throw err;

        console.log('User saved successfully');
        return res.json({ success: true });
      });
    }

    return res.status(500).send('Seems to be already set');
  })

  // save the sample user
});

app.post('/authenticate', (req, res)=>{
  // find the user
  User.findOne({
    name: req.body.name
  }, (err, user)=>{

    if (err) throw err;

    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {

      // check if password matches
      if (user.password != req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {

        // if user is found and password is right
        // create a token
        let token = jwt.sign(user, app.get('superSecret'), {
          expiresIn : 60*60*24
        });

        // return the information including token as JSON
        res.json({
          success: true,
          message: 'token',
          token: token
        });
      }

    }

  });
})

app.get('/api', (req, res, next)=>{
  // check header or url parameters or post parameters for token
 let token = req.body.token || req.query.token || req.headers['x-access-token'];

 // decode token
 if (token) {

   // verifies secret and checks exp
   jwt.verify(token, app.get('superSecret'), (err, decoded)=>{
     if (err) {
       return res.json({ success: false, message: 'Failed to authenticate token.' });
     } else {
       // if everything is good, save to request for use in other routes
       req.decoded = decoded;
       next();
     }
   });

 } else {

   // if there is no token
   // return an error
   return res.status(403).send({
       success: false,
       message: 'No token provided.'
   });

 }
}, (req, res)=>{
  res.json({ok: true});
});

app.get('/', (req, res)=>{
    res.send('API url : http://localhost:' + port + '/api');
});

app.listen(port);
console.log('Server opened at http://localhost:' + port);
