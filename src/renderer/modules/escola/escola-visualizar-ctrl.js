// escola-visualizar-ctrl.js
// Este arquivo contém o script de controle da tela escola-visualizar-view. 
// O mesmo serve para visualizar a posição das escolas no mapa.

var escolaVisualizada = null;
var escolas = new Map();

// Dados básicos do mapa
var mapaViz = novoMapaOpenLayers("mapVizEscola", cidadeLatitude, cidadeLongitude);
var vSource = mapaViz["vectorSource"];
var vLayer = mapaViz["vectorSource"];

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

// Processa escolas
var processarEscolas = (res) => {
    for (let escolaRaw of res) {
        let escolaJSON = parseEscolaDB(escolaRaw);
        let escolaID = escolaJSON["ID"]
        escolaJSON["ID_ESCOLA"] = escolaID

        let posicaoEscola = null;
        
        // Só adicionamos (mostraremos) as escolas que tem posição cadastrada!
        if (escolaJSON["LOC_LONGITUDE"] != "" && escolaJSON["LOC_LONGITUDE"] != undefined &&
            escolaJSON["LOC_LATITUDE"] != "" && escolaJSON["LOC_LONGITUDE"] != undefined) {
            let lat = escolaJSON["LOC_LATITUDE"];
            let lng = escolaJSON["LOC_LONGITUDE"];

            posicaoEscola = gerarMarcador(lat, lng, "img/icones/escola-marcador.png", 25, 50);
            posicaoEscola.set("NOME", escolaJSON["NOME"])
            posicaoEscola.set("TIPO", "ESCOLA")
            posicaoEscola.set("HORARIO", escolaJSON["HORARIO"])
            posicaoEscola.set("ENSINO", escolaJSON["ENSINO"])
            posicaoEscola.set("REGIME", escolaJSON["REGIME"])
            vSource.addFeature(posicaoEscola);
            escolas.set(escolaID, [lng, lat]);
        }
        $('#escolaViz').append(`<option value="${escolaID}">${escolaJSON['NOME']}</option>`);
    }

    if (!vSource.isEmpty()) {
        mapaViz["map"].getView().fit(vSource.getExtent());
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
        attributes: {
            'NOME': {
                title: 'Nome'
            },
            'HORARIO': {
                title: 'Horário de Func.'
            },
            'ENSINO': {
                title: 'Ensino'
            },
            'REGIME': {
                title: 'Regime'
            },
        }
    }
});

// Adiciona no mapa
mapaViz["map"].addOverlay(popupEscola);

$("#escolaViz").on('change', (e) => {
    var eID = e.target.value
    if (escolas.has(eID)) {
        var coordenadasEscola = escolas.get(eID)
        mapaViz["map"].getView().setCenter(ol.proj.fromLonLat(coordenadasEscola))
    } else {
        errorFn("Esta escola ainda não foi georeferenciada")
    }
});

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


