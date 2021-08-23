/*############################################################################
# 
# Module: server.js
#
# Description:
#     Server module, to handle Grafana Influx Plugin queries
#
# Copyright notice:
#     This file copyright (c) 2021 by
#
#         MCCI Corporation
#         3520 Krums Corners Road
#         Ithaca, NY  14850
#
#     Released under the MCCI Corporation.
#
# Author:
#     Seenivasan V, MCCI Corporation February 2021
#
# Revision history:
#     V1.0.0-3 Wed Aug 23 2021 11:24:35 seenivasan
#       Module created
############################################################################*/

const cors = require('cors');
const express = require('express');
const appconst = require('./app/misc/constants.js');

const bodyParser = require('body-parser');

const app = express();

// parse requests of content-type - application/json
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

require('./app/routes/grafana.route.js')(app);
require('./app/version.js')(app);

app.use(cors());

global.reqCnt = 0;

var server = app.listen(8893, function () {
    var host = server.address().address
    var port = server.address().port
    console.log(""+appconst.APP_NAME+" v"+appconst.APP_VERSION+" Listening http://%s:%s", host, port)
});