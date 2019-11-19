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
var appTitle = "SETE - Software de Gestão do Transporte Escolar"

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
        text: msg + " Feche e abra o software novamente. \n" + err,
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

var identity_router = null;
var identity_object_id = id;

function includeHTML() {
    var z, i, elmnt, file, xhttp;
    /* Loop through a collection of all HTML elements: */
    z = document.getElementsByTagName("*");
    for (i = 0; i < z.length; i++) {
        elmnt = z[i];
        /*search for elements with a certain atrribute:*/
        file = elmnt.getAttribute("include-html");
        if (file) {
            /* Make an HTTP request using the attribute value as the file name: */
            xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4) {
                    if (this.status == 200) { elmnt.innerHTML = this.responseText; }
                    if (this.status == 404) { elmnt.innerHTML = "Page not found."; }
                    /* Remove the attribute, and call this function once more: */
                    elmnt.removeAttribute("include-html");
                    includeHTML();
                }
            }
            xhttp.open("GET", file, true);
            xhttp.send();
            /* Exit the function: */
            return;
        }
    }
}