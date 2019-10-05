// Core Imports
const electron = require("electron");
const { app, BrowserWindow, ipcMain } = electron;
const path = require("path");

// Installer Check
const squirrel = require("./main/installer/squirrel.js");
squirrel();

// Optimization
const ClarkeWrightSchoolBusRouting = require("./main/routing/clarke-wright-schoolbus-routing.js");
const TwoOpt = require("./main/routing/twoopt.js");
const SchoolBusKMeans = require("./main/routing/kmeans.js");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let appWindow;

const createEntryWindow = () => {
  // Create the entry window.
  appWindow = new BrowserWindow({
    width: 800,
    height: 600,
    backgroundThrottling: false,
    show: false
  });

  // and load the entry.html of the app.
  //entryWindow.loadURL(`file://${__dirname}/entry.html`);
  appWindow.loadURL(`file://${__dirname}/renderer/dashboard.html`);

  // Open the DevTools.
  appWindow.webContents.openDevTools();

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
ipcMain.on("start:route-generation", (event, arg) => {
  console.time("kmeans");
  let kmeans = new SchoolBusKMeans(arg);
  let partitions = kmeans.partition(arg["numVehicles"]);
  console.timeEnd("kmeans");

  console.time("simulacao");
  let schoolBusRouter = new ClarkeWrightSchoolBusRouting(arg);
  let busRoutes = schoolBusRouter.route();
  console.timeEnd("simulacao");

  console.time("2-opt");
  let optimizedRoutes = new Array();
  busRoutes.forEach((r) => {
    let optRoute = new TwoOpt(r, schoolBusRouter.graph).optimize();
    optimizedRoutes.push(optRoute);
  });
  console.timeEnd("2-opt");

  let routesJSON = new Array();
  optimizedRoutes.forEach((r) => {
    routesJSON.push(r.toPlainJSON(schoolBusRouter.graph));
  });

  appWindow.webContents.send("end:route-generation", routesJSON);
})

