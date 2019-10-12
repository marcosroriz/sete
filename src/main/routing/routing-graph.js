// Basic Routing Graph Data Structure Implementation

const Heap = require("heap");
const Saving = require("./saving.js");

module.exports = class RoutingGraph {
    constructor(spatialiteDB, useSpatialDistance = false) {
        this.matrix = new Map();
        this.spatialiteDB = spatialiteDB;
        this.useSpatialDistance = useSpatialDistance;
    }

    addGarageVertex(key, lat, lng) {
        return this.addVertex("garage", lat, lng, 0, "garage", key);
    }

    addStopVertex(key, lat, lng, passengers = 0) {
        return this.addVertex(key, lat, lng, passengers, "stop", key);
    }

    addSchoolVertex(key, lat, lng, passengers = 0) {
        return this.addVertex("school", lat, lng, passengers, "school", key);
    }

    addVertex(key, lat, lng, passengers = 0, type = "stop", rawkey = "") {
        let vertex = new Map();
        vertex.set("key", key);
        vertex.set("rawkey", rawkey);
        vertex.set("lat", lat);
        vertex.set("lng", lng);
        vertex.set("passengers", passengers);
        vertex.set("type", type);
        vertex.set("spatialCostEdges", new Map());
        vertex.set("spatialDistEdges", new Map());
        vertex.set("savings", new Map());
        this.matrix.set(key, vertex);
    }

    buildSpatialVertex() {
        let promisesArray = new Array();
        this.matrix.forEach(c => {
            promisesArray.push(this.getSpatialVertex(c, this.spatialiteDB));
        });

        return promisesArray;
    }

    buildSpatialMatrix() {
        let promisesArray = new Array();

        // Graph pairs here are called (c, d) rather than (u, v) due to the paper nomenclature
        this.matrix.forEach(c => {
            let ckey = c.get("key");

            this.matrix.forEach(d => {
                let dkey = d.get("key");

                if (ckey == dkey) {
                    // Set distance to itself to zero
                    c.get("spatialDistEdges").set(dkey, 0);
                } else {
                    // Check if v has computed the distance to u
                    if (d.get("spatialDistEdges").has(ckey)) {
                        // We do not need to compute dist(u, v), since we already computed dist(v,u)
                        // Just save the already computed distance in u
                        c.get("spatialDistEdges").set(dkey, d.get("spatialDistEdges").get(ckey));
                    } else {
                        // Compute the distance
                        promisesArray.push(this.getSpatialDistance(c, d, this.spatialiteDB));
                    }
                }
            });
        });

        return promisesArray;
    }

    buildSavings() {
        this.savingsList = new Heap((a, b) => a.compareTo(b));

        this.matrix.forEach(c => {
            let ckey = c.get("key");
            let cedges = this.useSpatialDistance ? c.get("spatialDistEdges")
                                                : c.get("spatialCostEdges");

            // For each neighbor d from c compute the saving Scd
            this.matrix.forEach((d) => {
                let dkey = d.get("key");
                if (ckey != dkey && ckey != "garage" && dkey != "garage" &&
                    ckey != "school" && dkey != "school") {
                    let tgc = cedges.get("garage");

                    // Check if we already computed the savings
                    // If negative, compute, otherwise reuse the value
                    if (!(d.get("savings").has(ckey))) {
                        let tcs = cedges.get("school");
                        let tcd = cedges.get(dkey);
                        let tgd = this.useSpatialDistance 
                                ? this.matrix.get("garage").get("spatialDistEdges").get(dkey)
                                : this.matrix.get("garage").get("spatialCostEdges").get(dkey);
                        let scd = tcs + tgd - tcd;

                        c.get("savings").set(dkey, scd);
                        this.savingsList.push(new Saving(ckey, dkey, scd, tgc));
                    } else {
                        let scd = d.get("savings").get(ckey);
                        c.get("savings").set(dkey, scd);
                        this.savingsList.push(new Saving(ckey, dkey, scd, tgc));
                    }
                }
            });
        });

        return this.savingsList;
    }

    getSpatialDistance(c, d, spatialiteDB) {
        let cnodeID = c.get("dbNodeID");
        let dnodeID = d.get("dbNodeID");

        let sqlQuery = `SELECT *, ST_LENGTH(geometry, 1) AS dist, AsGeoJSON(geometry) AS js
                        FROM malha_net
                        WHERE NodeFrom = ${cnodeID} AND NodeTo = ${dnodeID}
                        LIMIT 1`;
        return new Promise((resolve, reject) => {
            spatialiteDB.get(sqlQuery, (err, row) => {
                let cost = row["Cost"];
                let dist = row["dist"];
                if (cost == 0) {
                    console.log("aqui aqui");
                    console.log(sqlQuery);
                }
                c.get("spatialDistEdges").set(d.get("key"), dist);
                c.get("spatialCostEdges").set(d.get("key"), cost);
                resolve();
            });
        });
    }

    getSpatialVertex(c, spatialiteDB) {
        let lng = c.get("lng");
        let lat = c.get("lat");

        let sqlQuery = `SELECT ST_Distance(ST_GeomFromText('POINT(${lng} ${lat})', 4326), linha.geometry, 1) AS dist, 
                               node_id
                        FROM malha_nodes AS linha
                        ORDER BY dist
                        LIMIT 1`;
        return new Promise((resolve, reject) => {
            spatialiteDB.get(sqlQuery, (err, row) => {
                c.set("dbNodeID", row["node_id"]);
                resolve();
            });
        });
    }

    getVertex(c) {
        return this.matrix.get(c);
    }

    distance(c, d) {
        if (this.useSpatialDistance) {
            return this.matrix.get(c).get("spatialDistEdges").get(d);
        } else {
            return this.matrix.get(c).get("spatialCostEdges").get(d);
        }
    }

    savings(c, d)  {
        if (this.matrix.get(c).get("savings").has(d)) {
            return this.matrix.get(c).get("savings").get(d);
        } else {
            return this.matrix.get(d).get("savings").get(c);
        }
    }

    passengers(c) {
        return this.matrix.get(c).get("passengers");
    }

    vertexToLatLon(c) {
        return this.matrix.get(c).get("lat") + ", " + this.matrix.get(c).get("lng");
    }

}