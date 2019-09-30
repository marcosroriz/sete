// Basic Routing Graph Data Structure Implementation

const Heap = require("heap");
const Saving = require("./saving.js");
const geolib = require("geolib");
const { getDistance } = geolib;

module.exports = class RoutingGraph {
    constructor() {
        this.matrix = new Map();
    }

    addVertex(key, lat, lng) {
        let vertex = new Map();
        vertex.set("key", key);
        vertex.set("lat", lat);
        vertex.set("lng", lng);
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
        let savings = new Heap((a, b) => b.value() - a.value());

        this.matrix.forEach(c => {
            let ckey = c.get("key");
            let cedges = c.get("edges");

            // For each neighbor d from c compute the saving Scd
            this.matrix.forEach((d) => {
                let dkey = d.get("key");
                if (ckey != dkey && ckey != "garage" && dkey != "garage") {
                    // Check if we already computed the savings
                    // Only proceed if we haven't computed
                    if (!(d.get("savings").has(ckey))) {
                        let tcs = cedges.get("school");
                        let tgd = this.matrix.get("garage").get("edges").get(dkey);
                        let tcd = cedges.get(dkey);
                        let scd = tcs + tgd - tcd;

                        c.get("savings").set(dkey, scd);

                        savings.push(new Saving(ckey, dkey, scd));
                    }
                }
            });
        });

        return savings;
    }
}