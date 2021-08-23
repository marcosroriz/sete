/**
 * SETE Desktop: main/malha/malha-update.js
 * 
 * Rotina para fazer a atualização da malha do município no SETE. 
 * A importação da malha é feita utilizando os dados do OpenStreetMap.
 * Para isso, a rotina manipula os binários da biblioteca Spatialite para
 * limpar, importar e criar a base de dados roteirizável.
 */


// Imports principais
const { app } = require("electron");
const path = require("path");
const fs = require("fs-extra");
const child_process = require("child_process");

/**
 * Malha Update
 * Esta classe encapsula as funções para limpar, carregar e reconstruir a malha.
 */
class MalhaUpdate {
    /**
     * Construtor
     * @param osmFilePath caminho para o arquivo OSM
     * @param dbPath caminho para a base de dados sqlite
     */
    constructor(osmFilePath, dbPath) {
        this.newOSMFile = osmFilePath;
        this.dbPath = dbPath;
    }

    /**
     * Função que limpa a base de dados
     * 
     * @returns chamada ao binário para limpar a base sqlite
     */
    clearNetwork() {
        let binario = "spatialite.exe";
        let envVariables = "";
        
        if (process.platform == "linux") {
            binario = "spatialite";
            envVariables = ".:" + path.join(app.getAppPath(), "bin");
        } else if (process.platform == "win32") {
            binario = "spatialite.exe";
        } else {
            binario = "spatialite_mac";
            envVariables = ".:" + path.join(app.getAppPath(), "bin");
        }

        let spatialiteBinPath = path.join(app.getAppPath(), "..", "bin", binario);
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
        return child_process.spawn(spatialiteBinPath, args, {
                	env: { 
        		"LD_LIBRARY_PATH": envVariables
        	}
	});
    }

    /**
     * Carrega a rede do OSM na base de dados
     * 
     * @param {string} tabela nome da tabela que será criada no sqlite
     * @returns chamada ao binário para carregar a base a partir do dado OSM
     */
    createBasicNet(tabela) {
        let binario = "spatialite_osm_net.exe";
        let envVariables = "";
        
        if (process.platform == "linux") {
            binario = "spatialite_osm_net";
            envVariables = ".:" + path.join(app.getAppPath(), "bin");
        } else if (process.platform == "win32") {
            binario = "spatialite_osm_net.exe";
        } else {
            binario = "spatialite_osm_net_mac";
            envVariables = ".:" + path.join(app.getAppPath(), "bin");
        }

        let spatialiteNetBinPath = path.join(app.getAppPath(), "..", "bin", binario);
        let templateFile = path.join(path.dirname(this.dbPath), "osm_road_template");
        let args = [
            "-o", this.newOSMFile,
            "-d", this.dbPath,
            "-T", tabela,
            "-tf", templateFile
        ];
        console.log(spatialiteNetBinPath);
        console.log(args);
        return child_process.spawn(spatialiteNetBinPath, args, {
                	env: { 
        		"LD_LIBRARY_PATH": envVariables
        	}
	});
    }

    /**
     * Função que cria a base de roteirização no sqlite
     * 
     * @param {string} tabela a tabela que será utilizada para criar as rotas
     * @returns chamada ao binário para construir a rede a partir da base carregada
     */
    createVirtualNetwork(tabela) {
        let binario = "spatialite_network.exe";
        let envVariables = "";
        if (process.platform == "linux") {
            binario = "spatialite_network";
            envVariables = ".:" + path.join(app.getAppPath(), "bin");
        } else if (process.platform == "win32") {
            binario = "spatialite_network.exe";
        } else {
            binario = "spatialite_network_mac";
            envVariables = ".:" + path.join(app.getAppPath(), "bin");
        }

        let spatialliteVirtualNetBin = path.join(app.getAppPath(), "..", "bin", binario);
        let args = [
            "-d", this.dbPath,
            "-T", tabela,
            "-f", "node_from",
            "-t", "node_to",
            "-g", "geometry",
            "-n", "name",
            "-c", "cost",
            "-o", tabela + "_data",
            "-v", tabela + "_net",
            "--oneway-tofrom", "oneway_tofrom",
            "--oneway-fromto", "oneway_fromto",
            "--overwrite-output"
        ];
        console.log(spatialliteVirtualNetBin);
        console.log(args);
        return child_process.spawn(spatialliteVirtualNetBin, args, {
        	env: { 
        		"LD_LIBRARY_PATH": envVariables
        	}
	});
    }


    /**
     * Função que engloba as tarefas de atualização da malha
     * 
     * @returns {Promise} uma promessa para atualizar a malha
     */
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
