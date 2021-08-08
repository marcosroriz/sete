// dashboard-ctrl.js
// Este arquivo provê os scripts básicos para controlar a tela inicial do SETE

// Mapa do dashboard
var mapa = novoMapaOpenLayers("mapaDashboard", cidadeLatitude, cidadeLongitude);

// Variável que armazena os alunos apresentados (será preenchida)
var hashMapAlunos = new Map();
var hashMapEscolas = new Map();
var hashMapRotas = new Map();

window.onresize = function () {
    setTimeout(function () {
        if (mapa != null) { mapa["map"].updateSize(); }
    }, 200);
}

var vectorSource = mapa["vectorSource"];
var vectorLayer = mapa["vectorLayer"];
var mapaOL = mapa["map"];

// Ativa busca
mapa["activateGeocoder"]();

// Ativa camadas
// mapa["activateImageLayerSwitcher"]();

// Ativa impressão
// mapa["activatePrinting"]();

// Mapa do dashboard
$("[name='mostrarAlunos']").bootstrapSwitch();
$("[name='mostrarEscolas']").bootstrapSwitch();
$("[name='mostrarRotas']").bootstrapSwitch();
$("[name='mostrarVeiculos']").bootstrapSwitch();


// Mostra âncora de loading
$(".content").hide();

if (firstAcess) {
    loadingFn("Sincronizando os dados com a nuvem...", "Espere um minutinho...");
    $(".preload").hide();
} else {
    $(".preload").show();
}

// Ativa links de navegação
$(".link-dash").on('click', function () {
    navigateDashboard("./modules/" + $(this).attr("name") + ".html");
});

// Seta o usuário do firebase
firebase.auth().onAuthStateChanged((user) => {
    if (user && user.uid == userconfig.get("ID")) {
        firebaseUser = user;
        var userDocPromise = remotedb.collection("users").doc(firebaseUser.uid).get();
        userDocPromise.then((queryResult) => {
            userData = queryResult.data();
            $("#userName").html(userData["NOME"].split(" ")[0]);
        })
    }
});

// Verifica se DB está sincronizado antes de colocar dados na tela do dashboard
dbEstaSincronizado()
    .then((estaSincronizado) => {
        if (!estaSincronizado) {
            console.log("PRECISAMOS SINCRONIZAR")
            return dbSincronizar();
        } else {
            // Está sincronizado
            console.log("ESTÁ SINCRONIZADO")
            return true;
        }
    })
    .then(() => preencheDashboard())
    .then(() => {
        $(".preload").fadeOut(200, function () {
            $(".content").fadeIn(200);
        });
        Swal2.close()

        mostraSeTemUpdate(firstAcess);
        firstAcess = false;

        return firstAcess
    })
    .then(() => preencheRelacoes())
    .then(() => preencheMapa())
    .catch((err) => {
        errorFn("Erro ao sincronizar, sem conexão com a Internet")
        $(".preload").fadeOut(200, function () {
            $(".content").fadeIn(200);
        });
    })

// Mostra se update (ver github version)
function mostraSeTemUpdate(firstAcess) {
    if (firstAcess) {
        fetch("https://raw.githubusercontent.com/marcosroriz/sete/master/package.json")
            .then(res => res.json())
            .then(pkg => {
                let upVersion = pkg.version;
                let currentVersion = app.getVersion();
                if (upVersion != currentVersion) {
                    $.notify({
                        icon: 'ml-1 fa fa-cloud-download menu-icon',
                        title: 'Saiu uma nova versão do SETE',
                        message: 'Clique aqui para entrar na página do SETE',
                        url: 'https://www.gov.br/fnde/pt-br/assuntos/sistemas/sete-sistema-eletronico-de-gestao-do-transporte-escolar',
                        target: '_blank'
                    }, {
                        type: "warning",
                        delay: 0
                    })
                }
            })
    }
}

// Preenche Dashboard
function preencheDashboard() {
    var dashPromises = new Array();

    dashPromises.push(dbBuscarTodosDadosPromise(DB_TABLE_ALUNO).then((res) => {
        res.forEach(aluno => hashMapAlunos.set(aluno["ID"], parseAlunoDB(aluno)))
    }))

    dashPromises.push(dbBuscarTodosDadosPromise(DB_TABLE_ESCOLA).then((res) => {
        res.forEach(escola => {
            let escolaJSON = parseEscolaDB(escola);
            escolaJSON["NUM_ALUNOS"] = 0;
            hashMapEscolas.set(escolaJSON["ID"], escolaJSON);
        })
    }))

    dashPromises.push(dbBuscarTodosDadosPromise(DB_TABLE_ESCOLA_TEM_ALUNOS).then((res) => {
        $("#alunosAtendidos").text(res.length);

        let escolasAtendidas = new Set()
        res.forEach(relEscolaAluno => escolasAtendidas.add(relEscolaAluno["ID_ESCOLA"]))

        $("#escolasAtendidas").text(escolasAtendidas.size);
    }))

    dashPromises.push(dbBuscarTodosDadosPromise(DB_TABLE_VEICULO).then((res) => {
        let func = naofunc = 0;
        res.forEach(veiculo => veiculo["MANUTENCAO"] ? naofunc++ : func++)
        $("#veiculosFuncionamento").text(func);
        $("#veiculosNaoFuncionamento").text(naofunc);
    }))

    dashPromises.push(dbBuscarTodosDadosPromise(DB_TABLE_ROTA).then((res) => {
        var totalRotas = res.length;
        var totalKM = 0;
        var totalKMMedio = 0;
        var totalTempo = 0;
        res.forEach((rota) => {
            totalKM = totalKM + parseFloat(rota["KM"]);
            totalTempo = totalTempo + parseFloat(rota["TEMPO"]);
            rota["NUM_ALUNOS_ROTA"] = 0;
            hashMapRotas.set(rota["ID"], rota)
        });

        if (totalRotas != 0) {
            totalKMMedio = Math.round(totalKM / totalRotas);
            totalTempo = Math.round(totalTempo / totalRotas);
        }

        $("#qtdeRotas").text(totalRotas);
        $("#kmTotal").text(Math.round(totalKM) + " km");
        $("#kmMedio").text(totalKMMedio + " km");
        $("#tempoMedio").text(totalTempo + " min");
    }))

    return Promise.all(dashPromises)
}

function preencheRelacoes() {
    var dashPromises = new Array();

    dashPromises.push(dbBuscarTodosDadosPromise(DB_TABLE_ESCOLA_TEM_ALUNOS).then((res) => {
        for (let relEscolaAluno of res) {
            let eID = relEscolaAluno["ID_ESCOLA"];
            let aID = relEscolaAluno["ID_ALUNO"];

            if (hashMapEscolas.has(eID)) {
                let escolaJSON = hashMapEscolas.get(eID);
                let alunoJSON = hashMapAlunos.get(aID);

                escolaJSON["NUM_ALUNOS"] = escolaJSON["NUM_ALUNOS"] + 1;
                if (alunoJSON) { // tem GPS
                    alunoJSON["ESCOLA"] = escolaJSON["NOME"];
                    hashMapAlunos.set(aID, alunoJSON);
                }
                hashMapEscolas.set(eID, escolaJSON);
            }
        }
    }))

    dashPromises.push(dbBuscarTodosDadosPromise(DB_TABLE_ROTA_ATENDE_ALUNO).then((res) => {
        for (let relRotaAluno of res) {
            let rID = relRotaAluno["ID_ROTA"];
            let aID = relRotaAluno["ID_ALUNO"];

            if (hashMapRotas.has(rID)) {
                let rotaJSON = hashMapRotas.get(rID);
                let alunoJSON = hashMapAlunos.get(aID);

                rotaJSON["NUM_ALUNOS_ROTA"] = rotaJSON["NUM_ALUNOS_ROTA"] + 1;
                if (alunoJSON) { // tem 
                    alunoJSON["ROTA"] = rotaJSON["NOME"];
                    hashMapAlunos.set(aID, alunoJSON);
                }
                hashMapRotas.set(rID, rotaJSON);
            }
        }
    }))

    return Promise.all(dashPromises)
}

// Preenche Mapa
function preencheMapa() {
    let categoriasAluno = ["Infantil", "Fundamental", "Médio", "Superior", "Outro"];
    let categoriasEscola = ["Municipal", "Estadual", "Federal", "Privada"];

    let lyrAluno = {};
    let lyrEscola = {};
    let lyrRotas = {};

    categoriasAluno.forEach(cat => lyrAluno[cat] = mapa["createLayer"](cat, cat, true))
    categoriasEscola.forEach(cat => lyrEscola[cat] = mapa["createLayer"](cat, cat, true))

    for (let aluno of hashMapAlunos.values()) {
        if (categoriasAluno.includes(aluno.NIVELSTR) &&
            aluno["LOC_LONGITUDE"] != "" && aluno["LOC_LONGITUDE"] != undefined &&
            aluno["LOC_LATITUDE"] != "" && aluno["LOC_LONGITUDE"] != undefined) {
            let vSource = lyrAluno[aluno.NIVELSTR].source;
            vSource.addFeature(plotarAluno(aluno));

            let vLayer = lyrAluno[aluno.NIVELSTR].layer;
            vLayer.setZIndex(10);
        }
    }

    let grupoLayersAlunos = [];
    categoriasAluno.reverse().forEach(cat => grupoLayersAlunos.push(lyrAluno[cat].layer));

    for (let escola of hashMapEscolas.values()) {
        if (categoriasEscola.includes(escola.DEPENDENCIA) &&
            escola["LOC_LONGITUDE"] != "" && escola["LOC_LONGITUDE"] != undefined &&
            escola["LOC_LATITUDE"] != "" && escola["LOC_LONGITUDE"] != undefined) {
            let vSource = lyrEscola[escola.DEPENDENCIA].source;
            vSource.addFeature(plotarEscola(escola));

            let vLayer = lyrEscola[escola.DEPENDENCIA].layer;
            vLayer.setZIndex(20);
        }
    }

    let grupoLayersEscolas = [];
    categoriasEscola.reverse().forEach(cat => grupoLayersEscolas.push(lyrEscola[cat].layer));

    for (let rota of hashMapRotas.values()) {
        if (rota["SHAPE"] != "" && rota["SHAPE"] != null && rota["SHAPE"] != undefined) {
            try {
                let rotaNome = rota["NOME"];
                let rotaCor = proximaCor();
                let rotaGeoJSON = (new ol.format.GeoJSON()).readFeatures(rota["SHAPE"]);

                // Processando rota
                let tamanhoRota = 0;
                let tamanhoRotaStr = "";
                rotaGeoJSON.forEach(f => {
                    if (f.getGeometry() instanceof ol.geom.LineString) {
                        tamanhoRota = tamanhoRota + ol.sphere.getLength(f.getGeometry());
                    }
                })

                if (tamanhoRota > 100) {
                    tamanhoRotaStr = (Math.round(tamanhoRota / 1000 * 100) / 100) + ' ' + 'km';
                } else {
                    tamanhoRotaStr = (Math.round(tamanhoRota * 100) / 100) + ' ' + 'm';
                }

                rotaGeoJSON.forEach(f => {
                    f.set("NOME", rota["NOME"]);
                    f.set("KM", rota["KM"]);
                    f.set("TEMPO", rota["TEMPO"]);
                    f.set("NUM_ALUNOS_ROTA", rota["NUM_ALUNOS_ROTA"]);
                    f.set("TIPO", "ROTA");
                });

                let rotaStyles = [
                    new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: "white",
                            width: 7
                        })
                    }),
                    new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: rotaCor,
                            width: 5
                        })
                    })
                ]

                let camada = mapa["createLayer"](rotaNome, rotaNome, true)
                camada.source.addFeatures(rotaGeoJSON);
                camada.layer.setStyle(rotaStyles);
                camada.layer.setZIndex(1);

                lyrRotas[rotaNome] = camada;
            } catch (error) {
                console.log(error);
            }
        }
    }

    let grupoLayersRotas = [];
    [...hashMapRotas.keys()].sort((a, b) => {
        let nomeA = hashMapRotas.get(a)["NOME"]?.toLowerCase();
        let nomeB = hashMapRotas.get(b)["NOME"]?.toLowerCase();
        return nomeA.localeCompare(nomeB);
    }).reverse().forEach(rotaKey => {
        let rota = hashMapRotas.get(rotaKey);
        console.log("rota", hashMapRotas[rotaKey])
        if (rota["NOME"] in lyrRotas) {
            grupoLayersRotas.push(lyrRotas[rota["NOME"]].layer)
        }
    });

    var layers = [
        new ol.layer.Tile({ source: new ol.source.Stamen({ layer: 'watercolor' }), title: 'watercolor' }),
        // new ol.layer.Tile({ source: new ol.source.Stamen({ layer: 'toner-background' }), title: 'toner-background' }),
        // new ol.layer.Tile({ source: new ol.source.Stamen({ layer: 'terrain-background' }), title: 'terrain-background' }),
        // new ol.layer.Tile({ source: new ol.source.Stamen({ layer: 'toner-lines' }), title: 'toner-lines' }),
        // new ol.layer.Tile({ source: new ol.source.Stamen({ layer: 'terrain-lines' }), title: 'terrain-lines' }),
        // new ol.layer.Group({
        //     title: 'labels', openInLayerSwitcher: true, layers: [
        //         new ol.layer.Tile({ source: new ol.source.Stamen({ layer: 'toner-labels' }), title: 'toner-labels' }),
        //         new ol.layer.Tile({ source: new ol.source.Stamen({ layer: 'terrain-labels' }), title: 'terrain-labels' }),
        //     ]
        // })
    ];

    // Add a layer switcher outside the map
    mapa["addGroupLayer"]("Rotas", grupoLayersRotas);
    mapa["addGroupLayer"]("Escolas", grupoLayersEscolas);
    mapa["addGroupLayer"]("Alunos", grupoLayersAlunos);

    // Popup
    mapa["map"].addInteraction(selectAlunoEscolaConfig);
    mapa["map"].addOverlay(popupAlunoEscolaConfig);

    var lswitcher = new ol.control.LayerSwitcher({
        target: $(".camadasMapaDashboard").get(0),
        reordering: false,
        extent: true,
        trash: false,
    });
    mapaOL.addControl(lswitcher);
    setTimeout(function () {
        if (mapaOL != null) { mapaOL.updateSize(); }
    }, 200);
}

// Cria feature de um aluno
var plotarAluno = (aluno) => {
    let alat = aluno["LOC_LATITUDE"];
    let alng = aluno["LOC_LONGITUDE"];
    let pontoAluno = gerarMarcador(alat, alng, "img/icones/aluno-marcador.png");

    pontoAluno.setId(aluno["ID_ALUNO"]);
    pontoAluno.set("NOME", aluno["NOME"]);
    pontoAluno.set("DATA_NASCIMENTO", aluno["DATA_NASCIMENTO"]);
    pontoAluno.set("ESCOLA", aluno["ESCOLA"]);
    pontoAluno.set("TURNOSTR", aluno["TURNOSTR"]);
    pontoAluno.set("NIVELSTR", aluno["NIVELSTR"]);
    pontoAluno.set("TIPO", "ALUNO");

    if (aluno["SEXO"] == 1) {
        pontoAluno.set("SEXO", "Masculino");
    } else {
        pontoAluno.set("SEXO", "Feminino");
    }

    return pontoAluno;
}

// Cria feature de uma escola
var plotarEscola = (escolaJSON) => {
    let escolaID = escolaJSON["ID_ESCOLA"];
    let lat = escolaJSON["LOC_LATITUDE"];
    let lng = escolaJSON["LOC_LONGITUDE"];

    let pontoEscola = gerarMarcador(lat, lng, "img/icones/escola-marcador.png");
    pontoEscola.setId(escolaID);
    pontoEscola.set("NOME", escolaJSON["NOME"]);
    pontoEscola.set("TIPO", "ESCOLA");
    pontoEscola.set("DEPENDENCIA", escolaJSON["DEPENDENCIA"]);
    pontoEscola.set("HORARIO", escolaJSON["HORARIO"]);
    pontoEscola.set("REGIME", escolaJSON["REGIME"]);
    pontoEscola.set("ENSINO", escolaJSON["ENSINO"])
    pontoEscola.set("NUM_ALUNOS", escolaJSON["NUM_ALUNOS"]);
    pontoEscola.set("CONTATO_TELEFONE", escolaJSON["CONTATO_TELEFONE"]);

    return pontoEscola;
}


///////////////////////////////////////////////////////////////////////////////
// Popup
///////////////////////////////////////////////////////////////////////////////
var selectAlunoEscolaConfig = new ol.interaction.Select({
    hitTolerance: 5,
    multi: false,
    condition: ol.events.condition.singleClick,
    filter: (feature, layer) => {
        console.log("feature", feature.getProperties())
        if ((feature.getGeometry().getType() == "Point" && (feature.getProperties().TIPO == "ALUNO" || 
                                                            feature.getProperties().TIPO == "ESCOLA")) 
            || 
            (feature.getGeometry().getType() == "LineString" && feature.getProperties().TIPO == "ROTA")) {
            return true;
        } else {
            return false;
        }
    }
});

var popupAlunoEscolaConfig = new ol.Overlay.PopupFeature({
    popupClass: "default anim",
    select: selectAlunoEscolaConfig,
    closeBox: true,
    template: {
        title: (elem) => {
            return elem.get("NOME");
        },
        attributes: {
            'NIVELSTR': {
                title: "Série",
                visible: (e) => e.getProperties().TIPO == "ALUNO"
            },
            'TURNOSTR': {
                title: "Turno",
                visible: (e) => e.getProperties().TIPO == "ALUNO"
            },
            'ESCOLA': {
                title: "Escola",
                visible: (e) => e.getProperties().TIPO == "ALUNO"
            },
            'DEPENDENCIA': {
                title: "Tipo",
                visible: (e) => e.getProperties().TIPO == "ESCOLA"
            },
            'REGIME': {
                title: "Regime",
                visible: (e) => e.getProperties().TIPO == "ESCOLA"
            },
            'ENSINO': {
                title: "Níveis",
                visible: (e) => e.getProperties().TIPO == "ESCOLA"
            },
            'HORARIO': {
                title: "Horário de Funcionamento",
                visible: (e) => e.getProperties().TIPO == "ESCOLA"
            },
            'CONTATO_TELEFONE': {
                title: "Contato",
                visible: (e) => e.getProperties().TIPO == "ESCOLA"
            },
            'NUM_ALUNOS': {
                title: "Número de alunos",
                visible: (e) => e.getProperties().TIPO == "ESCOLA"
            },
            'KM': {
                title: 'Tamanho da Rota',  // attribute's title
                before: '',           // something to add before
                format: ol.Overlay.PopupFeature.localString(),  // format as local string
                after: ' km',        // something to add after
                visible: (e) => e.getProperties().TIPO == "ROTA"
            },
            'TEMPO': {
                title: 'Tempo estimado',  // attribute's title
                before: '',           // something to add before
                format: ol.Overlay.PopupFeature.localString(),  // format as local string
                after: ' min',        // something to add after
                visible: (e) => e.getProperties().TIPO == "ROTA"
            },
            'NUM_ALUNOS_ROTA': {
                title: "Número de alunos",
                visible: (e) => e.getProperties().TIPO == "ROTA"
            },
        }
    }
});
