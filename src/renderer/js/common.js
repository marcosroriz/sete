// Imports Principais
var electron = require('electron');
var { ipcRenderer, remote, shell } = electron;
var app = remote.app;
var dialog = remote.dialog;
var win = remote.getCurrentWindow();

// Caminhos Comuns
var userDataDir = app.getPath('userData');

// Bibliotecas Básicas do JS
window.$ = window.jQuery = require("jquery");
window.Tether = require("tether");
window.Bootstrap = require("bootstrap");
require("jquery-validation");
require("jquery-mask-plugin");
var moment = require('moment');
var swal = require("sweetalert");
var Swal2 = require("sweetalert2");
var htmlToImage = require("html-to-image");

// Variáveis Basicas
var appTitle = "SETE - Software Eletrônico de Gestão do Transporte Escolar"
var userData = {};

// Arquivo de configuração local
var Store = require("electron-store");
var userconfig = new Store();

// Variáveis globais utilizadas para navegação
var lastPage = "./dashboard-main.html";
var currentPage = "./dashboard-main.html";

// Função genérica para relatar erros
var errorFn = (msg, err) => {
    Swal2.fire({
        title: "Ops... tivemos um problema!",
        text: msg + "\n Caso o erro persista, informe a seguinte mensagem para a equipe de suporte (cecateufg@gmail.com): \n" + err,
        icon: "error",
        type: "error",
        button: "Fechar"
    });
}

// Função de Navegação Dash
function navigateDashboard(target) {
    lastPage = currentPage;
    currentPage = target;
    $("#content").load(target);
    window.scrollTo(0, 0);
}

// Função de Navegação do Software
function navigatePage(target) {
    document.location.href = target;
}