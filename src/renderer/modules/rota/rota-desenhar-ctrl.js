// rota-desenhar-ctrl.js
// Este arquivo contém o script de controle da tela rota-desenhar-view. 
// O mesmo serve tanto para cadastrar, quanto para alterar o desenho de uma rota.

// Lista com as rotas
var listaDeRotas = new Map();
var idRotaSelecionada = 0;
var garagem;
$(".km").hide();
$(".tempo").hide();

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

        var numFeatures = feature.getGeometry().getCoordinates().length;
        var simplify = false;
        if (numFeatures > 100) {
            simplify = true;
        }

        let numSegmento = 0;
        feature.getGeometry().forEachSegment(function (start, end) {
            // var rnd = Math.floor(Math.random() * 100 + 1);
            var dx = end[0] - start[0];
            var dy = end[1] - start[1];
            var rotation = Math.atan2(dy, dx);

            if (simplify) {
                // Plota a cada 100 segmentos apenas
                if (numSegmento++ % 100 != 0) return;
            }

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
var continuePolygonMsg = 'Click to continue drawing the polygon';
var continueLineMsg = 'Clique para continuar desenhando o traçado da rota';

var pointerMoveHandler = function (evt) {
    if (evt.dragging) { return; }
    var helpMsg = 'Clique para iniciar o traçado da rota';
    if (sketch) { helpMsg = continueLineMsg; }

    helpTooltipElement.innerHTML = helpMsg;
    helpTooltip.setPosition(evt.coordinate);
    helpTooltipElement.classList.remove('hidden');
};

var formatLengthAll = () => {
    var length = 0;
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
});

var drawMataBurro = new ol.interaction.Draw({
    source: mapaSource,
    type: 'Point',
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
});

var drawColchete = new ol.interaction.Draw({
    source: mapaSource,
    type: 'Point',
    style: new ol.style.Style({
        image: gerarMarcadorIcone("img/icones/icone-porteira-small.png")
    })
})

drawColchete.on('drawend', function (drawEndEvent) {
    var colcheteFeature = drawEndEvent.feature;
    colcheteFeature.set("estiloIcone", "colchete");
    colcheteFeature.setStyle(new ol.style.Style({
        image: gerarMarcadorIcone("img/icones/porteira-marcador.png")
    }));
});

var draw = new ol.interaction.Draw({
    source: mapaSource,
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
    pixelTolerance: 20
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
    $("#regkm").val(formatLengthAll());
    // measureTooltipElement.innerHTML = formatLengthAll();
    // measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
    // measureTooltip.setOffset([0, -7]);

    // Remove listener
    ol.Observable.unByKey(listener);
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

// Barra de Controle
var mainbar = new ol.control.Bar();
var editbar = new ol.control.Bar({
    toggleOne: true,	// one control active at the same time
    group: false		// group controls together
});
var selectBar = new ol.control.Bar();

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
    title: "Select",
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
mapaOL.addControl(mainbar);

// Callback para pegar dados inicia das rotas
dbBuscarTodosDadosPromise(DB_TABLE_ROTA)
.then(res => {
    for (let rotaRaw of res) {
        rotaRaw["ALUNOS"] = [];
        rotaRaw["ESCOLAS"] = [];
        listaDeRotas.set(rotaRaw["ID"], rotaRaw);
        $('#listarotas').append(`<option value="${rotaRaw["ID"]}">${rotaRaw["NOME"]}</option>`);
    }
})
.then(() => dbLeftJoinPromise(DB_TABLE_ROTA_ATENDE_ALUNO, "ID_ALUNO", DB_TABLE_ALUNO, "ID_ALUNO"))
.then(res => processarAlunosPorRota(res))
.then(() => dbLeftJoinPromise(DB_TABLE_ROTA_PASSA_POR_ESCOLA, "ID_ESCOLA", DB_TABLE_ESCOLA, "ID_ESCOLA"))
.then(res => processarEscolasPorRota(res))
.then(() => dbBuscarTodosDadosPromise(DB_TABLE_GARAGEM))
.then(res => processarGaragem(res))
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

$("#listarotas").on("change", (evt) => {
    if (evt.currentTarget.value != "") {
        try {
            idRotaSelecionada = evt.currentTarget.value;
            var rotaSelect = listaDeRotas.get(idRotaSelecionada);
            var nomeRota = rotaSelect["NOME"];
            Swal2.fire({
                title: "Carregando rota",
                text: "Carregando traçado da rota " + nomeRota,
                type: "info",
                icon: "info",
                showCancelButton: false,
                closeOnConfirm: false,
                closeOnClickOutside: false,
                allowOutsideClick: false,
                showConfirmButton: false
            });

            // Limpando dados do mapa
            vectorSource.clear();
            mapaSource.clear();

            // Acrescenta garagem
            plotarGaragem(garagem);

            // Acrescentando rota existente
            if (rotaSelect["SHAPE"] != "" && rotaSelect["SHAPE"] != undefined) {
                mapaSource.addFeatures((new ol.format.GeoJSON()).readFeatures(rotaSelect["SHAPE"]))
            }

            // Tipo de Modal
            // var tipoModal = parseInt(rotaSelect["TIPO"]);
            // switch (tipoModal) {
            //     case 1:
            //         $(".tempo").hide();
            //         $("#regkm").val(rotaSelect["KM"]);
            //         $(".km").show();
            //         break;
            //     case 2:
            //         $("#regtempo").val(rotaSelect["TEMPO"]);
            //         $(".tempo").show();
            //         $(".km").hide();
            //         break;
            //     case 3:
            //         $(".tempo").val(rotaSelect["TEMPO"]);
            //         $("#regkm").val(rotaSelect["KM"]);
            //         $(".tempo").show();
            //         $(".km").show();
            //         break;
            //     default:
            //         $(".tempo").hide();
            //         $("#regkm").val(rotaSelect["KM"]);
            //         $(".km").show();
            // }

            alunosRota = rotaSelect["ALUNOS"]
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
                    plotarAluno(escola);
                }
            })

            if (!mapaSource.isEmpty()) {
                mapaOL.getView().fit(vSource.getExtent());
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
        text: "A rota " + listaDeRotas.get(idRotaSelecionada)["NOME"] + " foi salva com sucesso. " +
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

$("#rota-malha-salvarNovaMalha").on('click', () => {
    if (idRotaSelecionada == 0) {
        Swal2.fire("Escolha uma rota primeiro!", "", "error");
    } else {
        var rotasJSON = { "ID_ROTA": idRotaSelecionada };
        // rotasJSON["KM"] = $("#regkm").val();
        // rotasJSON["TEMPO"] = $("#regtempo").val();
        rotasJSON["SHAPE"] = new ol.format.GeoJSON().writeFeatures(mapaSource.getFeatures());

        dbAtualizarPromise(DB_TABLE_ROTA, rotasJSON, idRotaSelecionada)
        .then(res => completeForm())
        .catch(err => errorFn("Erro ao atualizar o motorista!", err))
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