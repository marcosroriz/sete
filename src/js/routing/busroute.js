// Bus Route Class

class BusRoute {
    constructor({ path = new Array() }) {
        this.route = path;
        this.id = BusRoute.genID();
    }

    reverse() {
        return new BusRoute({ path: this.route.reverse() });
    }

    passengers() {
        return this.route.length;
    }

    first() {
        return this.route[0];
    }

    last() {
        return this.route[this.route.length - 1];
    }

    isFirst(x) {
        return x == this.first();
    }

    isLast(x) {
        return x == this.last();
    }

    has(x) {
        return this.route.includes(x);
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

    travTime(routingGraph, speed) {
        return this.travDistance(routingGraph) * speed;
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