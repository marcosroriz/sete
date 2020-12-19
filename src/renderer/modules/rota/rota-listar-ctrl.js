// rota-listar-ctrl.js
// Este arquivo contém o script de controle da tela rota-listar-view. O mesmo
// apresenta as rotas cadastradas em uma tabela. Também é feito uma busca nas
// base de dados de alunos e escolas para conhecer o quantitativo atendido por rota.

// Preenchimento da Tabela via SQL
var listaDeRotas = new Map();

// DataTables
var dataTablesRotas = $("#datatables").DataTable({
    ...dtConfigPadraoFem("rota"),
    ...{
        columns: [
            { data: 'NOME', width: "30%" },
            { data: 'TURNOSTR', width: "20%" },
            { data: 'KMSTR', width: "20%" },
            { data: 'NUMALUNOS', width: "15%" },
            { data: 'NUMESCOLAS', width: "15%" },
            {
                data: "ACOES",
                width: "110px",
                sortable: false,
                defaultContent: '<a href="#" class="btn btn-link btn-primary rotaView"><i class="fa fa-search"></i></a>' +
                    '<a href="#" class="btn btn-link btn-warning rotaEdit"><i class="fa fa-edit"></i></a>' +
                    '<a href="#" class="btn btn-link btn-danger rotaRemove"><i class="fa fa-times"></i></a>'
            }
        ],
        columnDefs: [{ targets: 0,  render: renderAtMostXCharacters(50) }],
        buttons: [
            {
                extend: 'pdfHtml5',
                orientation: "landscape",
                title: "Rotas cadastradas",
                text: "Exportar para PDF",
                exportOptions: {
                    columns: [0, 1, 2, 3, 4]
                },
                customize: function (doc) {
                    doc.content[1].table.widths = ['30%', '15%', '20%', '20%', '15%'];
                    doc.images = doc.images || {};
                    doc.images["logo"] = baseImages.get("logo");
                    doc.content.splice(1, 0, {
                        alignment: 'center',
                        margin: [0, 0, 0, 12],
                        image: "logo"
                    });
                    doc.styles.tableHeader.fontSize = 12;
                }
            }
        ]
    }
});

dataTablesRotas.on('click', '.rotaView', function () {
    var $tr = getRowOnClick(this);

    estadoRota = dataTablesRotas.row($tr).data();
    action = "visualizarRota";
    navigateDashboard("./modules/rota/rota-dados-view.html");
});

dataTablesRotas.on('click', '.rotaEdit', function () {
    var $tr = getRowOnClick(this);

    estadoRota = dataTablesRotas.row($tr).data();
    action = "editarRota";
    navigateDashboard("./modules/rota/rota-cadastrar-view.html");
});

dataTablesRotas.on('click', '.rotaRemove', function () {
    var $tr = getRowOnClick(this);
    estadoRota = dataTablesRotas.row($tr).data();
    var idRota = estadoRota["ID"];

    action = "apagarMotorista";
    confirmDialog("Remover essa rota?",
                  "Ao remover essa rota ela será retirado do sistema e os alunos e "
                + "escolas que possuir vínculo deverão ser rearranjadas novamente."
    ).then((res) => {
        let listaPromisePraRemover = []
        if (res.value) {
            listaPromisePraRemover.push(dbRemoverDadoPorIDPromise(DB_TABLE_ROTA, "ID_ROTA", idRota));
            listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_ATENDE_ALUNO, "ID_ROTA", idRota));
            listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_PASSA_POR_ESCOLA, "ID_ROTA", idRota));
            listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_DIRIGIDA_POR_MOTORISTA, "ID_ROTA", idRota));
            listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_POSSUI_VEICULO, "ID_ROTA", idRota));
            listaPromisePraRemover.push(dbAtualizaVersao());
        }

        return Promise.all(listaPromisePraRemover)
    }).then((res) => {
        if (res.length > 0) {
            dataTablesRotas.row($tr).remove();
            dataTablesRotas.draw();
            Swal2.fire({
                title: "Sucesso!",
                icon: "success",
                text: "Rota removida com sucesso!",
                confirmButtonText: 'Retornar a página de administração'
            });
        }
    }).catch((err) => errorFn("Erro ao remover a rota", err))
});


dbBuscarTodosDadosPromise(DB_TABLE_ROTA)
.then(res => processarRotas(res))
.then(() => dbLeftJoinPromise(DB_TABLE_ROTA_ATENDE_ALUNO, "ID_ALUNO", DB_TABLE_ALUNO, "ID_ALUNO"))
.then((res) => processarAlunosPorRota(res))
.then(() => dbLeftJoinPromise(DB_TABLE_ROTA_PASSA_POR_ESCOLA, "ID_ESCOLA", DB_TABLE_ESCOLA, "ID_ESCOLA"))
.then((res) => processarEscolasPorRota(res))
.then((res) => adicionaDadosTabela(res))
.catch((err) => errorFn("Erro ao listar as escolas!", err))

// Processar rotas
var processarRotas = (res) => {
    $("#totalNumRotas").text(res.length);
    for (let rotaRaw of res) {
        let rotaJSON = parseRotaDB(rotaRaw);
        rotaJSON["STRESCOLAS"] = "Não cadastrado";
        rotaJSON["STRALUNOS"]  = "Não cadastrado";
        rotaJSON["NUMESCOLAS"] = 0;
        rotaJSON["NUMALUNOS"]  = 0;
        rotaJSON["ALUNOS"]     = [];
        rotaJSON["ESCOLAS"]    = [];
        rotaJSON["ID_ROTA"]    = rotaJSON["ID"];
        listaDeRotas.set(rotaJSON["ID"], rotaJSON);
    }
    return listaDeRotas;
}

// Processar alunos por rota
var processarAlunosPorRota = (res) => {
    for (let aluno of res) {
        aluno = parseAlunoDB(aluno)
        let rotaJSON = listaDeRotas.get(aluno["ID_ROTA"]);
        rotaJSON["NUMALUNOS"] = rotaJSON["NUMALUNOS"] + 1;
        rotaJSON["ALUNOS"].push(aluno);
    }
    return listaDeRotas;
}

// Processar alunos por Escola
var processarEscolasPorRota = (res) => {
    for (let escola of res) {
        escola = parseEscolaDB(escola)
        let rotaJSON = listaDeRotas.get(escola["ID_ROTA"]);
        rotaJSON["NUMESCOLAS"] = rotaJSON["NUMESCOLAS"] + 1;
        rotaJSON["ESCOLAS"].push(escola);
    }
    return listaDeRotas;
}

// Adiciona dados na tabela
adicionaDadosTabela = (res) => {
    res.forEach((rota) => {
        dataTablesRotas.row.add(rota);
    });

    dataTablesRotas.draw();
}

action = "listarRotas";