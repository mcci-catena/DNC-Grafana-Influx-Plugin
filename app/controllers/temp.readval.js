const readdb = require('./influx.js');
const constants = require('../misc/constants.js');

exports.gquery = async function (req, res) {

    //var body = 'SELECT max("vBat") FROM "autogen"."HeatData" WHERE ("devEUI" = \'0002CC0100000343\') AND time >= 1603391400000ms and time <= 1603477799000ms GROUP BY time(2m) fill(null)'
    var body = 'SELECT max("vBat") FROM "autogen"."HeatData" WHERE ("devEUI" = \'0002CC0100000343\') AND time >= 1603391400000ms and time <= 1603477799000ms GROUP BY time(2m) fill(0)'
    var influxset = {};
    
    //query = "https://staging-iseechange.mcci.mobi/influxdb:8086/"+"query?db=iseechange-01"+
    //            "&q=select+deviceid,+"+aggfn+"+from+"+
    //            indata.measure+"+where+"+devid+"time+>=+'"+fmdtstr+
    //            "'+and+time+<=+'"+todtstr+"'+group by time(1d)"
    
    influxset.server = constants.INFLUX_URL
	influxset.db = "iseechange-01"
	influxset.qry = body
	influxset.user = constants.INFLUX_UNAME
    influxset.pwd = constants.INFLUX_PWD
    
    readMeasurement(res, influxset)

}


async function readMeasurement(res, indata)
{
   try{
       influxdata = await readdb.readInflux(indata)

       if(influxdata != 'error')
       {
           return res.status(200).send(influxdata)
       }

   }catch(err){
       return res.status(400).send({
            error: "Data not available for the sensor"
       });
   }
}