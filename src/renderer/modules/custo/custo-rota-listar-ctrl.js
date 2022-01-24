// custo-rota-listar-ctrl.js
// Este arquivo contém o script de controle da tela custo-rota-listar-view. 
// O mesmo apresenta as rotas cadastradas em uma tabela, permitindo que o usuário
// possa computar o custo da rota conforme a metodologia FNDE/CECATE-UFG.

// Preenchimento da Tabela via SQL
var listaDeRotas = new Map();

// DataTables
var dataTablesRotas = $("#datatables").DataTable({
    ...dtConfigPadraoFem("rota"),
    ...{
        dom: 'rtilp<"clearfix m-2">',
        select: {
            style: 'single',
            info: false
        },
        "order": [[ 1, "asc" ]],
        columns: [
            { data: "SELECT", width: "60px" },
            { data: 'NOME', width: "20%" },
            { data: 'TURNOSTR', width: "10%" },
            { data: 'GPS', width: "300px" },
            { data: 'KMSTR', width: "18%" },
            { data: 'NUMALUNOS', width: "12%" },
            { data: 'NUMESCOLAS', width: "12%" },
            {
                data: "ACOES",
                width: "110px",
                sortable: false,
                defaultContent: '<a href="#" class="btn btn-link btn-primary custoCalculadora"><i class="fa fa-calculator" style="color: orange;"></i></a>'
                //  + '<a href="#" class="btn btn-link custoParametros"><i class="fa fa-search"></i></a>'
            }
        ],
        columnDefs: [
            { targets: 0, 'checkboxes': { 'selectRow': true } },
            { targets: 1,  render: renderAtMostXCharacters(50) }
        ],
    }
});

dataTablesRotas.on('click', '.custoCalculadora', function () {
    let $tr = getRowOnClick(this);

    estadoRota = dataTablesRotas.row($tr).data();
    action = "calcularRota";
    navigateDashboard("./modules/custo/custo-resultado-rodo-view.html");
});

dataTablesRotas.on('click', '.rotaEdit', function () {
    let $tr = getRowOnClick(this);

    estadoRota = dataTablesRotas.row($tr).data();
    action = "editarRota";
    navigateDashboard("./modules/rota/rota-cadastrar-view.html");
});


restImpl.dbGETColecao(DB_TABLE_ROTA)
.then(res => processarRotas(res))
.then((res) => adicionaDadosTabela(res))
.catch((err) => {
    debugger
    errorFn("Erro ao listar as rotas!", err)
})

// .then((res) => adicionaDadosTabela(res))
// .catch((err) => errorFn("Erro ao listar as escolas!", err))
// dbBuscarTodosDadosPromise(DB_TABLE_ROTA)
// .then(res => processarRotas(res))
// .then(() => dbLeftJoinPromise(DB_TABLE_ROTA_ATENDE_ALUNO, "ID_ALUNO", DB_TABLE_ALUNO, "ID_ALUNO"))
// .then((res) => processarAlunosPorRota(res))
// .then(() => dbLeftJoinPromise(DB_TABLE_ROTA_PASSA_POR_ESCOLA, "ID_ESCOLA", DB_TABLE_ESCOLA, "ID_ESCOLA"))
// .then((res) => processarEscolasPorRota(res))
// .then((res) => adicionaDadosTabela(res))
// .catch((err) => errorFn("Erro ao listar as escolas!", err))

// Processar rotas
var processarRotas = (res) => {
    $("#totalNumRotas").text(res.length);
    for (let rotaRaw of res) {
        let rotaJSON = parseRotaDBREST(rotaRaw);
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

// Adiciona dados na tabela
adicionaDadosTabela = (res) => {
    let i = 0;
    res.forEach((rota) => {
        rota["SELECT"] = i++;
        dataTablesRotas.row.add(rota);
    });

    dataTablesRotas.draw();
    dtInitFiltros(dataTablesRotas, [1, 2, 3, 4, 5, 6]);
}


$("#datatables_filter input").on('keyup', function () {
    dataTablesRotas.search(jQuery.fn.dataTable.ext.type.search["locale-compare"](this.value)).draw()
})


action = "listarRotasCusto";