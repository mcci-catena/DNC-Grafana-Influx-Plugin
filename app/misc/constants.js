module.exports = Object.freeze({
    //INFLUX_URL: "https://staging-iseechange.mcci.mobi/influxdb:8086",
    INFLUX_URL: "https://staging-analytics.weradiate.com/influxdb:8086",
    INFLUX_UNAME: "ezra",
    INFLUX_PWD: "1millioncompost",

    BASE_URL: "http://localhost:8893/",

    DNC_TAGS : ["country", "state", "city", "ward", "street", "location", "devname"],

    // Status Codes
    OK : 200,
    Not_found : 404,
    Internal_Server_Error : 500,
    Created : 201,
    No_content : 204,
    Modified : 304,
    Bad_request : 400,
    Unauthorized : 401,
    Forbidden: 403,
    Not_implemented: 501
});