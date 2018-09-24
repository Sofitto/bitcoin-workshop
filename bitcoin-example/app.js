var express = require('express');
var app = express();

app.use('/', express.static(__dirname + '/static'));

var port = 3030;
app.listen(port);
console.log("App listening on port " + port);
