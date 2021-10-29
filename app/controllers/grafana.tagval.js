/*############################################################################
# 
# Module: grafana.tagkey.js
#
# Description:
#     Endpoint implementation for Grafna Tag Value queries
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

var request = require('request');

const constants = require('../misc/constants.js');

exports.tagVal = async function (req, res, influxd) {

    var options = {
        url: constants.DNC_URL+"tagsv",
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        form: { 'influxd': influxd }
    };

    request(options, function (error, resp, body) {
        if (error) {
            res.status(500).send('Connect to DNC failed!');
        }

        else {
            if (resp.statusCode == 200) {
                res.status(200).send(body);
            }

            else {
                res.sendStatus(401);
            }
        }
    });
}