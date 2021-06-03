module.exports = function (app) {
    app.get('/version', function(req, res) {
        res.status(200).json({'MCCI Corporation': 'DNC App API V1.3'});
    });
}

