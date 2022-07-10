// Main class that does the routing optimization
// It calls each individual algorithm

// Imports and Algorithms
var ClarkeWrightSchoolBusRouting = require("./clarke-wright-schoolbus-routing.js");
var TwoOpt = require("./twoopt.js");
var SchoolBusKMeans = require("./kmeans.js");
var { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { toNumber } = require("lodash");

class RoutingOptimizationWorker {
    constructor(cachedODMatrix, routingParams, spatialiteDB) {
        this.cachedODMatrix = cachedODMatrix;
        this.routingParams = routingParams;
        this.spatialiteDB = spatialiteDB;
        this.reverseMap = new Map();
        
        // IDENTIFICANDO O MODO DE SOLUÇÃO
        if (typeof this.routingParams["maxCapacity"] == 'object') {
            this.heterogeneous = true;
            console.log("\n *** FROTA HETEROGÊNEA ***\n")
        } else {
            this.heterogeneous = false;
            console.log("\n *** FROTA HOMOGÊNEA ***\n")
        }

        routingParams["stops"].forEach((s) => {
            let key = Number(s["lat"]).toFixed(10) + "-" + Number(s["lng"]).toFixed(10);
            let stopsAtGivenLocation = [];
            if (this.reverseMap.has(key)) {
                stopsAtGivenLocation = this.reverseMap.get(key);
            }
            stopsAtGivenLocation.push(s);

            this.reverseMap.set(key, stopsAtGivenLocation);
        });

        console.log(routingParams)
    }

    getStops(rawCluster) {
        let stops = new Array();
        let stopsConsidered = new Map();

        rawCluster.forEach((rc) => {
            let key = Number(rc[0]).toFixed(10) + "-" + Number(rc[1]).toFixed(10);
            let stopsAtGivenLocation = this.reverseMap.get(key);

            if (!stopsConsidered.has(key)) {
                stops.push(...stopsAtGivenLocation)
                stopsConsidered.set(key, true);
            }
        });

        return stops;
    }

    SortClustersMaxToMin(clusterizedStops){
        let ClustersSorted = {};
        for (let i = 0; i < clusterizedStops.length; i++) {
            let clusterStops = clusterizedStops[i];
            let countPassagers = 0;
            for (let z = 0; z < clusterStops.length; z++) {
                countPassagers = countPassagers + clusterStops[z].passengers;
            }
            ClustersSorted[countPassagers] = clusterStops;
        }
        //console.log("ClustersSorted = ",ClustersSorted);
        
        let IndexByCluester = Array();
        Object.keys(ClustersSorted).forEach((index)=>{
            IndexByCluester.push(Number(index));
        });
        IndexByCluester.sort((a,b)=> b-a);
        //console.log("IndexByCluester = ",IndexByCluester);
        
        let SortClusters = Array();
        for (let i = 0; i < IndexByCluester.length; i++) {
            SortClusters.push(ClustersSorted[IndexByCluester[i]]);
        }
        
        //console.log("SortClusters = ",SortClusters);
        return SortClusters;
    }

    optimize() {
        return new Promise((resolve, reject) => {
            // Activate spatial db
            this.spatialiteDB.spatialite((dbError) => {
                if (dbError) {
                    reject("ERRO AO ABRIR MALHA");
                }

                let routers = new Array();
                let busRoutes = new Array();
                let kmeans = new SchoolBusKMeans(this.routingParams);
                let routingGraph;
                let IterCapacity = 0;

                kmeans.partition(this.routingParams["numVehicles"])
                    .then(clusters => {
                        let clusterizedStops = new Array();
                        clusters.forEach((c) => clusterizedStops.push(this.getStops(c.cluster)))

                        // CASO PARTICULAR PARA FROTA HETEROGÊNEA
                        if (this.heterogeneous == true) {
                            clusterizedStops = this.SortClustersMaxToMin(clusterizedStops);
                        }
                        
                        let clarkAlgorithmsPromise = new Array();
                        clusterizedStops.forEach((cs) => {
                            let param = Object.assign({}, this.routingParams);
                            param["stops"] = cs;

                            // CASO PARTICULAR PARA FROTA HETEROGÊNEA
                            if (this.heterogeneous == true) {
                                param["maxCapacity"] = this.routingParams["maxCapacity"][IterCapacity];
                                IterCapacity++;
                            }
                            
                            // Deixar apenas as escolas que atendem os alunos no conjunto
                            let clusterSchoolsSet = new Set();
                            cs.forEach(student => clusterSchoolsSet.add(student["school"]));
                            let clusterSchools = new Array();
                            this.routingParams.schools.forEach(school => {
                                if (clusterSchoolsSet.has(school["key"])) {
                                    clusterSchools.push(school);
                                }
                            });
                            param["schools"] = clusterSchools;
                            
                            let cwalg = new ClarkeWrightSchoolBusRouting(this.cachedODMatrix, param, this.spatialiteDB);
                            clarkAlgorithmsPromise.push(cwalg.spatialRoute());
                            routers.push(cwalg);
                            
                        });
                        
                        // let schoolBusRouter = new ClarkeWrightSchoolBusRouting(this.routingParams, this.spatialiteDB);
                        // schoolBusRouter.spatialRoute().then((busRoutes) => {
                        return Promise.all(clarkAlgorithmsPromise)
                    })
                    .then((busRoutesGenerated) => {
                        // Bus Routes
                        busRoutes = busRoutesGenerated;

                        // Routing Graph and rebuilding cache
                        var matrixMap = new Map();
                        routers.forEach((alg) => {
                            matrixMap = new Map([...matrixMap, ...alg.graph.matrix])

                            this.cachedODMatrix.nodes = {
                                ...this.cachedODMatrix.nodes,
                                ...alg.graph.cachedODMatrix.nodes
                            }

                            for (let n in alg.graph.cachedODMatrix.dist) {
                                this.cachedODMatrix.dist[n] = {
                                    ...this.cachedODMatrix.dist[n],
                                    ...alg.graph.cachedODMatrix.dist[n]
                                }
                            }

                            for (let n in alg.graph.cachedODMatrix.cost) {
                                this.cachedODMatrix.cost[n] = {
                                    ...this.cachedODMatrix.cost[n],
                                    ...alg.graph.cachedODMatrix.cost[n]
                                }
                            }
                        })
                        routingGraph = routers[0].graph;
                        routingGraph.setMatrix(matrixMap);
                        routingGraph.setCachedODMatrix(this.cachedODMatrix);

                        return Promise.all(routingGraph.buildInnerCityMatrix())
                    })
                    .then(() => {
                        // Run opt
                        let optimizedRoutes = new Array();

                        // Compute Route JSON (need to run at promise)
                        var promises = new Array();

                        // Iterate result
                        let i = 0;
                        for (i = 0; i < busRoutes.length; i++) {
                            var genRoutes = busRoutes[i];
                            // Print Routes
                            // console.log(genRoutes);

                            genRoutes.forEach((r) => {
                                // console.log("ANTES", r.route)
                                let optRoute = new TwoOpt(r, routingGraph).optimize();
                                // console.log("DEPOIS", optRoute.route)
                                optimizedRoutes.push(optRoute);
                            })

                            optimizedRoutes.forEach((r) => {
                                promises.push(r.toPlainJSON(routingGraph, this.spatialiteDB));
                            });
                        }

                        return Promise.all(promises)
                    })
                    .then((routesJSON) => {
                        var fc = new Map();
                        routesJSON.forEach((r) => {
                            var ckey = r["path"].map(a => a["id"]).join("-")
                            fc.set(ckey, r);
                        })
                        // console.log([...fc.values()]);
                        resolve([this.cachedODMatrix, ...fc.values()])
                    })
            })
        });
    };
}

if (isMainThread) {
    module.exports = class RoutingOptimization {
        constructor(app, dbPath) {
            this.app = app;
            this.dbPath = dbPath;

            this.worker = new Worker(__filename, {
                workerData: {
                    "dbPath": this.dbPath
                }
            });

            this.worker.on('message', (payload) => {
                if (!payload.error) {
                    app.emit("done:route-generation", payload.result)
                } else {
                    app.emit("error:route-generation", payload.result)
                }
            });

            this.worker.on('error', (err) => {
                app.emit("error:route-generation", err)
            });

            this.worker.on('exit', (code) => {
                console.log("WORKER EXITING WITH CODE", code)
            });
        }

        quit() {
            this.worker.terminate();
        }

        optimize(cachedODMatrix, routingParams) {
            this.worker.postMessage({ cachedODMatrix, routingParams })
        }
    }
} else {
    console.log("WORKER STARTED");
    console.log(workerData)

    let { dbPath } = workerData;

    var spatialite = require("spatialite");
    var spatialiteDB = new spatialite.Database(dbPath);

    parentPort.on('message', processData => {
        let { cachedODMatrix, routingParams } = processData;
        var routerWorker = new RoutingOptimizationWorker(cachedODMatrix, routingParams, spatialiteDB)
        routerWorker.optimize()
            .then((res) => {
                console.log("WORKER FINISHED")
                parentPort.postMessage({ error: false, result: res })
                //process.exit(0)
            })
            .catch((err) => {
                console.log("WORKER ERROR")
                parentPort.postMessage({ error: true, result: err })
                //process.exit(1)
            })

    })
}
