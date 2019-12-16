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
        this.reverseMap = new Map();

        routingParams["stops"].forEach((s) => {
            var key = s["lat"] + "-" + s["lng"];
            this.reverseMap.set(key, s);
        });
    }

    getStops(rawCluster) {
        var stops = new Array();
        rawCluster.forEach((rc) => {
            var key = rc[0] + "-" + rc[1];
            var obj = this.reverseMap.get(key)
            stops.push(obj)
        });

        return stops;
    }

    optimize() {
        return new Promise((resolve, reject) => {
            // Activate spatial db
            this.spatialiteDB.spatialite((error) => {
                let kmeans = new SchoolBusKMeans(this.routingParams);
                kmeans.partition(this.routingParams["numVehicles"])
                    .then((clusters) => {
                        var clusterizedStops = new Array();
                        clusters.forEach((c) => clusterizedStops.push(this.getStops(c.cluster)))

                        var clarkAlgorithmsPromise = new Array();
                        var routers = new Array();
                        clusterizedStops.forEach((cs) => {
                            var param = Object.assign({}, this.routingParams);
                            param["stops"] = cs;

                            var cwalg = new ClarkeWrightSchoolBusRouting(param, this.spatialiteDB);
                            clarkAlgorithmsPromise.push(cwalg.spatialRoute());
                            routers.push(cwalg);
                        })

                        // let schoolBusRouter = new ClarkeWrightSchoolBusRouting(this.routingParams, this.spatialiteDB);
                        // schoolBusRouter.spatialRoute().then((busRoutes) => {
                        Promise.all(clarkAlgorithmsPromise).then((busRoutes) => {
                            // Run opt
                            let optimizedRoutes = new Array();

                            // Compute Route JSON (need to run at promise)
                            var promises = new Array();

                            // Routing Graph
                            var matrixMap = new Map();
                            routers.forEach((alg) => {
                                matrixMap = new Map([...matrixMap, ...alg.graph.matrix])
                            })
                            var routingGraph = routers[0].graph;
                            routingGraph.setMatrix(matrixMap);
                            Promise.all(routingGraph.buildSpatialMatrix())
                                .then(() => {
                                    // Iterate result
                                    let i = 0;
                                    for (i = 0; i < busRoutes.length; i++) {
                                        var genRoutes = busRoutes[i];
                                        // Print Routes
                                        console.log(genRoutes);
                                        genRoutes.forEach((r) => {
                                            console.log("ANTES", r.route)
                                            let optRoute = new TwoOpt(r, routingGraph).optimize();
                                            console.log("DEPOIS", optRoute.route)
                                            optimizedRoutes.push(optRoute);
                                        })

                                        optimizedRoutes.forEach((r) => {
                                            promises.push(r.toPlainJSON(routingGraph, this.spatialiteDB));
                                        });
                                    }

                                    Promise.all(promises).then((routesJSON) => {
                                        var fc = new Map();
                                        routesJSON.forEach((r) => {
                                            var ckey = r["path"].map(a => a["id"]).join("-")
                                            fc.set(ckey, r);
                                        })
                                        console.log([...fc.values()])
                                        resolve([...fc.values()])
                                    })
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
