// rota-importar-ctrl.js
// Este arquivo contém o script de controle da tela rota-importar-view. O mesmo
// possibilita importar a rota de um arquivo GPX

// Lista de Imports
var togeojson = require("@mapbox/togeojson");
var GPXDOMParser = require("xmldom").DOMParser;
var simplify = require("simplify-geojson");

// Variáveis de Mapas
var listaDeRotas = new Map();
var mapa = novoMapaOpenLayers("mapRota", cidadeLatitude, cidadeLongitude);
var malha = mapa["addLayer"]("Malha");
var malhaSource = malha["source"];
var malhaLayer = malha["layer"];
var gpx = "";
var gpxSimplificado = "";
var gpxDOM = "";

var getGeomStyle = function (feature) {
    var styles = new Array();

    if (feature.getGeometry() instanceof ol.geom.LineString) {
        styles.push(new ol.style.Style({
            stroke: new ol.style.Stroke({ color: "white", width: 8 }),
        }));
        styles.push(new ol.style.FlowLine({
            color: "Orange",
            color2: "DarkSlateGrey",
            width: 3,
            width2: 3,
            arrowSize: 32,
            zIndex: 0,
        }));
        // flowStyle.setArrow(1);

        let pontoReferencial = null;
        let ultPonto = feature.getGeometry().getLastCoordinate().slice(0, 2);

        feature.getGeometry().forEachSegment(function (start, end) {
            let plotSeta = false;

            if (!pontoReferencial) {
                plotSeta = true;
                pontoReferencial = ol.proj.transform(start, 'EPSG:3857', 'EPSG:4326');

                styles.push(new ol.style.Style({
                    geometry: new ol.geom.Point(start),
                    image: new ol.style.Icon({
                        src: "img/icones/inicio-icone.png",
                        anchor: [0.75, 0.5],
                        rotateWithView: true,
                    }),
                    zIndex: 150,
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
                        src: "img/icones/arrow.png",
                        anchor: [0.75, 0.5],
                        rotateWithView: true,
                        rotation: -rotation,
                    }),
                    zIndex: 100,
                }));
            }
        });
    }
    return styles;
};

malhaLayer.setStyle((feature) => {
    if (feature.getGeometry() instanceof ol.geom.LineString) {
        feature.setStyle(getGeomStyle(feature));
    } 
});

$("#inverter-rota").on("click", () => {
    malhaSource.clear();

    let arr = gpxSimplificado.features[0].geometry.coordinates;
    arr.reverse();
    gpxSimplificado.features[0].geometry.coordinates = arr;

    malhaSource.addFeatures((new ol.format.GeoJSON()).readFeatures(gpxSimplificado, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
    }))

    mapa["map"].getView().fit(malhaSource.getExtent());
});

// Ativa busca e camadas
mapa["activateGeocoder"]();
mapa["activateImageLayerSwitcher"]();

var erroSwalAntigo = (msgTitle, msgDesc) => {
    return swal({
        title: msgTitle,
        text: msgDesc,
        icon: "error",
        button: "Fechar",
    });
};

$("#arqGPX").on("change", () => {
    try {
        let gpxFile = $("#arqGPX")[0].files[0].path;
        if (gpxFile != "") {
            gpxDOM = new GPXDOMParser().parseFromString(fs.readFileSync(gpxFile, "UTF8"));
            gpx = togeojson.gpx(gpxDOM);

            var trackFeatures = null;
            for (let i = 0; i < gpx.features.length; i++) {
                if (gpx.features[i].geometry.type == "LineString") {
                    if (trackFeatures) {
                        trackFeatures.geometry.coordinates.push(...gpx.features[i].geometry.coordinates);
                    } else {
                        trackFeatures = gpx.features[i];
                    }
                }

                if (gpx.features[i].geometry.type == "MultiLineString") {
                    let lineStringCoordinates = [];
                    for (ls of gpx.features[i].geometry.coordinates) {
                        lineStringCoordinates.push(...ls)
                    }

                    if (trackFeatures) {
                        trackFeatures.geometry.coordinates.push(...lineStringCoordinates);
                    } else {
                        let feature = {
                            type: "Feature",
                            geometry: {
                                type: "LineString",
                                properties: {},
                                options: {},
                            },
                            properties: {},
                        };
                        feature.geometry.coordinates = lineStringCoordinates;
                        trackFeatures = feature;
                    }
                }
            }
            gpx["features"] = [trackFeatures];
            gpxSimplificado = simplify(gpx, 0.0001);

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
    Swal2.fire({
        title: "Rota salva com sucesso",
        text: "O percurso da rota " + listaDeRotas.get(Number($("#listarota").val())) + " foi importada com sucesso. " +
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
        $("a[name='rota/rota-listar-view']").trigger("click");
    });
}

$('#rota-salvar-rota').on('click', () => {
    loadingFn("Importando o percurso da Rota");

    let idRota = $("#listarota").val();
    let shape = JSON.parse(new ol.format.GeoJSON().writeFeatures(malhaSource.getFeatures()));
    let km = Math.round(ol.sphere.getLength(malhaSource.getFeatures()[0].getGeometry()) / 1000 * 100) / 100;
    
    // Verifica se a rota refere-se a uma parte do trajeto (0) ou o trajeto completo (1)
    if (Number($("input[name='tipoTrajeto']:checked").val()) == 0) {
        km = km * 2;
    }

    restImpl.dbGETEntidade(DB_TABLE_ROTA, `/${idRota}`)
    .then((dadosDaRota) => {
        delete dadosDaRota["_links"];
        delete dadosDaRota["result"];
        dadosDaRota["km"] = km;

        let promiseArray = [];
        promiseArray.push(restImpl.dbPUT(DB_TABLE_ROTA, `/${idRota}`, dadosDaRota))
        promiseArray.push(restImpl.dbPUT(DB_TABLE_ROTA, `/${idRota}/shape`, shape))

        return Promise.all(promiseArray)
    })
    .then(() => completeForm())
    .catch(err => erroSwalAntigo("Erro ao importar a rota!", err))
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

restImpl.dbGETColecao(DB_TABLE_ROTA)
.then(res => {
    if (res.length == 0) {
        throw "Nenhuma rota disponível";
    } else {
        res.sort((a, b) => a["nome"].localeCompare(b["nome"]))

        for (let rotaRaw of res) {
            let rota = parseRotaDBREST(rotaRaw);
            let rID = rota["ID"];
            let rNome = rota["NOME"];
            listaDeRotas.set(rID, rNome);
            $("#listarota").append(`<option value="${rID}">${rNome}</option>`);
        }
    }
}).catch((err) => erroSwalAntigo("Ops... tivemos um problema ao listar as rotas", err));