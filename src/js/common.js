// Bibliotecas Básicas
window.$ = window.jQuery = require("jquery");
window.Tether = require("tether");
window.Bootstrap = require("bootstrap");
require("jquery-validation");
require("jquery-mask-plugin");
require("sweetalert");

// Arquivo de configuração local
const Store = require("electron-store");
const userconfig = new Store();
