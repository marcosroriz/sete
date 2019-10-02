const kmeans = require('node-kmeans');
const geolib = require("geolib");
const { getDistance } = geolib;

module.exports = class SchoolBusKMeans {
    constructor(inputData) {
        // Create KMeans vectors (each stop)
        this.vectors = new Array();

        // Add Stops to graph and vectors
        inputData["stops"].forEach((s) => {
            for (let i = 0; i < s["passengers"]; i++) {
                this.vectors.push([parseFloat(s["lat"]), parseFloat(s["lng"])]);
            }
        });
    }

    partition(numVehicles) {
        console.log("foi?");
        kmeans.clusterize(this.vectors,
            {
                k: numVehicles,
                distance: (a, b) => {
                    return getDistance(
                        { latitude: a[0], longitude: a[1] },
                        { latitude: b[0], longitude: b[1] }
                    );
                }
            }, (err, res) => {
                if (err) console.error(err);
                else console.log('%o', res);
                console.log("aqui");
            })
    }
}