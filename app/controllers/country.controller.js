const Country = require('../models/country.model.js');
const validfn = require('../misc/validators.js');

const mongoose = require('mongoose');
const e = require('express');

// Create and Save a new Client


exports.create = (req, res) => {
    
if(!req.body.name) {
        return res.status(400).send({
            message: "Country name can not be empty"
        });
    }
    
    const [resb, rest] = validfn.inputvalidation(req.body.name)

    if(!Boolean(resb))
    {
        return res.status(400).send({message: "Client name "+rest}); 
    }
        
    var filter = {"cname": {$regex: new RegExp(req.body.name, "ig")}}
    Country.findOne(filter)
    .then(function(data) {
        //console.log(data)
        if(data)
        {
            res.status(400).send({message: "Country already exists!"})
        }
        else
        {
            var rstr = GenerateRandom();
            var countryid = {"cid": rstr}
            CheckForClientExistance(countryid , res, "CountryID")
            .then(function(data) {
                if(data == 0)
                {
                    const country = new Country({
                        cname: req.body.name,
                        cid: rstr
                        });    
                    country.save()
                    .then(data => {
                        res.send(data);
                    }).catch(err => {
                        res.status(500).send({
                            message: err.message || "Some error occurred while creating the Country."
                        });
                    });      
                }
            });
        }
    });
    
};
    

function GenerateRandom()
{
   var a = Math.floor((Math.random() * 9999) + 999);
   a = String(a);
   return a = a.substring(0, 4);
}

function CheckForClientExistance(reqFilter, res, dataId)
{
    return new Promise(function(resolve, reject) {

    //console.log(reqFilter);

       Country.countDocuments(reqFilter,function(err, count){
       if(err)
       {
           reject(2);
           return res.status(400).send({
             message: "connection error!!!"
           });
       }
       if(count > 0)
       {
           resolve(1)
              return res.status(400).send({
              message: ""+dataId+" already exists, try with another!!!"
           }); 
       }
       else{
           resolve(0);
       }
     });

    });
}


// Find a single country by countryName
exports.findOne = (req, res) => {
    var filter = {"cname": {$regex: new RegExp(req.params.countryId, "ig")}}
    Country.find(filter)
    .then(data => {
        if(!data) {
            return res.status(400).send({
                message: "Country not found with name " + req.params.countryId
            });            
        }
        res.status(200).send(data);
    }).catch(err => {
        if(err.kind === 'ObjectId') {
            return res.status(400).send({
                message: "Country not found with ID " + req.params.countryId
            });                
        }
        return res.status(500).send({
            message: "Error retrieving note with id " + req.params.countryId
        });
    });
};



// Retrieve and return all users from the database.
exports.findAll = () => {
     Country.find()
    .then(data => {
        //console.log(data)
        return data;
    }).catch(err => {
        console.log("Country Error")
        return "error"
    });
};



// Funtion Name : getOne
// Input Parameter : Country Name
// Output : [['countryName', 'countryID']]

exports.getOne = (cname) => {
    return new Promise(function(resolve, reject) {
        var filter = {"cname": {$regex: new RegExp(cname, "ig")}}
        Country.find(filter)
        .then(data => {
            if(data) 
            {
                var clients = [];
                for(var i=0; i<data.length; i++)
                {
                    var cid = [];
                    cid.push(data[i].cname);
                    cid.push(data[i].cid);
                    clients.push(cid)
                    
                }
                resolve(clients)
            }
        }).catch(err => {
            console.log("Country Error")
            reject("error")
        });
    });
}


// Funtion Name : findAll
// Input Parameter : None
// Output : [['countryName1', 'countryID1'], ['countryName2', 'countryID2']]


exports.findAll = () => {
    return new Promise(function(resolve, reject) {
        Country.find()
        .then(data => {
            if(data)
            {
                var clients = [];
                for(var i=0; i<data.length; i++)
                {
                    var cid = [];
                    cid.push(data[i].cname);
                    cid.push(data[i].cid);
                    clients.push(cid)
                    
                }
                resolve(clients)
            }
            
        }).catch(err => {
            console.log("Country Error")
            reject("error")
        });

    });

};