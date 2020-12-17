// frota-listar-ctrl.js
// Este arquivo contém o script de controle da tela frota-listar-view. O mesmo
// apresenta os veículos cadastrados em uma tabela.

// Preenchimento da Tabela via SQL
var listaDeVeiculos = new Map();

// DataTables
var dataTablesVeiculos = $("#datatables").DataTable({
    ...dtConfigPadrao("veículo"),
    ...{
        columns: [
            { data: 'PLACA', width: "12%" },
            { data: 'TIPOSTR', width: "14%" },
            { data: 'MARCASTR', width: "14%" },
            { data: 'MODELOSTR', width: "14%" },
            { data: 'CAPACIDADE', width: "400px" },
            { data: 'CAPACIDADE_ATUAL', width: "400px" },
            { data: 'ESTADO', width: "200px" },
            {
                data: "ACOES",
                width: "70px",
                sortable: false,
                defaultContent: '<a href="#" class="btn btn-link btn-primary frotaView"><i class="fa fa-search"></i></a>' +
                    '<a href="#" class="btn btn-link btn-warning frotaEdit"><i class="fa fa-edit"></i></a>' +
                    '<a href="#" class="btn btn-link btn-danger frotaRemove"><i class="fa fa-times"></i></a>'
            }
        ],
        columnDefs: [{ targets: 0,  render: renderAtMostXCharacters(50) }],
        dom: 'lfrtipB',
        buttons: [
            {
                extend: 'pdfHtml5',
                orientation: "landscape",
                title: "Veículos cadastrados",
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

dataTablesVeiculos.on('click', '.frotaView', function () {
    var $tr = getRowOnClick(this);

    estadoVeiculo = dataTablesVeiculos.row($tr).data();
    action = "visualizarVeiculo";
    navigateDashboard("./modules/frota/frota-dados-view.html");
});

dataTablesVeiculos.on('click', '.frotaEdit', function () {
    var $tr = getRowOnClick(this);

    estadoVeiculo = dataTablesVeiculos.row($tr).data();
    action = "editarVeiculo";
    navigateDashboard("./modules/frota/frota-cadastrar-view.html");
});

dataTablesVeiculos.on('click', '.frotaRemove', function () {
    var $tr = getRowOnClick(this);

    estadoVeiculo = dataTablesVeiculos.row($tr).data();
    var idVeiculo = estadoVeiculo["ID_VEICULO"];

    action = "apagarVeiculo";
    confirmDialog("Remover esse veículo?",
                  "Ao remover esse veículo ele será retirado do sistema das "
                + "rotas e das escolas que possuir vínculo."
    ).then((res) => {
        let listaPromisePraRemover = []
        if (res.value) {
            listaPromisePraRemover.push(dbRemoverDadoPorIDPromise(DB_TABLE_VEICULO, "ID_VEICULO", idVeiculo));
            listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_POSSUI_POR_VEICULO, "ID_VEICULO", idVeiculo));
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

dbBuscarTodosDadosPromise(DB_TABLE_VEICULO)
.then(res => processarVeiculos(res))
.then(res => adicionaDadosTabela(res))
.catch((err) => errorFn("Erro ao listar os veículos!", err))

// Processar motoristas
var processarVeiculos = (res) => {
    $("#totalNumVeiculos").text(res.length);
    for (let veiculoRaw of res) {
        let veiculoJSON = parseVeiculoDB(veiculoRaw);
        veiculoJSON["ID_VEICULO"] = veiculoJSON["ID"]
        listaDeVeiculos.set(veiculoJSON["ID_VEICULO"], veiculoJSON);
    }
    return listaDeVeiculos;
}

// Adiciona dados na tabela
adicionaDadosTabela = (res) => {
    res.forEach((veiculo) => {
        dataTablesVeiculos.row.add(veiculo);
    });

    dataTablesVeiculos.draw();
}

action = "listarVeiculos";