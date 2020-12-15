// Imports Principais do Electron
var electron = require('electron');
var { ipcRenderer, remote, shell } = electron;
var app = remote.app;
var dialog = remote.dialog;
var win = remote.getCurrentWindow();
var versao = app.getVersion();

// Imports Básicos do NodeJS
var fs = require("fs-extra");

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

// Função genérica para relatar carregamento
var loadingFn = (msgTitle, msgDesc = "Aguarde, estamos processando...") => {
    return Swal2.fire({
        title: msgTitle,
        imageUrl: "img/icones/processing.gif",
        closeOnClickOutside: false,
        allowOutsideClick: false,
        showConfirmButton: false,
        text: msgDesc
    })
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

// Estrutura básica de validação dos formulários
function configMostrarResultadoValidacao() {
    return {
        highlight: function (element) {
            $(element).closest('.form-group').removeClass('has-success').addClass('has-error');
            $(element).closest('.form-check').removeClass('has-success').addClass('has-error');
        },
        success: function (element) {
            $(element).closest('.form-group').removeClass('has-error').addClass('has-success');
            $(element).closest('.form-check').removeClass('has-error').addClass('has-success');
        },
        errorPlacement: function (error, element) {
            console.log(error);
            console.log(element);
            $(element).closest('.form-group').append(error).addClass('has-error');
        }
    }
}

// Estrutura básica dos formulários wizard
function configWizardBasico(idElemento) {
    return {
        'tabClass': 'nav nav-pills',
        'nextSelector': '.btn-next',
        'previousSelector': '.btn-back',

        onNext: function (tab, navigation, index) {
            var $valid = $(idElemento).valid();
            if (!$valid) {
                validadorFormulario.focusInvalid();
                return false;
            } else {
                window.scroll(0, 0);
            }
        },

        onTabClick: function (tab, navigation, index) {
            var $valid = $(idElemento).valid();
            if (!$valid) {
                return false;
            } else {
                window.scroll(0, 0);
                return true;
            }
        },
    }
}