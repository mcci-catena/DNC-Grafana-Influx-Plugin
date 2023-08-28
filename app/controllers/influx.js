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
#     V1.0.0 Fri Oct 22 2021 11:24:35 seenivasan
#       Module created
############################################################################*/

const request = require('request');
const constants = require('../misc/constants.js');

exports.readSensorInflux = (indata) => {
    return new Promise(function(resolve, reject) {

        // console.log("InfCommand: ", indata)

        let inq = indata.qry.replace("+", "%2B")
        let query = ""+indata.infdb.url+"/query?db="+indata.infdb.db+"&q="+inq

        
        request.get(query,
            {'auth': {'user': indata.infdb.uname, 'pass': indata.infdb.pwd, 'sendImmediately': false } },
            function(error, response)
            {
                if(error)
                {
                    reject(indata["sdata"] = "error");
                }
                else
                {
                    try
                    {
                        var dout = JSON.parse(response.body)
                        
                        if(dout.hasOwnProperty("results"))
                        { 
                            resobj = dout.results[0]

                            if(resobj.hasOwnProperty("statement_id"))
                            {
                                let mq = indata.qid.mq
                                let cq = indata.qid.cq
                                
                                let cdata = {}
                                cdata[cq] = {tags: indata.tags, data: dout}
                                let mdata = {}
                                mdata[mq] = cdata
                                resolve(mdata);
                            }
                            else
                            {
                                reject(indata["sdata"] = "error");
                            }
                        }
                        else
                        {
                            reject(indata["sdata"] = "error");
                        }
                    }
                    catch(err){
                        reject(indata["sdata"] = "error");
                    }
                        
                }
        });
    })
}

exports.readInflux = (indata) => {
    return new Promise(function(resolve, reject) {

        let inq = indata.qry.replace("+", "%2B")
        // query = ""+indata.server+"/query?db="+indata.db+"&q="+inq

        query = ""+constants.INFLUX_URL+"/query?db="+indata.db+"&q="+inq


        console.log("Read Influx: ", query)

        request.get(query,
            {'auth': {'user': indata.user, 'pass': indata.pwd, 'sendImmediately': false } },
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
