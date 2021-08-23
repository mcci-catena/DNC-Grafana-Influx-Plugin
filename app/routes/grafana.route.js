const grafctrl = require('../controllers/grafana.controller.js');

module.exports = (app) => {

    // Create a new Note
    app.post('/query', grafctrl.gquery);
}