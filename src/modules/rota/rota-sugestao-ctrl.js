// Lista de Imports
// IPC para processar algoritmo
const { ipcRenderer } = require('electron');

// Config View
var mapaConfig = novoMapaOpenLayers("mapaRotaSugestaoConfig", -16.8152409, -49.2756642);

// TODO: Passar isso para qualquer tipo de mapa no arquivo de js comum
window.onresize = function () {
    setTimeout(function () { mapaConfig["map"].updateSize(); }, 200);
}

// Pontos de Parada
function getAlunos() {
    let a = new Array();
    a.push({ key: 1, lat: -16.79614, lng: -49.18946, school: "S1" });
    a.push({ key: 2, lat: -16.79705, lng: -49.18674, school: "S1" });
    a.push({ key: 3, lat: -16.7997, lng: -49.18377, school: "S1" });
    a.push({ key: 4, lat: -16.80014, lng: -49.18736, school: "S1" });
    // // a[5] = [-16.80311, -49.1802, "S2"];
    a.push({ key: 6, lat: -16.80161, lng: -49.18593, school: "S1" });
    // // a[7] = [-16.85038, -49.1817, "S2"];
    a.push({ key: 8, lat: -16.8558, lng: -49.17038, school: "S1" });
    a.push({ key: 9, lat: -16.85691, lng: -49.18187, school: "S1" });
    // // a.push({ key: 10, lat: -16.85995, lng: -49.17206, school: "S2" });
    // // a.push({ key: 11, lat: -16.8694, lng: -49.17141, school: "S2" });
    // // a.push({ key: 12, lat: -16.8698, lng: -49.1936, school: "S2" });
    a.push({ key: 13, lat: -16.87182, lng: -49.20667, school: "S1" });
    a.push({ key: 14, lat: -16.87517, lng: -49.21696, school: "S1" });
    a.push({ key: 15, lat: -16.88314, lng: -49.21585, school: "S1" });
    a.push({ key: 16, lat: -16.88006, lng: -49.22106, school: "S1" });
    a.push({ key: 16, lat: -16.88006, lng: -49.22106, school: "S1" });
    // // // a.push({ key: 17, lat: -16.80018, lng: -49.12808, school: "S2" });
    a.push({ key: 18, lat: -16.80503, lng: -49.12542, school: "S1" });
    a.push({ key: 19, lat: -16.79706, lng: -49.11872, school: "S1" });
    a.push({ key: 20, lat: -16.79731, lng: -49.11134, school: "S1" });
    // // a.push({ key: 21, lat: -16.78884, lng: -49.1431, school: "S2" });
    // // a.push({ key: 22, lat: -16.79003, lng: -49.12976, school: "S2" });
    // // a.push({ key: 23, lat: -16.79888, lng: -49.12299, school: "S2" });
    // // a.push({ key: 24, lat: -16.91227, lng: -49.10845, school: "S2" });
    // // a.push({ key: 25, lat: -16.90915, lng: -49.1154, school: "S2" });
    // // a.push({ key: 26, lat: -16.92779, lng: -49.09266, school: "S2" });
    // // a.push({ key: 27, lat: -16.93938, lng: -49.105, school: "S2" });
    // // a.push({ key: 28, lat: -16.94552, lng: -49.13829, school: "S2" });
    // // a.push({ key: 29, lat: -16.94589, lng: -49.1257, school: "S1" });
    // // a.push({ key: 30, lat: -16.85882, lng: -49.27791, school: "S1" });
    // // a.push({ key: 31, lat: -16.86449, lng: -49.27654, school: "S2" });
    // // a.push({ key: 31, lat: -16.86449, lng: -49.27654, school: "S2" });
    // // a.push({ key: 32, lat: -16.86917, lng: -49.28418, school: "S1" });
    // // a.push({ key: 33, lat: -16.87566, lng: -49.28341, school: "S1" });
    // // a.push({ key: 34, lat: -16.87821, lng: -49.26607, school: "S1" });
    // // a.push({ key: 35, lat: -16.86935, lng: -49.32064, school: "S2" });
    // // a.push({ key: 36, lat: -16.84019, lng: -49.36664, school: "S1" });
    // // a.push({ key: 37, lat: -16.83242, lng: -49.38458, school: "S1" });
    // // a.push({ key: 38, lat: -16.83256, lng: -49.37794, school: "S1" });
    // // a.push({ key: 39, lat: -16.85186, lng: -49.38025, school: "S1" });
    // // a.push({ key: 40, lat: -16.85139, lng: -49.38933, school: "S1" });
    // // a.push({ key: 41, lat: -16.84646, lng: -49.38971, school: "S1" });
    // // a.push({ key: 42, lat: -16.85382, lng: -49.36705, school: "S1" });

    return a;
}

function getGaragens() {
    let g = new Array();
    g.push({ key: "G1", lat: -16.81651, lng: -49.25611 });

    return g;
}

function getEscolas() {
    let s = new Array();
    s.push({ key: "S1", lat: -16.82113, lng: -49.25096 });
    s.push({ key: "S2", lat: -16.82815, lng: -49.26058 });

    return s;
}

var alunos   = getAlunos();
var garagens = getGaragens();
var escolas  = getEscolas();


// Onde vamos adicionar os elementos
var vSource = mapaConfig["vectorSource"];

function drawElements(arrAlunos, arrGaragens, arrEscolas) {
    for (let i in arrAlunos) {
        let a = arrAlunos[i];
        let p = new ol.Feature({
            "geometry": new ol.geom.Point(ol.proj.fromLonLat([a["lng"], a["lat"]]))
        });
        p.setStyle(new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [12, 37],
                anchorXUnits: 'pixels',
                anchorYUnits: 'pixels',
                opacity: 1,
                src: "img/icones/aluno-marcador.png"
            })
        }));
        vSource.addFeature(p);
    }

    for (let i in arrEscolas) {
        let e = arrEscolas[i];
        let p = new ol.Feature({
            "geometry": new ol.geom.Point(ol.proj.fromLonLat([e["lng"], e["lat"]]))
        });
        p.setStyle(new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [12, 37],
                anchorXUnits: 'pixels',
                anchorYUnits: 'pixels',
                opacity: 1,
                src: "img/icones/escola-marcador.png"
            })
        }));
        vSource.addFeature(p);
    }
    for (let i in arrGaragens) {
        let g = arrGaragens[i];
        let p = new ol.Feature({
            "geometry": new ol.geom.Point(ol.proj.fromLonLat([g["lng"], g["lat"]]))
        });
        p.setStyle(new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [12, 37],
                anchorXUnits: 'pixels',
                anchorYUnits: 'pixels',
                opacity: 1,
                src: "img/icones/garagem-marcador.png"
            })
        }));
        vSource.addFeature(p);
    }

}

// Desenha elementos
drawElements(alunos, garagens, escolas);
mapaConfig["map"].getView().fit(vSource.getExtent());

// Realiza a Simulação

// Modal informando o usuário que está ocorrendo a simulação
var simModal;

// Trigger para Iniciar Simulação
function initSimulation() {
    simModal = swal({
        title: "Simulando...",
        text: "Espere um minutinho...",
        // type: "warning",
        imageUrl: "img/icones/processing.gif",
        buttons: false,
        showSpinner: true,
        closeOnClickOutside: false,
        allowOutsideClick: false,
        showConfirmButton: false
    });

    // Retorna o conjunto de alunos
    alunos   = getAlunos();
    garagens = getGaragens();
    escolas  = getEscolas();

    // Juntar dados em um objeto
    let routeGenerationInputData = {
        "maxTravDist" : $("#maxDist").val(),
        "maxTravTime" : $("#maxTime").val(),
        "optTarget"   : "maxTravDist",
        "numVehicles" : $("#numVehicles").val(),
        "maxCapacity" : $("#maxCapacity").val(),
        "garage"      : garagens,
        "stops"       : alunos,
        "schools"     : escolas,
    };

    ipcRenderer.send('route-generation', routeGenerationInputData); 
};

// Validar Formulário
var validadorFormulario = $("#wizardSugestaoRotaForm").validate({
    rules: {
        publico: {
            required: true
        },
        turno: {
            required: true
        },
        maxTime: {
            required: true,
            number: true,
            min: 0,
            max: 360
        },
        maxDist: {
            required: true,
            number: true,
            min: 0,
            max: 100
        },
        numVehicles: {
            required: true,
            number: true,
            min: 0,
            max: 1000
        },
        maxCapacity: {
            required: true,
            number: true,
            min: 0,
            max: 100
        },
    },
    messages: {
        publico: {
            required: "Por favor selecione o público alvo"
        },
        turno: {
            required: "Por favor selecione o turno dos(as) alunos(as)",
        },
        maxTime: {
            required: "Por favor informe o tempo máximo desejado para cada rota",
            min: "Por favor selecione um valor acima de 0 minutos",
            max: "Por favor selecione um valor abaixo de 360 minutos (6 horas)",
        },
        maxDist: {
            required: "Por favor informe a distância máxima percorrida por rota",
            min: "Por favor selecione um valor acima de 0 km",
            max: "Por favor selecione um valor abaixo de 100 km"
        },
        numVehicles: {
            required: "Por favor informe o número desejado (total) de veículos",
            min: "Por favor selecione um valor acima de 0 veículos",
            max: "Por favor selecione um valor abaixo de 1000 veículos",
        },
        maxTime: {
            required: "Por favor informe a capacidade máxima dos veículos",
            min: "Por favor selecione um valor acima de 0 assento",
            max: "Por favor selecione um valor abaixo de 100 assentos",
        },
    },
    highlight: function (element) {
        $(element).closest('.form-group').removeClass('has-success').addClass('has-error');
        $(element).closest('.form-check').removeClass('has-success').addClass('has-error');
    },
    success: function (element) {
        $(element).closest('.form-group').removeClass('has-error').addClass('has-success');
        $(element).closest('.form-check').removeClass('has-error').addClass('has-success');
    },
    errorPlacement: function (error, element) {
        $(element).closest('.form-group').append(error).addClass('has-error');
    }
});

$('.card-wizard').bootstrapWizard({
    'tabClass': 'nav nav-pills',
    'nextSelector': '.btn-next',
    'previousSelector': '.btn-back',

    onNext: function (tab, navigation, index) {
        var $valid = $('#wizardSugestaoRotaForm').valid();
        if (!$valid) {
            validadorFormulario.focusInvalid();
            return false;
        } else {
            window.scroll(0, 0);
            if (index == 1) {
                initSimulation();
            }
        }
    },

    onTabClick: function (tab, navigation, index) {
        var $valid = $('#wizardSugestaoRotaForm').valid();
        if (!$valid) {
            return false;
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
});