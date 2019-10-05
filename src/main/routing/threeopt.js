const RoutingGraph = require("./routing-graph.js");
const BusRoute = require("./busroute.js");

module.exports = class ThreeOpt {
    constructor(busRoute) {
        this.busRoute = busRoute;
    }
}
