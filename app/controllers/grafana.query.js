const readdb = require('./influx.js');
const cntryctrl = require('./country.controller.js');
const tagkeyctrl = require('./grafana.tagkey.js');
const tagvalctrl = require('./grafana.tagval.js');
const measctrl = require('./grafana.measure.js');

const constants = require('../misc/constants.js');


module.exports  =  function (app) {
    app.post('/query', async function(req, res) {

        console.log("\nGrafana Post Request")

        var inq = req.body.q

        console.log("Query: ", inq)
        console.log("Query1: ", req.query)
        console.log("ClientName: ", req.headers.clientname)


        if(!req.headers.authorization || req.headers.authorization.indexOf('Basic') === -1){
	    console.log("auth missed!")
	}

	const b64c = req.headers.authorization.replace(/^Basic/, '')
	const creden = (new Buffer.from(b64c, 'base64')).toString('ascii')
	console.log("credentials: "+creden)
	const [uname, pwd] = creden.split(':')
	console.log(uname, pwd)

        if(inq.includes("SHOW TAG KEYS"))
        {
            console.log("\nGrafana QT-2")
            tagkeyctrl.tagKey(req, res)
        }
        else
        if(inq.includes("SHOW TAG VALUES"))
        {
            console.log("\nGrafana QT-3")
            tagvalctrl.tagVal(req, res)
        }
        else
        if(inq.includes("SELECT"))
        {
            console.log("\nGrafana QT-4")
            measctrl.measureVal(req, res)
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
    });
}


const asyncOperation = index => {

    return new Promise(resolve =>
  
      setTimeout(() => {
  
        console.log('Request performed:');
  
        resolve(index);
  
      }, 5000))
  
  };


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
