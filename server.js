/**
 * Created by Iaroslav Zhbankov on 26.12.2016.
 */
var express = require('express');
var app = express();
var session = require('express-session');

app.use('/', express.static('public'));
app.use(session({secret: "secretword", resave: false, saveUninitialized: true}));

app.get('/', function (req, res) {
    res.sendFile('index.html')
});

app.listen(process.env.PORT || 3000, function () {
    console.log("Start server at port 3000");
});