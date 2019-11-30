// Variáveis de Mapas
var listaDeRotas = new Map();
var mapa = novoMapaOpenLayers("mapRota", cidadeLatitude, cidadeLongitude);
var malha = mapa["addLayer"]("Malha");
var malhaSource = malha["source"];
var malhaLayer = malha["layer"];
var gpx = "";
var gpxDOM = "";

var style = {
    'Point': [
        new ol.style.Style({
            image: new ol.style.Circle({
                radius: 15,
                anchor: [10, 10],
                anchorXUnits: 'pixels',
                anchorYUnits: 'pixels',
                fill: new ol.style.Fill({
                    color: 'white'
                })
            })
        }),
        new ol.style.Style({
            image: new ol.style.Circle({
                radius: 8,
                anchor: [10, 10],
                anchorXUnits: 'pixels',
                anchorYUnits: 'pixels',
                fill: new ol.style.Fill({
                    color: '#ffcc33'
                })
            })
        }),
    ],
    'LineString': new ol.style.Style({
        stroke: new ol.style.Stroke({ color: '#ffcc33', width: 4 })
    }),
};

malhaLayer.setStyle((feature) => {
    if (feature.getGeometry() instanceof ol.geom.LineString) {
        feature.setStyle(style["LineString"]);
    } else if (feature.getGeometry() instanceof ol.geom.Point) {
        feature.setStyle(style["Point"]);
    }
});

// Ativa busca e camadas
mapa["activateGeocoder"]();
mapa["activateImageLayerSwitcher"]();

// Lista de Imports
var togeojson = require('@mapbox/togeojson');
var fs = require("fs-extra");
var DOMParser = require('xmldom').DOMParser;

$("#arqGPX").change(() => {
    let gpxFile = $("#arqGPX")[0].files[0].path;
    if (gpxFile != "") {
        gpxDOM = new DOMParser().parseFromString(fs.readFileSync(gpxFile, "UTF8"));
        gpx = togeojson.gpx(gpxDOM);
        
        var trackFeatures = new Array();
        for (let i = 0; i < gpx.features.length; i++) {
            if (gpx.features[i].geometry.type == "LineString") {
                trackFeatures.push(gpx.features[i]);
            }
        }
        gpx["features"] = trackFeatures;
        
        malhaSource.clear();
        malhaSource.addFeatures((new ol.format.GeoJSON()).readFeatures(gpx, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        }))

        mapa["map"].getView().fit(malhaSource.getExtent());
    }
});

var completeForm = () => {
    Swal2.fire({
        title: "Rota salva com sucesso",
        text: "A rota " + listaDeRotas.get(parseInt($("#listarota").val())) + " foi salva com sucesso. " +
            "Clique abaixo para retornar ao painel.",
        type: "success",
        icon: "success",
        showCancelButton: false,
        confirmButtonClass: "btn-success",
        confirmButtonText: "Retornar ao painel",
        closeOnConfirm: false,
        closeOnClickOutside: false,
        allowOutsideClick: false,
        showConfirmButton: true
    })
    .then(() => {
        navigateDashboard("./modules/rota/rota-listar-view.html");
    });
}

$('#rota-salvar-rota').click(() => {
    var idRota = $("#listarota").val();
    var km = Math.round(ol.sphere.getLength(malhaSource.getFeatures()[0].getGeometry()) / 1000 * 100) / 100;
    var rotasJSON = {
        ID_ROTA: idRota,
        KM: km,
        SHAPE: new ol.format.GeoJSON().writeFeatures(malhaSource.getFeatures())
    }
    AtualizarPromise("Rotas", rotasJSON, "ID_ROTA", idRota)
        .then((res) => {
            completeForm();
        })
        .catch((err) => {
            errorFn("Erro ao salvar a Rota", err)
        });
});

// Wizard
$('.card-wizard').bootstrapWizard({
    'tabClass': 'nav nav-pills',
    'nextSelector': '.btn-next',
    'previousSelector': '.btn-back',

    onNext: function (tab, navigation, index) {
        if (gpx == "") {
            Swal2.fire({
                title: "Ops... tivemos um problema!",
                text: "Por favor, selecione o arquivo GPX antes de prosseguir",
                icon: "error",
                type: "error",
                button: "Fechar"
            });
            return false;
        }
        window.scroll(0, 0);
        return true;
    },

    onTabClick: function (tab, navigation, index) {
        if (gpx == "") {
            Swal2.fire({
                title: "Ops... tivemos um problema!",
                text: "Por favor, selecione o arquivo GPX antes de prosseguir",
                icon: "error",
                type: "error",
                button: "Fechar"
            });
            return false;
        }
        window.scroll(0, 0);
        return true;
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

        setTimeout(function () {
            // Atualiza o mapa
            mapa["map"].updateSize();
            if (malhaSource.getFeatures().length != 0) {
                mapa["map"].getView().fit(malhaSource.getExtent());
            }
        }, 200);
    }
});

window.onresize = function () {
    setTimeout(function () {
        if (mapa != null) { mapa["map"].updateSize(); }
    }, 200);
}

BuscarTodosDadosPromise("Rotas")
    .then((res) => {
        res.forEach((rota) => {
            var rID = rota["ID_ROTA"];
            var rNome = rota["NOME"];
            listaDeRotas.set(parseInt(rID), rNome);
            $('#listarota').append(`<option value="${rID}">${rNome}</option>`);
        })
    })
    .catch((err) => {
        errorFn("Erro ao listar as Rotas", err)
    });