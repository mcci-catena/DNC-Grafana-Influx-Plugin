/*############################################################################
# 
# Module: grafana.brixval.js
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
#     V1.0.0 Wed Mar 02 2022 11:24:35 seenivasan
#       Module created
############################################################################*/

var request = require('request');
const constants = require('../misc/constants.js');

function getBrixVal(filter)
{
    return new Promise(async function(resolve, reject) {
        const url = "http://localhost:8891/brix"

        request.get(url, function (error, resp, body) {
            if (error) {
                console.log('Connect to DNC failed!');
                console.log(error)
                reject("error")
            }

            else {
                if (resp.statusCode == 200) {
                    
                    if(filter === false) {
                        resolve(JSON.parse(body))
                    }
                   
                    let rdata = JSON.parse(body)
                    nbrixval = []
                    for(let i=0; i< rdata.length; i++)
                    {
                        let brixdict = {}
                        brixdict["Arnot"] = rdata[i]["Arnot"]
                        brixdict["Uihlein"] = rdata[i]["Uihlein"]
                        brixdict["UVM"] = rdata[i]["UVM"]
                        let bdate = rdata[i]["rdate"].split("T")
                        brixdict["rdate"] = bdate[0]
                        nbrixval.push(brixdict)
                    }
                    resolve(nbrixval)
                }
                else {
                    console.log("401 Error");
                    reject("error")
                }
            }
        });

    });
}

exports.brixVal = getBrixVal