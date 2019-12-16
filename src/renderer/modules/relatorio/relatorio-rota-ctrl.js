// Preenchimento da Tabela via SQL
var listaDeRotas = new Map();
var totalNumRotas = 0;
var totalNumAlunosAtendidos = 0;

// Dados para serem plotados
var dataTotalRotas = { series: [], labels: [] };
var dataQuilometragem = { series: [], labels: ["Menor", "Média", "Maior"] };
var dataQuilometragemTotal = { series: [], labels: [] };
var dataTempo = { series: [], labels: ["Menor", "Média", "Maior"] };
var dataTempoTotal = { series: [], labels: [] };
var dataTurno = { series: [], labels: ["Manhã", "Tarde", "Noite"] };
var dataDificuldade = {
    series: [], labels: ["Porteira", "Mata-Burro", "Colchete",
        "Atoleiro", "Ponte Rústica"]
};

// DataTables
var defaultTableConfig = GetTemplateDataTableConfig();
defaultTableConfig["columns"] = [
    { data: 'NOME', width: "30%" },
    { data: 'TURNOSTR', width: "20%" },
    { data: 'KMSTR', width: "20%" },
    { data: "DIFICULDADESTR" },
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
]

defaultTableConfig["columnDefs"] = [
    {
        "targets": [3],
        "visible": false,
        "searchable": true
    },
    {
        targets: 0,
        render: function (data, type, row) {
            return data.length > 50 ?
                data.substr(0, 50) + '…' :
                data;
        }
    },
];

var dataTablesRelatorio = $("#datatables").DataTable(defaultTableConfig);

function CalcularEstatisticas() {
    var totalRotas = listaDeRotas.size;

    var quilometragem = new Array();
    var tempo = new Array();
    var statTurno = { 1: 0, 2: 0, 3: 0 };
    var statDificuldade = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    listaDeRotas.forEach((rota) => {
        quilometragem.push(parseFloat(rota["KM"]))
        tempo.push(parseFloat(rota["TEMPO"]))

        if (rota["TURNO_MATUTINO"]) statTurno[1] = statTurno[1] + 1;
        if (rota["TURNO_VESPERTINO"]) statTurno[2] = statTurno[2] + 1;
        if (rota["TURNO_NOTURNO"]) statTurno[3] = statTurno[3] + 1;

        if (rota["DA_PORTEIRA"]) statDificuldade[1] = statDificuldade[1] + 1;
        if (rota["DA_MATABURRO"]) statDificuldade[2] = statDificuldade[2] + 1;
        if (rota["DA_COLCHETE"]) statDificuldade[3] = statDificuldade[3] + 1;
        if (rota["DA_ATOLEIRO"]) statDificuldade[4] = statDificuldade[4] + 1;
        if (rota["DA_PONTERUSTICA"]) statDificuldade[5] = statDificuldade[5] + 1;
    })

    dataTotalRotas["series"].push(totalRotas);
    dataTotalRotas["labels"].push("Número total de rotas cadastradas");

    dataQuilometragemTotal["series"].push(quilometragem.reduce((a, b) => a + b));
    dataQuilometragemTotal["labels"].push("Quilometragem total percorrida pelas rotas (km)")

    dataTempoTotal["series"].push(tempo.reduce((a, b) => a + b));
    dataTempoTotal["labels"].push("Tempo total percorrido pelas rotas (min)")

    var kmMean = quilometragem.reduce((a, b) => a + b) / totalRotas;
    var kmMax = Math.max(...quilometragem);
    var kmMin = Math.min(...quilometragem);
    dataQuilometragem["series"] = [kmMin, kmMean, kmMax]

    var tempoMean = tempo.reduce((a, b) => a + b) / totalRotas;
    var tempoMax = Math.max(...tempo);
    var tempoMin = Math.min(...tempo);
    dataTempo["series"] = [tempoMin, tempoMean, tempoMax]

    dataTurno["series"] = [statTurno[1], statTurno[2], statTurno[3]]
    dataDificuldade["series"] = [statDificuldade[1], statDificuldade[2],
    statDificuldade[3], statDificuldade[4], statDificuldade[5]]

    $("#listaTipoRelatorio").val("turno").trigger("change");
    $("#menuRelatorio :first-child").click();
}

var listaDeOpcoesRelatorio = {
    "total": {
        TXTMENU: "Total",
        SERIE: dataTotalRotas,
        TITULO: "Número total de rotas",
        TIPO: "total",
        FILTRO: "",
    },
    "quilometragem": {
        TXTMENU: "Quilometragem média",
        SERIE: dataQuilometragem,
        TITULO: "Valores da menor, média e maior quilometragem percorrida pelas rotas",
        TIPO: "barraraw",
        FILTRO: "",
    },
    "quilometragemtotal": {
        TXTMENU: "Quilometragem total",
        SERIE: dataQuilometragemTotal,
        TITULO: "Quilometragem total percorrida pela rota",
        TIPO: "total",
        FILTRO: "",
    },
    "tempo": {
        TXTMENU: "Tempo médio",
        SERIE: dataTempo,
        TITULO: "Valores do menor, médio e maior tempo gasto pelas rotas",
        TIPO: "barraraw",
        FILTRO: "",
    },
    "tempototal": {
        TXTMENU: "Tempo total",
        SERIE: dataTempoTotal,
        TITULO: "Tempo total gasto pelas rota",
        TIPO: "total",
        FILTRO: "",
    },
    "turno": {
        TXTMENU: "Turno",
        SERIE: dataTurno,
        TITULO: "Distribuição de rotas por turno",
        TIPO: "barra",
        FILTRO: "TURNOSTR",
    },
    "dificuldade": {
        TXTMENU: "Dificuldades atravessadas",
        SERIE: dataDificuldade,
        TITULO: "Quantiativo das dificuldades atravessadas pelas rotas",
        TIPO: "barra",
        FILTRO: "DIFICULDADESTR",
        LEGENDA_GRANDE: true
    },
}

GetTemplateMenu("#menuRelatorio", listaDeOpcoesRelatorio);
SetMainFilterMenu("#listaTipoRelatorio", listaDeOpcoesRelatorio);

$("#listaTipoRelatorio").change((e) => {
    var $that = $(e.target);
    var optName = $that.val();
    var opt = listaDeOpcoesRelatorio[optName];

    $("#listaFiltroRelatorio").empty();
    $("#listaFiltroRelatorio").append(`<option value="">Selecione uma opção ...</option>`);
    var labels = opt["SERIE"]["labels"];

    if (opt["CUSTOM"]) {
        opt["CUSTOMFN"]();
    } else {
        for (let i = 0; i < labels.length; i++) {
            $("#listaFiltroRelatorio").append(`<option value="${labels[i]}">${labels[i]}</option>`);
        }
    }

    dataTablesRelatorio.search("", false, true, false).draw();
    $("#totalNumRotas").html(dataTablesRelatorio.page.info().recordsDisplay);

    $("#listaFiltroRelatorio").change((e) => {
        var filtroValue = $(e.currentTarget).val();
        var optValue = listaDeOpcoesRelatorio[$("#listaTipoRelatorio").val()];

        if (optValue["FILTROULTIMA"]) {
            filtroValue = filtroValue.split(" ").slice(-1)[0];
        }

        if (optValue["CUSTOM"]) {
            dataTablesRelatorio.search(filtroValue).draw();
        } else {
            dataTablesRelatorio.search(filtroValue, false, true, false).draw();
        }
        $("#totalNumRotas").html(dataTablesRelatorio.page.info().recordsDisplay);
    })
})

$("#menuRelatorio a.list-group-item").click((e) => {
    $(".card-report").fadeOut(300, () => {
        e.preventDefault()
        var $that = $(e.target);
        $($that).parent().find('a').removeClass('active');
        $that.addClass('active');

        var optName = $that.attr('name');
        var opt = listaDeOpcoesRelatorio[optName];

        // Titulo
        $(".card-title").html(opt["TITULO"]);

        // Grafico
        $("#grafico").empty();
        plotGraphic("#grafico", opt);

        // Legenda
        $("#legendPlace").empty();
        var isLong = false;
        if (opt["LEGENDA_GRANDE"]) isLong = true;
        if (opt["TIPO"] != "barra") {
            plotLegend("#legendPlace", opt["SERIE"]["labels"], isLong)
        }
        $(".card-report").fadeIn(300);
    });
});

dataTablesRelatorio.on('click', '.rotaView', function () {
    var $tr = getRowOnClick(this);

    estadoRota = dataTablesRelatorio.row($tr).data();
    action = "visualizarRota";
    navigateDashboard("./modules/rota/rota-dados-view.html");
});

dataTablesRelatorio.on('click', '.rotaEdit', function () {
    var $tr = getRowOnClick(this);

    estadoRota = dataTablesRelatorio.row($tr).data();
    action = "editarRota";
    navigateDashboard("./modules/rota/rota-cadastrar-view.html");
});

dataTablesRelatorio.on('click', '.rotaRemove', function () {
    var $tr = getRowOnClick(this);
    estadoRota = dataTablesRelatorio.row($tr).data();
    var idRota = estadoRota["ID_ROTA"];

    action = "apagarMotorista";
    Swal2.fire({
        title: 'Remover essa rota?',
        text: "Ao remover essa rota ela será retirado do sistema e os alunos e escolas que possuir vínculo deverão ser rearranjados novamente.",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        cancelButtonText: "Cancelar",
        confirmButtonText: 'Sim, remover'
    }).then((result) => {
        if (result.value) {
            RemoverPromise("Rotas", "ID_ROTA", idRota)
                .then(() => {
                    dataTablesRelatorio.row($tr).remove();
                    dataTablesRelatorio.draw();
                    Swal2.fire({
                        type: 'success',
                        title: "Sucesso!",
                        text: "Rota removida com sucesso!",
                        confirmButtonText: 'Retornar a página de administração'
                    });
                })
                .catch((err) => errorFn("Erro ao remover a rota. ", err));
        }
    })
});

// Callback para pegar dados inicia da escolas
var listaInicialCB = (err, result) => {
    if (err) {
        errorFn("Erro ao listar as rotas", err);
    } else {
        totalNumRotas = result.length;

        for (let rotaRaw of result) {
            let rotaJSON = parseRotaDB(rotaRaw);
            rotaJSON["STRESCOLAS"] = "Não cadastrado"
            rotaJSON["STRALUNOS"] = "Não cadastrado"
            rotaJSON["NUMESCOLAS"] = 0
            rotaJSON["NUMALUNOS"] = 0
            listaDeRotas.set(rotaJSON["ID_ROTA"], rotaJSON);
        }

        var promiseArray = new Array();

        listaDeRotas.forEach((rota) => {
            promiseArray.push(ListarTodasAsEscolasAtendidasPorRotaPromise(rota["ID_ROTA"]))
            promiseArray.push(ListarTodosOsAlunosAtendidosPorRotaPromise(rota["ID_ROTA"]))
        });

        Promise.all(promiseArray)
            .then((res) => {
                var handleEscolasAtendidas = new Array();
                var handleAlunosAtendidos = new Array();
                for (let i = 0; i < res.length; i++) {
                    if (i % 2 == 0) {
                        handleEscolasAtendidas.push(res[i]);
                    } else {
                        handleAlunosAtendidos.push(res[i]);
                    }
                }

                handleEscolasAtendidas.forEach((e) => {
                    if (e != null && e != undefined && e.length != 0) {
                        let rotaJSON = listaDeRotas.get(e[0]["ID_ROTA"]);
                        rotaJSON["NUMESCOLAS"] = e.length;
                    }
                });

                handleAlunosAtendidos.forEach((a) => {
                    if (a != null && a != undefined && a.length != 0) {
                        let rotaJSON = listaDeRotas.get(a[0]["ID_ROTA"]);
                        rotaJSON["NUMALUNOS"] = a.length;
                    }
                });
                listaDeRotas.forEach((rota) => {
                    dataTablesRelatorio.row.add(rota);
                });
                dataTablesRelatorio.draw();
                CalcularEstatisticas();
            });

    }
};

BuscarTodosDados("Rotas", listaInicialCB);

action = "relatorioRota";