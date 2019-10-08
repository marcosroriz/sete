// Main class that does the routing optimization
// It calls each individual algorithm

// Imports and Algorithms
const ClarkeWrightSchoolBusRouting = require("./clarke-wright-schoolbus-routing.js");
const TwoOpt = require("./twoopt.js");
const SchoolBusKMeans = require("./kmeans.js");

module.exports = class RoutingOptimization {
    constructor(routingParams, spatialiteDB) {
        this.routingParams = routingParams;
        this.spatialiteDB = spatialiteDB;
    }

    optimize() {
        // Activate spatial db
        this.spatialiteDB.spatialite((error) => {
            let kmeans = new SchoolBusKMeans(this.routingParams);
            kmeans.partition(this.routingParams["numVehicles"])
                  .then((clusters) => {
                    console.log(clusters);
                    console.log("Executa um Clark por Cluster");

                    let schoolBusRouter = new ClarkeWrightSchoolBusRouting(this.routingParams,
                                                                           this.spatialiteDB);
                    schoolBusRouter.spatialRoute().then((routes) => {
                        // Print Routes
                        console.log(routes);
                        routes.forEach((r) => {
                            console.log(r.toLatLongRoute(this.graph));
                            console.log("-------")
                        });
                    });
                });
        });
    }
}

               //  schoolBusRouter.buildDistMatrix()
                                    //  .then())
                // let busRoutes = schoolBusRouter.route();
                // console.time("2-opt");
                // let optimizedRoutes = new Array();
                // busRoutes.forEach((r) => {
                //   let optRoute = new TwoOpt(r, schoolBusRouter.graph).optimize();
                //   optimizedRoutes.push(optRoute);
                // });
                // console.timeEnd("2-opt");

                // console.time("route-to-json")
                // let routesJSON = new Array();
                // optimizedRoutes.forEach((r) => {
                //   routesJSON.push(r.toPlainJSON(schoolBusRouter.graph));
                // });
                // console.timeEnd("route-to-json");
                    // return routesJSON;
