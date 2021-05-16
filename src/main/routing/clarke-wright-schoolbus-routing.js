// Implements a varition of the Clarke and Wright algorithm (1964) based on:
// SCHOOL BUS ROUTING BY COMPUTER
// See: https://www.sciencedirect.com/science/article/abs/pii/004116477290072X
//      https://doi.org/10.1016/0041-1647(72)90072-X
//
// Using the strategy described in 
// SpeedRoute: Fast, efficient solutions for school bus routing problems
// See https://doi.org/10.1016/j.trb.2018.09.004 

var RoutingGraph = require("./routing-graph.js");
var BusRoute = require("./busroute.js");
var haversine = require("haversine-distance");

class ClarkeWrightSchoolBusRouting {
    constructor(cachedODMatrix, inputData, spatialiteDB) {
        // Database Parameters
        this.spatialiteDB = spatialiteDB;

        // Algorithm Parameters
        this.maxTravDist = inputData["maxTravDist"];
        this.maxTravTime = inputData["maxTravTime"];
        this.optTarget = inputData["optTarget"];
        this.numVehicles = inputData["numVehicles"];
        this.maxCapacity = inputData["maxCapacity"];
        this.busSpeed = inputData["busSpeed"];

        // Garage
        this.garage = inputData["garage"];

        // Bus Stops (if not using one, each student represent a bus stop)
        this.stops = inputData["stops"];

        // Schools (if using more than one, get the one that is closest to the stops)
        this.schools = inputData["schools"];

        // Create and prepare the routing Graph
        this.graph = new RoutingGraph(cachedODMatrix, this.spatialiteDB, true);

        // Add Garage to the Graph
        this.graph.addGarageVertex(this.garage[0]["key"], this.garage[0]["lat"], this.garage[0]["lng"]);

        // Add Stops and get used schools
        this.schoolsUsed = new Set();
        this.stops.forEach((s) => {
            this.graph.addStopVertex(s["key"], s["lat"], s["lng"], s["passengers"]);
            this.schoolsUsed.add(s["school"]);
        });

        // Add Meta School
        var lat = 0;
        var lng = 0;
        this.schools.forEach((s) => {
            if (this.schoolsUsed.has(s["key"])) {
                lat = lat + parseFloat(s["lat"]);
                lng = lng + parseFloat(s["lng"]);
                this.graph.addSpecialSchoolVertex(s["key"], s["lat"], s["lng"]);
            }
        })
        lat = lat / this.schoolsUsed.size;
        lng = lng / this.schoolsUsed.size;
        this.graph.addSchoolVertex("school", lat, lng);

        // Map of Bus Routes
        this.routes = new Map();

        // Map of Bus Stops to Routes
        this.stopsToRouteMap = new Map();
    }

    buildSpatialIndex() {
        return Promise.all(this.graph.buildSpatialVertex());
    }

    buildSpatialMatrix() {
        return Promise.all(this.graph.buildSpatialMatrix());
    }

    buildInitialRoute() {
        this.stops.forEach((s) => {
            let busPath = ["garage", s["key"], "school"];
            let busRoute = new BusRoute({ path: busPath });

            this.routes.set(busRoute.id, busRoute);
            this.stopsToRouteMap.set(s["key"], busRoute.id);
        });
    }

    processSavings(savingsQueue) {
        while (!savingsQueue.empty()) {
            let saving = savingsQueue.pop();
            
            // console.log(saving);
            let cRoute = this.getRoute(saving.c);
            let dRoute = this.getRoute(saving.d);

            // Check if it is possible to join the two routes
            if (cRoute.id != dRoute.id && cRoute.lastStop() == saving.c && dRoute.firstStop() == saving.d) {
                // Create merge route
                let firstPath = cRoute.route.slice(0, cRoute.route.length - 1);
                let secondPath = dRoute.route.slice(1, dRoute.route.length);
                let mergePath = firstPath.concat(secondPath);
                let mergeRoute = new BusRoute({ path: mergePath });

                // Check if a merge violate constraints
                let totalPassengers = mergeRoute.numPassengers(this.graph);
                let totalTravDistance = mergeRoute.travDistance(this.graph);
                let totalTravTime = totalTravDistance / this.busSpeed;

                // console.log("PASSENGERS", totalPassengers, "MAX CAPACITY", this.maxCapacity)
                // console.log("TRAV DISTANCE", totalTravDistance, "MAX DIST", this.maxTravDist)
                // console.log("TRAV TIME", totalTravTime, "MAX TIME", this.maxTravTime)

                // We can merge!
                if (totalPassengers <= this.maxCapacity &&  
                    totalTravDistance <= this.maxTravDist &&
                    totalTravTime <= this.maxTravTime) {
                    // Delete old routes
                    this.routes.delete(cRoute.id);
                    this.routes.delete(dRoute.id);

                    // Put new route
                    this.routes.set(mergeRoute.id, mergeRoute);
                    for (let stopID = 1; stopID < mergePath.length - 1; stopID++) {
                        this.setRoute(mergePath[stopID], mergeRoute);
                    }
                }
            }
        }
    }

    getRoute(stopID) {
        return this.routes.get(this.stopsToRouteMap.get(stopID));
    }

    setRoute(stopID, busRoute) {
        this.stopsToRouteMap.set(stopID, busRoute.id);
    }

    spatialRoute() {
        // First, build spatial index
        return this.buildSpatialIndex()
            .then(() => this.buildSpatialMatrix()) // Second, build spatial matrix
            .then(() => {
                // Third, run clark
                return new Promise((resolve, reject) => {
                    // Build initial rotes for each bus stop (or student)
                    this.buildInitialRoute();

                    // Build savings and put it on a priority queue
                    let savings = this.graph.buildSavings();

                    // Process savings
                    this.processSavings(savings);

                    // Add remainder schools to tail
                    this.routes.forEach((r) => {
                        var cuttedPath = r.route.slice(0, r.route.length - 1)
                        var lastStopKey = cuttedPath[cuttedPath.length - 1]
                        var lastStop = this.stops[Object.keys(this.stops).find(key => this.stops[key]["key"] == lastStopKey)];

                        this.otherSchools = new Map();
                        this.schools.forEach((s) => {
                            if (this.schoolsUsed.has(s["key"])) {
                                var a = { "lat": s["lat"], "lng": s["lng"] }
                                var b = { "lat": lastStop["lat"], "lon": lastStop["lng"] }
                                var dist = haversine(a, b);
                                this.otherSchools.set(dist, s);
                            }
                        });
                        var closestSchoolsIndexes = [...this.otherSchools.keys()].sort();
                        closestSchoolsIndexes.forEach((ci) => {
                            cuttedPath.push("otherschool" + this.otherSchools.get(ci)["key"])
                        });
                        r.route = cuttedPath;
                    })

                    // Print Routes
                    // this.routes.forEach((r) => {
                    //     console.log(r.toLatLongRoute(this.graph));
                    //     console.log("-------")
                    // });

                    resolve(this.routes);
                });
            })
            .catch((err) => {
                console.log(err);
                console.log("ERROR");
            });
    }

    route() {
        // First, build dist matrix
        this.graph.buildDistMatrix();

        // Second, build initial rotes for each bus stop (or student)
        this.buildInitialRoute();

        // Third, build savings and put it on a priority queue
        let savings = this.graph.buildSavings();

        // Process savings
        this.processSavings(savings);

        // Print Routes
        this.routes.forEach((r) => {
            console.log(r.toLatLongRoute(this.graph));
            console.log("-------")
        });

        return this.routes;
    }

}

module.exports = ClarkeWrightSchoolBusRouting;
