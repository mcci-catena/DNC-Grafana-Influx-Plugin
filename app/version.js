const appconst = require('./misc/constants.js');

module.exports = function (app) {
    app.get('/version', function(req, res) {
        res.status(200).json(''+appconst.APP_NAME+" v"+appconst.APP_VERSION);
    });
}

