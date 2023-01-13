// relatorio-frota-ctrl.js
// Este arquivo contém o script de controle da tela relatorio-frota-view. 

// Preenchimento da Tabela via SQL
var listaDeVeiculos = new Map();
var listaDeRotas = new Map();

var totalNumAlunosAtendidos = 0;

// Dados para serem plotados
var dataIdadeVeiculo = { series: [], labels: [] };
var dataTipoVeiculo = {
    series: [], labels: ["Ônibus", "Micro-ônibus", "Van", "Kombi", "Caminhão",
        "Caminhonete", "Motocicleta", "Animal de tração",
        "Lancha/Voadeira", "Barco de madeira", "Barco de alumínio",
        "Canoa motorizada", "Canoa a remo"]
};
var dataMarcaVeiculo = {
    series: [], labels: ["Iveco", "Mercedes-Benz", "Renault", "Volkswagen", "Volare",
        "EMGEPRON (Empresa Gerencial de Projetos Navais)", "ESTALEIRO B3", "Yamanha"]
};
var dataModeloVeiculo = {
    series: [], labels: ["ORE 1", "ORE 1 (4x4)", "ORE 2", "ORE 3", "ORE 4",
        "ONUREA", "Lancha a Gasolina", "Lancha a Diesel"]
};
var dataOrigemVeiculo = { series: [], labels: ["Veículo Próprio", "Veículo Terceirizado"] };
var dataCapacidadeVeiculo = { series: [], labels: [] };
var dataLotacaoVeiculo = { series: [], labels: [] };

// DataTables
var defaultTableConfig = GetTemplateDataTableConfig();
defaultTableConfig["columns"] = [
    { data: 'PLACA', width: "12%" },
    { data: 'TIPOSTR', width: "14%" },
    { data: 'MARCASTR', width: "14%" },
    { data: 'MODELOSTR', width: "14%" },
    { data: 'CAPACIDADE', width: "400px" },
    { data: 'CAPACIDADE_ATUAL', width: "400px" },
    { data: 'ESTADO', width: "200px" },
    {
        data: "ACOES",
        width: "110px",
        sortable: false,
        defaultContent: '<a href="#" class="btn btn-link btn-primary frotaView"><i class="fa fa-search"></i></a>' +
            '<a href="#" class="btn btn-link btn-warning frotaEdit"><i class="fa fa-edit"></i></a>' +
            '<a href="#" class="btn btn-link btn-danger frotaRemove"><i class="fa fa-times"></i></a>'
    }
]

defaultTableConfig["columnDefs"] = [ { targets: 0, render: renderAtMostXCharacters(50) } ];

var dataTablesRelatorio = $("#datatables").DataTable(defaultTableConfig);

function CalcularEstatisticas() {
    var totalVeiculos = listaDeVeiculos.size;
    var totalIdadeVeiculo = 0;
    var totalCapacidadeVeiculo = 0;

    var statTipo = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0 };
    var statMarca = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };
    var statModelo = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };
    var statOrigem = { 1: 0, 2: 0 };

    listaDeVeiculos.forEach((veiculo) => {
        statTipo[parseInt(veiculo["TIPO"])] = statTipo[parseInt(veiculo["TIPO"])] + 1;
        statMarca[parseInt(veiculo["MARCA"])] = statMarca[parseInt(veiculo["MARCA"])] + 1;
        statModelo[parseInt(veiculo["MODELO"])] = statModelo[parseInt(veiculo["MODELO"])] + 1;
        statOrigem[parseInt(veiculo["ORIGEM"])] = statOrigem[parseInt(veiculo["ORIGEM"])] + 1;

        totalIdadeVeiculo = totalIdadeVeiculo + parseInt(veiculo["ANO"]);
        totalCapacidadeVeiculo = totalCapacidadeVeiculo + parseInt(veiculo["CAPACIDADE"]);
    })

    if (totalVeiculos != 0) {
        dataIdadeVeiculo["series"].push(Math.floor(totalIdadeVeiculo / totalVeiculos));    
        dataCapacidadeVeiculo["series"].push(totalCapacidadeVeiculo / totalVeiculos);
        dataLotacaoVeiculo["series"].push(totalNumAlunosAtendidos / totalVeiculos);
    } else {
        dataIdadeVeiculo["series"].push(0);
        dataCapacidadeVeiculo["series"].push(0);
        dataLotacaoVeiculo["series"].push(0);
    }

    dataIdadeVeiculo["labels"].push("Ano médio dos veículos utilizados");
    dataCapacidadeVeiculo["labels"].push("Média de Assentos Disponíveis por Veículos");
    dataLotacaoVeiculo["labels"].push("Passageiros por Veículo");

    dataTipoVeiculo["series"] = [statTipo[1], statTipo[2], statTipo[3], statTipo[4], statTipo[5], statTipo[6], statTipo[7],
    statTipo[8], statTipo[9], statTipo[10], statTipo[11], statTipo[12], statTipo[13]]

    dataMarcaVeiculo["series"] = [statMarca[1], statMarca[2], statMarca[3], statMarca[4],
    statMarca[5], statMarca[6], statMarca[7], statMarca[8]]

    dataModeloVeiculo["series"] = [statModelo[1], statModelo[2], statModelo[3], statModelo[4], statModelo[5],
    statModelo[6], statModelo[7], statModelo[8]]

    dataOrigemVeiculo["series"] = [statOrigem[1], statOrigem[2]]

    $("#listaTipoRelatorio").val("dependencia").trigger("change");
    $("#menuRelatorio :first-child").click();
}

var listaDeOpcoesRelatorio = {
    "lotacao": {
        TXTMENU: "Capacidade Atual",
        SERIE: dataLotacaoVeiculo,
        TITULO: "Média de passageiros transportados por veículo",
        TIPO: "total",
        FILTRO: "",
    },
    "capacidade": {
        TXTMENU: "Capacidade Média",
        SERIE: dataCapacidadeVeiculo,
        TITULO: "Média da Capacidade Máxima dos Veículos",
        TIPO: "total",
        FILTRO: "",
    },
    "dependencia": {
        TXTMENU: "Categoria",
        SERIE: dataTipoVeiculo,
        TITULO: "Porcentagem de Veículos por Categoria",
        TIPO: "pizza",
        FILTRO: "TIPOSTR",
        LEGENDA_GRANDE: true
    },
    "idade": {
        TXTMENU: "Idade",
        SERIE: dataIdadeVeiculo,
        TITULO: "Ano Médio dos Veículos Utilizados",
        TIPO: "total",
        FILTRO: "LOCALIZACAO",
    },
    "marca": {
        TXTMENU: "Marca",
        SERIE: dataMarcaVeiculo,
        TITULO: "Porcentagem de Veículos por Marca",
        TIPO: "pizza",
        FILTRO: "MARCASTR",
        LEGENDA_GRANDE: true
    },
    "modelo": {
        TXTMENU: "Modelo",
        SERIE: dataModeloVeiculo,
        TITULO: "Porcentagem de Veículos por Modelo",
        TIPO: "barra",
        FILTRO: "MODELOSTR"
    },
    "origem": {
        TXTMENU: "Origem",
        SERIE: dataOrigemVeiculo,
        TITULO: "Porcentagem de Veículos por Origem",
        TIPO: "barra",
        FILTRO: "ORIGEMSTR"
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
    $("#totalNumAlunos").html(dataTablesRelatorio.page.info().recordsDisplay);

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
        $("#totalNumAlunos").html(dataTablesRelatorio.page.info().recordsDisplay);
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

dataTablesRelatorio.on('click', '.frotaView', function () {
    var $tr = getRowOnClick(this);

    estadoVeiculo = dataTablesRelatorio.row($tr).data();
    action = "visualizarVeiculo";
    navigateDashboard("./modules/frota/frota-dados-view.html");
});

dataTablesRelatorio.on('click', '.frotaEdit', function () {
    var $tr = getRowOnClick(this);

    estadoVeiculo = dataTablesRelatorio.row($tr).data();
    action = "editarVeiculo";
    navigateDashboard("./modules/frota/frota-cadastrar-view.html");
});

dataTablesRelatorio.on('click', '.frotaRemove', function () {
    var $tr = getRowOnClick(this);
    estadoVeiculo = dataTablesRelatorio.row($tr).data();
    var idVeiculo = estadoVeiculo["ID"];

    action = "apagarVeiculo";
    confirmDialog("Remover esse veículo?",
                  "Ao remover esse veículo ele será retirado do sistema das "
                + "rotas e das escolas que possuir vínculo."
    ).then((res) => {
        let listaPromisePraRemover = []
        if (res.value) {
            listaPromisePraRemover.push(dbRemoverDadoPorIDPromise(DB_TABLE_VEICULO, "ID_VEICULO", idVeiculo));
            listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_POSSUI_VEICULO, "ID_VEICULO", idVeiculo));
            listaPromisePraRemover.push(dbAtualizaVersao());
        }

        return Promise.all(listaPromisePraRemover)
    }).then((res) => {
        if (res.length > 0) {
            dataTablesVeiculos.row($tr).remove();
            dataTablesVeiculos.draw();
            Swal2.fire({
                title: "Sucesso!",
                icon: "success",
                text: "Veículo removido com sucesso!",
                confirmButtonText: 'Retornar a página de administração'
            });
        }
    }).catch((err) => errorFn("Erro ao remover o veículo", err))
});

Swal2.fire({
    title: "Funcionalidade indisponível",
    icon: "warning",
    html:
        'Esta funcionalidade está em fase de reformulação SETE',
}).then(() => $("#logosete").trigger("click"))

// dbBuscarTodosDadosPromise(DB_TABLE_VEICULO)
// .then(res => processarVeiculos(res))
// .then(() => dbLeftJoinPromise(DB_TABLE_ROTA_ATENDE_ALUNO, "ID_ROTA", DB_TABLE_ROTA, "ID_ROTA"))
// .then(res => processarAlunosPorRota(res))
// .then(() => dbBuscarTodosDadosPromise(DB_TABLE_ROTA_POSSUI_VEICULO))
// .then((res) => processarVeiculosPorRota(res))
// .then(() => adicionaDadosTabela())
// .then(() => CalcularEstatisticas())
// .catch((err) => errorFn("Erro ao listar os veículos!", err))

// Processar veiculos
var processarVeiculos = (res) => {
    for (let veiculoRaw of res) {
        let veiculoJSON = parseVeiculoDB(veiculoRaw);
        veiculoJSON["ID_VEICULO"] = veiculoJSON["ID"]
        veiculoJSON["CAPACIDADE_ATUAL"] = 0

        listaDeVeiculos.set(veiculoJSON["ID_VEICULO"], veiculoJSON);
    }
    return listaDeVeiculos;
}

// Processar alunos por rota
var processarAlunosPorRota = (res) => {
    totalNumAlunosAtendidos = res.length;

    for (let rota of res) {
        rota = parseRotaDB(rota)
        let idRota = rota["ID_ROTA"];
        if (!listaDeRotas.has(idRota)) {
            listaDeRotas.set(idRota, { "NUMALUNOS": 0 });    
        }
        let rotaJSON = listaDeRotas.get(idRota)
        rotaJSON["NUMALUNOS"] = rotaJSON["NUMALUNOS"] + 1;
        listaDeRotas.set(idRota, rotaJSON);    
    }
    return listaDeRotas;
}


// Processar veiculos por rota
var processarVeiculosPorRota = (res) => {
    for (let relVeiculoPorRota of res) {
        let veiculo = listaDeVeiculos.get(relVeiculoPorRota["ID_VEICULO"])
        let idRota = relVeiculoPorRota["ID_ROTA"];

        if (!listaDeRotas.has(idRota)) {
            listaDeRotas.set(idRota, { "NUMALUNOS": 0 });    
        }
        
        let rota = listaDeRotas.get(idRota)
        veiculo["CAPACIDADE_ATUAL"] = rota["NUMALUNOS"];
        listaDeVeiculos.set(relVeiculoPorRota["ID_VEICULO"], veiculo);
    }
    return listaDeVeiculos;
}

// Adiciona dados na tabela
adicionaDadosTabela = (res) => {
    listaDeVeiculos.forEach((veiculo) => {
        dataTablesRelatorio.row.add(veiculo);
    });

    dataTablesRelatorio.draw();
}

action = "relatorioFrota";