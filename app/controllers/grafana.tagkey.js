var request = require('request');

const constants = require('../misc/constants.js');

exports.tagKey = async function (req, res, influxd) {

    var options = {
        url: constants.DNC_URL+"tagsk",
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        form: { 'influxd': influxd }
    };

    //console.log("Query: ", req.body.q)

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