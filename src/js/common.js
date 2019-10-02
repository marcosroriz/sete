// IPC
const { ipcRenderer } = require('electron');

// Bibliotecas Básicas do JS
window.$ = window.jQuery = require("jquery");
window.Tether = require("tether");
window.Bootstrap = require("bootstrap");
require("jquery-validation");
require("jquery-mask-plugin");
require("sweetalert");
require("moment");

// Arquivo de configuração local
const Store = require("electron-store");
const userconfig = new Store();

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