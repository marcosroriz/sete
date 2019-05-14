const electron = require("electron");
const { app, BrowserWindow, ipcMain } = electron;
const path = require("path");
// const ImportarEscolasCenso = require("./js/importar_escolas_censo");
// const knex = require('knex')({
//   client: 'sqlite3',
//   connection: {
//     filename: path.join(__dirname, "db", "local.db"),
//   },
//   useNullAsDefault: true
// });

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function (command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, { detached: true });
    } catch (error) { }

    return spawnedProcess;
  };

  const spawnUpdate = function (args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
};

handleSquirrelEvent();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let entryWindow;

const createEntryWindow = () => {
  // Create the entry window.
  entryWindow = new BrowserWindow({
    width: 800,
    height: 600,
    backgroundThrottling: false,
    show: false
  });

  // and load the entry.html of the app.
  //entryWindow.loadURL(`file://${__dirname}/entry.html`);
  entryWindow.loadURL(`file://${__dirname}/cadastrar_frota.html`);

  // Open the DevTools.
  entryWindow.webContents.openDevTools();

  entryWindow.on("ready-to-show", () => {
    entryWindow.maximize();
    entryWindow.show();
  });

  // Emitted when the window is closed.
  entryWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    entryWindow = null;
  });

  // let censoPath = path.join(__dirname, "db", "52.csv");
  // let importarescolas = new ImportarEscolasCenso(censoPath, 52, 5201108)
  // importarescolas.parse((results) => {
  //   console.log(results);

  //   knex.batchInsert("Escolas", results, 20)
  //     .then(function () {
  //       console.log("BATCH INSERT");
  //     })
  //     .catch(function (error) {
  //       console.log("ERROR");
  //       console.error(error);
  //     });

  //   /*
  //   results.data.forEach((escola) => {
  //     console.log(escola["MEC_NO_ENTIDADE"]);
  //     knex("Escolas").insert(escola).thenReturn().catch(function(err) {
  //       console.log("-------------")
  //       console.error(err)
  //       console.log(escola["MEC_CO_ENTIDADE"]);
  //     })
  //   });*/
  // });

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
  if (entryWindow === null) {
    createEntryWindow();
  }
});

