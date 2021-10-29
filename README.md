# dnc grafana influx plugin

Grafana Influx Plugin is a middle layer application works between Grafana UI and DNC Server, receives Influx query from Grafana Dashboard, present that query to DNC Server get response from DNC Server and forward the response back to Grafna Dashboard. To achieve this, do a small change Data Source configuration, replace the DataBase URL with the DNC plugin URL, then all the queries from Grafana Dashboard directed to DNC Plugin Application Server.
