// Implements a varition of the Clarke and Wright algorithm (1964) based on:
// SCHOOL BUS ROUTING BY COMPUTER
// By: Brian T. Bennet and Denos C. Gazis
// See: https://www.sciencedirect.com/science/article/abs/pii/004116477290072X
//      https://doi.org/10.1016/0041-1647(72)90072-X

const Heap = require("heap");
const RoutingGraph = require("./routing-graph.js");
const BusRoute = require("./busroute.js");
const _ = require("lodash");


class ClarkeWrightSchoolBusRouting {
    constructor(inputData) {
        // Algorithm Parameters
        this.maxTravDist = inputData["maxTravDist"];
        this.maxTravTime = inputData["maxTravTime"];
        this.optTarget = inputData["optTarget"];
        this.numVehicles = inputData["numVehicles"];
        this.maxCapacity = inputData["maxCapacity"];
        this.busSpeed = 11.11; // 11.11 m/s ~= 40 km/h

        // Garage
        this.garage = inputData["garage"];

        // Bus Stops (if not using one, each student represent a bus stop)
        this.stops = inputData["stops"];

        // Schools (if using more than one, get the one that is closest to the stops)
        this.schools = inputData["schools"];

        // Create and prepare the routing Graph
        this.graph = new RoutingGraph();

        // Add Garage to the Graph
        // Only using a single garage!
        this.graph.addVertex("garage", this.garage["lat"], this.garage["lng"]);

        // Add Stops
        this.stops.forEach((s) => {
            this.graph.addVertex(s["key"], s["lat"], s["lng"]);
        });

        // Get the distance to the first school
        // TODO: Fix this
        this.schools.forEach((s) => {
            this.graph.addVertex("school", s["lat"], s["lng"]);
        });

        // Map of Bus Routes
        this.routes = new Map();

        // Map of Bus Stops to Routes
        this.stopsToRouteMap = new Map();
    }

    buildInitialRoute() {
        this.stops.forEach((s) => {
            let busPath = ["garage", s["key"], "school"];
            let busRoute = new BusRoute({ path: busPath });

            this.routes.set(busRoute.id, busRoute);
            this.stopsToRouteMap.set(s["key"], busRoute.id);
        });
    }

    // merge(otherBusRoute, c, d) {
    //     let mergePossible = false;

    //     if (this.first() == c && 
    //         otherBusRoute.first() == d &&
    //         ) {

    //     }
    //     return mergePossible;
    // }

    route() {
        // First, build dist matrix
        console.time('build-distmatrix');
        this.graph.buildDistMatrix();
        console.timeEnd('build-distmatrix');

        // Second, build initial rotes for each bus stop (or student)
        console.time('build-initial-route');
        this.buildInitialRoute();
        console.timeEnd('build-initial-route');

        // Third, build savings and put it on a priority queue
        console.time('build-savings');
        let savings = this.graph.buildSavings();
        console.timeEnd('build-savings');

        console.log(savings.peek());
        let s = savings.pop();
        console.log(this.graph.vertexToLatLon(s.c));
        console.log(this.graph.vertexToLatLon(s.d));
        s = savings.pop();
        console.log(this.graph.vertexToLatLon(s.c));
        console.log(this.graph.vertexToLatLon(s.d));
        s = savings.pop();
        console.log(this.graph.vertexToLatLon(s.c));
        console.log(this.graph.vertexToLatLon(s.d));
        s = savings.pop();
        console.log(this.graph.vertexToLatLon(s.c));
        console.log(this.graph.vertexToLatLon(s.d));
    }
}

module.exports = ClarkeWrightSchoolBusRouting;
