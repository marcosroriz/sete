// Bibliotecas
var osmtogeojson = require('osmtogeojson');

// Mapas
var mapaConfig = novoMapaOpenLayers("mapaRotaSugestaoConfig", cidadeLatitude, cidadeLongitude);
var mapaRotaGerada = novoMapaOpenLayers("mapaRotaSugestaoGerada", cidadeLatitude, cidadeLongitude);

// Desenha elementos
// Onde vamos adicionar os elementos
var vSource = mapaConfig["vectorSource"];
var gSource = mapaRotaGerada["vectorSource"];

// Mapa rotas geradas
var rotasGeradas = new Map();

window.onresize = function () {
    setTimeout(function () {
        console.log("resize");
        if (mapaConfig != null) { mapaConfig["map"].updateSize(); }
        if (mapaRotaGerada != null) { mapaRotaGerada["map"].updateSize(); }
    }, 200);
}

var alunoMap = new Map();
var escolaMap = new Map();

var alunos = new Array();
var garagens = new Array();
var escolas = new Array();


////////////////////////////////////////////////////////////////////////////////
// Promessas
////////////////////////////////////////////////////////////////////////////////

loadingFn("Preparando a ferramenta")

loadOSMFile()
.then(dataOSM => convertOSMToGeoJSON(dataOSM))
.then(osmGeoJSON => plotMalha(osmGeoJSON))
.then(() => dbBuscarTodosDadosPromise(DB_TABLE_VEICULO))
.then(res => $("#numVehicles").val(res.length))
.then(() => dbBuscarTodosDadosPromise(DB_TABLE_ALUNO))
.then(res => preprocessarAlunos(res))
.then(() => dbBuscarTodosDadosPromise(DB_TABLE_ESCOLA))
.then(res => preprocessarEscolas(res))
.then(() => dbBuscarTodosDadosPromise(DB_TABLE_GARAGEM))
.then(res => preprocessarGaragem(res))
.then(() => dbLeftJoinPromise(DB_TABLE_ESCOLA_TEM_ALUNOS, "ID_ESCOLA", DB_TABLE_ESCOLA, "ID_ESCOLA"))
.then(res => processarVinculoAlunoEscolas(res))
.then(() => dbLeftJoinPromise(DB_TABLE_ROTA_ATENDE_ALUNO, "ID_ROTA", DB_TABLE_ROTA, "ID_ROTA"))
.then(res => processarVinculoAlunoRota(res))
.then(() => listaElementos())
.catch((err) => {
    let code = err.code;
    if (code == "erro:malha") {
        informarNaoExistenciaDado("Malha não cadastrada", 
                                  "Cadastrar malha",
                                  "a[name='rota/rota-malha-view']")
    } else if (code == "erro:garagem") {
        informarNaoExistenciaDado("Garagem não cadastrada", 
                                  "Cadastrar garagem",
                                  "a[name='frota/garagem-visualizar-view']")
    } else if (code == "erro:aluno") {
        informarNaoExistenciaDado("Não há nenhum aluno georeferenciado", 
                                  "Gerenciar alunos",
                                  "a[name='aluno/aluno-listar-view']")
    } else if (code == "erro:escola") {
        informarNaoExistenciaDado("Não há nenhuma escola georeferenciada", 
                                  "Gerenciar escolas",
                                  "a[name='escola/escola-listar-view']")
    } else if (code == "erro:vinculo") {
        informarNaoExistenciaDado("As escolas dos alunos escolhidos não estão georeferenciadas", 
                                  "Escolas: " + err.data,
                                  "a[name='escola/escola-listar-view']")
    } else {
        errorFn(`Erro ao utilizar a ferramenta de sugestão de rotas. 
                 Entre em contato com a equipe de suporte`);
    }
})

// Informar não existência de dado
var informarNaoExistenciaDado = (titulo, msgConfirmacao, pagCadastroDado) => {
    return Swal2.fire({
        title: titulo,
        text: "Para utilizar a ferramenta de sugestão de rotas é necessário realizar esta ação antes",
        icon: "error",
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        cancelButtonText: "Retornar",
        confirmButtonText: msgConfirmacao
    }).then((result) => {
        if (result.value) {
            $(pagCadastroDado).click();
        } else {
            navigateDashboard(lastPage);
        }
    })
}

// Função le o arquivo osm da malha
function loadOSMFile() {
    let arqOrigem = path.join(userDataDir, "malha.osm");
    return new Promise((resolve, reject) => {
        fs.readFile(arqOrigem, (err, dataOSM) => {
            if (err) reject({ code: "erro:malha" })

            resolve(dataOSM)
        })
    })
}

// Função converse osm para geojson
function convertOSMToGeoJSON(dataOSM) {
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(dataOSM, "text/xml");
    let osmGeoJSON = osmtogeojson(xmlDoc);

    return Promise.resolve(osmGeoJSON);
}

// Plota malha
function plotMalha(osmGeoJSON) {
    let olConfigMap = mapaConfig["map"];

    let tileIndex = geojsonvt(osmGeoJSON, {
        extent: 4096,
        debug: 1,
        maxZoom: 20,
        indexMaxZoom: 20,
        tolerance: 5
    })
    let format = new ol.format.GeoJSON({
        // Data returned from geojson-vt is in tile pixel units
        dataProjection: new ol.proj.Projection({
            code: 'TILE_PIXELS',
            units: 'tile-pixels',
            extent: [0, 0, 4096, 4096],
        }),
    });

    let malhaVectorSource = new ol.source.VectorTile({
        tileUrlFunction: function (tileCoord) {
            // Use the tile coordinate as a pseudo URL for caching purposes
            return JSON.stringify(tileCoord);
        },
        tileLoadFunction: function (tile, url) {
            var tileCoord = JSON.parse(url);
            var data = tileIndex.getTile(tileCoord[0], tileCoord[1], tileCoord[2]);
            var geojson = JSON.stringify({
                    type: 'FeatureCollection',
                    features: data ? data.features : [],
                },
                osmMapReplacer
            );
            var features = format.readFeatures(geojson, {
                extent: malhaVectorSource.getTileGrid().getTileCoordExtent(tileCoord),
                featureProjection: olConfigMap.getView().getProjection(),
            });
            tile.setFeatures(features);
        },
    });

    var malhaVectorLayer = new ol.layer.VectorTile({
        source: malhaVectorSource,
        zIndex: 1,
        style: (feature, resolution) => {
            if (feature.getGeometry() instanceof ol.geom.LineString) {
                return new ol.style.Style({
                    stroke: new ol.style.Stroke({ color: "red", width: 2 }),
                })
            }
        }
    });
    olConfigMap.addLayer(malhaVectorLayer)

    mapaConfig["vectorLayer"].setZIndex(99);
    return Promise.resolve(tileIndex)
}



// Preprocessa alunos
function preprocessarAlunos(res) {
    let numTemGPS = 0;
    
    for (let alunoRaw of res) {
        let alunoJSON = parseAlunoDB(alunoRaw);

        if (alunoJSON["LOC_LATITUDE"] != "" && alunoJSON["LOC_LONGITUDE"] != "" &&
            alunoJSON["LOC_LATITUDE"] != undefined && alunoJSON["LOC_LONGITUDE"] != undefined &&
            alunoJSON["LOC_LATITUDE"] != null && alunoJSON["LOC_LONGITUDE"] != null) {

            alunoJSON["GPS"] = true;
            numTemGPS++;
        } else {
            alunoJSON["GPS"] = false;
        }

        alunoJSON["TEM_ESCOLA"] = false;
        alunoJSON["ESCOLA_ID"] = false;
        alunoJSON["ESCOLA_NOME"] = "Não está vinculado";
        alunoJSON["ESCOLA_TEM_GPS"] = false;

        alunoJSON["TEM_ROTA"] = false;
        alunoJSON["ROTA_ID"] = "";
        alunoJSON["ROTA_NOME"] = "";

        alunoMap.set(String(alunoJSON["ID"]), alunoJSON);
    }

    if (numTemGPS == 0) {
        Promise.reject({ code: "erro:aluno" })
    } else {
        return alunoMap;
    }
}

// Preprocessa escolas
function preprocessarEscolas(res) {
    let numTemGPS = 0;

    for (let escolaRaw of res) {
        let escolaJSON = parseEscolaDB(escolaRaw);

        if (escolaJSON["LOC_LATITUDE"] != "" && escolaJSON["LOC_LONGITUDE"] != "" &&
            escolaJSON["LOC_LATITUDE"] != undefined && escolaJSON["LOC_LONGITUDE"] != undefined &&
            escolaJSON["LOC_LATITUDE"] != null && escolaJSON["LOC_LONGITUDE"] != null) {

            escolaJSON["GPS"] = true;
            numTemGPS++;
        } else {
            escolaJSON["GPS"] = false;
        }
        escolaJSON["TEM_ALUNO_COM_GPS"] = false;

        escolaMap.set(String(escolaJSON["ID"]), escolaJSON);
    }

    if (numTemGPS == 0) {
        Promise.reject({ code: "erro:escola" })
    } else {
        return escolaMap;
    }
}

// Preprocessa garagens
function preprocessarGaragem(res) {
    if (res.length == 0) {
        return Promise.reject({ code: "erro:garagem" });
    }

    for (let g of res) {
        if (g["LOC_LATITUDE"] != "" && g["LOC_LONGITUDE"] != "" &&
            g["LOC_LATITUDE"] != undefined && g["LOC_LONGITUDE"] != undefined &&
            g["LOC_LATITUDE"] != null && g["LOC_LONGITUDE"] != null) {

            garagens.push({
                key: g["ID"],
                tipo: "garagem",
                lat: g["LOC_LATITUDE"],
                lng: g["LOC_LONGITUDE"]
            })
        }
    }
    return garagens;
}

// Filtrar os alunos e escolas que estão georeferenciados
function processarVinculoAlunoEscolas(res) {
    let numVinculo = 0;
    let escolasVinculo = new Array();
    for (let vinculoRaw of res) {
        let aID = String(vinculoRaw["ID_ALUNO"]);
        let eID = String(vinculoRaw["ID_ESCOLA"]);
        let eNome = vinculoRaw["NOME"];

        let alunoJSON = alunoMap.get(aID);
        alunoJSON["ESCOLA_ID"] = eID;
        alunoJSON["ESCOLA_NOME"] = eNome;

        // Verificar se escola do aluno está georeferenciada
        let escolaAluno = escolaMap.get(String(eID));

        if (escolaAluno["GPS"]) {
            alunoJSON["ESCOLA_TEM_GPS"] = true;
            alunoMap.set(aID, alunoJSON);

            escolaAluno["TEM_ALUNO_COM_GPS"] = true;
            escolaMap.set(eID, escolaAluno);
            
            numVinculo++;
            escolasVinculo.push(eNome)
        }
    }

    if (numVinculo == 0) {
        Promise.reject({ code: "erro:vinculo", data: escolasVinculo.join(", ") })
    } else {
        return alunoMap;
    }
};

// Filtrar os alunos que já possuem rota
function processarVinculoAlunoRota(res) {
    for (let vinculoRaw of res) {
        let aID = String(vinculoRaw["ID_ALUNO"]);
        let rID = String(vinculoRaw["ID_ROTA"]);
        let rNome = vinculoRaw["NOME"];

        let alunoJSON = alunoMap.get(aID);
        alunoJSON["ROTA"] = true;
        alunoJSON["ROTA_ID"] = rID;
        alunoJSON["ROTA_NOME"] = rNome;

        alunoMap.set(aID, alunoJSON);
    }
    return alunoMap;
};

// Pega os elementos do mapa e transforma no nosso array
function listaElementos() {
    alunoMap.forEach((a, aID) => {
        if (a["GPS"] && a["ESCOLA_TEM_GPS"]) {
            alunos.push({
                key: aID,
                tipo: "aluno",
                nome: a["NOME"],
                lat: a["LOC_LATITUDE"],
                lng: a["LOC_LONGITUDE"],
                turno: a["TURNOSTR"],
                nivel: a["NIVELSTR"],
                temEscola: a["TEM_ESCOLA"],
                school: a["ESCOLA_ID"],
                escolaID: a["ESCOLA_ID"],
                escolaNome: a["ESCOLA_NOME"],
                escolaTemGPS: a["ESCOLA_TEM_GPS"] ? "Sim" : "Não",
                passengers: 1
            })
        }
    })

    escolaMap.forEach((e, eID) => {
        if (e["GPS"] && e["TEM_ALUNO_COM_GPS"]) {
            escolas.push({
                key: eID,
                tipo: "escola",
                nome: e["NOME"],
                localizacao: e["LOCALIZACAO"],
                ensino: e["ENSINO"],
                horario: e["HORARIO"],
                lat: e["LOC_LATITUDE"],
                lng: e["LOC_LONGITUDE"]
            })
        }
    })

    drawMapElements(alunos, garagens, escolas, vSource);
    drawMapElements(alunos, garagens, escolas, gSource);
    setTimeout(() => {
        mapaConfig["map"].getView().fit(vSource.getExtent());
        mapaRotaGerada["map"].getView().fit(gSource.getExtent());
    }, 500);

    Swal2.close();
}

function drawMapElements(arrAlunos, arrGaragens, arrEscolas, camada) {
    for (let i in arrAlunos) {
        let a = arrAlunos[i];
        let p = new ol.Feature({
            ...a,
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
        camada.addFeature(p);
    }

    for (let i in arrEscolas) {
        let e = arrEscolas[i];
        let p = new ol.Feature({
            ...e,
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
        camada.addFeature(p);
    }
    for (let i in arrGaragens) {
        let g = arrGaragens[i];
        let p = new ol.Feature({
            ...g,
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
        camada.addFeature(p);
    }
}

function getPoint(stopType, stopID) {
    let parada;
    if (stopType == "garage") {
        parada = garagens;
    } else if (stopType == "school" || stopType == "otherschool") {
        for (let i = 0; i < escolas.length; i++) {
            if (escolas[i].key == stopID) {
                parada = escolas[i];
                break;
            }
        }
    } else {
        for (let i = 0; i < alunos.length; i++) {
            if (alunos[i].key == stopID) {
                parada = alunos[i];
                break;
            }
        }
    }
    return new ol.geom.Point(ol.proj.fromLonLat([parada["lng"], parada["lat"]])).getCoordinates();
}

function drawRoutes(routesJSON) {
    let grupoDeCamadas = new Array();
    let numRota = 1;
    routesJSON.forEach((r) => {
        // Adiciona para camadas
        rotasGeradas.set(r["id"], r);

        let rotaCor = proximaCor();
        let camada = mapaRotaGerada["createLayer"](r["id"],
            `<span class="corRota" style="background-color: ${rotaCor}">  </span>Rota: ${numRota++}`);

        // Make this dynamic
        pickedRoute = r;
        pickedRouteLength = r["purejson"].coordinates.length;
        pickedLayer = camada.layer;

        // Add Route Drawing
        let gjson = new ol.format.GeoJSON({ featureProjection: 'EPSG:3857' })
            .readFeatures(r["geojson"]);
        let styles = new Array();
        styles.push(new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: rotaCor,
                width: 5
            })
        }));

        // Ponto inicial
        let geoMarker = new ol.Feature({
            type: 'geoMarker',
            geometry: new ol.geom.Point(r["purejson"].coordinates[0])
        });
        geoMarker.setStyle = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({ color: 'black' }),
                stroke: new ol.style.Stroke({
                    color: 'white', width: 2
                })
            })
        });

        // Add additional properties
        gjson.forEach(f => {
            f.set("rota", numRota);
            f.set("pickedRoute", r);
            f.set("pickedRouteLength", r["purejson"].coordinates.length);
            f.set("marker", geoMarker);
        });

        // Poem setinhas nos pontos
        let pontosRota = new Array();
        for (let i = 1; i < r["path"].length; i++) {
            let parada = r["path"][i];
            pontosRota.push(getPoint(parada.type, parada.id));
        }
        let p = new ol.Feature({ "geometry": new ol.geom.LineString(pontosRota) });

        // Desenha setinhas
        p.getGeometry().forEachSegment(function (start, end) {
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
        });

        // Salva camada no grupoDeCamadas
        camada.source.addFeatures(gjson);
        camada.layer.setStyle(styles);
        camada.layer.setZIndex(1);


        // let popup = buildPopup(r["id"], mapaRotaGerada["select"]);
        // mapaRotaGerada["map"].addOverlay(popup);
        grupoDeCamadas.unshift(camada.layer);
    });

    mapaRotaGerada["addGroupLayer"]("Rotas", grupoDeCamadas);
}


///////////////////////////////////////////////////////////////////////////////
// Animação
///////////////////////////////////////////////////////////////////////////////
var btnIniciarAnimacao = $("#animarRota");
btnIniciarAnimacao.on('click', (evt) => {
    pickedLayer.setZIndex(2);
    startAnimation();
});

var pickedLayer = null;
var pickedRoute = null;
var pickedRouteLength = 0;
var animating = false;
var speed = 20;
var now = 0;

var moveFeature = function (event) {
    var vectorContext = ol.render.getVectorContext(event);
    var frameState = event.frameState;

    var elapsedTime = frameState.time - now;
    // here the trick to increase speed is to jump some indexes
    // on lineString coordinates
    var index = Math.round(speed * elapsedTime / 1000);

    if (index >= pickedRouteLength) {
        pickedLayer.un('postrender', moveFeature);
        return;
    }

    let pcoord = pickedRoute["purejson"].coordinates[index];
    let plat = pcoord[1];
    let plng = pcoord[0];


    let geoMarker = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([plng, plat]))
    });
    let geoStyle = new ol.style.Style({
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({ color: 'black' }),
            stroke: new ol.style.Stroke({
                color: 'white', width: 2
            })
        })
    });

    let iconStyle = new ol.style.Style({
        image: new ol.style.Icon({
            // anchor: [0, 0],
            // anchorXUnits: 'pixels',
            // anchorYUnits: 'pixels',
            opacity: 1,
            img: document.getElementById("onibusMarcador"),
            // src: "img/icones/onibus-marcador.png",
            imgSize: [36, 36],
            // size: [36, 36]
        })
    });

    vectorContext.drawFeature(geoMarker, iconStyle);
    // tell OpenLayers to continue the postrender animation
    mapaRotaGerada["map"].render();
};

function startAnimation() {
    animating = true;
    now = new Date().getTime();
    pickedLayer.on("postrender", moveFeature);
    mapaRotaGerada["map"].render();
}


///////////////////////////////////////////////////////////////////////////////
// Popup
///////////////////////////////////////////////////////////////////////////////
var selectAlunoEscola = new ol.interaction.Select({
    hitTolerance: 5,
    multi: false,
    condition: ol.events.condition.singleClick,
    filter: (feature, layer) => {
        if (feature.getGeometry().getType() == "Point" &&
            (feature.getProperties().tipo == "aluno" ||
                feature.getProperties().tipo == "escola")) {
            return true;
        } else {
            return false;
        }
    }
});
mapaConfig["map"].addInteraction(selectAlunoEscola);

var popupAlunoEscola = new ol.Overlay.PopupFeature({
    popupClass: "default anim",
    select: selectAlunoEscola,
    closeBox: true,
    template: {
        title: (elem) => {
            return elem.get("nome");
        },
        attributes: {
            'nivel': {
                title: "Série",
                visible: (e) => e.getProperties().tipo == "aluno"
            },
            'turno': {
                title: "Turno",
                visible: (e) => e.getProperties().tipo == "aluno"
            },
            'escolaNome': {
                title: "Escola",
                visible: (e) => e.getProperties().tipo == "aluno"
            },
            'escolaTemGPS': {
                title: "Escola possui GPS?",
                visible: (e) => e.getProperties().tipo == "aluno"
            },
            'ensino': {
                title: "Níveis",
                visible: (e) => e.getProperties().tipo == "escola"
            },
            'horario': {
                title: "Horário de Funcionamento",
                visible: (e) => e.getProperties().tipo == "escola"
            },
            'localizacao': {
                title: "Localização",
                visible: (e) => e.getProperties().tipo == "escola"
            },
        }
    }
});
mapaConfig["map"].addOverlay(popupAlunoEscola);

var selectRoute = new ol.interaction.Select({
    hitTolerance: 5,
    multi: false,
    condition: ol.events.condition.singleClick,
    filter: (feature, layer) => {
        if (feature.getGeometry().getType() == "LineString") {
            pickedRoute = feature.get("pickedRoute");
            pickedRouteLength = feature.get("pickedRouteLength");
            return true;
        } else {
            return false;
        }
    }
});
mapaRotaGerada["map"].addInteraction(selectRoute);
var popup = new ol.Overlay.PopupFeature({
    popupClass: "default anim",
    select: selectRoute,
    closeBox: true,
    template: {
        title: (elem) => {
            return "Rota " + elem.get("rota");
        },
        attributes: {
            'numPassengers': {
                title: 'Número de Passageiros'
            },
            'travDistance': {
                title: 'Tamanho da Rota',  // attribute's title
                before: '',           // something to add before
                format: ol.Overlay.PopupFeature.localString(),  // format as local string
                after: ' km.'        // something to add after
            }
        }
    }
});
mapaRotaGerada["map"].addOverlay(popup);

//////////////////////////////////////////////////////////////
// Realiza a Simulação
//////////////////////////////////////////////////////////////

// Trigger para Iniciar Simulação
function initSimulation() {
    swal({
        title: "Simulando...",
        text: "Espere um minutinho...",
        type: "warning",
        imageUrl: "img/icones/processing.gif",
        icon: "img/icones/processing.gif",
        buttons: false,
        showSpinner: true,
        closeOnClickOutside: false,
        allowOutsideClick: false,
        showConfirmButton: false
    });

    // Juntar dados em um objeto
    let routeGenerationInputData = {
        "maxTravDist": $("#maxDist").val() * 1000,
        "maxTravTime": $("#maxTime").val(),
        "optTarget": "maxTravDist",
        "numVehicles": $("#numVehicles").val(),
        "maxCapacity": $("#maxCapacity").val(),
        // TODO
        "busSpeed": 11.11, // 11.11 m/s ~= 40 km/h
        "garage": garagens,
        "stops": alunos,
        "schools": escolas,
    };

    debugger
    ipcRenderer.send('start:route-generation', routeGenerationInputData);
};

// Trigger para finalizar simulação
ipcRenderer.on("end:route-generation", function (event, routesJSON) {
    setTimeout(function () {
        // Apaga rotas anteriores desenhadas
        mapaRotaGerada["rmGroupLayer"]();

        // Desenha novas rotas
        rotasGeradas = new Map();
        drawRoutes(routesJSON);

        // Ativa grupo
        mapaRotaGerada["activateSidebarLayerSwitcher"](".sidebar-RotasGeradas");

        // Atualiza o mapa
        mapaRotaGerada["map"].updateSize();
        mapaRotaGerada["map"].getView().fit(gSource.getExtent());

        setTimeout(() => {
            $('.expend-layers').click();
            $('.ol-layerswitcher-buttons').hide();
            $('.layerswitcher-opacity').hide();
        }, 100);
        swal.close();
    }, 2000);
});


// Trigger para erro na simulação
ipcRenderer.on("error:route-generation", function (event, err) {
    errorFn("Erro no processo de simulação de rota!", err)
});


////////////////////////////////////////////////////////////////////////////////
// Validar Formulário
////////////////////////////////////////////////////////////////////////////////
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

$('input[type=radio][name=turno]').on('change', (evt) => {
    console.log("aqui");
    // evt.currentTarget.value
})