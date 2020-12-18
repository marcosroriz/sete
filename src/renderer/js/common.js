// common.js
// Este arquivo contém imports e rotinas comuns a todas as telas do software
// Aqui é importado (biblioteca) e definido (funções): 
// - bibliotecas do Electron
// - funções de manipulação de arquivo (fs)
// - funções de navegação do sistema de arquivo (path/userData)
// - funções de navegação interna do sete (dashboard)
// - bibliotecas do jQuery
// - funções para criar notificações (erro, pergunta, etc) com SweetAlert2
// - funções que retornam as opções comuns dos wizards e de validação dos formulários

// Imports Principais do Electron
var electron = require('electron');
var { ipcRenderer, remote, shell } = electron;
var app = remote.app;
var dialog = remote.dialog;
var win = remote.getCurrentWindow();
var versao = app.getVersion();

// Imports de I/O do NodeJS
var fs = require("fs-extra");

// Imports de biblioteca de caminhos (para acessar e navegar no sistema de arquivos)
// app.getPath retorna a pasta do SO que armazina os dados de configuração do app
var path = require("path");
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
const { debug } = require('console');

// Variáveis Basicas
var appTitle = "SETE - Software Eletrônico de Gestão do Transporte Escolar"
var userData = {};

// Variáveis globais utilizadas para navegação
var lastPage = "./dashboard-main.html";
var currentPage = "./dashboard-main.html";

// Função genérica para relatar erros
var errorFn = (msg, err = "", title = "Ops... tivemos um problema!") => {
    if (err != "") {
        msg = msg + "\n Caso o erro persista, informe a seguinte mensagem para a equipe de suporte (cecateufg@gmail.com): \n" + err
    }
    Swal2.fire({
        title: title,
        text: msg,
        icon: "error",
        type: "error",
        confirmButtonText: "Fechar"
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

// Função genérica para criar um diálogo de confirmação de exclusão
var confirmDialog = (msgTitle, msgDesc, buttonDesc = "Sim, remover") => {
    return Swal2.fire({
        title: msgTitle,
        text: msgDesc,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        cancelButtonText: "Cancelar",
        confirmButtonText: buttonDesc
    })
}

// Função genérica para crair um dialogo que questiona se o usuário tem certeza
var goaheadDialog = (msgTitle, msgDesc) => {
    return Swal2.fire({
        title: msgTitle,
        text: msgDesc,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        cancelButtonText: "Cancelar",
        confirmButtonText: 'Sim'
    })
}

// Função genérica para criar um diálogo de cancelamento de edição
var cancelDialog = (msgTitle = "Cancelar Edição?", 
                    msgDesc = "Se você cancelar nenhum alteração será feita.") => {
    return Swal2.fire({
        title: msgTitle,
        text: msgDesc,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        cancelButtonText: "Voltar a editar",
        confirmButtonText: 'Sim, cancelar'
    })
}

// Função genérica para criar um diálogo de sucesso
var successDialog = (msgTitle = "Parabéns!", 
                     msgDesc = "A operação ocorreu com sucesso.") => {
    return Swal2.fire({
        title: msgTitle,
        text: msgDesc,
        icon: "success",
        button: "Fechar"
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

// Função que converte uma lista em um mapa
function convertListToMap(list, campoID = "ID") {
    let mapa = new Map()
    list.forEach(l => mapa.set(String(l[campoID]), l))

    return mapa;
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
function configWizardBasico(idElemento, usarValidador = true) {
    return {
        'tabClass': 'nav nav-pills',
        'nextSelector': '.btn-next',
        'previousSelector': '.btn-back',

        onNext: function (tab, navigation, index) {
            if (usarValidador) {
                var $valid = $(idElemento).valid();
                if (!$valid) {
                    validadorFormulario.focusInvalid();
                    return false;
                } else {
                    window.scroll(0, 0);
                }
            } else {
                window.scroll(0, 0);
                return true;
            }
        },

        onTabClick: function (tab, navigation, index) {
            if (usarValidador) {
                var $valid = $(idElemento).valid();
                if (!$valid) {
                    return false;
                } else {
                    window.scroll(0, 0);
                    return true;
                }
            } else {
                window.scroll(0, 0);
                return true;
            }
        },

        onTabShow: function (tab, navigation, index) {
            var $total = navigation.find('li').length;
            var $current = index + 1;
    
            var $wizard = navigation.closest('.card-wizard');
    
            // If it's the last tab then hide the last button and show the finish instead
            if ($current >= $total) {
                $($wizard).find('.btn-next').hide();
                $($wizard).find('.btn-finish').show();
            } else {
                $($wizard).find('.btn-next').show();
    
                $($wizard).find('.btn-finish').hide();
            }
        }
    }
}