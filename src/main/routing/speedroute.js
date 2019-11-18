// Implements a varition of the MCM algorithm of
// SpeedRoute: Fast, efficient solutions for school bus routing problems
// See https://doi.org/10.1016/j.trb.2018.09.004 

const Graph = require("./routing-graph.js");

module.exports = class SpeedRoute {
    constructor(inputData) {
        this.graph = new Graph();
        let n = 0;
        for (let i in inputData["alunos"]) {
            this.graph.addVertex(i, inputData["alunos"][i][0], inputData["alunos"][i][1]);
            n++;
        }
        let k = 0;
        while (k < 50) {
            for (let i in inputData["alunos"]) {
                let r = Math.random() - Math.random();
                this.graph.addVertex(n + parseInt(i), inputData["alunos"][i][0] + r, inputData["alunos"][i][1] + r);
                n++;
            }
            k++;
        }
        this.graph.createDistMatrix();
    }
}