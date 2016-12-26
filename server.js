/**
 * Created by Iaroslav Zhbankov on 26.12.2016.
 */
var express = require('express');
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/nightlife';

app.use('/', express.static('public'));
app.use(express.static(__dirname + '/public'));
app.use(session({secret: "secretword", resave: false, saveUninitialized: true}));
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/view/index.html');
});

app.get('/signup', function (req, res) {
    res.sendFile(__dirname + '/view/signup.html');
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
    res.sendFile(__dirname + '/view/signin.html');
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

app.listen(process.env.PORT || 3000, function () {
    console.log("Start server at port 3000");
});