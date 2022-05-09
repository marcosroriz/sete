// aluno-visualizar-ctrl.js
// Este arquivo contém o script de controle da tela aluno-visualizar-view. 
// O mesmo serve para visualizar a posição de alunos no mapa e de suas respectivas escolas.

var alunoVisualizado = null;
var listaDeAlunos = new Map();

// Dados básicos do mapa
var mapaViz = novoMapaOpenLayers("mapVizAlunos", cidadeLatitude, cidadeLongitude);
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

// Select para lidar com click no aluno
var selectAluno = selectPonto("ALUNO");

// Botão de editar e remover aluno
var btnEditar;
var btnRemover;

// Rotina para editar aluno (verifica se usuário tem ctz antes)
function editarAluno(alunoID) {
    return goaheadDialog('Editar esse aluno?',
        "Gostaria de editar os dados deste aluno?",
    ).then((result) => {
        Swal2.close();
        if (result.value) {
            estadoAluno = listaDeAlunos.get(alunoID);
            action = "editarAluno";
            navigateDashboard("./modules/aluno/aluno-cadastrar-view.html");
        }
    })
}
// Rotina para remover aluno (verifica se usuário tem ctz antes)
function removerAluno(alunoID) {
    return confirmDialog('Remover esse aluno?',
        "Ao remover esse aluno, ele será retirado do sistema das rotas e das escolas que possuir vínculo."
    ).then((result) => {
        let listaPromisePraRemover = [];
        if (result.value) {
            listaPromisePraRemover.push(restImpl.dbDELETE(DB_TABLE_ALUNO, `/${alunoID}`));
        }
        return Promise.all(listaPromisePraRemover)
    }).then((res) => {
        if (res.length > 0) {
            Swal2.fire({
                title: "Sucesso!",
                icon: "success",
                text: "Aluno(a) removido(a) com sucesso!",
                confirmButtonText: 'Recarregar o mapa'
            }).then(() => navigateDashboard("./modules/aluno/aluno-visualizar-view.html"));
        }
    }).catch((err) => errorFn("Erro ao remover o(a) aluno(a)", err))
}

// Popup aluno
mapaViz["map"].addInteraction(selectAluno);
var popupAluno = new ol.Overlay.PopupFeature({
    popupClass: "default anim",
    select: selectAluno,
    closeBox: true,
    onshow: () => {
        let alunoID = selectAluno.features_["array_"][0].get("ID");
        btnEditar = $('<a href="#" id="btnEditar" class="btn btn-custom-popup btn-warning"><i class="fa fa-edit"></i></a>');
        btnEditar.on('click', () => editarAluno(alunoID));
        $(".ol-popupfeature").append(btnEditar)

        btnRemover = $('<a href="#" id="btnRemover" class="btn btn-custom-popup btn-danger"><i class="fa fa-trash"></i></a>');
        btnRemover.on('click', () => removerAluno(alunoID));
        $(".ol-popupfeature").append(btnRemover)
    },
    onclose: () => {
        $("#btnEditar").remove();
        $("#btnRemover").remove();
    },
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
            'ROTA': {
                title: 'Rota'
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

restImpl.dbGETColecao(DB_TABLE_ALUNO)
    .then(res => preprocessarAlunos(res))
    .then(res => plotarListaDeAlunos(res))
    .catch(err => errorFn("Erro ao visualizar os alunos", err))

// Preprocessa alunos
var preprocessarAlunos = (res) => {
    for (let alunoRaw of res) {
        let alunoJSON = parseAlunoREST(alunoRaw);
        alunoJSON["ID_ALUNO"] = alunoJSON["ID"]

        // Só adicionamos (mostraremos) os alunos que tem posição cadastrada!
        if (alunoJSON["LOC_LONGITUDE"] != "" && alunoJSON["LOC_LONGITUDE"] != undefined &&
            alunoJSON["LOC_LATITUDE"] != "" && alunoJSON["LOC_LONGITUDE"] != undefined) {
            listaDeAlunos.set(alunoJSON["ID"], alunoJSON);
        }
    }
    return listaDeAlunos;
}

// Plota os alunos
var plotarListaDeAlunos = (listaDeAlunos) => {
    // Plotar alunos
    listaDeAlunos.forEach((aluno) => {
        vSource.addFeature(plotarAluno(aluno));
    });
    if (!vSource.isEmpty()) {
        mapaViz["map"].getView().fit(vSource.getExtent(), { padding: [40, 40, 40, 40] });
        mapaViz["map"].updateSize();
    }
}

// Cria feature de um aluno
var plotarAluno = (aluno) => {
    let alat = aluno["LOC_LATITUDE"];
    let alng = aluno["LOC_LONGITUDE"];
    let p = gerarMarcador(alat, alng, "img/icones/aluno-marcador.png");

    p.setId(aluno["ID_ALUNO"]);
    p.set("ID", aluno["ID"]);
    p.set("NOME", aluno["NOME"]);
    p.set("ESCOLA", aluno["ESCOLA"]);
    p.set("ROTA", aluno["ROTA"]);
    p.set("TURNOSTR", aluno["TURNOSTR"]);
    p.set("NIVELSTR", aluno["NIVELSTR"]);
    p.set("TIPO", "ALUNO");

    if (aluno["SEXO"] == 1) {
        p.set("SEXO", "Masculino");
    } else {
        p.set("SEXO", "Feminino");
    }

    return p;
}

var addAlunoNivel = (nivel) => {
    listaDeAlunos.forEach((aluno) => {
        if (aluno["NIVEL"] == nivel) {
            let f = vSource.getFeatureById(aluno["ID_ALUNO"]);
            if (f == null) {
                vSource.addFeature(plotarAluno(aluno));
            }
        }
    });
}

var addAlunoTurno = (nivel) => {
    listaDeAlunos.forEach((aluno) => {
        if (aluno["TURNO"] == nivel) {
            let f = vSource.getFeatureById(aluno["ID_ALUNO"]);
            if (f == null) {
                vSource.addFeature(plotarAluno(aluno));
            }
        }
    });
}

var removerAlunoNivel = (nivel) => {
    listaDeAlunos.forEach((aluno) => {
        if (aluno["NIVEL"] == nivel) {
            let f = vSource.getFeatureById(aluno["ID_ALUNO"]);
            if (f != null) {
                vSource.removeFeature(f);
            }
        }
    });
}

var removerAlunoTurno = (nivel) => {
    listaDeAlunos.forEach((aluno) => {
        if (aluno["TURNO"] == nivel) {
            let f = vSource.getFeatureById(aluno["ID_ALUNO"]);
            if (f != null) {
                vSource.removeFeature(f);
            }
        }
    });
}

$("#infantil").on('change', function (e) {
    if (e.currentTarget.checked) {
        addAlunoNivel(1);
    } else {
        removerAlunoNivel(1);
    }
});

$("#fundamental").on('change', function (e) {
    if (e.currentTarget.checked) {
        addAlunoNivel(2);
    } else {
        removerAlunoNivel(2);
    }
});

$("#medio").on('change', function (e) {
    if (e.currentTarget.checked) {
        addAlunoNivel(3);
    } else {
        removerAlunoNivel(3);
    }
});

$("#superior").on('change', function (e) {
    if (e.currentTarget.checked) {
        addAlunoNivel(4);
    } else {
        removerAlunoNivel(4);
    }
});

$("#outro").on('change', function (e) {
    if (e.currentTarget.checked) {
        addAlunoNivel(5);
    } else {
        removerAlunoNivel(5);
    }
});

$("#manha").on('change', function (e) {
    if (e.currentTarget.checked) {
        addAlunoTurno(1);
    } else {
        removerAlunoTurno(1);
    }
});

$("#tarde").on('change', function (e) {
    if (e.currentTarget.checked) {
        addAlunoTurno(2);
    } else {
        removerAlunoTurno(2);
    }
});

$("#integral").on('change', function (e) {
    if (e.currentTarget.checked) {
        addAlunoTurno(3);
    } else {
        removerAlunoTurno(3);
    }
});

$("#noite").on('change', function (e) {
    if (e.currentTarget.checked) {
        addAlunoTurno(4);
    } else {
        removerAlunoTurno(4);
    }
});


// Botões
$("#btnVoltar").on('click', () => {
    navigateDashboard(lastPage);
})

$("#btnExpJPEG").on('click', () => {
    // Verifica se estamos ou não rodando no Electron
    if (window.process) {
        // Estamos no electron
        dialog.showSaveDialog(win, {
            title: "Salvar Mapa",
            defaultPath: "mapa-aluno.png",
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
                    html: `Aguarde um segundinho...`
                })
                return Promise.all([Promise.resolve(acao.filePath),
                htmlToImage.toPng(document.getElementById("mapaCanvas"))])
            }
        }).then((data) => {
            var caminhoSalvar = data[0];
            var dataUrl = data[1];
            var base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
            fs.writeFile(caminhoSalvar, base64Data, 'base64', (err) => {
                if (err) {
                    errorFn("Erro ao salvar a imagem")
                } else {
                    Swal2.fire({
                        title: "Sucesso!",
                        text: "O mapa foi exportado com sucesso. O arquivo pode ser encontrado em: " + caminhoSalvar,
                        icon: "success",
                        button: "Fechar"
                    });
                }
            });
        }).catch((err) => {
            Swal2.close()
            errorFn("Erro ao salvar a imagem")
        });
    } else {
        // Estamos no browser
        domtoimage.toBlob(document.getElementById("mapaCanvas"))
            .then(function (blob) {
                window.saveAs(blob, 'mapa-aluno.png');
                successDialog();
            });
    }

})

action = "visualizarAluno";