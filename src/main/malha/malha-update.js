// Malha Update entry point
// First, check if OSM input is OK

const { app } = require("electron");
const path = require("path");
const child_process = require("child_process");
const fs = require("fs-extra");

class MalhaUpdate {
    constructor(osmFilePath, dbPath, sqliteDB) {
        this.newOSMFile = osmFilePath;
        this.dbPath = dbPath;
        this.sqliteDB = sqliteDB;
    }

    clearNetwork(tableName) {
        let t1 = this.sqliteDB.schema.dropTableIfExists("graph_nodes");
        let t2 = this.sqliteDB.schema.dropTableIfExists("osm_tmp_nodes");
        let t3 = this.sqliteDB.schema.dropTableIfExists("road_nodes");
        let t4 = this.sqliteDB.schema.dropTableIfExists(tableName);
        let t5 = this.sqliteDB.schema.dropTableIfExists(tableName + "_nodes");
        return [t1, t2, t3, t4, t5];
    }

    createBasicNet(tableName) {
        let binName = "spatialite_osm_net.exe";
        if (process.platform == "linux") {
            binName = "spatialite_osm_net";
        } else if (process.platform == "win32") {
            binName = "spatialite_osm_net.exe";
        } else {
            binName = "spatialite_osm_net_mac";
        }
        
        let spatialiteNetBinPath = path.join(app.getAppPath(), "bin", binName);
        let args = ["-o", this.newOSMFile, "-d", this.dbPath, "-T", tableName];
        return child_process.spawnSync(spatialiteNetBinPath, args);
    }

    update() {
        // First, check if OSM network data is OK
        Promise.all(this.clearNetwork("malhaTest")).then(() => {
            let malhaTestCreation = this.createBasicNet("malhaTest");
            
            let status = malhaTestCreation.status;
            if (status == 0) {
                // Process returned OK
                // Ok, now we'll copy the updated OSM file to the existing one
                let userDataPath = app.getPath('userData');
                let dstFile = path.join(userDataPath, "malha.osm");
                try {
                    fs.copySync(this.newOSMFile, dstFile);
                    console.log("foi");
                    console.log("salvei em: ", dstFile);
                } catch (err) {
                    console.error(err);
                }
            }
            // console.log(malhaTestCreation.pid);
            // console.log("status", malhaTestCreation.status);
            // console.log(malhaTestCreation.stdout);
        });
    }
}

module.exports = MalhaUpdate;