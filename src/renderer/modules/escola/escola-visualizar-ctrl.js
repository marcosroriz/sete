// escola-visualizar-ctrl.js
// Este arquivo contém o script de controle da tela escola-visualizar-view. 
// O mesmo serve para visualizar a posição das escolas no mapa.

var escolaVisualizada = null;
var escolas = new Map();
var hashMapEscolas = new Map();
var listaDeAlunos = new Map();

// Dados básicos do mapa
var mapaViz = novoMapaOpenLayers("mapVizEscola", cidadeLatitude, cidadeLongitude);
var vSource = mapaViz["vectorSource"];
var vLayer = mapaViz["vectorLayer"];
vLayer.setZIndex(100);

var bufferMap = mapaViz.addLayer("buffer");
var bufferSource = bufferMap["source"];
var bufferLayer = bufferMap["layer"];
bufferLayer.setZIndex(1);
bufferLayer.setStyle((feat, res) => {
    let estilos = {};

    estilos["R5"] = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'rgba(254, 232, 200, 1)',
            width: '3',
        }),
        fill: new ol.style.Fill({
            color: 'rgba(254, 232, 200, 0.5)',
        }),
    })

    estilos["R10"] = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'rgba(253, 187, 132, 1)',
            width: 3,
        }),
        fill: new ol.style.Fill({
            color: 'rgba(253, 187, 132, 0.5)',
        }),
    })

    estilos["R15"] = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'rgba(227, 74, 51, 1)',
            width: 3,
        }),
        fill: new ol.style.Fill({
            color: 'rgba(227, 74, 51, 0.5)',
        }),
    })
    console.log(feat.getProperties())
    return estilos[feat.getProperties()["RANK"]]
});


// Ativa busca e camadas
mapaViz["activateGeocoder"]();
mapaViz["activateImageLayerSwitcher"]();
mapaViz["map"].updateSize();

window.onresize = function () {
    setTimeout(function () {
        if (mapaViz != null) { mapaViz["map"].updateSize(); }
    }, 200);
}

dbBuscarTodosDadosPromise(DB_TABLE_ESCOLA)
    .then(res => processarEscolas(res))
    .then(() => dbBuscarTodosDadosPromise(DB_TABLE_ALUNO))
    .then(res => preprocessarAlunos(res))
    .then(() => dbBuscarTodosDadosPromise(DB_TABLE_ESCOLA_TEM_ALUNOS))
    .then((res) => preprocessarRelacaoEscolaAluno(res))
    .then((res) => adicionaDadosMapa(res))


// Processa escolas
var processarEscolas = (res) => {
    res.sort((a, b) => a["NOME"].localeCompare(b["NOME"]))

    for (let escolaRaw of res) {
        let escolaJSON = parseEscolaDB(escolaRaw);
        let escolaID = escolaJSON["ID"];
        escolaJSON["ID_ESCOLA"] = escolaID;
        escolaJSON["NUM_ALUNOS"] = 0;
        escolaJSON["ALUNOS"] = [];
        hashMapEscolas.set(escolaID, escolaJSON);
    }

    return hashMapEscolas;
}

// Preprocessa alunos
var preprocessarAlunos = (res) => {
    for (let alunoRaw of res) {
        let alunoJSON = parseAlunoDB(alunoRaw);
        alunoJSON["ID_ALUNO"] = alunoJSON["ID"]

        // Só adicionamos (mostraremos) os alunos que tem posição cadastrada!
        if (alunoJSON["LOC_LONGITUDE"] != "" && alunoJSON["LOC_LONGITUDE"] != undefined &&
            alunoJSON["LOC_LATITUDE"] != "" && alunoJSON["LOC_LONGITUDE"] != undefined) {
            listaDeAlunos.set(alunoJSON["ID"], alunoJSON);
        }
    }
    return listaDeAlunos;
}


// Preprocessa relação de escolas e alunos para pegar o quantitativo entre eles
var preprocessarRelacaoEscolaAluno = (res) => {
    for (let relEscolaAluno of res) {
        let eID = relEscolaAluno["ID_ESCOLA"];
        let aID = relEscolaAluno["ID_ALUNO"];

        if (hashMapEscolas.has(eID)) {
            let escolaJSON = hashMapEscolas.get(eID);
            let alunoJSON = listaDeAlunos.get(aID);

            escolaJSON["NUM_ALUNOS"] = escolaJSON["NUM_ALUNOS"] + 1;
            if (alunoJSON) { // tem GPS
                escolaJSON["ALUNOS"].push(alunoJSON);
            }
            hashMapEscolas.set(eID, escolaJSON);
        }
    }

    return hashMapEscolas;
}

// Adiciona dados no Mapa
adicionaDadosMapa = (res) => {
    let escolaArray = [...res.values()];
    escolaArray.sort((a, b) => a["NOME"].localeCompare(b["NOME"]))

    for (let escolaJSON of escolaArray) {
        let escolaID = escolaJSON["ID"];
        escolaJSON["ID_ESCOLA"] = escolaID;

        // Só adicionamos (mostraremos) as escolas que tem posição cadastrada!
        if (escolaJSON["LOC_LONGITUDE"] != "" && escolaJSON["LOC_LONGITUDE"] != undefined &&
            escolaJSON["LOC_LATITUDE"] != "" && escolaJSON["LOC_LONGITUDE"] != undefined) {
            plotarEscola(escolaJSON);
            $('#escolaViz').append(`<option value="${escolaID}">${escolaJSON['NOME']} ✔️</option>`);
        } else {
            $('#escolaViz').append(`<option value="${escolaID}">${escolaJSON['NOME']} ❌</option>`);
        }
    }

    if (!vSource.isEmpty()) {
        mapaViz["map"].getView().fit(vSource.getExtent(), {
            padding: [40, 40, 40, 40]
        });
        mapaViz["map"].updateSize();
    }
}

// Select para lidar com click nas escolas
var selectEscola = selectPonto("ESCOLA");

// Popup escola
mapaViz["map"].addInteraction(selectEscola);
var popupEscola = new ol.Overlay.PopupFeature({
    popupClass: "default anim",
    select: selectEscola,
    closeBox: true,
    template: {
        title: (elem) => {
            return elem.get("NOME");
        },
        attributes: {
            'HORARIO': {
                title: 'Horário de Func.'
            },
            'CONTATO_TELEFONE': {
                title: "Telefone"
            },
            'ENSINO': {
                title: 'Ensino'
            },
            'REGIME': {
                title: 'Regime'
            },
            'NUM_ALUNOS': {
                title: 'Número de alunos'
            }
        }
    }
});

// Adiciona no mapa
mapaViz["map"].addOverlay(popupEscola);

$("#escolaViz").on('change', (e) => {
    var eID = e.target.value;

    if (eID != "0" && eID != 0) {
        if (escolas.has(eID)) {
            vSource.clear();

            let escolaJSON = hashMapEscolas.get(eID);
            let alunos = escolaJSON["ALUNOS"];

            plotarBuffer(escolaJSON);

            for (let alunoJSON of alunos) {
                plotarAluno(alunoJSON);
            }

            plotarEscola(escolaJSON);
            let coordenadasEscola = escolas.get(eID)
            mapaViz["map"].getView().setCenter(ol.proj.fromLonLat(coordenadasEscola))
        } else {
            errorFn("Esta escola ainda não foi georeferenciada")
        }
    } else {
        // Limpando dados do mapa
        vSource.clear();

        let escolaArray = [...hashMapEscolas.values()];
        for (let escolaJSON of escolaArray) {
            plotarEscola(escolaJSON);
        }

        mapaViz["map"].getView().fit(vSource.getExtent(), {
            padding: [40, 40, 40, 40]
        });
        mapaViz["map"].updateSize();
    }
});

// Interações com alunos
// Select para lidar com click no aluno
var selectAluno = selectPonto("ALUNO");

// Popup aluno
mapaViz["map"].addInteraction(selectAluno);
var popupAluno = new ol.Overlay.PopupFeature({
    popupClass: "default anim",
    select: selectAluno,
    closeBox: true,
    template: {
        title: (elem) => {
            return "Aluno " + elem.get("NOME");
        },
        attributes: {
            'NOME': {
                title: 'Nome'
            },
            'SEXO': {
                title: 'Sexo'
            },
            'DATA_NASCIMENTO': {
                title: 'Data de Nascimento'
            },
            'ESCOLA': {
                title: 'Escola'
            },
            'NIVELSTR': {
                title: 'Nível'
            },
            'TURNOSTR': {
                title: 'Turno'
            },
        }
    }
});
mapaViz["map"].addOverlay(popupAluno);

// Cria feature de uma escola
var plotarEscola = (escolaJSON) => {
    let escolaID = escolaJSON["ID_ESCOLA"];
    let lat = escolaJSON["LOC_LATITUDE"];
    let lng = escolaJSON["LOC_LONGITUDE"];

    posicaoEscola = gerarMarcador(lat, lng, "img/icones/escola-marcador.png", 25, 50);
    posicaoEscola.set("NOME", escolaJSON["NOME"]);
    posicaoEscola.set("TIPO", "ESCOLA");
    posicaoEscola.set("HORARIO", escolaJSON["HORARIO"]);
    posicaoEscola.set("ENSINO", escolaJSON["ENSINO"]);
    posicaoEscola.set("REGIME", escolaJSON["REGIME"]);
    posicaoEscola.set("ENSINO", escolaJSON["ENSINO"])
    posicaoEscola.set("NUM_ALUNOS", escolaJSON["NUM_ALUNOS"]);
    posicaoEscola.set("CONTATO_TELEFONE", escolaJSON["CONTATO_TELEFONE"]);

    vSource.addFeature(posicaoEscola);
    escolas.set(escolaID, [lng, lat]);
}

// Cria feature de um aluno
var plotarAluno = (aluno) => {
    let alat = aluno["LOC_LATITUDE"];
    let alng = aluno["LOC_LONGITUDE"];
    let p = gerarMarcador(alat, alng, "img/icones/aluno-marcador.png");

    p.setId(aluno["ID_ALUNO"]);
    p.set("NOME", aluno["NOME"]);
    p.set("DATA_NASCIMENTO", aluno["DATA_NASCIMENTO"]);
    p.set("ESCOLA", aluno["ESCOLA"]);
    p.set("TURNOSTR", aluno["TURNOSTR"]);
    p.set("NIVELSTR", aluno["NIVELSTR"]);
    p.set("TIPO", "ALUNO");

    if (aluno["SEXO"] == 1) {
        p.set("SEXO", "Masculino");
    } else {
        p.set("SEXO", "Feminino");
    }

    vSource.addFeature(p);
}

// Buffer
function plotarBuffer(escolaJSON) {
    let centro = {
        type: "Point",
        coordinates: [
            Number(escolaJSON["LOC_LONGITUDE"]),
            Number(escolaJSON["LOC_LATITUDE"])
        ]
    }

    let b1 = turf.buffer(centro, 5);
    let b2 = turf.buffer(centro, 10);
    let b3 = turf.buffer(centro, 15);

    let r5 = b1;
    r5["properties"]["RANK"] = "R5";

    let r10 = turf.difference(b2, b1);
    r10["properties"]["RANK"] = "R10";

    let r15 = turf.difference(b3, b2);
    r15["properties"]["RANK"] = "R15";

    let feat = turf.featureCollection([r5, r10, r15]);
    var geojson = (new ol.format.GeoJSON()).readFeatures(feat, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
    })

    bufferSource.addFeatures(geojson)
}

// Botões
$("#btnVoltar").on('click', () => {
    navigateDashboard(lastPage);
})

$("#btnExpJPEG").on('click', () => {
    htmlToImage.toPng(document.getElementById("mapaCanvas"))
        .then(function (dataUrl) {
            var link = document.createElement('a');
            link.download = 'mapa-escola' + escolaVisualizada["NOME"] + ' .jpeg';
            link.href = dataUrl;
            link.click();
        });

    dialog.showSaveDialog(win, {
        title: "Salvar Mapa",
        defaultPath: "mapa-escola.png",
        buttonLabel: "Salvar",
        filters: [
            { name: "PNG", extensions: ["png"] }
        ]
    }).then((acao) => {
        if (!acao.canceled) {
            Swal2.fire({
                title: "Salvando o mapa",
                imageUrl: "img/icones/processing.gif",
                closeOnClickOutside: false,
                allowOutsideClick: false,
                showConfirmButton: false,
                html: `Aguarde um segundinho...
                    `
            })
            htmlToImage.toPng(document.getElementById("mapaCanvas"))
                .then(function (dataUrl) {
                    var base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
                    fs.writeFile(acao.filePath, base64Data, 'base64', (err) => {
                        if (err) {
                            errorFn("Erro ao salvar a imagem")
                        } else {
                            Swal2.fire({
                                title: "Sucesso!",
                                text: "O mapa foi exportado com sucesso. O arquivo pode ser encontrado em: " + acao.filePath,
                                icon: "success",
                                type: "success",
                                button: "Fechar"
                            });
                        }
                    });
                });
        }

    });
})


