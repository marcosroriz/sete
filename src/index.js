/**
 * SETE Desktop: index.js
 * 
 * Ponto de entrada da aplicação desktop.
 * Primeiramente, instanciamos o electron e criamos o processo main e renderer.
 * Logo em seguida, realiza-se a instanciação da base de dados. 
 * Cria-se a janela do navegador no processo renderer e instancia-se a parte web.
 * Por fim, cria-se os listeners de IPC e o worker para a parte de roteirização.
 */

// Imports principais
const electron = require("electron");
const { app, BrowserWindow, ipcMain, shell } = electron;
const path = require("path");
const fs = require("fs-extra");

// Arquivo de configuração (variáveis básicas)
const Store = require("electron-store");
var appconfig = new Store();

// Bibliotecas para plotar logo do SETE e informações do sistema
const figlet = require("figlet");

// Plotando dados do sistema e SETE
console.log(figlet.textSync("SETE"))
console.log("SETE".padEnd(30), app.getVersion())
console.log("SISTEMA OPERACIONAL".padEnd(30), process.platform)
console.log("VERSAO DO SISTEMA OPERACIONAL".padEnd(30), process.getSystemVersion())
console.log("ARQUITETURA CPU".padEnd(30), process.arch)

////////////////////////////////////////////////////////////////////////////////
// BANCO DE DADOS
////////////////////////////////////////////////////////////////////////////////

// Path do banco de dados (dbPath), banco padrão (rawDBPath)
const dbPath = path.join(app.getPath('userData'), "db", "local.db");
const rawDBPath = path.join(__dirname, "db", "local.db");

// Verificando existência da base de dados
if (!fs.existsSync(dbPath)) {
    fs.copySync(rawDBPath, dbPath);
    console.log("COPIANDO A BASE DE DADOS DE: ", rawDBPath)
    console.log("PARA: ", dbPath)
} else {
    console.log("BASE SQLITE".padEnd(30), dbPath)
}

// Verificação se existe o template para criar a base de dados roteirizável
const malhaTemplatePath = path.join(app.getPath('userData'), "db", "osm_road_template");
const rawMalhaTemplatePath = path.join(__dirname, "db", "osm_road_template");

if (!fs.existsSync(malhaTemplatePath)) {
    fs.copySync(rawMalhaTemplatePath, malhaTemplatePath);
    console.log("COPIANDO O TEMPLATE DE MALHA DE: ", rawMalhaTemplatePath)
    console.log("PARA: ", malhaTemplatePath)
} else {
    console.log("TEMPLATE OSM".padEnd(30), malhaTemplatePath)
}

// Instanciação das bases de dados
const sqliteDB = require("knex")({
    client: "sqlite3",
    connection: {
        filename: dbPath
    },
    useNullAsDefault: true
});
const spatialite = require("spatialite");
const spatialiteDB = new spatialite.Database(dbPath);

////////////////////////////////////////////////////////////////////////////////
// Criação do navegador e processo renderer
////////////////////////////////////////////////////////////////////////////////

// Ref global para a janela, senão o garbage colector apaga a janela
let appWindow;

const createEntryWindow = () => {
    // Cria a janela do navegador
    appWindow = new BrowserWindow({
        "width": 1250,
        "height": 450,
        "minWidth": 1250,
        "minHeight": 450,
        "backgroundThrottling": false,
        "show": false,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            enableRemoteModule: true
        }
    });

    // Desabilita e esconde menu
    // appWindow.setMenu(null);
    appWindow.setMenuBarVisibility(false);

    // Agora carrega a página de login do SETE
    // Vamos verificar se estamos usando proxy
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

    // Abre DevTools.
    // appWindow.webContents.openDevTools();

    // Desabilita navegação externa
    appWindow.webContents.on("will-navigate", (e, url) => {
        console.log("WILL-NAVIGATE", url);

        if (url.includes("censobasico.inep.gov")) {
            shell.openExternal(url);
            e.preventDefault();
        } else if (!(url.includes("file:"))) {
            e.preventDefault();
        }
    });

    // Bloqueia tentativa de abrir nova janela, redireciona para navegador do sistema
    appWindow.webContents.on('new-window', function (e, url) {
        console.log('NEW-WINDOW', url)
        e.preventDefault();
        shell.openExternal(url);
    });

    // Mostra o navegador quando o mesmo terminar de renderizar a página inicial
    appWindow.on("ready-to-show", () => {
        appWindow.maximize();
        appWindow.show();
    });

    // Tratamento quando o usuário fecha a janela do navegador
    appWindow.on('closed', () => {
        // Dereferencia a variável que armazena o navegador
        appWindow = null;
    });
};

////////////////////////////////////////////////////////////////////////////////
// Rotinas do processo principal
////////////////////////////////////////////////////////////////////////////////

// Rotina para atualização da malha
const MalhaUpdate = require("./main/malha/malha-update.js");

// Rotina para otimização da malha
const RouteOptimization = require("./main/routing/routing-optimization.js");

// Carrega módulo de configuração do Proxy
const Proxy = require("./main/proxy/proxy.js");

////////////////////////////////////////////////////////////////////////////////
// Handlers para eventos do Electron.
// Estes serão chamados quando o node terminar de carregar o electron
////////////////////////////////////////////////////////////////////////////////

// Desabilita aceleração de hardware (vga) para evitar tela branca
app.disableHardwareAcceleration();

// Evento chamado quando precisamos logar utilizando o proxy
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

// Evento que será chamado quando o electron terminou de carregar
// Neste caso, redirecionamos para a função de criação do processo renderer
app.on('ready', createEntryWindow);

// Evento quando todas as janelas tiverem terminadas
app.on('window-all-closed', () => {
    // No mac é comum a app ficar na dock até que o usuário explicitamente feche ela
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

 // Evento gerado quando app vai terminar
 app.on("will-quit", () => {
    routeOptimizer.quit();
 })

// Evento chamado quando clicamos no ícone do app
app.on('activate', () => {
    // No mac é comum recriar o aplicativo quando o ícone está na dock
    if (appWindow === null) {
        routeOptimizer = new RouteOptimization(app, dbPath);
        createEntryWindow();
    }
});

////////////////////////////////////////////////////////////////////////////////
// Handlers para eventos do SETE
////////////////////////////////////////////////////////////////////////////////

// Worker que vai lidar com a parte de roteirização
let routeOptimizer = new RouteOptimization(app, dbPath);

// Evento para gerar rotas
ipcMain.on("start:route-generation", (event, routingArgs) => {
    let cachedODMatrix = appconfig.get("OD", {
        nodes: {}, dist: {}, cost: {}
    });

    routeOptimizer.optimize(cachedODMatrix, routingArgs)
})

// Evento chamado pelo nosso worker quando ele terminar de gerar a rota
app.on("done:route-generation", (res) => {
    // Set new cache
    let newODCache = res[0];
    appconfig.set("OD", newODCache);

    // Send generated routes
    let optRoutes = res.slice(1);
    appWindow.webContents.send("end:route-generation", optRoutes);
})

// Evento chamado pelo nosso worker quando ele encontra um erro ao gerar a rota
app.on("error:route-generation", (err) => {
    appWindow.webContents.send("error:route-generation", err);
})

// Evento para atualizar malha
ipcMain.on("start:malha-update", (event, newOSMFile) => {
    let malha = new MalhaUpdate(newOSMFile, dbPath);
    malha.update()
    .then((updateData) => {
        appconfig.delete("OD");
        appWindow.webContents.send("end:malha-update", true);
    })
    .catch((err) => {
        appWindow.webContents.send("end:malha-update", false);
    })
});
