const RoutingGraph = require("./routing-graph.js");
const BusRoute = require("./busroute.js");

module.exports = class TwoOpt {
    constructor(busRoute, routingGraph) {
        this.busRoute = busRoute;
        this.routingGraph = routingGraph;
        this.initialCost = this.busRoute.travDistance(this.routingGraph);
    }

    optimize() {
        let improved = true;
        let bestCost = this.busRoute.travDistance(this.routingGraph);
        let bestPath = this.busRoute.route;

        while (improved) {
            improved = false;

            let pairs = this.generateAllPairs();
            for (let p of pairs) {
                let i = p[0];
                let j = p[1];

                let initPath = bestPath.slice(0, i + 1);
                let splitPath = bestPath.slice(i + 1, j + 2).reverse();
                let finalPath = bestPath.slice(j + 2, bestPath.length);
                let newPath = initPath.concat(splitPath, finalPath);

                let newRoute = new BusRoute({ path: newPath });
                let newRouteCost = newRoute.travDistance(this.routingGraph);
                if (newRouteCost < bestCost) {
                    improved = true;
                    this.busRoute = newRoute;
                    bestCost = newRouteCost;
                    bestPath = newPath;
                }
            }
        }

        if (this.initialCost != bestCost) {
            console.log("OLD COST", "NEW COST");
            console.log(this.initialCost, bestCost);
        }
        return this.busRoute;
    }

    generateAllPairs() {
        let pairs = new Array();
        for (let i = 0; i < this.busRoute.length() - 3; i++) {
            for (let j = i + 2; j < this.busRoute.length() - 2; j++) {
                pairs.push([i, j]);
            }
        }

        return pairs;
    }

}
