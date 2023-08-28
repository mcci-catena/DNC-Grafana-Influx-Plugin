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

exports.measureVal = async (req, res, gquery) => {
    
    // console.log("Select Query Received ....")

    let grdict = {}                                      // Global Request Dict
    grdict["qresp"] = res                                // Query's response object
    grdict["qlist"] = checkForMultiple(req.body.q)       // Query List                              
    grdict["bqlist"] = []                                // Broken Query List
    grdict["dnc"] = []                                   // To hold DNC Data
    grdict["mdnc"] = []
    
    for(let i=0; i<grdict.qlist.length; i++){
        grdict.bqlist.push(parseInfluxQuery(grdict.qlist[i]))
    }

    // replace where
    for(let i=0; i<grdict.bqlist.length; i++){
        let dncdict = {}
        dncdict["select"] = extractselecttag(grdict.bqlist[i]["SELECT"])
        dncdict["tags"] = extractwheretags(grdict.bqlist[i]["WHERE"])
        dncdict["time"] = extractTimeSpan(grdict.bqlist[i]["AND"])
        dncdict["orgname"] = gquery.uname
        grdict.dnc.push(dncdict)
    }

    let promisearr = []

    for(let i=0; i<grdict.qlist.length; i++){
        let dnctags = Object.keys(grdict.dnc[i].tags)
        if(dnctags.length > 0){
            promisearr.push(getdncdevicemap(grdict.dnc[i]))
        }
    }

    const dmpromises = Promise.allSettled(promisearr);
    const statuses = await dmpromises;
    for(let rstatus of statuses){
        if(rstatus.status == 'fulfilled'){
            grdict.mdnc.push(rstatus.value)
        }
        else{
            console.log("BG Resp: ", rstatus)
        }
    }

    if(grdict.mdnc.length == 0){
        return res.status(502).send("Bad Gateway") 
    }

    for(let i=0; i<grdict.mdnc.length; i++){
        compileinfquery(grdict.mdnc[i], grdict.bqlist[i])
    }

    let ifdict = []
    for(let i=0; i<grdict.mdnc.length; i++){
        let dqdict = {}
        dqdict["tags"] = grdict.mdnc[i].tags
        dqdict["devices"] = []
        for(let j=0; j<grdict.mdnc[i].devices.length; j++){
            dqdict.devices.push(
                {qry: grdict.mdnc[i].devices[j].qry, 
                infdb: grdict.mdnc[i].devices[j].indb,
                tags: grdict.mdnc[i].dtags[grdict.mdnc[i].devices[j].sid]
            })
        }
        ifdict.push(dqdict)
    }

    let sdpromisearr = []

    for(let i=0; i<ifdict.length; i++){
        for(let j=0; j<ifdict[i].devices.length; j++){
            let infdict = {}
            infdict["tags"] = ifdict[i].devices[j].tags
            infdict["qid"] = {mq: i+1, cq: j+1}
            infdict["qry"] = ifdict[i].devices[j].qry
            infdict["infdb"] = ifdict[i].devices[j].infdb
            sdpromisearr.push(readdb.readSensorInflux(infdict))
        }
    }

    const sdpromises = Promise.allSettled(sdpromisearr);
    const dstatuses = await sdpromises;

    let gresult = []

    for(let rstatus of dstatuses){
        if(rstatus.status == 'fulfilled'){
            gresult.push(rstatus.value)
        }
        else{
            console.log("Failed: --> ", rstatus.reason)
        }
    }

    let gres = arrangeResults(gresult)

    res.status(200).send({results: gres}) 
}


function arrangeResults(sdlist){
    // console.log("Arrange Result: ", sdlist)
    let findict = {}
    for(let i=0; i<sdlist.length; i++){
        let mk = Object.keys(sdlist[i])[0]
        let ck = Object.keys(sdlist[i][mk])[0]
        if(!(mk in findict)){
            findict[mk] = []
        }
        findict[mk].push(sdlist[i][mk][ck])
    }

    // console.log(findict)
    let fkeys = Object.keys(findict)

    let rmarr = []   // response master array

    for(let i=0; i<fkeys.length; i++){
        let rsqdict = {}         // Single query data holder (single query may contains many devices)
        rsqdict["statement_id"] = 0
        
        let rsqdarr = []      // Single query data holder array of devices
        let infresarr = findict[fkeys[i]]
        for(let j=0; j<infresarr.length; j++){
            let sddict = {}     // Single Device Data holder
           
            let infresobj = infresarr[j].data.results[0]
           
            if(infresobj.hasOwnProperty("series")){
                let infddata = infresobj.series[0]
                sddict["name"] = infddata.name
                sddict["columns"] = infddata.columns
                sddict["tags"] = infresarr[j].tags
                sddict["values"] = infddata.values
                rsqdarr.push(sddict)
            }
            else{
                console.log("Series not present")
            }
        }

        if(rsqdarr.length > 0){
            rsqdict["series"] = rsqdarr
        }
       
        rmarr.push(rsqdict)
    }

    return rmarr
}


function checkForMultiple(inq){
    // console.log("Check for multiple")
    return mulq = inq.split(";")
}


function parseInfluxQuery(inpq){
    var tagstr, timstr, lmtstr

    var resstr = inpq.split("WHERE")
    var fdbstr = resstr[0].trim()
    
    var str2 = resstr[1].split("GROUP BY")
    var part2 = str2[0].trim()
    
    var str3 = str2[1].split("LIMIT")
    var gbystr = str3[0].trim()

    if(str3.length > 1){
        lmtstr = str3[1].trim()
    }
    else{
        lmtstr = null
    }
    
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

    let sqdict = {}
    sqdict["SELECT"] = fdbstr
    sqdict["WHERE"] = tagstr
    sqdict["AND"] = timstr
    sqdict["GROUPBY"] = gbystr
    sqdict["LIMIT"] = lmtstr
    
    return sqdict
}


function extractselecttag(seltag){
    // console.log("Extract sel tags: ", seltag)

    let str1 = seltag.split("SELECT")
    let str2 = str1[1].split("FROM")
    return str2[0].trim()

}

function extractwheretags(dnctags){
    var dnckey = {}
    
    if(dnctags != null)
    {
        var nq = dnctags.replace(new RegExp("AND", 'g'), "OR")
        var ql = nq.split("OR")
        var tagall = extractTags(ql)
        dnckey = tagall[0]
    }
 
    return dnckey
}


function getdncdevicemap(ddict)
{
    return new Promise(async function(resolve, reject) {
        var darr = []

        var options = {
            url: constants.DNC_URL+"gdlist",
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            form: { 'dncd': ddict }
        };

        request(options, function (error, resp, body) {
            if (error) 
            {
                //console.log("Connection Error")
                reject("Connction Error")
            }
            else 
            {
                if (resp.statusCode == 200)
                {
                    var data = JSON.parse(resp.body);
                    resolve(data.message)
                }
                else 
                {
                    if(resp.statusCode == 502)    // Bad Gateway , backend not available
                    {
                        reject("Bad Gateway")
                    }
                    else{
                        var data = JSON.parse(resp.body);
                        reject(data.message)
                    }
                    console.log("Error-2: ", resp.statusCode)
                    
                }
            }
        });

    });
}


function compileinfquery(indict, bqry){
    for(let i=0; i<indict.devices.length; i++){
        let dbdict = indict.dsrc[indict.devices[i].dsid]
    
        let qry1 = "SELECT "+indict.select+" FROM "+"\""+dbdict.mmtname+"\""
        let qry2 = " WHERE ("+"\""+indict.devices[i].devtype+"\""+" = '"+indict.devices[i].devid+"' )"
        let qry3 = maptimespan(indict.time, indict.devices[i])
        
        let fqry = qry1 + qry2 + " AND " + qry3 + " GROUP BY " + bqry["GROUPBY"]
        if(bqry["LIMIT"] != null){
            fqry = fqry + " LIMIT " + bqry["LIMIT"]
        }

        // return fqry
        indict.devices[i]["qry"] = fqry
        indict.devices[i]["indb"] = {url: dbdict.dburl, db: dbdict.dbname, uname: dbdict.uname, pwd: dbdict.pwd}
    }

}

function maptimespan(graftime, ddevdict){
    let fmdate = new Date(graftime[0])
    let todate = new Date(graftime[1])

    let idate = new Date(ddevdict.idate);
    let rdate = new Date(ddevdict.rdate);
    if(ddevdict.rdate == null)
    {
        rdate = new Date();
    }
              
    let influxfmdt = idate, influxtodt = rdate;

    if(idate.getTime() < fmdate.getTime())
    {
        influxfmdt = fmdate; 
    }
    if(rdate.getTime() > todate.getTime())
    {
        influxtodt = todate;
    }

    let fmms = influxfmdt.getTime()
    let toms = influxtodt.getTime()

    let timstr = "time >= "+fmms.toString()+"ms and time <= "+toms.toString()+"ms "

    return timstr
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
