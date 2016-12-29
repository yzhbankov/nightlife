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
var lastLocation = '';


app.use("/", express.static('public'));
app.use("/search", express.static('public'));
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
                res.redirect('/search/' + lastLocation);
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
                res.redirect('/search/' + lastLocation);
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
    res.redirect('/search/' + lastLocation);
});

app.post('/search', function (req, res) {
    var location = req.body.location;
    lastLocation = location;
    yelp.search({term: 'bars', location: location})
        .then(function (data) {
            var jsonString = JSON.stringify(data); // convert data to JSON string
            jsonBussObj = JSON.parse(jsonString).businesses; // Parse JSON string to JSON Object
            var l = jsonBussObj.length; // Print length

            var promise = new Promise(function (resolve, reject) {
                jsonBussObj.forEach(function (el, index) {
                    var barname = el["name"];
                    var bar_url = el["url"];
                    var text = el["snippet_text"];
                    var image_url = el["image_url"];
                    var location = el["location"]["city"];
                    MongoClient.connect(url, function (err, db) {
                        db.collection('bars_1').findOne({
                            "barname": barname,
                            "location": location
                        }, function (err, item) {
                            if (item) {
                                db.close();
                                if (index == l - 1) {
                                    resolve();
                                }
                            } else {
                                db.collection('bars_1').insertOne({
                                    "barname": barname,
                                    "location": location,
                                    "url": bar_url,
                                    "text": text,
                                    "img_url": image_url,
                                    "going": []
                                }, function (err, result) {
                                    if (!err) {
                                        console.log("bar added successfuly");
                                    }
                                });
                                db.close();
                                if (index == l - 1) {
                                    resolve();
                                }
                            }
                        });

                    });

                });
            });
            promise.then(function () {
                MongoClient.connect(url, function (err, db) {
                    db.collection('bars_1').find({
                        "location": location
                    }).toArray(function (err, items) {
                        res.render('searchResult.jade', {
                            "location": location,
                            "data": items,
                            "user": req.session.user
                        });
                    });
                    db.close();
                });
            });


        })

        .catch(function (err) {
            console.error(err);
        });
});

app.get('/search/:location', function (req, res) {
    var location = req.params.location;
    MongoClient.connect(url, function (err, db) {
        db.collection('bars_1').find({
            "location": location
        }).toArray(function (err, items) {
            res.render('searchResult.jade', {
                "location": location,
                "data": items,
                "user": req.session.user
            });
        });
        db.close();
    });
});

app.get('/search/:user/:barname', function (req, res) {
    var barname = req.params.barname;
    var user = req.params.user;
    if (user == 'null') {
        res.send("not authorised");
    } else {
        MongoClient.connect(url, function (err, db) {
            db.collection('bars_1').findOne({"barname": barname}, function (err, item) {
                if (item) {
                    if (item.going.indexOf(user) == -1) {
                        var newGoing = item.going;
                        newGoing.push(user);
                        db.collection('bars_1').update({"barname": barname},
                            {"$set": {"going": newGoing}}, function (err, doc) {
                                console.log("user going");
                                db.close();
                            });
                        res.send({"number": newGoing.length});
                    } else {
                        var newGoing = item.going;
                        newGoing.splice(item.going.indexOf(user), item.going.indexOf(user) + 1);
                        db.collection('bars_1').update({"barname": barname},
                            {"$set": {"going": newGoing}}, function (err, doc) {
                                console.log("user going");
                                db.close();
                            });
                        res.send({"number": newGoing.length});
                    }
                } else {
                    db.close();
                    res.send("no such a bar");
                }
            });
        });
    }
});

app.listen(process.env.PORT || 3000, function () {
    console.log("Start server at port 3000");
});