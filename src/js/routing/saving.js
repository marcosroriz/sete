module.exports = class Saving {
    constructor(c, d, scd = 0, tgc = 0) {
        // c, d pair
        this.c = c;
        this.d = d;

        // Scd saving
        this.scd = scd;

        // Distance from c to garage (useful if we have equal distance in saving)
        this.tgc = tgc;
    }

    compareTo(otherSaving) {
        if (this.scd != otherSaving.scd) {
            return otherSaving.scd - this.scd;
        } else {
            return otherSaving.tgc - this.tgc;
        }
    }

    toString() {
        return "Saving (" + this.c + ", " + this.d + ") : " + this.tgc + " -- (TGC: " + this.tgc + ")";
    }
}