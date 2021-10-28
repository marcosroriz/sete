// escola-dados-ctrl.js
// Este arquivo contém o script de controle da tela escola-dados-view. 
// O mesmo serve tanto para detalhar os dados de uma escola, especificamente os
// alunos matriculados nela

// Variáveis que armazena a escola, seus alunos e rotas
var alunosDaEscola = [];
var rotasDaEscola = [];

// Cria mapa na cidade atual
var mapaDetalhe = novoMapaOpenLayers("mapDetalheEscola", cidadeLatitude, cidadeLongitude);
var vSource = mapaDetalhe["vectorSource"];

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
var dataTableInstitucional = $("#dataTableInstitucional").DataTable({
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
        {
            extend: 'excel',
            className: 'btnExcel',
            filename: "EscolaCadastrada",
            title: appTitle,
            messageTop: "Dados da Escola: " + estadoEscola["NOME"],
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
            title: "Escolas cadastradas",
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
                action = "editarEscola";
                navigateDashboard("./modules/escola/escola-cadastrar-view.html");
            }
        },
        {
            text: "Apagar",
            className: "btnApagar",
            action: function (e, dt, node, config) {
                action = "apagarEscola";
                confirmDialog('Remover esse aluno?',
                  "Ao remover esse aluno ele será retirado do sistema das rotas " + 
                  "e das escolas que possuir vínculo."
                ).then((result) => {
                    let listaPromisePraRemover = []
                    if (result.value) {
                        listaPromisePraRemover.push(dbRemoverDadoPorIDPromise(DB_TABLE_ESCOLA, "ID_ESCOLA", estadoEscola["ID"]));
                        listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ESCOLA_TEM_ALUNOS, "ID_ESCOLA", estadoEscola["ID"]));
                        listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_PASSA_POR_ESCOLA, "ID_ESCOLA", estadoEscola["ID"]));
                        listaPromisePraRemover.push(dbAtualizaVersao());
                    }

                    return Promise.all(listaPromisePraRemover)
                }).then((res) => {
                    if (res.length > 0) {
                        dataTableEscolas.row($tr).remove();
                        dataTableEscolas.draw();
                        Swal2.fire({
                            title: "Sucesso!",
                            icon: "success",
                            text: "Aluno(a) removido(a) com sucesso!",
                            confirmButtonText: 'Retornar a página de administração'
                        });
                    }
                }).catch((err) => errorFn("Erro ao remover a escola", err))
            }
        }
    ]
});

var popularTabelaInstitucional = () => {
    // Popular tabela utilizando escola escolhida (estado)
    $("#detalheNomeEscola").html(estadoEscola["NOME"]);

    dataTableInstitucional.row.add(["Nome da escola", estadoEscola["NOME"]]);
    dataTableInstitucional.row.add(["Estado", ibgeEstados[estadoEscola["MEC_CO_UF"]]["nome"]]);
    dataTableInstitucional.row.add(["Município", ibgeMunicipios[estadoEscola["MEC_CO_MUNICIPIO"]]]);

    if (estadoEscola["LOC_CEP"] != "" && estadoEscola["LOC_CEP"] != null) {
        dataTableInstitucional.row.add(["CEP", estadoEscola["DEPENDENCIA"]]);
    } else {
        dataTableInstitucional.row.add(["CEP", "CEP não informado"]);
    }

    if (estadoEscola["LOC_ENDERECO"] != "" && estadoEscola["LOC_ENDERECO"] != null) {
        dataTableInstitucional.row.add(["Endereço", estadoEscola["LOC_ENDERECO"]]);
    } else {
        dataTableInstitucional.row.add(["Endereço", "Endereço não informado"]);
    }

    dataTableInstitucional.row.add(["Tipo de Localização", estadoEscola["LOCALIZACAO"]]);
    switch (estadoEscola["MEC_TP_LOCALIZACAO_DIFERENCIADA"]) {
        case 1:
            dataTableInstitucional.row.add(["Localização diferenciada", "Área de assentamento"]);
            break;
        case 2:
            dataTableInstitucional.row.add(["Localização diferenciada", "Terra índigena"]);
            break;
        case 3:
            dataTableInstitucional.row.add(["Localização diferenciada", "Área remanescente de quilombo"]);
            break;
        default:
            break;
    }
    dataTableInstitucional.row.add(["Dependência", estadoEscola["DEPENDENCIA"]]);

    if (estadoEscola["CONTATO_RESPONSAVEL"] != "" && estadoEscola["CONTATO_RESPONSAVEL"] != null) {
        dataTableInstitucional.row.add(["Contato", estadoEscola["CONTATO_RESPONSAVEL"]]);
    } else {
        dataTableInstitucional.row.add(["Contato", "Contato não informado"]);
    }

    if (estadoEscola["CONTATO_TELEFONE"] != "" && estadoEscola["CONTATO_TELEFONE"] != null) {
        dataTableInstitucional.row.add(["Telefone de contato", estadoEscola["CONTATO_TELEFONE"]]);
    } else {
        dataTableInstitucional.row.add(["Telefone de contato", "Telefone de contato não informado"]);
    }

    if (estadoEscola["CONTATO_EMAIL"] != "" && estadoEscola["CONTATO_EMAIL"] != null) {
        dataTableInstitucional.row.add(["E-mail de contato", estadoEscola["CONTATO_EMAIL"]]);
    } else {
        dataTableInstitucional.row.add(["E-mail de contato", "E-mail de contato não informado"]);
    }

    dataTableInstitucional.row.add(["Número de alunos atendidos", estadoEscola["NUM_ALUNOS"]]);
    $("#totalNumAlunos").text(estadoEscola["NUM_ALUNOS"]);
    
    dataTableInstitucional.row.add(["Tipo de ensino oferecido", estadoEscola["ENSINO"]]);
    dataTableInstitucional.row.add(["Horário de funcionamento", estadoEscola["HORARIO"]]);
    dataTableInstitucional.row.add(["Regime de funcionamento", estadoEscola["REGIME"]]);

    dataTableInstitucional.draw();

    return estadoEscola;
}

// popularTabelaInstitucional();

// Tabela Lista de Alunos
var dataTableListaDeAlunos = $('#dataTableListaDeAlunos').DataTable({
    ...dtConfigPadrao("aluno"),
    ...{
        columns: [
            { data: 'NOME', width: "30%" },
            // { data: 'DATA_NASCIMENTO', width: "600px" },
            { data: 'LOCALIZACAO', width: "30%" },
            { data: 'NIVELSTR', width: "200px" },
            { data: 'TURNOSTR', width: "100px" },
        ],
        // dom: 't<"detalheToolBar"B>',
        columnDefs: [{ targets: 0, render: renderAtMostXCharacters(50), type: 'locale-compare' } ],
        buttons: [
            {
                text: "Voltar",
                className: "btn-info",
                action: function (e, dt, node, config) {
                    navigateDashboard(lastPage);
                }
            },
            {
                extend: 'excel',
                className: 'btnExcel',
                filename: "AlunosAtendidos",
                title: appTitle,
                messageTop: "Alunos Atendidos pela Escola: " + estadoEscola["NOME"],
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
                title: appTitle,
                messageTop: "Alunos Atendidos pela Escola: " + estadoEscola["NOME"],
                text: "Exportar para PDF",
                exportOptions: {
                    columns: [0, 1]
                },
                customize: function (doc) {
                    doc = docReport(doc);
                }
            },
        ]
    }
});

// Permite buscar sem acentos
$("#datatables_filter input").on('keyup', function () {
    dataTableListaDeAlunos.search(jQuery.fn.dataTable.ext.type.search["locale-compare"](this.value)).draw()
})

restImpl.dbGETEntidade(DB_TABLE_ESCOLA, `/${estadoEscola.ID}`)
    .then((escolaRaw) => {
        let detalhesDaEscola = parseEscolaREST(escolaRaw);
        Object.assign(estadoEscola, detalhesDaEscola);
        
        estadoEscola["NUM_ALUNOS"] = estadoEscola["QTD_ALUNOS"];

        return estadoEscola;
    })
    .then(async () => {
        try {
            let listaDeAlunosRaw = await restImpl.dbGETEntidade(DB_TABLE_ESCOLA, `/${estadoEscola.ID}/alunos`);
            for (let alunoRaw of listaDeAlunosRaw.data) {
                let aluno = parseAlunoREST(alunoRaw);
                alunosDaEscola.push(aluno);
                
                dataTableListaDeAlunos.row.add(aluno);
            }

            estadoEscola["POSSUI_ALUNOS"] = true;
            dataTableListaDeAlunos.draw();
        } catch (err) {
            estadoEscola["POSSUI_ALUNOS"] = false;
        }

        // TODO: Adicionar lista de rotas na tela

        // try {
        //     let listaDeRotasRaw = await restImpl.dbGETEntidade(DB_TABLE_ESCOLA, `/${estadoEscola.ID}/rotas`);
        //     for (let rotaRaw of listaDeRotasRaw.data) {
        //         let rota = parseRotaDBREST(rotaRaw);
        //         rotasDaEscola.push(rota);
        //         // dataTableListaDeAlunos.row.add(aluno);
        //     }
        //     estadoEscola["POSSUI_ROTAS"] = true;
        // } catch (error) {
        //     estadoEscola["POSSUI_ROTAS"] = false;
        // }

        return estadoEscola;
    })
    .then(() => popularTabelaInstitucional())
    .then(() => plotarDadosNoMapa())
    .catch((err) => {
        console.log(err);
        errorFn("Erro ao listar o aluno", err)
    })
// Preprocessa alunos (pegamos apenas aqueles vinculados a esta escola)
var preprocessarAlunos = (res) => {
    var listaDeAlunos = [];
    for (let alunoRaw of res) {
        if (estadoEscola["ID"] == alunoRaw["ID_ESCOLA"]) {
            listaDeAlunos.push(parseAlunoDB(alunoRaw))
        }
    }
    return listaDeAlunos;
};

// Plota alunos no mapa
var plotarDadosNoMapa = () => {
    // Plota a posição da escola se tiver localização GPS
    if (estadoEscola["LOC_LONGITUDE"] != "" && estadoEscola["LOC_LONGITUDE"] != undefined &&
        estadoEscola["LOC_LATITUDE"] != "" && estadoEscola["LOC_LATITUDE"] != undefined) {
        // Esconde o campo que diz que a escola não tem localização
        $("#avisoNaoGeoReferenciada").hide()

        // Desenha marcador da posição atual do aluno
        let escolaLAT = estadoEscola["LOC_LATITUDE"];
        let escolaLNG = estadoEscola["LOC_LONGITUDE"]

        let posicaoEscola = gerarMarcador(escolaLAT, escolaLNG, "img/icones/escola-marcador.png");

        vSource.addFeature(posicaoEscola);
        mapaDetalhe["map"].getView().fit(vSource.getExtent());
        mapaDetalhe["map"].updateSize();
    } else {
        // Esconde o mapa da escola e mostra o campo que nao tem localização
        $("#mapDetalheEscola").hide();
    }

    // Plota Alunos
    alunosDaEscola.forEach((aluno) => {
        if (aluno["LOC_LONGITUDE"] != "" && aluno["LOC_LONGITUDE"] != undefined &&
            aluno["LOC_LATITUDE"] != "" && aluno["LOC_LATITUDE"] != undefined) {
            vSource.addFeature(plotarAluno(aluno));
        }
    });

    return estadoEscola;
}

// Adiciona dados na tabela
adicionaAlunosTabela = (res) => {
    res.forEach((aluno) => {
        dataTableListaDeAlunos.row.add(aluno);
    });

    dataTableListaDeAlunos.draw();
}

// Cria feature de um aluno
var plotarAluno = (aluno) => {
    let alat = aluno["LOC_LATITUDE"];
    let alng = aluno["LOC_LONGITUDE"];
    let p = gerarMarcador(alat, alng, "img/icones/aluno-marcador.png");

    p.setId(aluno["ID_ALUNO"]);
    p.set("NOME", aluno["NOME"]);
    p.set("DATA_NASCIMENTO", aluno["DATA_NASCIMENTO"]);
    p.set("TURNOSTR", aluno["TURNOSTR"]);
    p.set("NIVELSTR", aluno["NIVELSTR"]);
    p.set("TIPO", "ALUNO")

    if (aluno["SEXO"] == 1) { 
        p.set("SEXO", "Masculino");
    } else {
        p.set("SEXO", "Feminino");
    }

    return p;
}

// Select para lidar com click no aluno
var selectAluno = selectPonto("ALUNO");

// Popup aluno
mapaDetalhe["map"].addInteraction(selectAluno);
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

// Adiciona no mapa
mapaDetalhe["map"].addOverlay(popupAluno);

$("#detalheInitBtn").click();
$("#detalheMapa").on('click', (evt) => {
    setTimeout(function () {
        mapaDetalhe["map"].updateSize();
    }, 200);
});

action = "detalharEscola";