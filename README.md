# DNC grafana influx plugin

Grafana Influx Plugin is a middle layer application works between Grafana UI and DNC Server, receives Influx query from Grafana Dashboard, present that query to DNC Server get response from DNC Server and forward the response back to Grafna Dashboard. To achieve this, do a small change Data Source configuration, replace the DataBase URL with the DNC plugin URL, then all the queries from Grafana Dashboard directed to DNC Plugin Application Server.

## Release History
- v1.0.2 is patch release; it Contains the following changes
    -  Issue fixed – Issue when grafana contains math function which includes `+` symbol [plus sign](https://github.com/mcci-catena/DNC-Grafana-Influx-Plugin/commit/f8a234c7b64c7b1d0845906f92b10bca8e4d10d7)
- v1.0.1 is patch release; it Contains the following changes
    -  Issue fixed – Issue while using relative time range in Grafana `Grafana Time Range`[#1](https://gitlab-x.mcci.com/client/milkweed/mcgraw/dnc/dnc-grafana-influx-plugin/-/commit/5de7931e4e4c5f4f34ac6a7ebf127813ff32b6b8).

- v1.0.0 Initial release;
    -  Show DNC Tag keys and values
    -  Mapping of DNC Tags with Device ID
    -  Show data with DNC Tags
