const grafctrl = require('../controllers/grafana.controller.js');
const tempctrl = require('../controllers/temp.readval.js');

module.exports = (app) => {
    
    // Create a new Note
    app.post('/query', grafctrl.gquery);
    app.post('/rtemp', tempctrl.gquery);

}