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
    let a = {};
    a[1] = [-16.79614, -49.18946, "S1"];
    a[2] = [-16.79705, -49.18674, "S1"];
    a[3] = [-16.7997, -49.18377, "S2"];
    a[4] = [-16.80014, -49.18736, "S1"];
    a[5] = [-16.80311, -49.1802, "S2"];
    a[6] = [-16.80161, -49.18593, "S1"];
    a[7] = [-16.85038, -49.1817, "S2"];
    a[8] = [-16.8558, -49.17038, "S1"];
    a[9] = [-16.85691, -49.18187, "S1"];
    a[10] = [-16.85995, -49.17206, "S2"];
    a[11] = [-16.8694, -49.17141, "S2"];
    a[12] = [-16.8698, -49.1936, "S2"];
    a[13] = [-16.87182, -49.20667, "S1"];
    a[14] = [-16.87517, -49.21696, "S1"];
    a[15] = [-16.88314, -49.21585, "S1"];
    a[16] = [-16.88006, -49.22106, "S1"];
    a[16] = [-16.88006, -49.22106, "S1"];
    a[17] = [-16.80018, -49.12808, "S2"];
    a[18] = [-16.80503, -49.12542, "S1"];
    a[19] = [-16.79706, -49.11872, "S1"];
    a[20] = [-16.79731, -49.11134, "S1"];
    a[21] = [-16.78884, -49.1431, "S2"];
    a[22] = [-16.79003, -49.12976, "S2"];
    a[23] = [-16.79888, -49.12299, "S2"];
    a[24] = [-16.91227, -49.10845, "S2"];
    a[25] = [-16.90915, -49.1154, "S2"];
    a[26] = [-16.92779, -49.09266, "S2"];
    a[27] = [-16.93938, -49.105, "S2"];
    a[28] = [-16.94552, -49.13829, "S2"];
    a[29] = [-16.94589, -49.1257, "S1"];
    a[30] = [-16.85882, -49.27791, "S1"];
    a[31] = [-16.86449, -49.27654, "S2"];
    a[31] = [-16.86449, -49.27654, "S2"];
    a[32] = [-16.86917, -49.28418, "S1"];
    a[33] = [-16.87566, -49.28341, "S1"];
    a[34] = [-16.87821, -49.26607, "S1"];
    a[35] = [-16.86935, -49.32064, "S2"];
    a[36] = [-16.84019, -49.36664, "S1"];
    a[37] = [-16.83242, -49.38458, "S1"];
    a[38] = [-16.83256, -49.37794, "S1"];
    a[39] = [-16.85186, -49.38025, "S1"];
    a[40] = [-16.85139, -49.38933, "S1"];
    a[41] = [-16.84646, -49.38971, "S1"];
    a[42] = [-16.85382, -49.36705, "S1"];

    return a;
}

function getGaragens() {
    let g = {};
    g["G1"] = [-16.81651, -49.25611, "G1"];
    return g;
}

function getEscolas() {
    let e = {};
    e["S1"] = [-16.82113, -49.25096, "S1"];
    e["S2"] = [-16.82815, -49.26058, "S2"];
    return e;
}

var alunos = getAlunos();
var garagens = getGaragens();
var escolas = getEscolas();

// Onde vamos adicionar os elementos
var vSource = mapaConfig["vectorSource"];

function drawElements(arrAlunos, arrGaragens, arrEscolas) {
    for (let i in arrAlunos) {
        let a = arrAlunos[i];
        let p = new ol.Feature({
            "geometry": new ol.geom.Point(ol.proj.fromLonLat([a[1], a[0]]))
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

    for (let i in arrGaragens) {
        let g = arrGaragens[i];
        let p = new ol.Feature({
            "geometry": new ol.geom.Point(ol.proj.fromLonLat([g[1], g[0]]))
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

    for (let i in arrEscolas) {
        let e = arrEscolas[i];
        let p = new ol.Feature({
            "geometry": new ol.geom.Point(ol.proj.fromLonLat([e[1], e[0]]))
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
}

drawElements(alunos, garagens, escolas);
mapaConfig["map"].getView().fit(vSource.getExtent());

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
        console.log(error);
        console.log(element);
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
    }
});


// Trigger para Iniciar Simulação
$("#rota-sugestao-initBtnSim").click(() => {
    // // Juntar dados em um objeto
    // let routeGenerationInputData = {
    //     "alunos": alunos,
    //     "escolas": escolas,
    //     "garagem": garagens,
    //     "veiculos": [15, 25, 15],
    //     "maxTempo": 120,
    //     "maxDist": 40,
    //     "numAlunos": Object.keys(alunos).length,
    //     "numEscolas": Object.keys(escolas).length,
    //     "numVeiculos": 3,
    // };

    // ipcRenderer.send('route-generation', routeGenerationInputData);
});