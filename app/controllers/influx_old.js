const influxDB = require('influx');

exports.readInflux = (indata) => {
    return new Promise(function(resolve, reject) {

        const conn = {
            //host: 'influxdb',
            host: 'staging-analytics.weradiate.com/influxdb',
            database: indata.db,
            username: indata.user,
            password: indata.pwd,
            port: '8086'
        };

        const client = new influxDB.InfluxDB(conn)

        client.queryRaw(indata.qry)
        .then(rawData =>{
            if(rawData.hasOwnProperty("results"))
            {
                resobj = rawData["results"][0]
                if(resobj.hasOwnProperty("statement_id"))
                {
                    resolve(rawData);
                }
                else
                {
                    console.log("Result Error: ")
                    reject("error");
                }
            }

        }).catch(err => {
            console.log("Show Influx Error: ", err)
            reject("error");
        });

    });
}