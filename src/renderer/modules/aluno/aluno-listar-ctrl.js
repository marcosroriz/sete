// aluno-listar-ctrl.js
// Este arquivo contém o script de controle da tela aluno-listar-view. O memso
// apresenta os alunos cadastrados em uma tabela. Para tal, é feito uma consulta
// dos alunos no banco de dados. Também é feito consultas nos dados de escolas e
// coleções para apresentar dados adicionais na tabela dos alunos

// Variável que armazena os alunos apresentados (será preenchida)
var listaDeAlunos = new Map();

// Configura o DataTables
var dataTablesAlunos = $("#datatables").DataTable({
    // A função abaixo inicia nossa pré-configuração do datatable
    // ver detalhe da função em js/datatable.extra.js
    ...dtConfigPadrao("aluno"),
    ...{
        columns: [
            { data: 'NOME', width: "25%" },
            { data: 'LOCALIZACAO', width: "15%" },
            { data: 'ROTA', width: "15%" },
            { data: 'ESCOLA', width: "25%" },
            { data: 'NIVELSTR', width: "200px" },
            { data: 'TURNOSTR', width: "200px" },
            {
                data: "ACOES",
                width: "90px",
                sortable: false,
                defaultContent: '<a href="#" class="btn btn-link btn-primary alunoView"><i class="fa fa-search"></i></a>' +
                    '<a href="#" class="btn btn-link btn-warning alunoEdit"><i class="fa fa-edit"></i></a>' +
                    '<a href="#" class="btn btn-link btn-danger alunoRemove"><i class="fa fa-times"></i></a>'
            }
        ],
        columnDefs: [{ targets: 0, render: renderAtMostXCharacters(50) },
                    { targets: 2, render: renderAtMostXCharacters(50) }],
        buttons: [
            {
                extend: 'pdfHtml5',
                orientation: "landscape",
                title: "Alunos cadastrados",
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


dataTablesAlunos.on('click', '.alunoView', function () {
    var $tr = getRowOnClick(this);

    estadoAluno = dataTablesAlunos.row($tr).data();
    action = "visualizarAluno";
    navigateDashboard("./modules/aluno/aluno-dados-view.html");
});

dataTablesAlunos.on('click', '.alunoEdit', function () {
    var $tr = getRowOnClick(this);

    estadoAluno = dataTablesAlunos.row($tr).data();
    action = "editarAluno";
    navigateDashboard("./modules/aluno/aluno-cadastrar-view.html");
});

dataTablesAlunos.on('click', '.alunoRemove', function () {
    var $tr = getRowOnClick(this);

    estadoAluno = dataTablesAlunos.row($tr).data();
    action = "apagarAluno";
    confirmDialog('Remover esse aluno?',
                  "Ao remover esse aluno ele será retirado do sistema das rotas " + 
                  "e das escolas que possuir vínculo."
    ).then((result) => {
        let listaPromisePraRemover = []
        if (result.value) {
            listaPromisePraRemover.push(dbRemoverDadoPorIDPromise(DB_TABLE_ALUNO, "ID_ALUNO", estadoAluno["ID"]));
            listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ESCOLA_TEM_ALUNOS, "ID_ALUNO", estadoAluno["ID"]));
            listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_ATENDE_ALUNO, "ID_ALUNO", estadoAluno["ID"]));
            listaPromisePraRemover.push(dbAtualizaVersao());
        }

        return Promise.all(listaPromisePraRemover)
    }).then((res) => {
        if (res.length > 0) {
            dataTablesAlunos.row($tr).remove();
            dataTablesAlunos.draw();
            Swal2.fire({
                title: "Sucesso!",
                icon: "success",
                text: "Aluno(a) removido(a) com sucesso!",
                confirmButtonText: 'Retornar a página de administração'
            });
        }
    }).catch((err) => errorFn("Erro ao remover o(a) aluno(a)", err))
});


dbBuscarTodosDadosPromise(DB_TABLE_ALUNO)
.then(res => preprocessarAlunos(res))
.then(() => dbLeftJoinPromise(DB_TABLE_ESCOLA_TEM_ALUNOS, "ID_ESCOLA", DB_TABLE_ESCOLA, "ID_ESCOLA"))
.then(res => preprocessarEscolas(res))
.then(() => dbLeftJoinPromise(DB_TABLE_ROTA_ATENDE_ALUNO, "ID_ROTA", DB_TABLE_ROTA, "ID_ROTA"))
.then(res => preprocessarRotas(res))
.then((res) => adicionaDadosTabela(res))
.catch((err) => errorFn(err))

// Preprocessa alunos
var preprocessarAlunos = (res) => {
    $("#totalNumAlunos").text(res.length);
    for (let alunoRaw of res) {
        let alunoJSON = parseAlunoDB(alunoRaw);
        listaDeAlunos.set(alunoJSON["ID"], alunoJSON);
    }
    return listaDeAlunos;
}

// Preprocessa escolas
var preprocessarEscolas = (res) => {
    for (let escolaRaw of res) {
        let aID = escolaRaw["ID_ALUNO"];
        let eID = escolaRaw["ID_ESCOLA"];
        let eNome = escolaRaw["NOME"];

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
    return listaDeAlunos;
};

// Preprocessa rotas
var preprocessarRotas = (res) => {
    res.forEach((rota) => {
        let aID = rota["ID_ALUNO"];
        let alunoJSON =  listaDeAlunos.get(aID);
        
        alunoJSON["ROTA"] = rota["NOME"];
        listaDeAlunos.set(aID, alunoJSON);
    })

    return listaDeAlunos;
}

// Adiciona dados na tabela
adicionaDadosTabela = (res) => {
    res.forEach((aluno) => {
        dataTablesAlunos.row.add(aluno);
    });

    dataTablesAlunos.draw();
}

action = "listarAluno";