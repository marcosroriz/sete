// Bus Route Class

class BusRoute {
    constructor({ path = new Array() }) {
        this.route = path;
        this.id = BusRoute.genID();
    }

    firstStop() {
        return this.route[1];
    }

    lastStop() {
        return this.route[this.route.length - 2];
    }

    isFirstStop(x) {
        return x == this.firstStop();
    }

    isLastStop(x) {
        return x == this.lastStop();
    }

    has(x) {
        return this.route.includes(x);
    }

    length() {
        return this.route.length;
    }

    // FIXME: fix last and first piont
    reverse() {
        return new BusRoute({ path: this.route.reverse() });
    }

    numPassengers(routingGraph) {
        let p = 0;
        // Do not count the first (school) and last position (school)
        for (let i = 1; i <= this.route.length - 2; i++) {
            p = p + routingGraph.passengers(this.route[i]);
        }
        return p;
    }

    travDistance(routingGraph) {
        let dist = 0;
        // FIXME: disregard trip from garage to bus stop
        for (let i = 1; i < this.route.length - 1; i++) {
            let c = this.route[i];
            let d = this.route[i + 1];
            dist = dist + routingGraph.distance(c, d);
        }

        return dist;
    }

    toGeoJSON(c, d, spatialiteDB, route) {
        let cnodeID = c.get("dbNodeID");
        let dnodeID = d.get("dbNodeID");
        let sqlQuery = `SELECT AsGeoJSON(geometry) AS js
                        FROM malha_net
                        WHERE NodeFrom = ${cnodeID} AND NodeTo = ${dnodeID}
                        LIMIT 1`;
        return new Promise((resolve, reject) => {
            spatialiteDB.get(sqlQuery, (err, row) => {
                resolve({
                    ckey: c.get("key"),
                    dkey: d.get("key"),
                    gjson: row["js"]
                });
            });
        });
    }

    toPlainJSON(routingGraph, spatialiteDB) {
        return new Promise((resolve, reject) => {
            let routeJSON = {};
            routeJSON["id"] = this.busID;
            routeJSON["numPassengers"] = this.numPassengers(routingGraph);
            routeJSON["travDistance"] = this.travDistance(routingGraph);
            routeJSON["path"] = new Array();
            routeJSON["geojson"] = "";
    
            // Promises for computing GeoJson distance in each pair of the path
            // Compute Path
            let promises = new Array();
    
            for (let i = 0; i < this.route.length - 1; i++) {
                let c = routingGraph.getVertex(this.route[i]);
                let d = routingGraph.getVertex(this.route[i + 1]);
                routeJSON["path"].push({
                    id: c.get("rawkey"),
                    type: c.get("type")
                });
                promises.push(this.toGeoJSON(c, d, spatialiteDB, this.route));
            }

            Promise.all(promises).then((values) => {
                let pathGeojson = JSON.parse(values[1].gjson);
                for (let i = 2; i < values.length; i++) {
                    let pairGeoJson = JSON.parse(values[i].gjson);
                    for (let j = 1; j < pairGeoJson.coordinates.length; j++) {
                        pathGeojson.coordinates.push(pairGeoJson.coordinates[j]);
                    }
                }
                routeJSON["purejson"] = pathGeojson;
                routeJSON["geojson"] = {
                    "type": "Feature",
                    "properties": {
                        "numPassengers": routeJSON["numPassengers"],
                        "travDistance": (routeJSON["travDistance"] / 1000).toFixed(2),
                        // TODO: Colocar escolas
                    },
                    "geometry": {
                        "type": pathGeojson.type,
                        "coordinates": pathGeojson.coordinates,
                    }
                }
                resolve(routeJSON);
            });
        });
    }

    toLatLongRoute(routingGraph) {
        let routeSTR = "Route: " + this.busID + "\n"
                     + "NumberPassengers: " + this.numPassengers(routingGraph) + "\n"
                     + "TravDistance: " + this.travDistance(routingGraph);
        for (let i = 0; i < this.route.length; i++) {
            routeSTR += "\n" + this.route[i] + ":" + routingGraph.vertexToLatLon(this.route[i]);
        }

        return routeSTR;
    }

    static genID() {
        return BusRoute.busID++;
    }

    get id() {
        return this.busID;
    }

    set id(i) {
        this.busID = i;
    }
}

BusRoute.busID = 0;

module.exports = BusRoute;