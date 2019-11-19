var alunoVisualizado = null;
var listaDeAlunos = new Map();

// Dados basicos do mapa
var mapaViz = novoMapaOpenLayers("mapVizAlunos", cidadeLatitude, cidadeLongitude);
var vSource = mapaViz["vectorSource"];
var vLayer = mapaViz["vectorSource"];

// Ativa busca e camadas
mapaViz["activateGeocoder"]();
mapaViz["activateImageLayerSwitcher"]();

// Função para relatar erro
var errorFnAlunos = (err) => {
    Swal2.fire({
        title: "Ops... tivemos um problema!",
        text: "Erro ao listar os alunos! Feche e abra o software novamente. \n" + err,
        icon: "error",
        button: "Fechar"
    });
}

// Select para lidar com click no aluno
var selectAluno = new ol.interaction.Select({
    hitTolerance: 5,
    multi: false,
    condition: ol.events.condition.singleClick,
    filter: (feature, layer) => {
        if (feature.getGeometry().getType() == "Point") { 
            return true;
        } else {
            return false;
        }
    }
});

// Popup aluno
mapaViz["map"].addInteraction(selectAluno);
var popup = new ol.Overlay.PopupFeature({
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
mapaViz["map"].addOverlay(popup);

// Cria feature de um aluno
var plotarAluno = (aluno) => {
    let alat = aluno["LOC_LATITUDE"];
    let alng = aluno["LOC_LONGITUDE"];
    let p = new ol.Feature({
        "geometry": new ol.geom.Point(ol.proj.fromLonLat([alng, alat]))
    });
    p.setId(aluno["ID_ALUNO"]);
    p.set("NOME", aluno["NOME"]);
    p.set("DATA_NASCIMENTO", aluno["DATA_NASCIMENTO"]);
    p.set("ESCOLA", aluno["ESCOLA"]);
    p.set("TURNOSTR", aluno["TURNOSTR"]);
    p.set("NIVELSTR", aluno["NIVELSTR"]);
    p.setStyle(new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [12, 37],
            anchorXUnits: 'pixels',
            anchorYUnits: 'pixels',
            opacity: 1,
            src: "img/icones/aluno-marcador.png"
        })
    }));

    return p;
}


// Callback para pegar dados de escolas dos alunos
var listarEscolasAlunosCB = (err, result) => {
    if (err) {
        errorFnAlunos(err);
    } else {
        for (let alunoRaw of result) {
            let aID = alunoRaw["ID_ALUNO"];
            let eID = alunoRaw["ID_ESCOLA"];
            let eNome = alunoRaw["NOME"];

            let alunoJSON = listaDeAlunos.get(aID);
            alunoJSON["ID_ESCOLA"] = eID;
            alunoJSON["ESCOLA"] = eNome;
            alunoJSON["ESCOLA_LOC_LATITUDE"] = alunoRaw["LOC_LATITUDE"];
            alunoJSON["ESCOLA_LOC_LONGITUDE"] = alunoRaw["LOC_LONGITUDE"];
            alunoJSON["ESCOLA_MEC_CO_UF"] = alunoRaw["MEC_CO_UF"];
            alunoJSON["ESCOLA_MEC_CO_MUNICIPIO"] = alunoRaw["MEC_CO_MUNICIPIO"];
            alunoJSON["ESCOLA_MEC_TP_LOCALIZACAO"] = alunoRaw["MEC_TP_LOCALIZACAO"];
            alunoJSON["ESCOLA_MEC_TP_LOCALIZACAO_DIFERENCIADA"] = alunoRaw["MEC_TP_LOCALIZACAO_DIFERENCIADA"];
            alunoJSON["ESCOLA_CONTATO_RESPONSAVEL"] = alunoRaw["CONTATO_RESPONSAVEL"];
            alunoJSON["ESCOLA_CONTATO_TELEFONE"] = alunoRaw["CONTATO_TELEFONE"];

            listaDeAlunos.set(aID, alunoJSON);
        }

        // Plotar alunos
        listaDeAlunos.forEach((aluno) => {
            let aID  = aluno["ID_ALUNO"];
            vSource.addFeature(plotarAluno(aluno));
        });

        mapaViz["map"].getView().fit(vSource.getExtent());
        
    }
};

// Callback para pegar dados inicia dos alunos
var listaInicialCB = (err, result) => {
    if (err) {
        errorFn("Erro ao visualizar os alunos!", err);
    } else {
        for (let alunoRaw of result) {
            let alunoJSON = parseAlunoDB(alunoRaw);
            listaDeAlunos.set(alunoJSON["ID_ALUNO"], alunoJSON);
        }
        ListarEscolasDeAlunos(listarEscolasAlunosCB);
    }
};

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


BuscarTodosAlunos(listaInicialCB);

// Botões
$("#btnVoltar").click(() => {
    navigateDashboard(lastPage);
})

$("#btnExpJPEG").click(() => {
    htmlToImage.toPng(document.getElementById("mapaCanvas"))
        .then(function (dataUrl) {
            var link = document.createElement('a');
            link.download = 'mapa-aluno.jpeg';
            link.href = dataUrl;
            link.click();
        });
})


action = "visualizarAluno";