const cors = require('cors');
const express = require('express');
const dbConfig = require('./config/dbconfig.js');
const mongoose = require('mongoose');

const bodyParser = require('body-parser');

const app = express();

// parse requests of content-type - application/json
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

require('./app/routes/grafana.route.js')(app);
require('./app/version.js')(app);

app.use(cors());

global.reqCnt = 0;

var server = app.listen(8895, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("MCCI DNC App-API Listening http://%s:%s", host, port)
});

