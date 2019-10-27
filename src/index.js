// Core Imports
const electron = require("electron");
const { app, BrowserWindow, ipcMain } = electron;
const path = require("path");

// Installer Check
const squirrel = require("./main/installer/squirrel.js");
squirrel();

// Database Creator
const dbPath = path.join(__dirname, "db", "local.db");
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
        "show": false
    });

    // and load the entry.html of the app.
    //entryWindow.loadURL(`file://${__dirname}/entry.html`);
    appWindow.loadURL(`file://${__dirname}/renderer/dashboard.html`);

    // Open the DevTools.
    appWindow.webContents.openDevTools();

    // Prevent External Navigation
    appWindow.webContents.on("will-navigate", (e, url) => {
        console.log(e);
        console.log(url);
        e.preventDefault();
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

// app.disableHardwareAcceleration();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createEntryWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
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

// Route Generation Algorithm
ipcMain.on("start:route-generation", (event, routingArgs) => {
    new RouteOptimization(routingArgs, spatialiteDB).optimize().then((optRoutes) => {
        console.log("aqui");
        console.log("aqui");
        console.log("aqui");
        appWindow.webContents.send("end:route-generation", optRoutes);      
    });
})

// Malha Update
ipcMain.on("start:malha-update", (event, newOSMFile) => {
    let malha = new MalhaUpdate(newOSMFile, dbPath, sqliteDB);
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
    console.log("cheguei aqui");
    console.log(arg);
});
