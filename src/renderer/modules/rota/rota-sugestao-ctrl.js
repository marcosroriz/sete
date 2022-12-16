/**
 * SETE Desktop: renderer/modules/rota-sugestao-ctrl.js
 * 
 * Script de controle da tela de sugestão de rotas.
 * A tela mostrará um wizard, one a primeira etapa permitirá o usuário parametrizar a ferramenta.
 * A segunda tela mostrará o resultado da simulação.
 * Por fim, deve-se permitir que o usuário salve as rotas geradas.
 */

// Mapas (config = para parametrização, rotagerada = para simulação)
var mapaConfig = novoMapaOpenLayers("mapaRotaSugestaoConfig", cidadeLatitude, cidadeLongitude);
var mapaRotaGerada = novoMapaOpenLayers("mapaRotaSugestaoGerada", cidadeLatitude, cidadeLongitude);

// Desenha elementos
// Onde vamos adicionar os elementos
var vSource = mapaConfig["vectorSource"];
var gSource = mapaRotaGerada["vectorSource"];

// Rotina para atualizar os mapas quando a tela redimensionar
window.onresize = function () {
    setTimeout(function () {
        if (mapaConfig != null) { mapaConfig["map"].updateSize(); }
        if (mapaRotaGerada != null) { mapaRotaGerada["map"].updateSize(); }
    }, 200);
}

// Variável para armazenar as rotas geradas
var rotasGeradas = new Map();

// Variáveis que armazenará todos os usuários e escolas que podem utilizar a ferramenta
var alunoMap = new Map();      // Mapa que associa id aluno -> dados do aluno
var escolaMap = new Map();     // Mapa que associa id escola -> dados da escola
var nomeEscolaMap = new Map(); // Mapa que associa nome escola -> dados da escola
var nomeRotaMap = new Map();    // Mapa que associa nome rota  -> dados da rota

// Variáveis qeu contém apenas os usuários escolhidos para o processo de simulação
var alunos = new Array();
var garagens = new Array();
var escolas = new Array();

// Número da simulação
var numSimulacao = userconfig.get("SIMULATION_COUNT");
if (numSimulacao == undefined) {
    userconfig.set("SIMULATION_COUNT", 0);
    numSimulacao = 0;
}

////////////////////////////////////////////////////////////////////////////////
// Promessas
////////////////////////////////////////////////////////////////////////////////

function startTool() {
    // Esta ferramenta só funciona no Electron
    if (!isElectron) {
        Swal2.fire({
            title: "Funcionalidade indisponível",
            icon: "warning",
            html:
                'Esta funcionalidade está disponível apenas no SETE desktop. ' +
                'Baixe a versão desktop para acessá-la. <br> ' +
                'Clique ' +
                '<a target="_blank" href="https://transportes.fct.ufg.br/p/31448-sete-sistema-eletronico-de-gestao-do-transporte-escolar">aqui</a> ' +
                'para baixar a versão desktop.',
        }).then(() => navigateDashboard(lastPage))
    } else {
        // Rodando no electron
        loadingFn("Preparando a ferramenta")
        loadOSMFile()
        .then(dataOSM => convertOSMToGeoJSON(dataOSM))
        .then(osmGeoJSON => plotMalha(osmGeoJSON))
        .then(() => preprocessarVeiculos())
        .then(() => preprocessarEscolas())
        .then(() => preprocessarRotas())
        .then(() => preprocessarGaragem())
        .then(() => preprocessarAlunos())
        .then(() => listaElementos())
        .catch((err) => {
            let code = err.code;
            if (code == "erro:malha") {
                informarNaoExistenciaDado("Malha não cadastrada", 
                                          "Cadastrar malha",
                                          "a[name='rota/rota-malha-view']",
                                          "#veiculoMenu")
            } else if (code == "erro:garagem") {
                informarNaoExistenciaDado("Garagem não cadastrada", 
                                          "Cadastrar garagem",
                                          "a[name='frota/garagem-visualizar-view']",
                                          "#veiculoMenu")
            } else if (code == "erro:aluno") {
                informarNaoExistenciaDado("Não há nenhum aluno georeferenciado", 
                                          "Gerenciar alunos",
                                          "a[name='aluno/aluno-listar-view']",
                                          "#alunoMenu")
            } else if (code == "erro:escola") {
                informarNaoExistenciaDado("Não há nenhuma escola georeferenciada", 
                                          "Gerenciar escolas",
                                          "a[name='escola/escola-listar-view']",
                                          "#escolaMenu")
            } else if (code == "erro:vinculo") {
                informarNaoExistenciaDado("As escolas dos alunos escolhidos não estão georeferenciadas", 
                                          "Escolas: " + err.data,
                                          "a[name='escola/escola-listar-view']",
                                          "#escolaMenu")
            } else {
                errorFn(`Erro ao utilizar a ferramenta de sugestão de rotas. 
                         Entre em contato com a equipe de suporte`);
            }
        })    }
    
}

// Informar não existência de dado
var informarNaoExistenciaDado = (titulo, msgConfirmacao, pagCadastroDado, pagMenu) => {
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
            $(pagMenu).collapse();
        } else {
            navigateDashboard("./dashboard-main.html");
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
        buffer: 256,
        maxZoom: 20,
        indexMaxZoom: 20,
        tolerance: 5,
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
    mapaConfig["vectorLayer"].setZIndex(99);

    var malhaVectorLayer = new ol.layer.VectorTile({
        source: malhaVectorSource,
        zIndex: 90,
        maxZoom: 20,
        minZoom: 12,
        style: (feature, resolution) => {
            if (feature.getGeometry() instanceof ol.geom.LineString) {
                return new ol.style.Style({
                    stroke: new ol.style.Stroke({ color: "red", width: 2 }),
                })
            }
        }
    });
    olConfigMap.addLayer(malhaVectorLayer)
    return Promise.resolve(tileIndex)
}

// Preprocessa veículos
async function preprocessarVeiculos() {
    let veiculos = [];
    try {
        veiculos = await restImpl.dbBuscarTodosDadosPromise(DB_TABLE_VEICULO);
    } catch (err) {
        veiculos = [];
    }

    $("#numVehicles").val(1);
}

// Preprocessa alunos
async function preprocessarAlunos() {
    let numAlunosTemGPS = 0;
    let numEscolasTemGPS = 0;

    let alunos = [];
    try {
        alunos = await restImpl.dbGETColecao(DB_TABLE_ALUNO);

        for (let alunoRaw  of alunos) {
            let alunoJSON = parseAlunoREST(alunoRaw);
            
            if (alunoJSON["LOC_LATITUDE"] != "" && alunoJSON["LOC_LONGITUDE"] != "" &&
                alunoJSON["LOC_LATITUDE"] != undefined && alunoJSON["LOC_LONGITUDE"] != undefined &&
                alunoJSON["LOC_LATITUDE"] != null && alunoJSON["LOC_LONGITUDE"] != null) {

                alunoJSON["GPS"] = true;
                numAlunosTemGPS++;
            } else {
                alunoJSON["GPS"] = false;
            }

            // Verifica escola do aluno
            if (alunoJSON["ESCOLA"] && nomeEscolaMap.has(alunoJSON["ESCOLA"])) {
                let escolaJSON = nomeEscolaMap.get(alunoJSON["ESCOLA"]);
                alunoJSON["TEM_ESCOLA"] = true;
                alunoJSON["ESCOLA_ID"] = escolaJSON["ID"];
                alunoJSON["ESCOLA_NOME"] = escolaJSON["NOME"];
                
                if (escolaJSON["GPS"]) {
                    alunoJSON["ESCOLA_TEM_GPS"] = true;
                    numEscolasTemGPS++;
                } else {
                    alunoJSON["ESCOLA_TEM_GPS"] = false;
                }

                if (alunoJSON["GPS"]) {
                    escolaJSON["TEM_ALUNO_COM_GPS"] = true;
                }

                escolaMap.set(String(escolaJSON["ID"]), escolaJSON);
                nomeEscolaMap.set(String(escolaJSON["NOME"]), escolaJSON);
            } else {
                alunoJSON["TEM_ESCOLA"] = false;
                alunoJSON["ESCOLA_ID"] = false;
                alunoJSON["ESCOLA_NOME"] = "Não está vinculado";
                alunoJSON["ESCOLA_TEM_GPS"] = false;
            }

            // Verifica rota do aluno
            if (alunoJSON["ROTA"] && nomeRotaMap.has(alunoJSON["ROTA"])) {
                let rotaJSON = nomeRotaMap.get(alunoJSON["ROTA"]);
                alunoJSON["TEM_ROTA"] = true;
                alunoJSON["ROTA_ID"] = rotaJSON["ID"];
                alunoJSON["ROTA_NOME"] = rotaJSON["NOME"];
            } else {
                alunoJSON["TEM_ROTA"] = false;
                alunoJSON["ROTA_ID"] = "";
                alunoJSON["ROTA_NOME"] = "";
            }

            alunoMap.set(String(alunoJSON["ID"]), alunoJSON);
        }
    } catch (err) {
        alunos = [];
    }
    
    if (numAlunosTemGPS == 0) {
        return Promise.reject({ code: "erro:aluno" });
    } else if (numEscolasTemGPS == 0) {
        return Promise.reject({ code: "erro:escola" });
    } else {
        return alunoMap;
    }
}

// Preprocessa escolas
async function preprocessarEscolas() {
    let numTemGPS = 0;

    try {
        let escolas = await restImpl.dbGETColecao(DB_TABLE_ESCOLA);

        for (let escolaRaw of escolas) {
            let escolaJSON = parseEscolaREST(escolaRaw);
    
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
            nomeEscolaMap.set(escolaJSON["NOME"], escolaJSON);
        }
    } catch (err) {
        numTemGPS = 0;
    }

    if (numTemGPS == 0) {
        return Promise.reject({ code: "erro:escola" })
    } else {
        return escolaMap;
    }
}

// Preprocessa rotas
async function preprocessarRotas() {
    try {
        let rotas = await restImpl.dbGETColecao(DB_TABLE_ROTA);

        for (let rotaRaw of rotas) {
            let rotaJSON = parseRotaDBREST(rotaRaw);
            nomeRotaMap.set(rotaJSON["NOME"], rotaJSON);
        }
    } catch (err) {
        console.log("Não há nenhuma rota cadastrada");
    }
}

// Preprocessa garagens
async function preprocessarGaragem() {
    try {
        let garagensRaw = await restImpl.dbGETColecao(DB_TABLE_GARAGEM);
        let idGaragem =  garagensRaw[0]?.id_garagem;
        let garagemJSON = await restImpl.dbGETEntidade(DB_TABLE_GARAGEM, `/${idGaragem}`);
        
        if (garagemJSON["loc_latitude"] != "" && garagemJSON["loc_longitude"] != "" &&
            garagemJSON["loc_latitude"] != undefined && garagemJSON["loc_longitude"] != undefined &&
            garagemJSON["loc_latitude"] != null && garagemJSON["loc_longitude"] != null) {
            garagens.push({
                key: garagemJSON.id_garagem,
                tipo: "garagem",
                lat: garagemJSON["loc_latitude"],
                lng: garagemJSON["loc_longitude"]
            })
        } else {
            throw new Error("erro:garagem");
        }
    } catch (err) {
        return Promise.reject({ code: "erro:garagem" });
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

        if (escolaAluno && escolaAluno["GPS"]) {
            alunoJSON["ESCOLA_TEM_GPS"] = true;
            alunoMap.set(aID, alunoJSON);

            escolaAluno["TEM_ALUNO_COM_GPS"] = true;
            escolaMap.set(String(eID), escolaAluno);
            
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
        alunoJSON["TEM_ROTA"] = true;
        alunoJSON["ROTA"] = true;
        alunoJSON["ROTA_ID"] = rID;
        alunoJSON["ROTA_NOME"] = rNome;

        alunoMap.set(aID, alunoJSON);
    }
    return alunoMap;
};

// Pega os elementos do mapa e transforma no nosso array
function transformaAlunosEmArray(mapaAlunos) {
    let alunosArray = []
    mapaAlunos.forEach(([aID, a]) => {
        if (a["GPS"] && a["ESCOLA_TEM_GPS"]) {
            alunosArray.push({
                key: aID,
                tipo: "aluno",
                nome: a["NOME"],
                lat: a["LOC_LATITUDE"],
                lng: a["LOC_LONGITUDE"],
                turno: a["TURNOSTR"],
                nivel: a["NIVELSTR"],
                temEscola: a["TEM_ESCOLA"],
                school: String(a["ESCOLA_ID"]),
                escolaID: String(a["ESCOLA_ID"]),
                escolaNome: a["ESCOLA_NOME"],
                escolaTemGPS: a["ESCOLA_TEM_GPS"] ? "Sim" : "Não",
                passengers: 1
            })
        }
    })

    return alunosArray;
}

function transformaEscolaEmArray(mapaEscolas) {
    let escolasArray = []
    mapaEscolas.forEach(([eID, e]) => {
        if (e["GPS"] && e["TEM_ALUNO_COM_GPS"]) {
            escolasArray.push({
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

    return escolasArray;
}


function listaElementos() {
    alunos = transformaAlunosEmArray([...alunoMap])
    escolas = transformaEscolaEmArray([...escolaMap])

    drawMapElements(alunos, garagens, escolas, vSource);
    drawMapElements(alunos, garagens, escolas, gSource);
    setTimeout(() => {
        mapaConfig["map"].getView().fit(vSource.getExtent(), {
            padding: [40, 40, 40, 40]
        });
        mapaRotaGerada["map"].getView().fit(gSource.getExtent(), {
            padding: [40, 40, 40, 40]
        });
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
        let rotaCor = proximaCor();
        let camada = mapaRotaGerada["createLayer"](r["id"],
            `<span class="corRota" style="background-color: ${rotaCor}">  </span>Rota: ${numRota}`, true);

        // Adiciona tempo de viagem estimado
        let estTime = Number((r["geojson"]?.properties?.travDistance / $("#velMedia").val()) * 60)?.toFixed(2)
        if (estTime) {
            r["geojson"].properties["estTime"] = estTime;
            r["estTime"] = estTime;
        } else {
            r["geojson"].properties["estTime"] = "Não calculado";
            r["estTime"] = "Não calculado";
        }
        
        // Make this dynamic
        pickedRoute = r;
        pickedRouteLength = r["purejson"].coordinates.length;
        pickedLayer = camada.layer;
        
        // Add Route Drawing
        let gjson = new ol.format.GeoJSON({ featureProjection: 'EPSG:3857' }).readFeatures(r["geojson"]);
        let styles = new Array();
        styles.push(new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: "white",
                width: 7
            })
        }));
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


        // Adiciona para camadas
        rotasGeradas.set(numRota, {
            numRota,
            rotaCor,
            gjson,
            id: r["id"],
            payload: r,
            "picked": r,
            "length": pickedRouteLength,
            "layer": pickedLayer
        });

        numRota++;

        // let popup = buildPopup(r["id"], mapaRotaGerada["select"]);
        // mapaRotaGerada["map"].addOverlay(popup);
        grupoDeCamadas.unshift(camada.layer);
    });

    mapaRotaGerada["addGroupLayer"]("Rotas SIM-" + numSimulacao, grupoDeCamadas);
}


///////////////////////////////////////////////////////////////////////////////
// Animação
///////////////////////////////////////////////////////////////////////////////
function iniciaAnimacao(rotaID) {
    animating = false;

    let rotaPicked = rotasGeradas.get(rotaID);
    pickedLayer = rotaPicked["layer"];
    pickedRoute = rotaPicked["payload"];
    pickedRouteLength = pickedRoute["purejson"].coordinates.length;
    pickedLayer.setZIndex(2);
    startAnimation();
}

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
        animating = false;
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
    if (animating) {
        mapaRotaGerada["map"].render();
    }
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
var selectAlunoEscolaConfig = new ol.interaction.Select({
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
var selectAlunoEscolaRotaGerada = new ol.interaction.Select({
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
mapaConfig["map"].addInteraction(selectAlunoEscolaConfig);
mapaRotaGerada["map"].addInteraction(selectAlunoEscolaRotaGerada);

var popupAlunoEscolaConfig = new ol.Overlay.PopupFeature({
    popupClass: "default anim",
    select: selectAlunoEscolaConfig,
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
var popupAlunoEscolaRotaGerada = new ol.Overlay.PopupFeature({
    popupClass: "default anim",
    select: selectAlunoEscolaRotaGerada,
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
mapaConfig["map"].addOverlay(popupAlunoEscolaConfig);
mapaRotaGerada["map"].addOverlay(popupAlunoEscolaRotaGerada);

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
                after: ' km'        // something to add after
            },
            'estTime': {
                title: 'Tempo estimado',  // attribute's title
                before: '',           // something to add before
                format: ol.Overlay.PopupFeature.localString(),  // format as local string
                after: ' min'        // something to add after
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
    loadingFn("Simulando...")

    // Juntar dados em um objeto
    let routeGenerationInputData = {
        "maxTravDist": Number($("#maxDist").val()) * 1000,
        "maxTravTime": Number($("#maxTime").val()) * 60,
        "optTarget": "maxTravDist",
        "numVehicles": Number($("#numVehicles").val()),
        "maxCapacity": Number($("#maxCapacity").val()),
        "busSpeed": Number($("#velMedia").val()) / 3.6, // converte de km/h para m/s
        "garage": garagens,
        "stops": alunos,
        "schools": escolas,
    };

    ipcRenderer.send('start:route-generation', routeGenerationInputData);
};

if (isElectron) {
    // Trigger para finalizar simulação
    ipcRenderer.on("end:route-generation", function (evt, routesJSON) {
        setTimeout(function () {
            // Aumenta o contador de simulações
            numSimulacao++;
            userconfig.set("SIMULATION_COUNT", numSimulacao);
            $("#numSimulacao").text(numSimulacao);

            // Apaga rotas anteriores desenhadas
            mapaRotaGerada["rmGroupLayer"]();

            // Desenha novas rotas
            rotasGeradas = new Map();
            drawRoutes(routesJSON);

            // Ativa grupo
            let switcher = mapaRotaGerada["activateSidebarLayerSwitcher"](".sidebar-RotasGeradas");

            // Atualiza o mapa
            mapaRotaGerada["map"].updateSize();
            mapaRotaGerada["map"].getView().fit(gSource.getExtent(), {
                padding: [40, 40, 40, 40]
            });

            switcher.on('drawlist', function (e) {
                $(".ol-layer-vector").each((_, li) => {
                    let temBadge = $(li).find(".badge").length > 0 ? true : false;

                    if (!temBadge) {
                        let rotaID = Number($($(li).find("label")[0]).text().split(": ")[1]);
                        $($.parseHTML('<div class="badge badge-pill badge-warning pull-right"><i class="fa fa-map-o"></i></div>')).on('click', function () {
                            mapaRotaGerada["map"].getView().fit(gSource.getExtent(), {
                                padding: [40, 40, 40, 40]
                            });
                            iniciaAnimacao(rotaID);
                        })
                        .appendTo($(li));
                    }
                })
            });
            setTimeout(() => {
                $('.expend-layers').click();
                $('.ol-layerswitcher-buttons').hide();
                $('.layerswitcher-opacity').hide();
            }, 100);
            Swal2.close();
        }, 2000);
    });


    // Trigger para erro na simulação
    ipcRenderer.on("error:route-generation", function (event, err) {
        errorFn("Erro no processo de simulação de rota!", err)
    });
}

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
            min: 1,
            max: 360
        },
        maxDist: {
            required: true,
            number: true,
            min: 1,
            max: 300
        },
        velMedia: {
            required: true,
            number: true,
            min: 1,
            max: 120
        },
        numVehicles: {
            required: true,
            number: true,
            min: 1,
            max: 1000
        },
        maxCapacity: {
            required: true,
            number: true,
            min: 1,
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
        velMedia: {
            required: "Por favor informe a velocidade média dos veículos",
            min: "Por favor selecione um valor acima de 0 km/h",
            max: "Por favor selecione um valor abaixo de 120 km/h"
        },
        numVehicles: {
            required: "Por favor informe o número desejado (total) de veículos",
            min: "Por favor selecione um valor acima de 0 veículos",
            max: "Por favor selecione um valor abaixo de 1000 veículos",
        },
        maxCapacity: {
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

function validaDadosEscolhidos() {
    let formValido = true;

    // Verifica se tem alunos e escolas escolhidas
    if (alunos.length == 0) {
        errorFn(`Não é possível realizar a sugestão de rotas. Para esta combinação de parâmetros não há nenhum aluno georeferenciado`, 
                "", "Nenhum aluno georeferenciado neste caso");
        formValido = false;
    } else if (escolas.length == 0) {
        errorFn(`Não é possível realizar a sugestão de rotas. Para esta combinação de parâmetros não há nenhuma escola georeferenciada`, 
                "", "Nenhuma escola georeferenciada neste caso");
        formValido = false;
    }

    return formValido;
}

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
            // Após validação do form, vamos validar os dados no mapa
            if (validaDadosEscolhidos()) {
                window.scroll(0, 0);
                if (index == 1) {
                    initSimulation();
                }
            } else {
                return false;
            }
        }
    },

    onTabClick: function (tab, navigation, index) {
        var $valid = $('#wizardSugestaoRotaForm').valid();
        if (!$valid) {
            return false;
        } else {
            if (index == 1 && validaDadosEscolhidos()) {
                window.scroll(0, 0);
                return true;
            } else {
                return false;
            }
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
            startTool();
            $($wizard).find('.btn-next').show();
            $($wizard).find('.btn-finish').hide();
        }
    }
});


////////////////////////////////////////////////////////////////////////////////
// Replota dados
////////////////////////////////////////////////////////////////////////////////
function replotaDados() {
    let filtroTurno = [Number($("input[name='turno']:checked").val())];
    let filtroSemRota = $("input[name='publico']:checked").val() == "semRota";
    if (filtroTurno.indexOf(4) >= 0) {
        filtroTurno = [1,2] // FILTRANDO NO TURNO DA MANHÃ E TARDE AO MESMO TEMPO
    } else if (filtroTurno.indexOf(5) >= 0) {
        filtroTurno = [2,3] // FILTRANDO NO TURNO DA TARDE E NOITE AO MESMO TEMPO
    }

    // Filtrando
    let escolasAlunosFiltrados = new Set();
    let alunosFiltrados = [...alunoMap].filter((a) => {
        let alunoFiltrado = false;
        
        if (filtroSemRota) {
            alunoFiltrado = a[1]["GPS"] && a[1]["ESCOLA_TEM_GPS"] && filtroTurno.indexOf(a[1]["TURNO"]) >= 0 && a[1]["TEM_ROTA"] == false;
        } else {
            alunoFiltrado = a[1]["GPS"] && a[1]["ESCOLA_TEM_GPS"] && filtroTurno.indexOf(a[1]["TURNO"]) >= 0;
        }

        if (alunoFiltrado) {
            escolasAlunosFiltrados.add(a[1]["ESCOLA_ID"]);
        }

        return alunoFiltrado;
    })

    let escolasFiltradas = [...escolaMap].filter((e) => escolasAlunosFiltrados.has(e[1]["ID"]) && e[1]["GPS"])

    alunos = transformaAlunosEmArray(alunosFiltrados);
    escolas = transformaEscolaEmArray(escolasFiltradas);

    // Limpando dados do mapa
    vSource.clear();
    gSource.clear();

    drawMapElements(alunos, garagens, escolas, vSource);
    drawMapElements(alunos, garagens, escolas, gSource);
}

$('input[type=radio][name=publico]').on('change', (evt) => {
    replotaDados();
})

$('input[type=radio][name=turno]').on('change', (evt) => {
    replotaDados();
})

////////////////////////////////////////////////////////////////////////////////
// Salvar Rotas
////////////////////////////////////////////////////////////////////////////////

$("#rota-sugestao-saveBtnSim").on('click', () => {
    let numRotas = $(".visible.ol-layer-vector").length;
    if (numRotas == 0) {
        errorFn("Nenhuma rota selecionada");
    } else {
        let rotasLabels = ["<strong>Note que os alunos selecionados serão transferidos para as rotas selecionadas.</strong>"]
        let rotasSelecionadas = []
        $(".visible.ol-layer-vector").each((_, li) => {
            let lbl = $(li).find("label");
            rotasSelecionadas.push(Number(lbl.text().split(": ")[1]))
            rotasLabels.push(lbl.html())
        })

        Swal2.fire({
            title: 'Você deseja salvar as rotas abaixo?',
            icon: 'question',
            html: rotasLabels.join("<br />"),
            showCancelButton: true,
            cancelButtonText: "Cancelar",
            confirmButtonText: "Salvar"    
        }).then((res) => {
            if (res.isConfirmed) {
                Swal2.fire({
                    title: "Salvando as rotas...",
                    imageUrl: "img/icones/processing.gif",
                    closeOnClickOutside: false,
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    html: `
                    <br />
                    <div class="progress" style="height: 20px;">
                        <div id="pbar" class="progress-bar" role="progressbar" 
                             aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" 
                             style="width: 0%;">
                        </div>
                    </div>
                    `
                })

                var numAlunos = 0;
                var numEscolas = 0;
                var numRotas = rotasSelecionadas.length;
                
                var rotasQueVamosSalvar = [];

                rotasSelecionadas.forEach(rID => {
                    let rg = rotasGeradas.get(rID);
                    if (rg) {
                        let rgAlunos = rg.payload.path.filter(k => k.type == "stop");
                        let rgEscolas = rg.payload.path.filter(k => k.type == "otherschool" || k.type == "school");

                        rotasQueVamosSalvar.push({
                            "id": "ROTA-SIM-" + numSimulacao + "-" + rID,
                            "rota": rg,
                            "alunos": rgAlunos,
                            "escolas": rgEscolas
                        })

                        numAlunos += rgAlunos.length;
                        numEscolas += rgEscolas.length;
                    }
                })

                var totalOperacoes = numAlunos + numAlunos + numEscolas + numRotas + 1; 
                var progresso = 0;

                function updateProgresso() {
                    progresso++;
                    let progressoPorcentagem = Math.round(100 * (progresso / totalOperacoes))
                    $('.progress-bar').css('width', progressoPorcentagem + "%")
                    $('.progress-bar').text(progressoPorcentagem + "%")
                }

                // Promessas de Relações Antigas
                var promiseArrayRelacoesAntigas = new Array();

                // Remove das rotas atuais (se tiver vinculado)
                for (r of rotasQueVamosSalvar) { 
                    for (a of r.alunos) { 
                        console.log("REMOVER ROTA", a.id)
                        // Remove da escola atual (se tiver matriculado)
                        remotedb.collection("municipios")
                            .doc(codCidade)
                            .collection("rotaatendealuno")
                            .where("ID_ALUNO", "==", a.id)
                            .get({ source: "cache" })
                            .then((snapshotDocumentos) => {
                                updateProgresso()
                                snapshotDocumentos.forEach(doc => {
                                    promiseArrayRelacoesAntigas.push(doc.ref.delete())
                                })
                            })
                    }
                }

                Promise.all(promiseArrayRelacoesAntigas)
                .then(() => {
                    var promiseArrayRelacoes = new Array();

                    // Adicionar as novas rotas
                    for (r of rotasQueVamosSalvar) { 
                        r.alunos.forEach(a => promiseArrayRelacoes.push(
                            dbInserirPromise(DB_TABLE_ROTA_ATENDE_ALUNO, { "ID_ROTA": r.id, "ID_ALUNO": a.id })
                            .then(() => updateProgresso())
                            // console.log("TABLE_ATENDE_ALUNO", r.id, a.id)
                        ));

                        r.escolas.forEach(e => promiseArrayRelacoes.push(
                            dbInserirPromise(DB_TABLE_ROTA_PASSA_POR_ESCOLA, { "ID_ROTA": r.id, "ID_ESCOLA": e.id })
                            .then(() => updateProgresso())
                            // console.log("TABLE_PASSA_POR_ESCOLA", r.id, e.id)
                        ));

                        let rotaPayload = r.rota.payload;

                        let rotaJSON = {
                            "TIPO": 1, // int
                            "NOME": r.id, // string
                            "KM": (rotaPayload.travDistance / 1000).toFixed(2), // text
                            "TEMPO": rotaPayload.estTime, // text
                            "TURNO_MATUTINO": $("#turnoManha").is(":checked"), // bool
                            "TURNO_VESPERTINO": $("#turnoTarde").is(":checked"), // bool
                            "TURNO_NOTURNO": $("#turnoNoite").is(":checked"), // bool                    
                            "SHAPE": new ol.format.GeoJSON().writeFeatures(r.rota.gjson),

                            // campos default
                            "HORA_IDA_INICIO": "", 
                            "HORA_IDA_TERMINO": "", 
                            "HORA_VOLTA_INICIO": "", 
                            "HORA_VOLTA_TERMINO": "", 
                            "DA_PORTEIRA": false,
                            "DA_MATABURRO": false,
                            "DA_COLCHETE": false, 
                            "DA_ATOLEIRO": false, 
                            "DA_PONTERUSTICA": false,
                        }
                        promiseArrayRelacoes.push(
                            dbInserirPromise(DB_TABLE_ROTA, rotaJSON, r.id).then(() => updateProgresso())
                        );
                        promiseArrayRelacoes.push(
                            dbAtualizaVersao().then(() => updateProgresso())
                        );
                    }
                    return Promise.all(promiseArrayRelacoes)
                }).then(() => {
                    return Swal2.fire({
                        title: "Rotas salvas com sucesso",
                        icon: "success",
                        showCancelButton: false,
                        confirmButtonClass: "btn-success",
                        confirmButtonText: "Retornar ao painel",
                        closeOnConfirm: false,
                        closeOnClickOutside: false,
                        allowOutsideClick: false,
                        showConfirmButton: true
                    })
                }).then(() => {
                    navigateDashboard("./modules/rota/rota-listar-view.html");
                }).catch((err) => errorFn("Erro ao salvar as rotas sugeridas", err));
            }
        })
    }
})
// $(".visible.ol-layer-vector")