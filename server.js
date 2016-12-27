/**
 * Created by Iaroslav Zhbankov on 26.12.2016.
 */
var express = require('express');
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/nightlife';
var Yelp = require('yelp');
var yelp = new Yelp({
    consumer_key: 'D8Pz1LzmgxC7WUdgwhHfEA',
    consumer_secret: 'AvvKH7OKHnCEognJRrJpxqgg_Ps',
    token: 'hODpfw8stpBlBS9Xx5_cTtE2j5oapRcY',
    token_secret: 'yb0m-kyG5q_5sUladmco55Pa5U4'
});


app.use("/", express.static('public'));
app.use(express.static(__dirname + '/public'));
app.use(session({secret: "secretword", resave: false, saveUninitialized: true}));
app.use(bodyParser.urlencoded({extended: false}));
app.set('view engine', 'jade');
app.set('views', __dirname + '/view');

app.get('/', function (req, res) {
    res.render('index.jade', {});
});

app.get('/signup', function (req, res) {
    res.render('signup.jade', {});
});

app.post('/signup', function (req, res) {
    console.log(req.body);
    var username = req.body.user;
    var email = req.body.email;
    var password = req.body.password;

    MongoClient.connect(url, function (err, db) {
        db.collection('users').findOne({"username": username}, function (err, item) {
            if (item) {
                db.close();
                console.log("user already exist");
                res.redirect('/signup');
            } else {
                req.session.user = username;
                db.collection('users').insertOne({
                    "username": username,
                    "email": email,
                    "password": password
                }, function (err, result) {
                    if (!err) {
                        console.log("user added successfuly");
                    }
                });
                db.close();
                res.redirect('/');
            }
        });
    });
});

app.get('/signin', function (req, res) {
    res.render('signin.jade', {});
});

app.post('/signin', function (req, res) {
    var username = req.body.user;
    var password = req.body.password;

    MongoClient.connect(url, function (err, db) {
        db.collection('users').findOne({"username": username, "password": password}, function (err, item) {
            if (item) {
                req.session.user = username;
                db.close();
                console.log("user existing");
                res.redirect('/');
            } else {
                db.close();
                console.log("password or username is invalid");
                res.redirect('/signin');
            }
        });
    });
});

app.get('/logout', function (req, res) {
    req.session.destroy();
    console.log("session ends");
    res.redirect('/');
});

app.post('/search', function (req, res) {
    var location = req.body.location;
    yelp.search({term: 'food', location: location})
        .then(function (data) {
            var jsonString = JSON.stringify(data); // convert data to JSON string
            jsonBussObj = JSON.parse(jsonString).businesses; // Parse JSON string to JSON Object
            var l = jsonBussObj.length; // Print length






        })
        .catch(function (err) {
            console.error(err);
        });
    res.redirect('/');
});
app.listen(process.env.PORT || 3000, function () {
    console.log("Start server at port 3000");
});