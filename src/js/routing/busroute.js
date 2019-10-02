// Bus Route Class

class BusRoute {
    constructor({ path = new Array() }) {
        this.route = path;
        this.id = BusRoute.genID();
    }

    firstStop() {
        return this.route[1];
    }

    lastStop() {
        return this.route[this.route.length - 2];
    }

    isFirstStop(x) {
        return x == this.firstStop();
    }

    isLastStop(x) {
        return x == this.lastStop();
    }

    has(x) {
        return this.route.includes(x);
    }

    length() {
        return this.route.length;
    }

    // FIXME: fix last and first piont
    reverse() {
        return new BusRoute({ path: this.route.reverse() });
    }

    numPassengers(routingGraph) {
        let p = 0;
        // Do not count the first (school) and last position (school)
        for (let i = 1; i <= this.route.length - 2; i++) {
            p = p + routingGraph.passengers(this.route[i]);
        }
        return p;
    }

    travDistance(routingGraph) {
        let dist = 0;
        for (let i = 0; i < this.route.length - 1; i++) {
            let c = this.route[i];
            let d = this.route[i + 1];
            dist = dist + routingGraph.distance(c, d);
        }

        return dist;
    }

    toPlainJSON(routingGraph) {
        let routeJSON = {};
        routeJSON["id"] = this.busID;
        routeJSON["numPassengers"] = this.numPassengers(routingGraph);
        routeJSON["travDistance"] = this.travDistance(routingGraph);
        routeJSON["path"] = new Array();
        for (let i = 0; i < this.route.length; i++) {
            let vertex = routingGraph.getVertex(this.route[i]);
            routeJSON["path"].push({
                id: vertex.get("rawkey"),
                type: vertex.get("type")
            });
        }

        return routeJSON;
    }

    toLatLongRoute(routingGraph) {
        let routeSTR = "Route: " + this.busID + "\n"
                     + "NumberPassengers: " + this.numPassengers(routingGraph) + "\n"
                     + "TravDistance: " + this.travDistance(routingGraph);
        for (let i = 0; i < this.route.length; i++) {
            routeSTR += "\n" + this.route[i] + ":" + routingGraph.vertexToLatLon(this.route[i]);
        }

        return routeSTR;
    }

    static genID() {
        return BusRoute.busID++;
    }

    get id() {
        return this.busID;
    }

    set id(i) {
        this.busID = i;
    }
}

BusRoute.busID = 0;

module.exports = BusRoute;