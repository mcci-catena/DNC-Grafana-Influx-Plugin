const devctrl = require('../controllers/device.controller.js');

module.exports = (app) => {
    
    // Create a new Note
    app.post('/device', devctrl.create);

}