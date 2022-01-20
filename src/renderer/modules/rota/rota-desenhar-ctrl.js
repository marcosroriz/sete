// rota-desenhar-ctrl.js
// Este arquivo contém o script de controle da tela rota-desenhar-view. 
// O mesmo serve tanto para cadastrar, quanto para alterar o desenho de uma rota.

// Lista com as rotas
var listaDeRotas = new Map();
var idRotaSelecionada = 0;

// Dados da Rota selecionada
var dadosDaRota;
var shapeDaRota;
// $(".km").hide();
$(".tempo").hide();

// Garagem
var garagem;

// Variáveis de Mapas
var geojson = new ol.format.GeoJSON();
var mapMalhas = {};
var mapa = novoMapaOpenLayers("mapDesenhoRota", cidadeLatitude, cidadeLongitude);

window.onresize = function () {
    setTimeout(function () {
        console.log("resize");
        if (mapa != null) { mapa["map"].updateSize(); }
    }, 200);
}

// Escolheu alguma rota?
var escolheuRota = false;
function verificaSeEscolheuRota(e) {
    // console.log("PIXELS", mapa["map"].getFeaturesAtPixel(e.pixel_, { 'hitTolerance': 10 }))
    if (!escolheuRota) {
        Swal2.fire("Escolha uma rota primeiro!", "", "error");
        return false;
    } else {
        return true
    }
}

// Malha
var mapaAluno = mapa["addLayer"]("Malha");
var mapaSource = mapaAluno["source"];
var mapaLayer = mapaAluno["layer"];

var estilos = {}
estilos["Pavimentada"] = new ol.style.Stroke({ color: "#00cca7", width: 4 })
estilos["NaoPavimentada"] = new ol.style.Stroke({ color: '#ff6f00', width: 4 })
estilos["Hidrovia"] = new ol.style.Stroke({ color: "#1ebafc", width: 4 })

var modoSelecionado = "Pavimentada";

var estilosIcones = {
    inicio: "img/icones/inicio-icone.png",
    mataburro: "img/icones/mataburro-marcador.png",
    colchete: "img/icones/porteira-marcador.png"
}

var gerarMarcadorIcone = (imgPath) => {
    return new ol.style.Icon({
        anchor: [16, 16],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        opacity: 1,
        src: imgPath
    })
}

var getGeomStyle = function (feature) {
    var tipoLinha = feature.get("estilo");
    if (tipoLinha == undefined) {
        tipoLinha = "Pavimentada";
    }
    var styles = new Array();

    if (feature.getGeometry() instanceof ol.geom.LineString) {
        styles.push(new ol.style.Style({
            stroke: estilos[tipoLinha]
        }));

        let pontoReferencial = null;
        let ultPonto = feature.getGeometry().getLastCoordinate().slice(0, 2);
        feature.getGeometry().forEachSegment(function (start, end) {
            let plotSeta = false;

            if (!pontoReferencial) {
                plotSeta = true;
                pontoReferencial = ol.proj.transform(start, 'EPSG:3857', 'EPSG:4326');
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

mapaLayer.setStyle((feature) => {
    if (feature.getGeometry() instanceof ol.geom.LineString) {
        feature.setStyle(getGeomStyle(feature));
    } else if (feature.getGeometry() instanceof ol.geom.Point) {
        var tipoIcone = feature.get("estiloIcone");
        feature.setStyle(new ol.style.Style({
            image: gerarMarcadorIcone(estilosIcones[tipoIcone])
        }))
    }
})

var malhaGeoJSON = "";

// Elementos restantes (escolas, estudantes)
var vectorSource = mapa["vectorSource"];
var vectorLayer = mapa["vectorLayer"];
var mapaOL = mapa["map"];

// Ativa geocoder e camadas
mapa["activateImageLayerSwitcher"]();

var sketch;
var helpTooltipElement;
var helpTooltip;
var measureTooltipElement;
var measureTooltip;
var continuePolygonMsg = 'Clique para continuar desenhando o polígono';
var continueLineMsg = 'Clique para continuar desenhando o traçado da rota';

var pointerMoveHandler = function (evt) {
    if (evt.dragging) { return; }
    var helpMsg = 'Clique para iniciar o traçado da rota';
    if (sketch) { helpMsg = continueLineMsg; }

    helpTooltipElement.innerHTML = helpMsg;
    helpTooltip.setPosition(evt.coordinate);
    helpTooltipElement.classList.remove('hidden');
};

var formatLengthAll = (length = 0) => {
    var output = 0;
    mapaSource.getFeatures().forEach((f) => {
        if (f.getGeometry() instanceof ol.geom.LineString) {
            length = length + ol.sphere.getLength(f.getGeometry());
        }
    })

    if (length > 100) {
        output = (Math.round(length / 1000 * 100) / 100);
    } else {
        output = (Math.round(length * 100) / 100);
    }
    return output;
}

var formatLengthLeg = function (geom) {
    var output = "";
    var length = ol.sphere.getLength(geom);

    if (length > 100) {
        output = (Math.round(length / 1000 * 100) / 100) + ' ' + 'km';
    } else {
        output = (Math.round(length * 100) / 100) + ' ' + 'm';
    }
    return output;
};

if (helpTooltipElement) {
    helpTooltipElement.parentNode.removeChild(helpTooltipElement);
}
helpTooltipElement = document.createElement('div');
helpTooltipElement.className = 'ol-tooltip hidden';
helpTooltip = new ol.Overlay({
    element: helpTooltipElement,
    offset: [15, 0],
    positioning: 'center-left'
});
mapaOL.addOverlay(helpTooltip);
// mapaOL.on('pointermove', pointerMoveHandler);
// mapaOL.getViewport().addEventListener('mouseout', function () {
//     helpTooltipElement.classList.add('hidden');
// });

if (measureTooltipElement) {
    measureTooltipElement.parentNode.removeChild(measureTooltipElement);
}
measureTooltipElement = document.createElement('div');
measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
measureTooltip = new ol.Overlay({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: 'bottom-center'
});
mapaOL.addOverlay(measureTooltip);

// Interactions
var clearInteractions = () => {
    mapaOL.removeInteraction(drawMataBurro)
    mapaOL.removeInteraction(drawInicioRota)
    mapaOL.removeInteraction(drawColchete)
    mapaOL.removeInteraction(draw)
    mapaOL.removeInteraction(snap)
    mapaOL.removeInteraction(modify)
    mapaOL.removeInteraction(select)
}

var drawInicioRota = new ol.interaction.Draw({
    source: mapaSource,
    type: 'Point',
    condition: verificaSeEscolheuRota,
    style: new ol.style.Style({
        image: gerarMarcadorIcone("img/icones/icone-inicio-small.png")
    })
})

drawInicioRota.on('drawend', function (drawEndEvent) {
    var oldInicio = mapaSource.getFeatureById("inicio");
    if (oldInicio != null || oldInicio != undefined) {
        mapaSource.removeFeature(oldInicio);
    }
    var inicioFeature = drawEndEvent.feature;
    inicioFeature.setId("inicio");
    inicioFeature.set("estiloIcone", "inicio");
    inicioFeature.setStyle(new ol.style.Style({
        image: gerarMarcadorIcone("img/icones/inicio-icone.png")
    }));
    numOperacoes++;
});

var drawMataBurro = new ol.interaction.Draw({
    source: mapaSource,
    type: 'Point',
    condition: verificaSeEscolheuRota,
    style: new ol.style.Style({
        image: gerarMarcadorIcone("img/icones/icone-mataburro-small.png")
    })
})

drawMataBurro.on('drawend', function (drawEndEvent) {
    var mataBurroFeature = drawEndEvent.feature;
    mataBurroFeature.set("estiloIcone", "mataburro");
    mataBurroFeature.setStyle(new ol.style.Style({
        image: gerarMarcadorIcone("img/icones/mataburro-marcador.png")
    }));
    numOperacoes++;
});

var drawColchete = new ol.interaction.Draw({
    source: mapaSource,
    type: 'Point',
    condition: verificaSeEscolheuRota,
    style: new ol.style.Style({
        image: gerarMarcadorIcone("img/icones/icone-porteira-small.png")
    })
})

drawColchete.on('drawend', function (drawEndEvent) {
    var colcheteFeature = drawEndEvent.feature;
    colcheteFeature.set("estiloIcone", "colchete");
    condition: verificaSeEscolheuRota,
        colcheteFeature.setStyle(new ol.style.Style({
            image: gerarMarcadorIcone("img/icones/porteira-marcador.png")
        }));
    numOperacoes++;
});

var draw = new ol.interaction.Draw({
    source: mapaSource,
    condition: verificaSeEscolheuRota,
    type: 'LineString',
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#fac916',
            width: 4
        }),
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: '#ffcc33'
            })
        })

    })
});

var snap = new ol.interaction.Snap({
    source: mapaSource,
    pixelTolerance: 8
});

var modify = new ol.interaction.Modify({
    source: mapaSource
});

var select = new ol.interaction.Select({
    layers: function (layer) {
        let lname = layer.get("name")
        if (lname != undefined && lname == "Malha") {
            return true;
        } else {
            return false;
        }
        return true;
    },
    hitTolerance: 5
});

var selectedFeatures = [];

select.on("select", (evt) => {
    var selected = evt.selected;
    var deselected = evt.deselected;
    selectedFeatures = selected;

    evt.selected.forEach((f) => {
        var styles = []
        if (f.getGeometry().getType() == "Point") {
            var ficone = f.get("estiloIcone");
            styles.push(new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 25,
                    anchor: [50, 100],
                    anchorXUnits: 'pixels',
                    anchorYUnits: 'pixels',
                    fill: new ol.style.Fill({
                        color: 'white'
                    })
                })
            }))
            styles.push(new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 20,
                    anchor: [50, 100],
                    anchorXUnits: 'pixels',
                    anchorYUnits: 'pixels',
                    fill: new ol.style.Fill({
                        color: '#ffcc33'
                    })
                })
            }))
            styles.push(new ol.style.Style({
                image: gerarMarcadorIcone(estilosIcones[ficone])
            }))
        } else {
            styles.push(new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'white',
                    width: 8
                }),
            }))
            styles.push(new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#fac916',
                    width: 4
                }),
            }))
        }
        f.setStyle(styles);
    })
})

$(document).on('keyup', function (event) {
    if (event.keyCode === 27) {
        draw.removeLastPoint();
        select.getFeatures().clear();
        $(measureTooltipElement).css("display", "none");
    }
});


var listener;
draw.on('drawstart', function (drawStartEvent) {
    sketch = drawStartEvent.feature;
    var tooltipCoord = drawStartEvent.coordinate;
    $(measureTooltipElement).css("display", "");

    // Coloca estilo atual na feature desenhada
    sketch.getGeometry().set("estilo", modoSelecionado);
    listener = sketch.getGeometry().on('change', function (evt) {
        var geom = evt.target;
        var output = formatLengthLeg(geom);
        tooltipCoord = geom.getLastCoordinate();

        measureTooltipElement.innerHTML = output;
        measureTooltip.setPosition(tooltipCoord);
    });
});

draw.on('drawend', function (drawEndEvent) {
    // Faz merge se precisar
    // var [malhaFeature, malhaEstilos] = mergeLineString(drawEndEvent.feature);
    var malhaFeature = drawEndEvent.feature;
    var malhaGeometry = malhaFeature.getGeometry();
    malhaFeature.set("estilo", modoSelecionado);

    // Seta id e escreve para GeoJSON
    // malhaFeature.setId(idRotaSelecionada);
    /*malhaGeoJSON = geojson.writeFeatureObject(malhaFeature, {
        dataProjection: 'EPSG:4326'
    })*/

    // Seta estilo de cada parte e depois o estilo global
    // malhaFeature.setStyle(getGeomStyle(malhaGeometry));
    // malhaSource.addFeature(malhaFeature);

    // Seta quilometragem
    $(measureTooltipElement).css("display", "none");
    let length = ol.sphere.getLength(drawEndEvent.feature.getGeometry());
    $("#regkm").val(formatLengthAll(length));
    // measureTooltipElement.innerHTML = formatLengthAll();
    // measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
    // measureTooltip.setOffset([0, -7]);

    // Remove listener
    ol.Observable.unByKey(listener);
    numOperacoes++;
});

modify.on('modifyend', function (modifyEvent) {
    var malhaFeature = modifyEvent.features.getArray()[0];
    malhaFeature.setStyle(getGeomStyle(malhaFeature));

    $("#regkm").val(formatLengthAll());
    // measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
    // measureTooltip.setOffset([0, -7]);
});

// mapaOL.addInteraction(modify);
mapaOL.addInteraction(draw);
mapaOL.addInteraction(snap);


var ol3Parser = new jsts.io.OL3Parser();
function mergeLineString(currentFeature) {
    var features = mapaSource.getFeatures();
    var feature, currentGeo, featureGeo, union, i;

    // style array
    var styleArray = new Array();
    styleArray.push(currentFeature.getGeometry().get("estilo"));

    // loop forward because we have to remove the merged features
    for (i = features.length - 1; i >= 0; --i) {
        feature = features[i];
        // convert data with JSTS
        currentGeo = ol3Parser.read(currentFeature.getGeometry());
        featureGeo = ol3Parser.read(feature.getGeometry());
        // check intersection with another feature already on the vector
        if (currentGeo.intersects(featureGeo)) {
            // create union
            union = currentGeo.union(featureGeo);
            // push style
            styleArray.push(feature.getGeometry().get("estilo"))
            // set the new geometry to the last feature added
            currentFeature.setGeometry(ol3Parser.write(union));
            // remove the feature which was merged
            mapaSource.removeFeature(feature);
        }
    }

    return [currentFeature, styleArray];
}


// Plot
var plotarAluno = (alunoRaw) => {
    let lat = alunoRaw["LOC_LATITUDE"];
    let lng = alunoRaw["LOC_LONGITUDE"];
    let icon = "img/icones/aluno-marcador.png";

    let marcador = gerarMarcador(lat, lng, icon);
    marcador.set("nome", alunoRaw["NOME"]);
    marcador.set("content", alunoRaw["NOME"]);
    vectorSource.addFeature(marcador);
}

var plotarEscola = (escolaRaw) => {
    let lat = escolaRaw["LOC_LATITUDE"];
    let lng = escolaRaw["LOC_LONGITUDE"];
    let icon = "img/icones/escola-marker.png";

    let marcador = gerarMarcador(lat, lng, icon);
    marcador.set("nome", escolaRaw["NOME"]);
    marcador.set("content", escolaRaw["NOME"]);
    vectorSource.addFeature(marcador);
}

// Plota garagem na tela
var plotarGaragem = (garagemRaw) => {
    let lat = garagemRaw["LOC_LATITUDE"];
    let lng = garagemRaw["LOC_LONGITUDE"];
    let icon = "img/icones/garagem-icone.png";

    let marcador = gerarMarcador(lat, lng, icon);
    marcador.set("nome", "GARAGEM");
    marcador.set("content", "GARAGEM");
    vectorSource.addFeature(marcador);
}

// Barras de Controle
var centerbar = new ol.control.Bar();
var mainbar = new ol.control.Bar();
var editbar = new ol.control.Bar({
    toggleOne: true,	// one control active at the same time
    group: false		// group controls together
});
var selectBar = new ol.control.Bar();

var undoInteraction = new ol.interaction.UndoRedo();
mapaOL.addInteraction(undoInteraction);
// Prevent selection of a deleted feature
undoInteraction.on('undo', function (e) {
    if (e.action.type === 'addfeature') {
        select.getFeatures().clear();
    }
});

var numOperacoes = 0;

var bar = new ol.control.Bar({
    group: true,
    controls: [
        new ol.control.Button({
            html: '<i class="fa fa-undo" ></i>',
            title: 'Desfazer',
            handleClick: function () {
                if (numOperacoes > 0) {
                    undoInteraction.undo();
                    numOperacoes--;
                }
            }
        }),
        new ol.control.Button({
            html: '<i class="fa fa-repeat" ></i>',
            title: 'Refazer',
            handleClick: function () {
                undoInteraction.redo();
                numOperacoes++;
            }
        })
    ]
});
centerbar.addControl(bar);

var selectCtrl = new ol.control.Toggle({
    html: '<i class="fa fa-hand-pointer-o"></i>',
    title: "Select",
    onToggle: function (active) {
        clearInteractions();
        if (active) {
            mapaOL.addInteraction(select);
            mapaOL.addInteraction(snap);
        }
    },
    active: false
});
editbar.addControl(selectCtrl);

var removeCtrl = new ol.control.Button({
    html: '<i class="fa fa-times"></i>',
    title: "Remover",
    handleClick: function () {
        if (selectedFeatures.length != 0) {
            for (var i = 0; i < selectedFeatures.length; i++) {
                mapaSource.removeFeature(selectedFeatures[i]);
            }
            select.getFeatures().clear();
        } else {
            Swal2.fire(
                "Escolha um objeto primeiro!",
                "",
                "error"
            )
        }
    }
});
editbar.addControl(removeCtrl);

var modificarCtrl = new ol.control.Toggle({
    html: '<img class="ctrlIcon" src="./img/icones/icone-modificar.png">',
    title: "Modificar",
    onToggle: function (active) {
        clearInteractions();
        if (active) {
            mapaOL.addInteraction(modify);
            mapaOL.addInteraction(snap);
        }
    },
    active: false
});
editbar.addControl(modificarCtrl);


var pavimentadaCtrl = new ol.control.Toggle({
    html: '<i class="fa fa-road"></i>',
    title: 'Via Pavimentada',
    onToggle: function (active) {
        clearInteractions();
        if (active) {
            mapaOL.addInteraction(draw);
            mapaOL.addInteraction(snap);
        }
        modoSelecionado = "Pavimentada";
    },
    active: true
});
editbar.addControl(pavimentadaCtrl);

var naoPavimentadaCtrl = new ol.control.Toggle({
    html: '<img class="ctrlIcon" src="./img/icones/icone-naopavimentada2.png">',
    title: 'Via Não-Pavimentada',
    onToggle: function (active) {
        clearInteractions();
        if (active) {
            mapaOL.addInteraction(draw);
            mapaOL.addInteraction(snap);
        }
        modoSelecionado = "NaoPavimentada";
    }
});
editbar.addControl(naoPavimentadaCtrl);

var hidroviaCtrl = new ol.control.Toggle({
    html: '<img class="ctrlIcon" src="./img/icones/icone-aqua2.png">',
    title: 'Hidrovia',
    onToggle: function (active) {
        clearInteractions();
        if (active) {
            mapaOL.addInteraction(draw);
            mapaOL.addInteraction(snap);
        }
        modoSelecionado = "Hidrovia";
    }
});
editbar.addControl(hidroviaCtrl);

var inicioRotaCtrl = new ol.control.Toggle({
    html: '<img class="ctrlIcon" src="./img/icones/icone-inicio.png">',
    title: 'Início da Rota',
    onToggle: function (active) {
        clearInteractions();
        if (active) {
            mapaOL.addInteraction(drawInicioRota);
        }
        modoSelecionado = "inicio";
    },
});
editbar.addControl(inicioRotaCtrl);

var mataBurroCtrl = new ol.control.Toggle({
    html: '<img class="ctrlIcon" src="./img/icones/icone-mataburro.png">',
    title: 'Mata-burro',
    onToggle: function (active) {
        clearInteractions();
        if (active) {
            mapaOL.addInteraction(drawMataBurro);
        }
        modoSelecionado = "mata-burro";
    },
});
editbar.addControl(mataBurroCtrl);

var colcheteCtrl = new ol.control.Toggle({
    html: '<img class="ctrlIcon" src="./img/icones/icone-porteira.png">',
    title: 'Colchete',
    onToggle: function (active) {
        clearInteractions();
        if (active) {
            mapaOL.addInteraction(drawColchete);
        }
        modoSelecionado = "colchete";
    },
});
editbar.addControl(colcheteCtrl);

mainbar.addControl(editbar);
mainbar.setPosition("top-left");

mapaOL.addControl(centerbar);
mapaOL.addControl(mainbar);

// Callback para pegar dados iniciais das rotas
restImpl.dbGETColecao(DB_TABLE_ROTA)
    .then(res => {
        res.sort((a, b) => a["nome"].localeCompare(b["nome"]))

        for (let rotaRaw of res) {
            let rotaJSON = parseRotaDBREST(rotaRaw);
            rotaJSON["ALUNOS"] = [];
            rotaJSON["ESCOLAS"] = [];
            listaDeRotas.set(rotaJSON["ID"], rotaJSON);
            $('#listarotas').append(`<option value="${rotaJSON["ID"]}">${rotaJSON["NOME"]}</option>`);
        }
    })
    // .then(() => dbLeftJoinPromise(DB_TABLE_ROTA_ATENDE_ALUNO, "ID_ALUNO", DB_TABLE_ALUNO, "ID_ALUNO"))
    // .then(res => processarAlunosPorRota(res))
    // .then(() => dbLeftJoinPromise(DB_TABLE_ROTA_PASSA_POR_ESCOLA, "ID_ESCOLA", DB_TABLE_ESCOLA, "ID_ESCOLA"))
    // .then(res => processarEscolasPorRota(res))
    // .then(() => dbBuscarTodosDadosPromise(DB_TABLE_GARAGEM))
    // .then(res => processarGaragem(res))
    .catch(err => errorFn("Erro ao listar as rotas", err))


// Processa garagem
var processarGaragem = (res) => {
    for (let garagemRaw of res) {
        if (garagemRaw["LOC_LONGITUDE"] != null && garagemRaw["LOC_LONGITUDE"] != undefined &&
            garagemRaw["LOC_LATITUDE"] != null && garagemRaw["LOC_LATITUDE"] != undefined) {
            plotarGaragem(garagemRaw)
        }
        garagem = garagemRaw;
    }
    if (!mapaSource.isEmpty()) {
        mapaOL.getView().fit(vSource.getExtent());
        mapaOL.updateSize();
    }
}

// Processar alunos por rota
var processarAlunosPorRota = (res) => {
    for (let aluno of res) {
        aluno = parseAlunoDB(aluno)
        let rotaJSON = listaDeRotas.get(aluno["ID_ROTA"]);
        rotaJSON["ALUNOS"].push(aluno);
    }
    return listaDeRotas;
}

// Processar alunos por Escola
var processarEscolasPorRota = (res) => {
    for (let escola of res) {
        escola = parseEscolaDB(escola)
        let rotaJSON = listaDeRotas.get(escola["ID_ROTA"]);
        rotaJSON["ESCOLAS"].push(escola);
    }
    return listaDeRotas;
}

$("#listarotas").on("change", async (evt) => {
    if (evt.currentTarget.value == "") {
        escolheuRota = false;
    } else {
        escolheuRota = true;
        try {
            idRotaSelecionada = evt.currentTarget.value;
            let temShape = true;

            // Limpando dados do mapa
            vectorSource.clear();
            mapaSource.clear();

            try {
                dadosDaRota = await restImpl.dbGETEntidade(DB_TABLE_ROTA, `/${idRotaSelecionada}`);
                delete dadosDaRota["_links"];
                delete dadosDaRota["result"];
            } catch (error) {
                errorFn("Erro ao buscar os detalhes da Rota " + nomeRota, error);
                return error;
            }

            try {
                shapeDaRota = await restImpl.dbGETEntidade(DB_TABLE_ROTA, `/${idRotaSelecionada}/shape`);
            } catch (error) {
                temShape = false;
            }

            if (temShape) {
                Swal2.fire({
                    title: "Carregando rota",
                    text: "Carregando traçado da rota " + dadosDaRota["nome"],
                    type: "info",
                    icon: "info",
                    showCancelButton: false,
                    closeOnConfirm: false,
                    closeOnClickOutside: false,
                    allowOutsideClick: false,
                    showConfirmButton: false
                });

                // Acrescentando rota existente
                mapaSource.addFeatures((new ol.format.GeoJSON()).readFeatures(shapeDaRota.shape))
            }

            // Acrescenta garagem
            if (garagem != undefined) {
                plotarGaragem(garagem);
            }

            // zera o número de operações
            numOperacoes = 0;

            $("#regkm").val(strToNumber(dadosDaRota["km"]));
            $(".km").show();
            /*alunosRota = rotaSelect["ALUNOS"]
            escolasRota = rotaSelect["ESCOLAS"]

            alunosRota.forEach(aluno => {
                if (aluno["LOC_LONGITUDE"] != null && aluno["LOC_LONGITUDE"] != undefined &&
                    aluno["LOC_LATITUDE"] != null && aluno["LOC_LATITUDE"] != undefined) {
                    plotarAluno(aluno);
                }
            })

            escolasRota.forEach(escola => {
                if (escola["LOC_LONGITUDE"] != null && escola["LOC_LONGITUDE"] != undefined &&
                    escola["LOC_LATITUDE"] != null && escola["LOC_LATITUDE"] != undefined) {
                    plotarEscola(escola);
                }
            })*/

            if (!mapaSource.isEmpty()) {
                mapaOL.getView().fit(mapaSource.getExtent());
                mapaOL.updateSize();
            }
        } catch (error) {
            errorFn("Erro ao buscar os detalhes da Rota " + nomeRota, error)
        } finally {
            Swal2.close();
        }
    }
})

var completeForm = () => {
    Swal2.fire({
        title: "Rota salva com sucesso",
        text: "A rota " + dadosDaRota["nome"] + " foi salva com sucesso. " +
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

$("#rota-malha-salvarNovaMalha").on('click', () => {
    if (idRotaSelecionada == 0) {
        Swal2.fire("Escolha uma rota primeiro!", "", "error");
    } else {
        let promiseArray = [];
        dadosDaRota["km"] = strToNumber(String(formatLengthAll()));
        console.log(JSON.stringify(dadosDaRota))
        promiseArray.push(restImpl.dbPUT(DB_TABLE_ROTA, `/${idRotaSelecionada}`, dadosDaRota))
        promiseArray.push(restImpl.dbPUT(DB_TABLE_ROTA, `/${idRotaSelecionada}/shape`,
            JSON.parse(new ol.format.GeoJSON().writeFeatures(mapaSource.getFeatures()))))

        Promise.all(promiseArray)
            .then((res) => completeForm())
            .catch(err => {
                debugger
                console.log(err)
                errorFn("Erro ao atualizar o motorista!", err)
            })
    }
});

$("#cancelarAcao").on('click', () => {
    cancelDialog()
        .then((result) => {
            if (result.value) {
                navigateDashboard(lastPage);
            }
        })
});

action = "desenharRota"