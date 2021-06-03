const clientctrl = require('../controllers/country.controller.js');

module.exports = (app) => {
    
    // Create a new Client
    app.post('/country', clientctrl.create);

}