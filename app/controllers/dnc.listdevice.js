const Country = require('../models/country.model.js');
const DevSchema = require('../models/device.model.js');

const countrydb = require('./country.controller.js');

const mongoose = require('mongoose');

const constants = require('../misc/constants.js');

var DNC_TAGS = constants.DNC_TAGS



// Function Name  : filterDNCPair
// Input Parameter: dncdict - DNC dictionary
// Example Input  : {country: ['xxxx'], state: ['xxxx','yyyy'], city: ['aaaa', 'bbbb'], fdate: YYYY-MM-DDTHH:MM:SS.mmmZ, 
//                   fdate: YYYY-MM-DDTHH:MM:SS.mmmZ }
// Return value   : [{state: ['Tamil Nadu', 'Karnataka'], city: ['Chennai', 'Bangalore'], ward: ['Tambaram']}]
// This function removes country, fdate and tdate.

exports.filterDNCpair = (dncq) => {
    dnckey = {}

    for(var i=0; i<DNC_TAGS.length; i++)
    {
        if(dncq.hasOwnProperty(DNC_TAGS[i]))
        {
            if(DNC_TAGS[i] != "country")
                dnckey[DNC_TAGS[i]] = dncq[DNC_TAGS[i]]
        }
    }
    return dnckey
}


exports.fetchDeviceList = async (dncq) => {

    dncdict = {}

    dnckey = {}

    for(var i=0; i<DNC_TAGS.length; i++)
    {
        if(dncq.hasOwnProperty(DNC_TAGS[i]))
        {
            dncdict[DNC_TAGS[i]] = dncq[DNC_TAGS[i]]
            if(DNC_TAGS[i] != "country")
                dnckey[DNC_TAGS[i]] = dncq[DNC_TAGS[i]]
        }
        else
        {
            dncdict[DNC_TAGS[i]] = null
        }
    }

    var cid = []
    var clist
    if(dncq.hasOwnProperty("country"))
    {
        clist = await countrydb.getOne(dncq["country"])
    }
    else
    {
        clist = await countrydb.findAll()
    }

    var dlist = []

    for(var i=0; i<clist.length; i++)
    {
        //cid.push(clist[i][1])
        console.log("DeviceList: ",dncq, dnckey)
        var dev = await getDeviceList(clist[i][1], dncq, dnckey)
        
        for(var j=0; j<dev.length; j++)
        {
           dlist.push(dev[j])
        }
    }

    /*console.log("Get Device List: ", cid, dncq, dnckey)

    var dlist = await getDeviceList(cid, dncq, dnckey)  */
    return dlist
}    

//function getDeviceList(countryid, dncq, dnckey)
exports.getDeviceList = (countryid, fmdate, todate, dnckey) => {
    return new Promise(function(resolve, reject) {

        var Cdev = mongoose.model('device'+countryid, DevSchema);

        var timef = {$or:[{"idate": {$gte: fmdate, $lte: todate}},
                              {"rdate": {$gte: fmdate, $lte: todate}},
                              {"idate":{$lte: fmdate},"rdate": ''}]}
        var totf = []
        totf.push(dnckey)
        totf.push(timef)
    
        var filter = {}
        filter["$and"] = totf
        var findict = {}
 
        Cdev.find(filter).sort({"idate": 1})
        .then(function(data) {
            if(data)
            {
                var devarray = [];
                for(var i=0; i<data.length; i++)
                {
                    var indict = {};
                    indict['location'] = [data[i].latitude,data[i].longitude,data[i].state,
                                          data[i].city,data[i].ward,data[i].location,
                                          data[i].street,data[i].devname]
                    indict['devid'] = data[i].devid;
                    indict['idate'] = data[i].idate;
                    indict['rdate'] = data[i].rdate;
                    indict['darr'] = []
                    devarray.push(indict);
                }
                //console.log(devarray);
                findict['devices'] = devarray;
                resolve(findict)
           }
           else
           {
               reject("error")
           }
        })
        .catch(err => {
            reject("error")
        });

    });
}
