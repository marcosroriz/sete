// aluno-dados-ctrl.js
// Este arquivo contém o script de controle da tela aluno-dados-view. 
// O memso serve tanto para detalhar os dados de um determinado aluno
// Os dados do aluno estão na variável estadoAluno

// Cria mapa na cidade atual
var mapaDetalhe = novoMapaOpenLayers("mapDetalheAluno", cidadeLatitude, cidadeLongitude);
mapaDetalhe["activateImageLayerSwitcher"]();

// Corrige o bug de resize no mapa
window.onresize = function () {
    setTimeout(function () {
        if (mapaDetalhe != null) { mapaDetalhe["map"].updateSize(); }
    }, 200);
}

// Plota a posição do aluno se tiver localização GPS
if (estadoAluno["LOC_LONGITUDE"] != "" && estadoAluno["LOC_LONGITUDE"] != undefined &&
    estadoAluno["LOC_LATITUDE"] != "" && estadoAluno["LOC_LATITUDE"] != undefined) {
    // Esconde o campo que diz que o aluno não tem localização
    $("#alunoSemMapa").hide()
    
    // Desenha marcador da posição atual do aluno
    var alunoLAT = estadoAluno["LOC_LATITUDE"];
    var alunoLNG = estadoAluno["LOC_LONGITUDE"]

    var posicaoAluno = gerarMarcador(alunoLAT, alunoLNG, "img/icones/aluno-marcador.png");
    mapaDetalhe["vectorSource"].addFeature(posicaoAluno);
    mapaDetalhe["map"].getView().fit(mapaDetalhe["vectorSource"].getExtent());
    mapaDetalhe["map"].updateSize();    
} else {
    // Esconde o mapa do aluno e mostra o campo que nao tem localização
    $("#mapDetalheAluno").hide()
    $("#alunoSemMapa").show()
}

// Plota a posição da escola se tiver localização GPS
if (estadoAluno["ESCOLA_LOC_LATITUDE"] != "" && estadoAluno["ESCOLA_LOC_LATITUDE"] != undefined &&
    estadoAluno["ESCOLA_LOC_LONGITUDE"] != "" && estadoAluno["ESCOLA_LOC_LONGITUDE"] != undefined) {
    var escolaLAT = estadoAluno["ESCOLA_LOC_LATITUDE"];
    var escolaLNG = estadoAluno["ESCOLA_LOC_LONGITUDE"];
    
    var posicaoEscola = gerarMarcador(escolaLAT, escolaLNG, "img/icones/escola-marcador.png");
    mapaDetalhe["vectorSource"].addFeature(posicaoEscola);
    mapaDetalhe["map"].getView().fit(mapaDetalhe["vectorSource"].getExtent());
    mapaDetalhe["map"].updateSize();    
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
            filename: "Aluno" + estadoAluno["NOME"],
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
            title: "Aluno",
            extension: ".pdf",
            text: "Exportar para PDF",
            exportOptions: {
                columns: [0, 1]
            },
            customize: function (doc) {
                doc = docReport(doc);
                doc.content[2].table.widths = ['30%', '70%'];
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
                Swal2.fire({
                    title: 'Remover esse aluno?',
                    text: "Ao remover esse aluno ele será retirado do sistema das rotas e das escolas que possuir vínculo.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    cancelButtonText: "Cancelar",
                    confirmButtonText: 'Sim, remover'
                }).then((result) => {
                    let listaPromisePraRemover = []
                    if (result.value) {
                        listaPromisePraRemover.push(dbRemoverDadoPorIDPromise(DB_TABLE_ALUNO, "ID_ALUNO", estadoAluno["ID"]));
                        listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ESCOLA_TEM_ALUNOS, "ID_ALUNO", estadoAluno["ID"]));
                        listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_ATENDE_ALUNO, "ID_ALUNO", estadoAluno["ID"]));
                        listaPromisePraRemover.push(dbAtualizaVersao());
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

var popularTabelaAluno = () => {
    // Popular tabela utilizando escola escolhida (estado)
    $("#detalheNomeAluno").html(estadoAluno["NOME"]);

    dataTableAluno.row.add(["Nome do aluno", estadoAluno["NOME"]]);
    dataTableAluno.row.add(["Data de nascimento", estadoAluno["DATA_NASCIMENTO"]]);

    switch (String(estadoAluno["SEXO"])) {
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

    switch (String(estadoAluno["COR"])) {
        case "1":
            dataTableAluno.row.add(["Cor/Raça", "Amarelo"]);
            break;
        case "2":
            dataTableAluno.row.add(["Cor/Raça", "Branco"]);
            break;
        case "3":
            dataTableAluno.row.add(["Cor/Raça", "Indígena"]);
            break;
        case "4":
            dataTableAluno.row.add(["Cor/Raça", "Pardo"]);
            break;
        case "5":
            dataTableAluno.row.add(["Cor/Raça", "Preto"]);
            break;
        default:
            dataTableAluno.row.add(["Cor/Raça", "Não informado"]);
            break;
    }

    if (estadoAluno["CPF"] != undefined && estadoAluno["CPF"] != "") {
        dataTableAluno.row.add(["CPF", estadoAluno["CPF"]]);
    } else {
        dataTableAluno.row.add(["CPF", "CPF não informado"]);
    }

    var listaDeficiencia = new Array();
    if (estadoAluno["DEF_CAMINHAR"] != 0) { listaDeficiencia.push("Locomotora"); }
    if (estadoAluno["DEF_OUVIR"] != 0) { listaDeficiencia.push("Auditiva"); }
    if (estadoAluno["DEF_ENXERGAR"] != 0) { listaDeficiencia.push("Visual"); }
    if (estadoAluno["DEF_MENTAL"] != 0) { listaDeficiencia.push("Mental"); }

    if (listaDeficiencia.length != 0) {
        dataTableAluno.row.add(["Possui alguma deficiência?", listaDeficiencia.join(", ")]);
    } else {
        dataTableAluno.row.add(["Possui alguma deficiência?", "Não"]);
    }

    if (estadoAluno["NOME_RESPONSAVEL"] != undefined) {
        dataTableAluno.row.add(["Nome do responsável", estadoAluno["NOME_RESPONSAVEL"]]);
    } else {
        dataTableAluno.row.add(["Nome do responsável", "Contato não informado"]);
    }

    switch (estadoAluno["GRAU_RESPONSAVEL"]) {
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

    if (estadoAluno["TELEFONE_RESPONSAVEL"] != undefined && estadoAluno["TELEFONE_RESPONSAVEL"] != "") {
        dataTableAluno.row.add(["Telefone do responsável", estadoAluno["TELEFONE_RESPONSAVEL"]]);
    } else {
        dataTableAluno.row.add(["Telefone do responsável", "Telefone de contato não informado"]);
    }

    if (estadoAluno["LOC_ENDERECO"] != undefined && estadoAluno["LOC_ENDERECO"] != "") {
        dataTableAluno.row.add(["Endereço do aluno", estadoAluno["LOC_ENDERECO"]]);
    } else {
        dataTableAluno.row.add(["Endereço do aluno", "Endereço não informado"]);
    }

    if (estadoAluno["LOC_CEP"] != undefined && estadoAluno["LOC_CEP"] != "") {
        dataTableAluno.row.add(["CEP da residência", estadoAluno["LOC_CEP"]]);
    } else {
        dataTableAluno.row.add(["CEP da residência", "CEP não informado"]);
    }

    var dificuldadesAcesso = new Array();
    if (estadoAluno["DA_PORTEIRA"] != 0) { dificuldadesAcesso.push("Porteira"); }
    if (estadoAluno["DA_MATABURRO"] != 0) { dificuldadesAcesso.push("Mata-Burro"); }
    if (estadoAluno["DA_COLCHETE"] != 0) { dificuldadesAcesso.push("Colchete"); }
    if (estadoAluno["DA_ATOLEIRO"] != 0) { dificuldadesAcesso.push("Atoleiro"); }
    if (estadoAluno["DA_PONTERUSTICA"] != 0) { dificuldadesAcesso.push("Ponte Rústica"); }

    if (dificuldadesAcesso.length != 0) {
        dataTableAluno.row.add(["Dificuldade de acesso", dificuldadesAcesso.join(", ")]);
    } else {
        dataTableAluno.row.add(["Dificuldade de acesso", "Não informado"]);
    }

    if (estadoAluno["ESCOLA"] == "Aluno sem escola") {
        dataTableAluno.row.add(["Escola", "Não informada no sistema"]);
    } else {
        dataTableAluno.row.add(["Escola", estadoAluno["ESCOLA"]]);

        switch (estadoAluno["ESCOLA_MEC_TP_LOCALIZACAO"]) {
            case 1:
                dataTableAluno.row.add(["Localização", "Área Urbana"]);
                break;
            case 2:
                dataTableAluno.row.add(["Localização", "Área Rural"]);
                break;
            default:
                dataTableAluno.row.add(["Localização", "Área Urbana"]);
        }

        if (estadoAluno["ESCOLA_MEC_TP_LOCALIZACAO_DIFERENCIADA"] != undefined &&
            estadoAluno["ESCOLA_MEC_TP_LOCALIZACAO_DIFERENCIADA"] != "") {
            switch (estadoAluno["ESCOLA_MEC_TP_LOCALIZACAO_DIFERENCIADA"]) {
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

        if (estadoAluno["ESCOLA_CONTATO_RESPONSAVEL"] != undefined && 
            estadoAluno["ESCOLA_CONTATO_RESPONSAVEL"] != "") {
            dataTableAluno.row.add(["Contato da Escola", estadoAluno["ESCOLA_CONTATO_RESPONSAVEL"]]);
        } else {
            dataTableAluno.row.add(["Contato da Escola", "Contato da escola não informado"]);
        }

        if (estadoAluno["ESCOLA_CONTATO_TELEFONE"] != undefined && 
            estadoAluno["ESCOLA_CONTATO_TELEFONE"] != "") {
            dataTableAluno.row.add(["Telefone de Contato", estadoAluno["ESCOLA_CONTATO_TELEFONE"]]);
        } else {
            dataTableAluno.row.add(["Telefone de Contato", "Telefone de contato não informado"]);
        }

    }

    dataTableAluno.draw();
}

popularTabelaAluno();

$("#detalheInitBtn").click();
$("#detalheMapa").on('click', (evt) => {
    setTimeout(function () {
        mapaDetalhe["map"].updateSize();
    }, 200);
});

action = "detalharAluno";