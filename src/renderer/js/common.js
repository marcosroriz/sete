// Imports Principais
const electron = require('electron');
const { ipcRenderer, remote } = electron;
const app = remote.app;
const dialog = remote.dialog;
const win = remote.getCurrentWindow();

// Caminhos Comuns
const userDataDir = app.getPath('userData');

// Bibliotecas Básicas do JS
window.$ = window.jQuery = require("jquery");
window.Tether = require("tether");
window.Bootstrap = require("bootstrap");
require("jquery-validation");
require("jquery-mask-plugin");
require("moment");
const swal = require("sweetalert");
const Swal2 = require("sweetalert2");
const htmlToImage = require("html-to-image");

// Variáveis Basicas
const appTitle = "SETE - Software de Gestão do Transporte Escolar"

// Arquivo de configuração local
const Store = require("electron-store");
const userconfig = new Store();

// Variáveis globais utilizadas para navegação
var lastPage = "dashboard";
var currentPage = "dashboard";

// Função de Navegação Dash
function navigateDashboard(target) {
    lastPage = currentPage;
    currentPage = target;
    $("#content").load(target);
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