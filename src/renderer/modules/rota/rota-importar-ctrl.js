// rota-importar-ctrl.js
// Este arquivo contém o script de controle da tela rota-importar-view. O mesmo
// possibilita importar a rota de um arquivo GPX

// Variáveis de Mapas
var listaDeRotas = new Map();
var mapa = novoMapaOpenLayers("mapRota", cidadeLatitude, cidadeLongitude);
var malha = mapa["addLayer"]("Malha");
var malhaSource = malha["source"];
var malhaLayer = malha["layer"];
var gpx = "";
var gpxSimplificado = "";
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


var getGeomStyle = function (feature) {
    var styles = new Array();

    if (feature.getGeometry() instanceof ol.geom.LineString) {
        styles.push(new ol.style.Style({
            stroke: new ol.style.Stroke({ color: "#00cca7", width: 4 })
        }));

        var numFeatures = feature.getGeometry().getCoordinates().length;
        if (numFeatures > 100) {
            simplify = true;
        }

        let pontoReferencial = null;
        let ultPonto = feature.getGeometry().getLastCoordinate().slice(0, 2);

        feature.getGeometry().forEachSegment(function (start, end) {
            let plotSeta = false;

            if (!pontoReferencial) {
                plotSeta = true;
                pontoReferencial = ol.proj.transform(start, 'EPSG:3857', 'EPSG:4326');

                styles.push(new ol.style.Style({
                    geometry: new ol.geom.Point(end),
                    image: new ol.style.Icon({
                        src: "img/icones/inicio-icone.png",
                        anchor: [0.75, 0.5],
                        rotateWithView: true,
                    })
                }));

                return;
            } else if ((start[0] == ultPonto[0] && start[1] == ultPonto[1]) ||
                       (end[0] == ultPonto[0] && end[1] == ultPonto[1])) {
                plotSeta = true;
            } else {
                let pontoAtual = ol.proj.transform(end, 'EPSG:3857', 'EPSG:4326');
                
                let distancia = ol.sphere.getDistance(pontoReferencial, pontoAtual);

                if (distancia > 2000) {
                    pontoReferencial = pontoAtual;
                    plotSeta = true;
                }
            }

            if (plotSeta) {
                var dx = end[0] - start[0];
                var dy = end[1] - start[1];
                var rotation = Math.atan2(dy, dx);
    
                // arrows
                styles.push(new ol.style.Style({
                    geometry: new ol.geom.Point(end),
                    image: new ol.style.Icon({
                        src: 'img/icones/arrow.png',
                        anchor: [0.75, 0.5],
                        rotateWithView: true,
                        rotation: -rotation
                    })
                }));
            }
        });
    }
    return styles;
}

malhaLayer.setStyle((feature) => {
    if (feature.getGeometry() instanceof ol.geom.LineString) {
        feature.setStyle(getGeomStyle(feature));
    } 
    /* else if (feature.getGeometry() instanceof ol.geom.Point) {
        feature.setStyle(style["Point"]);
    }*/
});

// Ativa busca e camadas
mapa["activateGeocoder"]();
mapa["activateImageLayerSwitcher"]();

// Lista de Imports
var togeojson = require('@mapbox/togeojson');
var GPXDOMParser = require('xmldom').DOMParser;
var simplify = require('simplify-geojson')

var erroSwalAntigo = (msgTitle, msgDesc) => {
    return swal({
        title: msgTitle,
        text: msgDesc,
        icon: "error",
        button: "Fechar",
    });
}

$("#arqGPX").change(() => {
    try {
        let gpxFile = $("#arqGPX")[0].files[0].path;
        if (gpxFile != "") {
            gpxDOM = new GPXDOMParser().parseFromString(fs.readFileSync(gpxFile, "UTF8"));
            gpx = togeojson.gpx(gpxDOM);
            
            var trackFeatures = new Array();
            for (let i = 0; i < gpx.features.length; i++) {
                if (gpx.features[i].geometry.type == "LineString") {
                    trackFeatures.push(gpx.features[i]);
                }
            }
            gpx["features"] = trackFeatures;
            
            gpxSimplificado = simplify(gpx, 0.00001)

            malhaSource.clear();
            malhaSource.addFeatures((new ol.format.GeoJSON()).readFeatures(gpxSimplificado, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            }))

            mapa["map"].getView().fit(malhaSource.getExtent());
        }
    } catch (error) {
        erroSwalAntigo("Erro na leitura do arquivo GPX", "...")
    }
});

var completeForm = () => {
    swal({
        title: "Rota salva com sucesso",
        text: "A rota " + listaDeRotas.get($("#listarota").val()) + " foi salva com sucesso. " +
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
        document.location.href = "./dashboard.html";
        // navigateDashboard("./modules/rota/rota-listar-view.html");
    });
}

$('#rota-salvar-rota').click(() => {
    swal({
        title: "Importando dados da Rota",
        text: "Espere um segundinho...",
        icon: "info",
        buttons: false,
        closeOnEsc: false,
        closeOnClickOutside: false
    });

    var idRota = $("#listarota").val();
    var km = Math.round(ol.sphere.getLength(malhaSource.getFeatures()[0].getGeometry()) / 1000 * 100) / 100;
    var rotasJSON = {
        ID_ROTA: idRota,
        KM: km,
        SHAPE: new ol.format.GeoJSON().writeFeatures(malhaSource.getFeatures())
    }
    dbAtualizarPromise(DB_TABLE_ROTA, rotasJSON, idRota)
    .then(res => completeForm())
    .catch(err => erroSwalAntigo("Erro ao atualizar o motorista!", err))
});

// Wizard
$('.card-wizard').bootstrapWizard({
    'tabClass': 'nav nav-pills',
    'nextSelector': '.btn-next',
    'previousSelector': '.btn-back',

    onNext: function (tab, navigation, index) {
        if (gpx == "") {
            erroSwalAntigo("Ops... tivemos um problema", 
                           "Por favor, selecione o arquivo GPX antes de prosseguir!")
            return false;
        }
        window.scroll(0, 0);
        return true;
    },

    onTabClick: function (tab, navigation, index) {
        if (gpx == "") {
            erroSwalAntigo("Ops... tivemos um problema", 
                           "Por favor, selecione o arquivo GPX antes de prosseguir!")
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

dbBuscarTodosDadosPromise(DB_TABLE_ROTA)
.then(res => {
    for (let rota of res) {
        var rID = rota["ID"];
        var rNome = rota["NOME"];
        listaDeRotas.set(rID, rNome);
        $('#listarota').append(`<option value="${rID}">${rNome}</option>`);
    }
}).catch((err) => erroSwalAntigo("Ops... tivemos um problema ao listar as rotas", err ));