const tagkeyctrl = require('./grafana.tagkey.js');
const tagvalctrl = require('./grafana.tagval.js');
const measctrl = require('./grafana.measure.js');
const constants = require('../misc/constants.js');
const readdb = require('./influx.js');

exports.gquery = async function (req, res) {

    const b64c = req.headers.authorization.replace(/^Basic/, '')
	const creden = (new Buffer.from(b64c, 'base64')).toString('ascii')
    const [uname, pwd] = creden.split(':')
    
    var influxd = {}
    influxd.uname = uname;
    influxd.pwd = pwd;
    influxd.dbname = req.query.db
    influxd.query = req.body.q
    
    var inq = req.body.q

    if(inq.includes("SHOW TAG KEYS"))
    {
        console.log("\nGrafana QT-2")
        tagkeyctrl.tagKey(req, res, influxd)
    }
    else
    if(inq.includes("SHOW TAG VALUES"))
    {
        console.log("\nGrafana QT-3")
        tagvalctrl.tagVal(req, res, influxd)
    }
    else
    if(inq.includes("SELECT"))
    {
        console.log("\nGrafana QT-4")
        measctrl.measureVal(req, res, influxd)
    }
    else
    {
        console.log("\nGrafana QT-1")
        var influxset = {};
	    influxset.server = constants.INFLUX_URL
	    influxset.db = req.query.db
	    influxset.qry = req.body.q
	    influxset.user = constants.INFLUX_UNAME
	    influxset.pwd = constants.INFLUX_PWD
        
        readMeasurement(res, influxset)
    }
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