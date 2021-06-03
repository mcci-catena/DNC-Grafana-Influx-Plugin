const Country = require('../models/country.model.js');
const DevSchema = require('../models/device.model.js');
const validfn = require('../misc/validators.js');

const mongoose = require('mongoose');

// create a location under a pile 

exports.create = (req, res) => {
    if(!req.body.country || !req.body.state || !req.body.city || !req.body.ward || 
       !req.body.street || !req.body.location || !req.body.devname || !req.body.id || 
       !req.body.datetime) {

        return res.status(400).send({
            message: "mandatory field missing"
        });
    }

    /*[resb, rest] = validfn.inputvalidation(req.body.id)

    if(!Boolean(resb))
    {
        return res.status(400).send({message: "Device ID "+rest}); 
    }*/

    var dttmstr = req.body.datetime.split(",")
    var dtstr = dttmstr[0].trim();
    var tmstr = dttmstr[1].trim();

    if(!validfn.validatedate(dtstr) || !validfn.validatetime(tmstr))
    {
        return res.status(400).send({
            message: "Invalid date and time!"
        });
    }

    var gdate = new Date(req.body.datetime)
    var cdate = new Date();
    
    if(cdate < gdate)
    {
        return res.status(200).send({message: 
                "Add date should not be recent to the"+ 
                " current date" });
    }

    var countryname = {"cname" : req.body.country};
    Country.findOne(countryname)
    .then(function(data) {
        if(data)
        {
            var countryid = data.cid;

            var Cdev = mongoose.model('device'+countryid, DevSchema);
            Cdev.findOne({"state": req.body.state, "city": req.body.city,
                          "ward": req.body.ward, "street": req.body.street,
                          "location": req.body.location, 
                          "devname": req.body.devname, "rdate": ''})
            .then(function(data) {
                if(!data)
                {
                    addDevice(countryid, req, res);
                }
                else
                {
                    return res.status(400).send({
                        message: "Device name already exists, try with different!!!"
                    });
                }  

            })
            .catch((err) => {
                res.status(500).send({
                    message: err.message || "Error occurred while fetching the device info"
                });
            });
        }
        else
        {
            res.status(200).send({
                message: "Country not exists"
            });
        }
    })
    .catch((err) => {
        res.status(500).send({
            message: err.message || "Error occurred while fetching the country info"
        });
    });
}


function addDevice(countryid, req, res)
{
    var Cdev = mongoose.model('device'+countryid, DevSchema);
    const ndev = new Cdev({
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        state: req.body.state,
        city: req.body.city,
        ward: req.body.ward,
        street: req.body.street,
        location: req.body.location,
        devname: req.body.devname,
        devid: req.body.id,
        idate: new Date(req.body.datetime),
        //rdate: new Date(req.body.datetime)
        rdate: ''
    });   
    ndev.save()
    .then(data => {
        res.send(data);
    })
    .catch(err => { 
        res.status(500).send({
            message: err.message || "Error occurred while creating the Device."
        });
    });
}


exports.findAll = (req, res) => {
    if(!req.body.client || !req.body.site || !req.body.pile || !req.body.location) {
        return res.status(400).send({
            message: "mandatory field missing"
        });
    }
    
    var clientname = {"cname" : req.body.client};
    Clients.findOne(clientname)
    .then(function(data) {
        if(data)
        {
            var clientid = data.cid;
            var Cdev = mongoose.model('device'+clientid, DevSchema);
            var filter = {"site" : req.body.site, "pile" : req.body.pile, 
                          "lname" : req.body.location};
            Cdev.find(filter)
            .then(function(data) {
                if(data)
                {
                    res.send(data);
                }
                else
                {
                    res.status(200).send({
                        message: "No Devices under the site, pile and location!"
                    });
                }
            })
            .catch((err) => {
                res.status(500).send({
                    message: err.message || "Error occurred while fetching the device info"
                });
            });
        }
    })
    .catch((err) => {
        res.status(500).send({
            message: err.message || "Error occurred while fetching the client info"
        });
    });
}

