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