/*############################################################################
# 
# Module: influx.js
#
# Description:
#     InfluxDB read module
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
#     V1.0.3 Wed Feb 23 2021 11:24:35 seenivasan
#       Module created
############################################################################*/

const request = require('request');

exports.readInflux = (indata) => {
    return new Promise(function(resolve, reject) {
        query = ""+indata.server+"/query?db="+indata.db+"&q="+indata.qry

        console.log("Target: ", query)

        request.get(query,
            {'auth': {'user': 'ezra', 'pass': '1millioncompost', 'sendImmediately': false } },
            function(error, response)
            {
                if(error)
                {
                    reject("error");
                }
                else
                {
                    try
                    {
                        var dout = JSON.parse(response.body)
                        console.log(dout)
                        if(dout.hasOwnProperty("results"))
                        { 
                            resobj = dout.results[0]

                            if(resobj.hasOwnProperty("statement_id"))
                            {
                                resolve(dout);
                            }
                            else
                            {
                                reject("error");
                            }
                        }
                        else
                        {
                            reject("error");
                        }
                    }
                    catch(err){
                        reject("error");
                    }
                        
                }
        });
    });
}