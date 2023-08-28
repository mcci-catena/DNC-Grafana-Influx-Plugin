/*############################################################################
# 
# Module: grafana.tagkey.js
#
# Description:
#     Endpoint implementation for Grafna Tag Key queries
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
const readdb = require('./influx.js');

exports.tagKey = async function (req, res, influxd) {

    if(global.infKey.length >= 0)
    {
        var influxset = {};
	influxset.server = constants.INFLUX_URL
	influxset.db = req.query.db
	influxset.qry = req.body.q
	influxset.user = constants.INFLUX_UNAME
	influxset.pwd = constants.INFLUX_PWD
        
        readMeasurement(influxset)
    }


    var options = {
        url: constants.DNC_URL+"tagsk",
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        form: { 'influxd': influxd }
    };

    request(options, function (error, resp, body) {
        if (error) {
            console.log("Connect to DNC failed")
            res.status(500).send('Connect to DNC failed!');
        }

        else 
        {
            if (resp.statusCode == 200) 
            {
                serdict = {};
                resdict = {};
                findict = {};

                var data = JSON.parse(resp.body);

                serdict["name"] = "HeatData";
                serdict["columns"] = ["tagKey"];
                serdict["values"] = data.message;
                
                for(let i=0; i<global.infKey.length; i++)
                {
                    serdict["values"].push(global.infKey[i])
                }

                resdict["statement_id"] = 0;
                resdict["series"] = [serdict];

                findict["results"] = [resdict];

                res.status(200).send(findict);
            }

            else 
            {
                //console.log("Tag Key Read Error")
                res.sendStatus(401);
            }
        }
    });
}


async function readMeasurement(indata)
{
   try{
       influxdata = await readdb.readInflux(indata)

       if(influxdata != 'error')
       {
           reskey = influxdata.results[0].series[0].values
           if(reskey.length > 0)
           {
               global.infKey = []
               global.infKey.push(" - - - ")
               
               for(let i=0; i<reskey.length; i++)
               {
                   global.infKey.push(reskey[i])
               }
               console.log("\nInfKey: Fine")
           }
       }
       else
       {
           console.log("\nInfKey: Error-1")
           //global.infKey = []
       }

   }catch(err){
       console.log("\nInfKey: Error-2")
       //global.infKey = []
   }
}