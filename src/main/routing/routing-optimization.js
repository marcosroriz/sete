// Main class that does the routing optimization
// It calls each individual algorithm

// Imports and Algorithms
const ClarkeWrightSchoolBusRouting = require("./clarke-wright-schoolbus-routing.js");
const TwoOpt = require("./twoopt.js");
const SchoolBusKMeans = require("./kmeans.js");

module.exports = class RoutingOptimization {
    constructor(routingParams) {
        this.routingParams = routingParams;
    }

    optimize() {
        console.time("kmeans");
        let kmeans = new SchoolBusKMeans(this.routingParams);
        let partitions = kmeans.partition(this.routingParams["numVehicles"]);
        console.timeEnd("kmeans");
      
        console.time("simulacao");
        let schoolBusRouter = new ClarkeWrightSchoolBusRouting(this.routingParams);
        let busRoutes = schoolBusRouter.route();
        console.timeEnd("simulacao");
      
        console.time("2-opt");
        let optimizedRoutes = new Array();
        busRoutes.forEach((r) => {
          let optRoute = new TwoOpt(r, schoolBusRouter.graph).optimize();
          optimizedRoutes.push(optRoute);
        });
        console.timeEnd("2-opt");
      
        console.time("route-to-json")
        let routesJSON = new Array();
        optimizedRoutes.forEach((r) => {
          routesJSON.push(r.toPlainJSON(schoolBusRouter.graph));
        });
        console.timeEnd("route-to-json");

        return routesJSON;
    }
}

