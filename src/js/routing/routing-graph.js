// Basic Routing Graph Data Structure Implementation

const Heap = require("heap");
const Saving = require("./saving.js");
const geolib = require("geolib");
const { getDistance } = geolib;

module.exports = class RoutingGraph {
    constructor() {
        this.matrix = new Map();
    }

    addVertex(key, lat, lng, passengers = 0) {
        let vertex = new Map();
        vertex.set("key", key);
        vertex.set("lat", lat);
        vertex.set("lng", lng);
        vertex.set("passengers", passengers);
        vertex.set("edges", new Map());
        vertex.set("savings", new Map());
        this.matrix.set(key, vertex);
    }

    distance(c, d) {
        return this.matrix.get(c).get("edges").get(d);
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

    buildDistMatrix() {
        // Graph pairs here are called (c, d) rather than (u, v) due to the paper nomenclature
        this.matrix.forEach(c => {
            let ckey = c.get("key");
            let clat = c.get("lat");
            let clng = c.get("lng");

            this.matrix.forEach(d => {
                let dkey = d.get("key");
                let dlat = d.get("lat");
                let dlng = d.get("lng");

                if (ckey == dkey) {
                    // Set distance to itself to zero
                    c.get("edges").set(dkey, 0);
                } else {
                    // Check if v has computed the distance to u
                    if (d.get("edges").has(ckey)) {
                        // We do not need to compute dist(u, v), since we already computed dist(v,u)
                        // Just save the already computed distance in u
                        c.get("edges").set(dkey, d.get("edges").get(ckey));
                    } else {
                        // Compute the distance
                        let distance = getDistance(
                            { latitude: clat, longitude: clng },
                            { latitude: dlat, longitude: dlng }
                        );
                        c.get("edges").set(dkey, distance);
                    }
                }
            });
        });
    }

    buildSavings() {
        this.savingsList = new Heap((a, b) => a.compareTo(b));

        this.matrix.forEach(c => {
            let ckey = c.get("key");
            let cedges = c.get("edges");

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
                        let tgd = this.matrix.get("garage").get("edges").get(dkey);
                        let tcd = cedges.get(dkey);
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
}