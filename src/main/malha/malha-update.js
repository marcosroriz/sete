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

    clearNetwork() {
        let binName = "spatialite.exe";
        if (process.platform == "linux") {
            binName = "spatialite";
        } else if (process.platform == "win32") {
            binName = "spatialite.exe";
        } else {
            binName = "spatialite_mac";
        }

        let spatialiteBinPath = path.join(app.getAppPath(), "bin", binName);
        let sqlQuery = `BEGIN;
        SELECT DropTable(NULL, 'malha', 1);
        SELECT DropTable(NULL, 'malha_net', 1);
        SELECT DropTable(NULL, 'malha_nodes', 1);
        SELECT DropTable(NULL, 'malha_data', 1);
        DROP TABLE IF EXISTS osm_tmp_nodes;
        DROP TABLE IF EXISTS road_nodes;
        DROP TABLE IF EXISTS graph_nodes;
        COMMIT;
        VACUUM;`;
        let args = [this.dbPath, sqlQuery];
        console.log(spatialiteBinPath);
        console.log(args);
        return child_process.spawn(spatialiteBinPath, args);
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
            "-v", tableName + "_net",
            "--oneway-tofrom", "oneway_tofrom",
            "--oneway-fromto", "oneway_fromto",
            "--overwrite-output"];
        console.log(spatialliteVirtualNetBin);
        console.log(args);
        return child_process.spawn(spatialliteVirtualNetBin, args);

    }
    update() {
        return new Promise((resolve, reject) => {
            let malhaClear = this.clearNetwork();
            malhaClear.on('close', (status) => {
                if (status == 0) {
                    // Process returned OK
                    // Now, we'll create the network
                    let malhaCreation = this.createBasicNet("malha");
                    
                    malhaCreation.on('close', (status) => {
                        if (status == 0) {
                            // Process returned OK
                            // Now, we'll create the routing network
                            let malhaVirtualNetwork = this.createVirtualNetwork("malha");
                            malhaVirtualNetwork.on('close', (statusNet) => {
                                // Ok, now we'll copy the updated OSM file to the existing one
                                let userDataPath = app.getPath('userData');
                                let dstFile = path.join(userDataPath, "malha.osm");

                                try {
                                    fs.copySync(this.newOSMFile, dstFile);
                                    console.log("NOVO ARQUIVO DA MALHA SALVO EM: ", dstFile);
                                    resolve(dstFile)
                                } catch (err) {
                                    reject(err);
                                }
                            });

                            malhaVirtualNetwork.stdout.on('data', (data) => {
                                console.log(`stdout: ${data}`);
                            });

                            malhaVirtualNetwork.stderr.on('data', (data) => {
                                console.error(`stderr: ${data}`);
                            });

                        } else {
                            reject("Erro ao tentar criar a malha");
                        }
                    });

                    malhaCreation.stdout.on('data', (data) => {
                        console.log(`stdout: ${data}`);
                    });

                    malhaCreation.stderr.on('data', (data) => {
                        console.error(`stderr: ${data}`);
                    });
                } else {
                    reject("Erro ao tentar limpar a malha da base de dados")
                }
            });

            malhaClear.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
            });

            malhaClear.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
            });
        });
    }
}

module.exports = MalhaUpdate;