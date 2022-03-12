/*############################################################################
# 
# Module: grafana.measure.js
#
# Description:
#     Endpoint implementation for Grafna measurement queries
#
# Copyright notice:
#     This file copyright (c) 2021 by
#
#         MCCI Corporation
#         3520 Krums Corners Road
#         Ithaca, NY  14850
#
#     Released under the MCCI Corporation.
#
# Author:
#     Seenivasan V, MCCI Corporation February 2021
#
# Revision history:
#     V1.0.0 Fri Oct 22 2021 11:24:35 seenivasan
#       Module created
############################################################################*/

var request = require('request');
const readdb = require('./influx.js');

const constants = require('../misc/constants.js');
const brixvalctrl = require('./grafana.brixval.js');

const othertags = ["Topic", "TreesUihlein", "TreesArnot", "TreesUVM"]



exports.measureVal = async (req, res, influxd) => {
    reqCnt ++
    var dnckey = {}
    var respdict = {}

    respdict["influxd"] = influxd
    
    var selq = interpretSelectQuery(req.body.q)

    if(selq[1] != null)
    {
        var nq = selq[1].replace(new RegExp("AND", 'g'), "OR")
        var ql = nq.split("OR")
        var tagall = extractTags(ql)
        dnckey = tagall[0]
    }
    
    var otags = {}

    for(const[key, value] of Object.entries(dnckey))
    {
        if(othertags.includes(key))
        {
            otags[key] = value
            delete dnckey[key]
        }
        
    }

    respdict["dnckey"] = dnckey
    respdict["taglist"] = []
    respdict["otags"] = otags
 
    var tspan = extractTimeSpan(selq[2])
    
    respdict["fdate"] = tspan[0]
    respdict["tdate"] = tspan[1]

    var strsc = selq[0]+" WHERE "
    var strgbc = "GROUP BY "+selq[3]

    respdict["strsc"] = strsc
    respdict["strgbc"] = strgbc

    respdict["dlist"] = []
    respdict["res"] = res
    respdict["sarr"] = []

    if(Object.keys(otags).includes("Topic")) {
        if(otags["Topic"].includes("Sap Sweetness")) {
            console.log("Sap Sweetness")
            getSapSweetness(res)
            return
        }
    }

    let gdict = {}
    try{
        gdict = await getDeviceList(respdict)
        await readDeviceData(gdict) 
    }catch(err){
        respdict["res"].status(400).send();    
    }
}


function getDeviceList(ddict)
{
    return new Promise(async function(resolve, reject) {
        var darr = []

        dncdict = {}
        dncdict["influxd"] = ddict["influxd"]
        dncdict["fdate"] = ddict["fdate"]
        dncdict["tdate"] = ddict["tdate"]
        dncdict["dnckey"] = ddict["dnckey"] 
        
        var options = {
            url: constants.DNC_URL+"dlist",
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            form: { 'dncd': dncdict }
        };

        request(options, function (error, resp, body) {
            if (error) 
            {
                reject("Connction Error")
            }
            else 
            {
                if (resp.statusCode == 200)
                {
                    var data = JSON.parse(resp.body);
                    ddict["dbdata"] = data.resdict.dbdata
                    ddict["dlist"] = data.resdict.devices
                    ddict["taglist"] = data.resdict.taglist
                    resolve(ddict)
                }
                else 
                {
                    console.log("Error-2")
                    reject("Error")
                }
            }
        });

    });
}


// Function Name  : readDeviceData
// Input Parameter: request, response buffer
// Required Input : dbName, selectClause, groupByClause, [devID, idate, rdate], fromDate, toDate
// Fetch data for each device, collect all response and send data to Grafana(request) as a single response
// Return value   : None
// ddict keys: influxd, dnckey, taglist, otags, fdate, tdate, strsc, strgbc, dlist, res, sarr, dbdata
// dlist contains array of devices for the selected DNC Tags

function readDeviceData(ddict){
    return new Promise(async function(resolve, reject) {

        var topic = getFunctionName(ddict["otags"])
        var brixval

        if(syrupRequested) {
            brixval = await brixvalctrl.brixVal(true)
            console.log("Syrup needed, read Brix data done.")
        }

        for(var i=0; i<ddict["dlist"].length; i++) {

            var rval = await readFromInflux(ddict["id"], ddict.dbdata, ddict["strsc"], ddict["strgbc"], 
                                            ddict["dlist"][i], ddict["fdate"], ddict["tdate"])
            let dicout = rval[1]
            if(dicout.results[0].hasOwnProperty("series")) {
                indict = dicout.results[0].series[0]
                tagdict = {}

                for(k=0; k<ddict.taglist.length; k++)
                {
                    tagdict[ddict.taglist[k]] =  ddict["dlist"][i].location[k+2]
                }
                 
                loctag = []
                for(k=0; k<ddict.taglist.length; k++)
                {
                    loctag.push(ddict["dlist"][i].location[k+2])
                }
                loctag.reverse()
                tagdict["loctag"] = loctag.join(' ')
                 
                tagdict["latitude"] = ddict["dlist"][i].location[0]
                tagdict["longitude"] = ddict["dlist"][i].location[1]
                
                indict["tags"] = tagdict
                indict["otags"] = ddict["otags"]
                indict["brixval"] = brixval

                let fval = await doSapFunction(indict, topic)
                
                if(fval != null) {
                    console.log("Move values")
                    indict["values"] = [fval]
                }

                ddict["sarr"].push(indict)
            }
        }
        resdict = {}
        resdict["statement_id"] = 0
        resdict["series"] = ddict["sarr"]
        findict = {}
        findict["results"] = [resdict]
        console.log("*** Sending Response ***")
        ddict["res"].status(200).send(findict); 
        resolve()
    });
}


async function getSapSweetness(res) {
    let arnotdict = {}
    let uihleindict = {}
    let uvmdict = {}

    let arnottags = {}
    let uihleintags = {}
    let uvmtags = {}

    arnotdict["name"] = "SapSweetness"
    arnotdict["columns"] = ["time", "mean"]
    arnottags["location"] = "Arnot"
    arnottags["Area"] = "Indoor"
    arnotdict["tags"] = arnottags

    uihleindict["name"] = "SapSweetness"
    uihleindict["columns"] = ["time", "mean"]
    uihleintags["location"] = "Uihlein"
    uihleintags["Area"] = "Indoor"
    uihleindict["tags"] = uihleintags

    uvmdict["name"] = "SapSweetness"
    uvmdict["columns"] = ["time", "mean"]
    uvmtags["location"] = "UVM"
    uvmtags["Area"] = "Indoor"
    uvmdict["tags"] = uvmtags
    
    let brixval = await brixvalctrl.brixVal(false)

    let arnot = []
    let uihlein = []
    let uvm = []

    for(let i=0; i< brixval.length; i++)
    {
        arnot.push([brixval[i]["rdate"], parseFloat(brixval[i]["Arnot"])])
        uihlein.push([brixval[i]["rdate"], parseFloat(brixval[i]["Uihlein"])])
        uvm.push([brixval[i]["rdate"], parseFloat(brixval[i]["UVM"])])
    }

    arnotdict["values"] = arnot
    uihleindict["values"] = uihlein
    uvmdict["values"] = uvm

    let seriesdict = []
    seriesdict.push(arnotdict)
    seriesdict.push(uihleindict)
    seriesdict.push(uvmdict)

    let resdict = {}
    resdict["statement_id"] = 0
    resdict["series"] = seriesdict

    let findict = {}
    findict["results"] = [resdict]

    res.status(200).send(findict); 
}

function syrupRequested(otagDict) {
    if(Object.keys(otagDict).includes("Topic")) {
        if(otagDict["Topic"].includes("Syrup per Tap")) {
            return true
        }
    }
    return false
}

function getFunctionName(otagDict) {
    if(Object.keys(otagDict).includes("Topic")) {
        if(otagDict["Topic"].includes("Syrup per Tap")) {
            return syrupPerTap
        }  
        else
        if(otagDict["Topic"].includes("Gallons/Tree")){
            return gallonsPerTree
        }
        else
        if(otagDict["Topic"].includes("Gallons/Hr")){
            return gallonPerHour
        }
        else
        if(otagDict["Topic"].includes("Total Gallons")){
            return totalGallons
        }
    }
    return noSapRequested
}

const doSapFunction = function (sapDict, logic) {
    return logic(sapDict)
} 

const noSapRequested = async function(sapDict) {
    return null
}

const gallonsPerTree = async function(sapDict) {
    let sum = 0;
    let fdate;
    let location = sapDict["tags"]["Location"]
        
    for(let i=0; i<sapDict["values"].length; i++)
    {
        sum = sum + sapDict["values"][i][1]
        fdate = sapDict["values"][i][0]
    }

    let trees = sapDict["otags"]["Trees"+location]
    sum = sum / trees
    return [fdate, sum]
}

const gallonPerHour = async function(sapDict) {
    return null
}

const totalGallons = async function(sapDict) {
    let sum = 0;
    let fdate;

    for(let i=0; i<sapDict["values"].length; i++)
    {
        sum = sum + sapDict["values"][i][1]
        fdate = sapDict["values"][i][0]
    }
    return [fdate, sum]
}

const syrup = function (sapVal, brixVal) {
    return sapVal / ((87.1 / brixVal) - 0.32)
}

const syrupPerTap = async function(sapDict) {
    let sum = 0;
    let fdate;
    let location = sapDict["tags"]["Location"]
    let sapFiltData = sapDict["values"].filter(removeNull)

    //let syrupData = []

    if(sapFiltData.length > 0) {
        for(let i=0; i< sapFiltData.length; i++) {
            let nsyrup = []
            let bdate = sapFiltData[i][0].split("T")
            let bindex = sapDict["brixval"].map(e=> e.rdate).indexOf(bdate[0])
            let brixd
            try{
                brixd = sapDict["brixval"][bindex][location]
            }
            catch{
                brixd = 0
            }
            sum = sum + syrup(sapFiltData[i][1], brixd)
            fdate = sapDict["values"][i][0]
            //syrupData.push([sapFiltData[i][0], syrup(sapFiltData[i][1], brixd)])
        }
        let trees = sapDict["otags"]["Trees"+location]
        sum = sum / trees
    }

    return [fdate, sum]
}

function removeNull(adata){
    return adata[1] != null && adata[1] != 0;
}


// Function Name  : extractTimeSpan
// Input Parameter: Array of Objects
// Example Input  : ['"state" = 'Tamil Nadu'', '"city" = 'Chennai'', '"state" = 'Karnataka'', '"city" = 'Bangalore'', '"ward" = 'Tambaram'' ]
// Return value   : [{state: ['Tamil Nadu', 'Karnataka'], city: ['Chennai', 'Bangalore'], ward: ['Tambaram']}]

function extractTimeSpan(timeq)
{
    var fmstr, tostr, fmdate, todate

    if(timeq.includes("and"))
    {
        var qrstr = timeq.split("and")
        fmstr = qrstr[0]
        tostr = qrstr[1]
    }
    else
    {
        fmstr = timeq
        tostr = "time <= "+new Date().getTime()+"ms"
    }

    var fmdate = convertDate(fmstr)
    var todate = convertDate(tostr)

    return [fmdate, todate]
}

function convertDate(instr)
{
    if(instr.includes("now()"))
    {
        if(instr.includes("now() - "))
        {
            var fqstr = instr.split("-")
            var fstr = fqstr[1].trim()

            if(fstr.includes("m"))
            {
                fstr.replace("m","")
                var minutes = parseInt(fstr)
                var fdate = new Date(new Date().getTime() - (minutes * 60 * 1000))
                return fdate
            }
            else
            if(fstr.includes("h"))
            {
                fstr.replace("h","")
                var thr = parseInt(fstr)
                var days = parseInt(thr/24)
                var hrs = thr%24
            
                if(days > 0)
                {
                    var fdate = new Date(new Date().getTime() - (days * 24 * 60 * 60 * 1000))
                    if(hrs > 0)
                        fdate = new Date(fdate.getTime() - (hrs * 60 * 60 * 1000))

                    return fdate
                }
                else
                {
                    var fdate = new Date(new Date().getTime() - (hrs * 60 * 60 * 1000))
                    return fdate
                }
            }
            else
            if(fstr.includes("d"))
            {
                fstr.replace("d","")
                var days = parseInt(fstr)
                var fdate = new Date(new Date().getTime() - (days * 24 * 60 * 60 * 1000))
                return fdate
            }
        }
        else
        {
            return new Date()
        }
    }
    else
    {
        var fstr;
        if(instr.includes("time >="))
        {
            fstr = (instr.replace("time >=", "")).trim()
        }
        else
        if(instr.includes("time <="))
        {
            fstr = (instr.replace("time <=", "")).trim()
        }
        var ftime = fstr.replace("ms","").trim()
        return new Date(parseInt(ftime))
    }
}


// Function Name  : extractTags
// Input Parameter: 'time >= now() - 2d'
// Return value   :  [YYYY-MM-DDTHH:MM:SS.mmmZ, YYYY-MM-DDTHH:MM:SS.mmmZ]

function extractTags(inq)
{
    var alltag = []
    var ntag = []
    var nval = []

    const rek = /"(.*?)"/g;
    const rev = /'(.*?)'/g;

    
    for(var i=0; i<inq.length; i++)
    {
        const rek = /"(.*?)"/g;
        const rev = /'(.*?)'/g;      
  
        ntag.push((rek.exec(inq[i])).pop())
        nval.push((rev.exec(inq[i])).pop())
    }

    var dictall = {}

    for(var i=0; i<ntag.length; i++)
    {
        if(dictall.hasOwnProperty(ntag[i]))
        {
            dictall[ntag[i]].push(nval[i])
        }
        else
        {
            dictall[ntag[i]] = [nval[i]] 
        }
    } 
    
    alltag.push(dictall)
    
    return alltag
}


// Function Name  : interpretSelectQuery
// Input Parameter: Select Query
// Return Value   : Array[4]
// 1. SELECT Clause --> 'SELECT mean("t") FROM "HeatData"'
// 2. WHERE Clause -->  '"state" = 'Tamil Nadu' AND "city" = 'Chennai' AND "ward" = 'Tambaram''
// 3. Time span -->  'time >= now() - 2d'
// 4. GROUP BY --> 'time(1d) fill(none)'

function interpretSelectQuery(inq)
{
    var fdbstr 
    var gbystr
    var tagstr
    var timstr

    var resstr = inq.split("WHERE")
    var fdbstr = resstr[0].trim()
    var str2 = resstr[1].split("GROUP BY")
    var part2 = str2[0].trim()
    var gbystr = str2[1].trim()

    if(part2.startsWith("("))
    {
        tag_flg = 1
        var tagpart = part2.split("time >=")
        var tagstr1 = tagpart[0].split(")")

        tagstr = tagstr1[0].replace("(","").trim()
        timstr = "time >="+tagpart[1]

    }
    else
    {
        tagstr = null
        timstr = part2.trim()
    }

    var allstr = []
    allstr.push(fdbstr)
    allstr.push(tagstr)
    allstr.push(timstr)
    allstr.push(gbystr)

    return allstr
}


// Function Name  : readFromInflux
// Input Parameter: database name, Select clause, Group By Clause, [devId, idate, rdate], fromDate, toDate
// Return Value   : Influx Data

async function readFromInflux(rindex, dbinflux, selc, gbyc, devdata, fmdate, todate)
{
    var influxset = {};

    influxset.server = dbinflux.url
    influxset.db = dbinflux.dbname
    influxset.user = dbinflux.user
    influxset.pwd = dbinflux.pwd

    var idate = new Date(devdata.idate);
    var rdate = new Date(devdata.rdate);
    if(devdata[2] == null)
    {
        rdate = new Date();
    }
              
    var influxfmdt = idate, influxtodt = rdate;

    if(idate.getTime() < fmdate.getTime())
    {
        influxfmdt = fmdate; 
    }
    if(rdate.getTime() > todate.getTime())
    {
        influxtodt = todate;
    }

    var fmms = influxfmdt.getTime()
    var toms = influxtodt.getTime()

    var timstr = "time >= "+fmms.toString()+"ms and time <= "+toms.toString()+"ms "

    orflg = 0
    devid = ""
    
    if(devdata.deviceid != "")
    {
        devid = devid+"\"deviceid\" = '"+devdata.deviceid+"'"
        orflg = 1
    }
    if(devdata.devID != "")
    {
        if(orflg)
        {
            devid = devid+" or "
        }
        devid = devid+"\"devID\" = '"+devdata.devID+"'"
        orflg = 1
    }

    if(devdata.devEUI != "")
    {
        if(orflg)
        {
            devid = devid+" or "
        }
        devid = devid+"\"devEUI\" = '"+devdata.devEUI+"'"
    }

    var query = selc+"("+devid+")"+" AND "+timstr+gbyc
        
    influxset.qry = query

    try{
        influxdata = await readdb.readInflux(influxset)
        return [rindex,influxdata]
    }catch(err){
        return "error"        
    }
}