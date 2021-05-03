// Core Imports
const electron = require("electron");
const { app, BrowserWindow, ipcMain, shell } = electron;
const path = require("path");
const fs = require("fs-extra");

// Basic app config (variables)
var Store = require('electron-store');
var appconfig = new Store();

// Database Creator
const dbPath = path.join(app.getPath('userData'), "db", "local.db");
const rawDBPath = path.join(__dirname, "db", "local.db");

if (!fs.existsSync(dbPath)) {
    fs.copySync(rawDBPath, dbPath);
    console.log("COPIANDO A BASE DE DADOS DE: ", rawDBPath)
    console.log("PARA: ", dbPath)
} else {
    console.log("USANDO BASE DE DADOS:", dbPath)
}

// Malha Creator
const malhaTemplatePath = path.join(app.getPath('userData'), "db", "osm_road_template");
const rawMalhaTemplatePath = path.join(__dirname, "db", "osm_road_template");

if (!fs.existsSync(malhaTemplatePath)) {
    fs.copySync(rawMalhaTemplatePath, malhaTemplatePath);
    console.log("COPIANDO O TEMPLATE DE MALHA DE: ", rawMalhaTemplatePath)
    console.log("PARA: ", malhaTemplatePath)
} else {
    console.log("USANDO BASE DE DADOS:", malhaTemplatePath)
}

const sqliteDB = require("knex")({
    client: "sqlite3",
    connection: {
        filename: dbPath
    },
    useNullAsDefault: true
});
const spatialite = require("spatialite");
const spatialiteDB = new spatialite.Database(dbPath);

// Malha Update
const MalhaUpdate = require("./main/malha/malha-update.js");

//Carrega módulo de configuração do Proxy
const Proxy = require("./main/proxy/proxy.js");

// Route Optimization
const RouteOptimization = require("./main/routing/routing-optimization.js");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let appWindow;

const createEntryWindow = () => {
    // Create the entry window.
    appWindow = new BrowserWindow({
        "width": 1250,
        "height": 650,
        "minWidth": 1250,
        "minHeight": 650,
        "backgroundThrottling": false,
        "show": false,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            enableRemoteModule: true
        }
    });

    // hide menubar
    appWindow.setMenuBarVisibility(false);

    // now load the entry.html of the app.
    let usingProxy = appconfig.get("PROXY_USE");
    if (!usingProxy) {
        appWindow.loadURL(`file://${__dirname}/renderer/login-view.html`);
    } else {
        let proxyType = appconfig.get("PROXY_TYPE");
        let proxyAddress = appconfig.get("PROXY_ADDRESS");
        let proxyPort = appconfig.get("PROXY_PORT");
        let proxyString = `${proxyType}://${proxyAddress}:${proxyPort},direct://`
        console.log("PROXY STRING", proxyString)

        appWindow.webContents.session.setProxy({ proxyRules: proxyString }).then(() => {
            appWindow.loadURL(`file://${__dirname}/renderer/login-view.html`);
        });
    }

    // Open the DevTools.
    // appWindow.webContents.openDevTools();

    // Prevent External Navigation
    appWindow.webContents.on("will-navigate", (e, url) => {
        console.log("WILL-NAVIGATE", url);

        if (url.includes("censobasico.inep.gov")) {
            shell.openExternal(url);
            e.preventDefault();
        } else if (!(url.includes("file:"))) {
            e.preventDefault();
        }
    });

    appWindow.webContents.on('new-window', function (e, url) {
        console.log('NEW-WINDOW', url)
        e.preventDefault();
        shell.openExternal(url);
    });


    appWindow.on("ready-to-show", () => {
        appWindow.maximize();
        appWindow.show();
    });

    // Emitted when the window is closed.
    appWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        appWindow = null;
    });
};

// Desabilita aceleração de hardware (vga) para evitar tela branca
app.disableHardwareAcceleration();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

// Evento chamado quando precisamos logar o proxy
app.on('login', (event, webContents, details, authInfo, callback) => {
    event.preventDefault()
    console.log(authInfo)

    let proxyTemAutenticacao = appconfig.get("PROXY_HASAUTENTICATION");
    if (proxyTemAutenticacao) {
        let proxyUser = appconfig.get("PROXY_USER");
        let proxyPassword = appconfig.get("PROXY_PASSWORD");
        callback(proxyUser, proxyPassword);
    }
})

app.on('ready', createEntryWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    routeOptimizer.quit();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (appWindow === null) {
        createEntryWindow();
    }
});

let routeOptimizer = new RouteOptimization(app, dbPath);

// Route Generation Algorithm
ipcMain.on("start:route-generation", (event, routingArgs) => {
    let cachedODMatrix = appconfig.get("OD", {
        nodes: {}, dist: {}, cost: {}
    });

    routeOptimizer.optimize(cachedODMatrix, routingArgs)
})

// Malha Update
ipcMain.on("start:malha-update", (event, newOSMFile) => {
    let malha = new MalhaUpdate(newOSMFile, dbPath);
    malha.update()
        .then((updateData) => {
            appWindow.webContents.send("end:malha-update", true);
        })
        .catch((err) => {
            appWindow.webContents.send("end:malha-update", false);
        })
});

// Send Answer Update
app.on("finish-update", (event, arg) => {
    console.log(arg);
});

app.on("done:route-generation", (res) => {
    // Set new cache
    let newODCache = res[0];
    appconfig.set("OD", newODCache);

    // Send generated routes
    let optRoutes = res.slice(1);
    appWindow.webContents.send("end:route-generation", optRoutes);
})

app.on("error:route-generation", (err) => {
    appWindow.webContents.send("error:route-generation", err);
})