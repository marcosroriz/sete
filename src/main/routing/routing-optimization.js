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
        return new Promise((resolve, reject) => {
            // Activate spatial db
            this.spatialiteDB.spatialite((error) => {
                let kmeans = new SchoolBusKMeans(this.routingParams);
                kmeans.partition(this.routingParams["numVehicles"])
                      .then((clusters) => {
                            console.log(clusters);
                            console.log("Executa um Clark por Cluster");

                            let schoolBusRouter = new ClarkeWrightSchoolBusRouting(this.routingParams,
                                                                                this.spatialiteDB);
                            schoolBusRouter.spatialRoute().then((busRoutes) => {
                                // Print Routes
                                console.log(busRoutes);

                                // Run OPT
                                let optimizedRoutes = new Array();
                                busRoutes.forEach((r) => {
                                    let optRoute = new TwoOpt(r, schoolBusRouter.graph).optimize();
                                    optimizedRoutes.push(optRoute);
                                });

                                // Compute Route JSON (need to run at promise)
                                let promises = new Array();
                                optimizedRoutes.forEach((r) => {
                                    promises.push(r.toPlainJSON(schoolBusRouter.graph, this.spatialiteDB));
                                });

                                Promise.all(promises).then((routesJSON) => {
                                    console.log(routesJSON);
                                    resolve(routesJSON);
                                })
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
