module.exports = Object.freeze({
    APP_NAME: "DNC Grafana Influx Plugin",
    APP_VERSION: "1.0.0-4",
    INFLUX_URL: "http://influxdb:8086",
    INFLUX_UNAME: "******",
    INFLUX_PWD: "*****",
    APP_PORT: 8893,
    
    //BASE_URL: "http://localhost:8893/",
    DNC_URL: "http://localhost:8891/",

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