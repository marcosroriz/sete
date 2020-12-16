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

dbBuscarTodosDadosPromise(DB_TABLE_ALUNO)
.then(res => preprocessarAlunos(res))
.then(() => dbLeftJoinPromise(DB_TABLE_ESCOLA_TEM_ALUNOS, "ID_ESCOLA", DB_TABLE_ESCOLA, "ID_ESCOLA"))
.then(res => preprocessarEscolas(res))
.then(res => plotarListaDeAlunos(res))
.catch(err => errorFn("Erro ao visualizar os alunos", err))

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

// Preprocessa escolas
var preprocessarEscolas = (res) => {
    for (let escolaRaw of res) {
        let aID = escolaRaw["ID_ALUNO"];
        let eID = escolaRaw["ID_ESCOLA"];
        let eNome = escolaRaw["NOME"];

        // Verifica se este aluno está na lista de alunos com posição
        if (listaDeAlunos.has(aID)) {
            let alunoJSON = listaDeAlunos.get(aID);
            alunoJSON["ID_ESCOLA"] = eID;
            alunoJSON["ESCOLA"] = eNome;
            alunoJSON["ESCOLA_LOC_LATITUDE"] = escolaRaw["LOC_LATITUDE"];
            alunoJSON["ESCOLA_LOC_LONGITUDE"] = escolaRaw["LOC_LONGITUDE"];
            alunoJSON["ESCOLA_MEC_CO_UF"] = escolaRaw["MEC_CO_UF"];
            alunoJSON["ESCOLA_MEC_CO_MUNICIPIO"] = escolaRaw["MEC_CO_MUNICIPIO"];
            alunoJSON["ESCOLA_MEC_TP_LOCALIZACAO"] = escolaRaw["MEC_TP_LOCALIZACAO"];
            alunoJSON["ESCOLA_MEC_TP_LOCALIZACAO_DIFERENCIADA"] = escolaRaw["MEC_TP_LOCALIZACAO_DIFERENCIADA"];
            alunoJSON["ESCOLA_CONTATO_RESPONSAVEL"] = escolaRaw["CONTATO_RESPONSAVEL"];
            alunoJSON["ESCOLA_CONTATO_TELEFONE"] = escolaRaw["CONTATO_TELEFONE"];
    
            listaDeAlunos.set(aID, alunoJSON);
        }
    }
    return listaDeAlunos;
};

// Plota os alunos
var plotarListaDeAlunos = (listaDeAlunos) => {
    // Plotar alunos
    listaDeAlunos.forEach((aluno) => {
        vSource.addFeature(plotarAluno(aluno));
    });
    mapaViz["map"].getView().fit(vSource.getExtent());
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
})

action = "visualizarAluno";