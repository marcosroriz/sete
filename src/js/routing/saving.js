module.exports = class Saving {
    constructor(c, d, scd = 0) {
        this.c = c;
        this.d = d;
        this.scd = scd;
    }

    computeSaving(distMatrix) {
        let tcs = distMatrix.get(c).get("edges").get("school");
        let tgd = distMatrix.get("garage").get("edges").get(d);
        let tcd = distMatrix.get(c).get("edges").get(d);
        this.scd = tcs + tgd - tcd;
    }

    value() {
        return this.scd;
    }
}