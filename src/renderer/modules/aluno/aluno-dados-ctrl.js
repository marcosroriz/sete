// aluno-dados-ctrl.js
// Este arquivo contém o script de controle da tela aluno-dados-view. 
// O mesmo serve tanto para detalhar os dados de um determinado aluno
// Os dados do aluno estão na variável estadoAluno

// Variáveis aluno a ser mostrada na tela
var aluno = {};

// Cria mapa na cidade atual
var mapaDetalhe = novoMapaOpenLayers("mapDetalheAluno", cidadeLatitude, cidadeLongitude);

// Ativa camada
mapaDetalhe["activateImageLayerSwitcher"]();

// Corrige o bug de resize no mapa
window.onresize = function () {
    setTimeout(function () {
        if (mapaDetalhe != null) { mapaDetalhe["map"].updateSize(); }
    }, 200);
}

// Tira o btn group do datatable
$.fn.dataTable.Buttons.defaults.dom.container.className = 'dt-buttons';

// Cria DataTable Institucional
var dataTableAluno = $("#dataTableDadosAluno").DataTable({
    columns: [
        { width: "20%", className: "text-right detalheChave" },
        { width: "60%", className: "text-left detalheValor" },
    ],
    autoWidth: false,
    paging: false,
    searching: false,
    ordering: false,
    dom: 't<"detalheToolBar"B>',
    buttons: [
        {
            text: "Voltar",
            className: "btn-info",
            action: function (e, dt, node, config) {
                navigateDashboard(lastPage);
            }
        },
        // TODO: https://datatables.net/forums/discussion/58749/any-export-complete-event
        {
            extend: 'excel',
            className: 'btnExcel',
            extension: ".xlsx",
            filename: "Aluno " + estadoAluno["NOME"],
            title: appTitle,
            messageTop: "Dados do Aluno: " + estadoAluno["NOME"],
            text: 'Exportar para Excel/LibreOffice',
            customize: function (xlsx) {
                var sheet = xlsx.xl.worksheets['sheet1.xml'];

                $('row c[r^="A"]', sheet).attr('s', '2');
                $('row[r="1"] c[r^="A"]', sheet).attr('s', '27');
                $('row[r="2"] c[r^="A"]', sheet).attr('s', '3');
            }
        },
        {
            extend: 'pdfHtml5',
            orientation: "landscape",
            title: "Aluno " + estadoAluno.NOME,
            extension: ".pdf",
            text: "Exportar para PDF",
            exportOptions: {
                columns: [0, 1]
            },
            customize: function (doc) {
                doc = docReport(doc);
                doc.content[3].table.widths = ['30%', '70%'];
            }
        },
        {
            text: "Modificar",
            className: "btnMoficar",
            action: function (e, dt, node, config) {
                action = "editarAluno";
                navigateDashboard("./modules/aluno/aluno-cadastrar-view.html");
            }
        },
        {
            text: "Apagar",
            className: "btnApagar",
            action: function (e, dt, node, config) {
                action = "apagarAluno";
                confirmDialog('Remover esse aluno?',
                    "Ao remover esse aluno ele será retirado do sistema das rotas " +
                    "e das escolas que possuir vínculo."
                ).then((result) => {
                    let listaPromisePraRemover = []
                    if (result.value) {
                        listaPromisePraRemover.push(restImpl.dbDELETE(DB_TABLE_ALUNO, `/${estadoAluno.ID}`));
                    }

                    return Promise.all(listaPromisePraRemover)
                })
                    .then((res) => {
                        if (res.length > 0) {
                            Swal2.fire({
                                title: "Sucesso!",
                                icon: "success",
                                text: "Aluno(a) removido(a) com sucesso!",
                                confirmButtonText: 'Retornar a página de administração'
                            }).then(() => {
                                navigateDashboard("./modules/aluno/aluno-listar-view.html");
                            });
                        }
                    }).catch((err) => errorFn("Erro ao remover o(a) aluno(a)", err))
            }
        },
    ]
});

restImpl.dbGETEntidade(DB_TABLE_ALUNO, `/${estadoAluno.ID}`)
    .then((alunoRaw) => {
        aluno = parseAlunoREST(alunoRaw);
        return aluno;
    })
    .then(async () => {
        try {
            let escolaRaw = await restImpl.dbGETEntidade(DB_TABLE_ALUNO, `/${estadoAluno.ID}/escola`);            
            let escola = parseEscolaREST(escolaRaw);

            aluno["ID_ESCOLA"] = escola["id"];
            aluno["ESCOLA"] = escola["NOME"];
            aluno["ESCOLA_LOC_LATITUDE"] = escola["LOC_LATITUDE"];
            aluno["ESCOLA_LOC_LONGITUDE"] = escola["LOC_LONGITUDE"];
            aluno["ESCOLA_MEC_CO_UF"] = escola["MEC_CO_UF"];
            aluno["ESCOLA_MEC_CO_MUNICIPIO"] = escola["MEC_CO_MUNICIPIO"];
            aluno["ESCOLA_MEC_TP_LOCALIZACAO"] = escola["MEC_TP_LOCALIZACAO"];
            aluno["ESCOLA_MEC_TP_LOCALIZACAO_DIFERENCIADA"] = escola["MEC_TP_LOCALIZACAO_DIFERENCIADA"];
            aluno["ESCOLA_CONTATO_RESPONSAVEL"] = escola["CONTATO_RESPONSAVEL"];
            aluno["ESCOLA_CONTATO_TELEFONE"] = escola["CONTATO_TELEFONE"];
        } catch (err) {
            aluno["ESCOLA"] = "Aluno sem escola";
        }

        // TODO: arrumar isso assim que a API estiver estável
        try {
            let rotaRaw = await restImpl.dbGETEntidade(DB_TABLE_ALUNO, `/${estadoAluno.ID}/rota`);
            aluno["ROTA"] = rotaRaw.nome;
        } catch (error) {
            aluno["ROTA"] = "Sem rota cadastrada";
        }

        return aluno;
    })
    .then(() => popularTabelaAluno())
    .then(() => plotaDadosNoMapa())
    .catch((err) => {
        console.log(err);
        errorFn("Erro ao listar o aluno", err)
    })


function plotaDadosNoMapa() {
    // Plota a posição do aluno se tiver localização GPS
    if (aluno["LOC_LONGITUDE"] != "" && aluno["LOC_LONGITUDE"] != undefined &&
        aluno["LOC_LATITUDE"] != "" && aluno["LOC_LATITUDE"] != undefined) {
        // Esconde o campo que diz que o aluno não tem localização
        $("#avisoNaoGeoReferenciada").hide()

        // Desenha marcador da posição atual do aluno
        var alunoLAT = aluno["LOC_LATITUDE"];
        var alunoLNG = aluno["LOC_LONGITUDE"]

        var posicaoAluno = gerarMarcador(alunoLAT, alunoLNG, "img/icones/aluno-marcador.png");
        mapaDetalhe["vectorSource"].addFeature(posicaoAluno);
        mapaDetalhe["map"].getView().fit(mapaDetalhe["vectorSource"].getExtent());
        mapaDetalhe["map"].updateSize();
    } else {
        // Esconde o mapa do aluno e mostra o campo que nao tem localização
        $("#mapDetalheAluno").hide()
    }

    // Plota a posição da escola se tiver localização GPS
    if (aluno["ESCOLA_LOC_LATITUDE"] != "" && aluno["ESCOLA_LOC_LATITUDE"] != undefined &&
        aluno["ESCOLA_LOC_LONGITUDE"] != "" && aluno["ESCOLA_LOC_LONGITUDE"] != undefined) {
        var escolaLAT = aluno["ESCOLA_LOC_LATITUDE"];
        var escolaLNG = aluno["ESCOLA_LOC_LONGITUDE"];

        var posicaoEscola = gerarMarcador(escolaLAT, escolaLNG, "img/icones/escola-marcador.png");
        mapaDetalhe["vectorSource"].addFeature(posicaoEscola);
        mapaDetalhe["map"].getView().fit(mapaDetalhe["vectorSource"].getExtent());
        mapaDetalhe["map"].updateSize();
    }

}

function popularTabelaAluno() {
    // Popular tabela utilizando escola escolhida (estado)
    $("#detalheNomeAluno").html(aluno["NOME"]);

    dataTableAluno.row.add(["Nome do aluno", aluno["NOME"]]);
    dataTableAluno.row.add(["Data de nascimento", aluno["DATA_NASCIMENTO"]]);

    switch (String(aluno["SEXO"])) {
        case "1":
            dataTableAluno.row.add(["Sexo", "Masculino"]);
            break;
        case "2":
            dataTableAluno.row.add(["Sexo", "Feminino"]);
            break;
        default:
            dataTableAluno.row.add(["Sexo", "Não informado"]);
            break;
    }

    dataTableAluno.row.add(["Cor/Raça", aluno["CORSTR"]]);

    if (aluno["CPF"] != undefined && aluno["CPF"] != "") {
        dataTableAluno.row.add(["CPF", aluno["CPF"]]);
    } else {
        dataTableAluno.row.add(["CPF", "CPF não informado"]);
    }

    var listaDeficiencia = new Array();
    if (aluno["DEF_CAMINHAR"] != 0) { listaDeficiencia.push("Locomotora"); }
    if (aluno["DEF_OUVIR"] != 0) { listaDeficiencia.push("Auditiva"); }
    if (aluno["DEF_ENXERGAR"] != 0) { listaDeficiencia.push("Visual"); }
    if (aluno["DEF_MENTAL"] != 0) { listaDeficiencia.push("Mental"); }

    if (listaDeficiencia.length != 0) {
        dataTableAluno.row.add(["Possui alguma deficiência?", listaDeficiencia.join(", ")]);
    } else {
        dataTableAluno.row.add(["Possui alguma deficiência?", "Não"]);
    }

    if (aluno["NOME_RESPONSAVEL"] != undefined) {
        dataTableAluno.row.add(["Nome do responsável", aluno["NOME_RESPONSAVEL"]]);
    } else {
        dataTableAluno.row.add(["Nome do responsável", "Contato não informado"]);
    }

    switch (Number(aluno["GRAU_RESPONSAVEL"])) {
        case 0:
            dataTableAluno.row.add(["Grau de parentesco", "Pai, Mãe, Padrasto ou Madrasta"]);
            break;
        case 1:
            dataTableAluno.row.add(["Grau de parentesco", "Avô ou Avó"]);
            break;
        case 2:
            dataTableAluno.row.add(["Grau de parentesco", "Irmão ou Irmã"]);
            break;
        case 3:
            dataTableAluno.row.add(["Grau de parentesco", "Outro Parente"]);
            break;
        case 4:
            dataTableAluno.row.add(["Grau de parentesco", "Outro Parente"]);
            break;
        default:
            dataTableAluno.row.add(["Grau de parentesco", "Não informado"]);
            break;
    }

    if (aluno["TELEFONE_RESPONSAVEL"] != undefined && aluno["TELEFONE_RESPONSAVEL"] != "") {
        dataTableAluno.row.add(["Telefone do responsável", aluno["TELEFONE_RESPONSAVEL"]]);
    } else {
        dataTableAluno.row.add(["Telefone do responsável", "Telefone de contato não informado"]);
    }

    if (aluno["LOC_ENDERECO"] != undefined && aluno["LOC_ENDERECO"] != "") {
        dataTableAluno.row.add(["Endereço do aluno", aluno["LOC_ENDERECO"]]);
    } else {
        dataTableAluno.row.add(["Endereço do aluno", "Endereço não informado"]);
    }

    if (aluno["LOC_CEP"] != undefined && aluno["LOC_CEP"] != "") {
        dataTableAluno.row.add(["CEP da residência", aluno["LOC_CEP"]]);
    } else {
        dataTableAluno.row.add(["CEP da residência", "CEP não informado"]);
    }

    var dificuldadesAcesso = new Array();
    if (aluno["DA_PORTEIRA"] && aluno["DA_PORTEIRA"] != 0) { dificuldadesAcesso.push("Porteira"); }
    if (aluno["DA_MATABURRO"] && aluno["DA_MATABURRO"] != 0) { dificuldadesAcesso.push("Mata-Burro"); }
    if (aluno["DA_COLCHETE"] && aluno["DA_COLCHETE"] != 0) { dificuldadesAcesso.push("Colchete"); }
    if (aluno["DA_ATOLEIRO"] && aluno["DA_ATOLEIRO"] != 0) { dificuldadesAcesso.push("Atoleiro"); }
    if (aluno["DA_PONTERUSTICA"] && aluno["DA_PONTERUSTICA"] != 0) { dificuldadesAcesso.push("Ponte Rústica"); }

    if (dificuldadesAcesso.length != 0) {
        dataTableAluno.row.add(["Dificuldade de acesso", dificuldadesAcesso.join(", ")]);
    } else {
        dataTableAluno.row.add(["Dificuldade de acesso", "Nenhuma"]);
    }

    if (aluno["ESCOLA"] == "Aluno sem escola") {
        dataTableAluno.row.add(["Escola", "Não informada no sistema"]);
    } else {
        dataTableAluno.row.add(["Escola", aluno["ESCOLA"]]);

        switch (aluno["ESCOLA_MEC_TP_LOCALIZACAO"]) {
            case 1:
                dataTableAluno.row.add(["Localização da Escola", "Área Urbana"]);
                break;
            case 2:
                dataTableAluno.row.add(["Localização da Escola", "Área Rural"]);
                break;
            default:
                break;
        }

        if (aluno["ESCOLA_MEC_TP_LOCALIZACAO_DIFERENCIADA"] != undefined &&
            aluno["ESCOLA_MEC_TP_LOCALIZACAO_DIFERENCIADA"] != "") {
            switch (Number(aluno["ESCOLA_MEC_TP_LOCALIZACAO_DIFERENCIADA"])) {
                case 1:
                    dataTableAluno.row.add(["Localização diferenciada", "Área de assentamento"]);
                    break;
                case 2:
                    dataTableAluno.row.add(["Localização diferenciada", "Terra índigena"]);
                    break;
                case 3:
                    dataTableAluno.row.add(["Localização diferenciada", "Área remanescente de quilombo"]);
                    break;
                default:
                    break;
            }
        }

        if (aluno["ESCOLA_CONTATO_RESPONSAVEL"] != undefined &&
            aluno["ESCOLA_CONTATO_RESPONSAVEL"] != "") {
            dataTableAluno.row.add(["Contato da Escola", aluno["ESCOLA_CONTATO_RESPONSAVEL"]]);
        } else {
            dataTableAluno.row.add(["Contato da Escola", "Contato da escola não informado"]);
        }

        if (aluno["ESCOLA_CONTATO_TELEFONE"] != undefined &&
            aluno["ESCOLA_CONTATO_TELEFONE"] != "") {
            dataTableAluno.row.add(["Telefone de Contato", aluno["ESCOLA_CONTATO_TELEFONE"]]);
        } else {
            dataTableAluno.row.add(["Telefone de Contato", "Telefone de contato não informado"]);
        }
    }

    dataTableAluno.row.add(["ROTA", aluno["ROTA"]]);

    dataTableAluno.draw();

    return aluno;
}

$("#detalheInitBtn").click();
$("#detalheMapa").on('click', (evt) => {
    setTimeout(function () {
        mapaDetalhe["map"].updateSize();
    }, 200);
});

action = "detalharAluno";