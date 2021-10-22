/*############################################################################
# 
# Module:version.js
#
# Description:
#     Version Endpoint
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
#     V1.0.0 Fri Oct 22 2021 11:24:35 seenivasan
#       Module created
############################################################################*/

const appconst = require('./misc/constants.js');

module.exports = function (app) {
    app.get('/version', function(req, res) {
        //res.status(200).json('Grafana Influx Plugin API V1.0.0-3');
        res.status(200).json(''+appconst.APP_NAME+" v"+appconst.APP_VERSION);
    });
}

