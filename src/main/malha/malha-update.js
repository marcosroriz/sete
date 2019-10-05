// Malha Update entry point
// First, check if OSM input is OK

const { app } = require("electron");
const path = require("path");
const child_process = require("child_process");
const osmread = require("osm-read");

class MalhaUpdate {
    constructor(osmFilePath, dbPath, sqliteDB) {
        this.newOSMFile = osmFilePath;
        this.dbPath = dbPath;
        this.sqliteDB = sqliteDB;
    }

    clear(db) {
        let t1 = db.schema.dropTableIfExists("graph_nodes");
        let t2 = db.schema.dropTableIfExists("osm_tmp_nodes");
        let t3 = db.schema.dropTableIfExists("road_nodes");
    }

    update() {
        // First, clear temporary osm data
        let t1 = this.sqliteDB.schema.dropTableIfExists("graph_nodes");
        let t2 = this.sqliteDB.schema.dropTableIfExists("osm_tmp_nodes");
        let t3 = this.sqliteDB.schema.dropTableIfExists("road_nodes");
        let t4 = this.sqliteDB.schema.dropTableIfExists("malhaTest");
        let t5 = this.sqliteDB.schema.dropTableIfExists("malhaTest_nodes");
        Promise.all([t1, t2, t3, t4]).then(() => {
            console.log("fiz o drop das tabelas");

            let spatialiteNetBinPath = path.join(app.getAppPath(), "bin", "spatialite_osm_net");
            let args = ["-o", this.newOSMFile, "-d", this.dbPath, "-T", "malhaTest"];
            let netDBCreation = child_process.spawnSync(spatialiteNetBinPath, args);
            console.log("output");

            console.log(netDBCreation.pid);
            console.log("status", netDBCreation.status);
            console.log(netDBCreation.stdout);
        });
    }
}

module.exports = MalhaUpdate;