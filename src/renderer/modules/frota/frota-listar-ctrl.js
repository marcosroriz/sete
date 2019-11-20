// Preenchimento da Tabela via SQL
var listaDeVeiculos = new Map();

// DataTables
var dataTablesVeiculos = $("#datatables").DataTable({
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
    columnDefs: [{
        targets: 0,
        render: function (data, type, row) {
            return data.length > 50 ?
                data.substr(0, 50) + '…' :
                data;
        }
    }],
    autoWidth: false,
    bAutoWidth: false,
    lengthMenu: [[10, 50, -1], [10, 50, "Todas"]],
    pagingType: "full_numbers",
    order: [[0, "asc"]],
    language: {
        "search": "_INPUT_",
        "searchPlaceholder": "Procurar veículos",
        "lengthMenu": "Mostrar _MENU_ veículos por página",
        "zeroRecords": "Não encontrei nenhum veículo cadastrado",
        "info": "Mostrando página _PAGE_ de _PAGES_",
        "infoEmpty": "Sem registros disponíveis",
        "infoFiltered": "(Veículos filtrados a partir do total de _MAX_ veículos)",
        "paginate": {
            "first": "Primeira",
            "last": "Última",
            "next": "Próxima",
            "previous": "Anterior"
        },
    },
    dom: 'frtipB',
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
    Swal2.fire({
        title: 'Remover esse veículo?',
        text: "Ao remover esse veículo ele será retirado do sistema das rotas e das escolas que possuir vínculo.",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        cancelButtonText: "Cancelar",
        confirmButtonText: 'Sim, remover'
    }).then((result) => {
        if (result.value) {
            RemoverPromise("Veiculos", "ID_VEICULO", idVeiculo)
            .then(() => {
                dataTablesVeiculos.row($tr).remove();
                dataTablesVeiculos.draw();
                Swal2.fire({
                    type: 'success',
                    title: "Sucesso!",
                    text: "Veículo removido com sucesso!",
                    confirmButtonText: 'Retornar a página de administração'
                });
            })
            .catch((err) => errorFn("Erro ao remover o veículo. ", err));
        }
    })
});

// Callback para pegar dados inicia da escolas
var listaInicialCB = (err, result) => {
    if (err) {
        errorFn("Erro ao listar os veículo", err);
    } else {
        $("#totalNumVeiculos").text(result.length);
        
        for (let veiculoRaw of result) {
            let veiculoJSON = parseVeiculoDB(veiculoRaw);
            listaDeVeiculos.set(veiculoJSON["ID_VEICULO"], veiculoJSON);
        }

        listaDeVeiculos.forEach((veiculo) => {
            dataTablesVeiculos.row.add(veiculo);
        });

        dataTablesVeiculos.draw();
    }
};

BuscarTodosDados("Veiculos", listaInicialCB);

action = "listarVeiculos";