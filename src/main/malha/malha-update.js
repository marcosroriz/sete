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
        let templateFile = path.join(path.dirname(this.dbPath), "osm_road_template");
        let args = ["-o", this.newOSMFile, 
                    "-d", this.dbPath, 
                    "-T", tableName, 
                    "-tf", templateFile];
        console.log(spatialiteNetBinPath);
        console.log(args);
        return child_process.spawn(spatialiteNetBinPath, args);
    }

    createVirtualNetwork(tableName) {
        let binName = "spatialite_network.exe";
        if (process.platform == "linux") {
            binName = "spatialite_network";
        } else if (process.platform == "win32") {
            binName = "spatialite_network.exe";
        } else {
            binName = "spatialite_network_mac";
        }

        let spatialliteVirtualNetBin = path.join(app.getAppPath(), "bin", binName);
        let args = ["-d", this.dbPath, 
                    "-T", tableName, 
                    "-f", "node_from",
                    "-t", "node_to",
                    "-g", "geometry",
                    "-n", "name",
                    "-c", "cost",
                    "-o", tableName + "_data",
                    "-v", tableName + "_net"];
        console.log(spatialliteVirtualNetBin);
        console.log(args);
        return child_process.spawn(spatialliteVirtualNetBin, args);

    }
    async update() {
        // First, check if OSM network data is OK
        Promise.all(this.clearNetwork("malha")).then(() => {
            let malhaCreation = this.createBasicNet("malha");
            malhaCreation.on('close', (status) => {
                if (status == 0) {
                    // Process returned OK

                    // Now, we'll create the routing network
                    let malhaVirtualNetwork = this.createVirtualNetwork("malha");
                    malhaVirtualNetwork.on('close', (statusNet) => {
                        console.log(statusNet);

                        // Ok, now we'll copy the updated OSM file to the existing one
                        let userDataPath = app.getPath('userData');
                        let dstFile = path.join(userDataPath, "malha.osm");
                        try {
                            fs.copySync(this.newOSMFile, dstFile);
                            console.log("salvei em: ", dstFile);
                        } catch (err) {
                            console.error(err);
                        }
                    });
                } else {
                    // Handle error
                }
            });
            // console.log(malhaTestCreation.pid);
            // console.log("status", malhaTestCreation.status);
            // console.log(malhaTestCreation.stdout);
        });
    }
}

module.exports = MalhaUpdate;