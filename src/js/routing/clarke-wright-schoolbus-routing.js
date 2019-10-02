// Implements a varition of the Clarke and Wright algorithm (1964) based on:
// SCHOOL BUS ROUTING BY COMPUTER
// By: Brian T. Bennet and Denos C. Gazis
// See: https://www.sciencedirect.com/science/article/abs/pii/004116477290072X
//      https://doi.org/10.1016/0041-1647(72)90072-X

const Heap = require("heap");
const RoutingGraph = require("./routing-graph.js");
const BusRoute = require("./busroute.js");
const Saving = require("./saving.js");

class ClarkeWrightSchoolBusRouting {
    constructor(inputData) {
        // Algorithm Parameters
        this.maxTravDist = inputData["maxTravDist"];
        this.maxTravTime = inputData["maxTravTime"];
        this.optTarget   = inputData["optTarget"];
        this.numVehicles = inputData["numVehicles"];
        this.maxCapacity = inputData["maxCapacity"];
        this.busSpeed    = 11.11; // 11.11 m/s ~= 40 km/h

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
        this.graph.addGarageVertex(this.garage["key"], this.garage["lat"], this.garage["lng"]);

        // Add Stops
        // TODO: Add # students at each stop
        this.stops.forEach((s) => {
            this.graph.addStopVertex(s["key"], s["lat"], s["lng"], s["passengers"]);
        });

        // Get the distance to the first school
        // TODO: Fix this
        this.schools.forEach((s) => {
            this.graph.addSchoolVertex(s["key"], s["lat"], s["lng"]);
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

    processSavings(savingsQueue) {
        while (!savingsQueue.empty()) {
            let saving = savingsQueue.pop();
            console.log(saving);
            let cRoute = this.getRoute(saving.c);
            let dRoute = this.getRoute(saving.d);

            // Check if it is possible to join the two routes
            if (cRoute.id != dRoute.id && cRoute.lastStop() == saving.c && dRoute.firstStop() == saving.d) {
                // Create merge route
                let firstPath  = cRoute.route.slice(0, cRoute.route.length - 1);
                let secondPath = dRoute.route.slice(1, dRoute.route.length);
                let mergePath  = firstPath.concat(secondPath);
                let mergeRoute = new BusRoute({ path: mergePath });

                // Check if a merge violate constraints
                let totalPassengers = mergeRoute.numPassengers(this.graph);
                let totalTravDistance = mergeRoute.travDistance(this.graph);

                // We can merge!
                if (totalPassengers <= this.maxCapacity && totalTravDistance <= this.maxTravDist) {
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

    route() {
        // First, build dist matrix
        console.time("build-distmatrix");
        this.graph.buildDistMatrix();
        console.timeEnd("build-distmatrix");

        // Second, build initial rotes for each bus stop (or student)
        console.time("build-initial-route");
        this.buildInitialRoute();
        console.timeEnd("build-initial-route");

        // Third, build savings and put it on a priority queue
        console.time("build-savings");
        let savings = this.graph.buildSavings();
        console.timeEnd("build-savings");

        // Process savings
        console.time("process-savings");
        this.processSavings(savings);
        console.timeEnd("process-savings");
        
        // Print Routes
        this.routes.forEach((r) => {
            console.log(r.toLatLongRoute(this.graph));
            console.log("-------")
        });

        return this.routes;
    }

}

module.exports = ClarkeWrightSchoolBusRouting;
