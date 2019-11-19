// Preenchimento da Tabela via SQL
var listaDeMotoristas = new Map();

// DataTables
var dataTablesMotoristas = $("#datatables").DataTable({
    columns: [
        { data: 'NOME', width: "40%" },
        { data: 'TELEFONE', width: "25%" },
        { data: 'TURNOSTR', width: "300px" },
        {
            data: "ACOES",
            width: "110px",
            sortable: false,
            defaultContent: '<a href="#" class="btn btn-link btn-primary motoristaView"><i class="fa fa-search"></i></a>' +
                '<a href="#" class="btn btn-link btn-warning motoristaEdit"><i class="fa fa-edit"></i></a>' +
                '<a href="#" class="btn btn-link btn-danger motoristaRemove"><i class="fa fa-times"></i></a>'
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
        "searchPlaceholder": "Procurar motoristas",
        "lengthMenu": "Mostrar _MENU_ motoristas por página",
        "zeroRecords": "Não encontrei nenhum motorista cadastrado",
        "info": "Mostrando página _PAGE_ de _PAGES_",
        "infoEmpty": "Sem registros disponíveis",
        "infoFiltered": "(Motoristas filtrados a partir do total de _MAX_ motoristas)",
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
            title: "Motoristas cadastrados",
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

dataTablesMotoristas.on('click', '.motoristaView', function () {
    var $tr = getRowOnClick(this);

    estadoMotorista = dataTablesMotoristas.row($tr).data();
    action = "visualizarMotorista";
    navigateDashboard("./modules/motorista/motorista-dados-view.html");
});

dataTablesMotoristas.on('click', '.motoristaEdit', function () {
    var $tr = getRowOnClick(this);

    estadoMotorista = dataTablesMotoristas.row($tr).data();
    action = "editarMotorista";
    navigateDashboard("./modules/motorista/motorista-cadastrar-view.html");
});

dataTablesMotoristas.on('click', '.motoristaRemove', function () {
    var $tr = getRowOnClick(this);
    estadoMotorista = dataTablesMotoristas.row($tr).data();
    var idMotorista = estadoMotorista["ID_MOTORISTA"];

    action = "apagarMotorista";
    Swal2.fire({
        title: 'Remover esse motorista?',
        text: "Ao remover esse motorista ele será retirado do sistema das rotas e das escolas que possuir vínculo.",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        cancelButtonText: "Cancelar",
        confirmButtonText: 'Sim, remover'
    }).then((result) => {
        if (result.value) {
            RemoverPromise("Motoristas", "ID_MOTORISTA", idMotorista)
            .then(() => {
                dataTablesMotoristas.row($tr).remove();
                dataTablesMotoristas.draw();
                Swal2.fire({
                    type: 'success',
                    title: "Sucesso!",
                    text: "Motorista removido com sucesso!",
                    confirmButtonText: 'Retornar a página de administração'
                });
            })
            .catch((err) => errorFn("Erro ao remover o motorista. ", err));
        }
    })
});

// Callback para pegar dados inicia da escolas
var listaInicialCB = (err, result) => {
    if (err) {
        errorFn("Erro ao listar os motoristas", err);
    } else {
        for (let motoristaRaw of result) {
            let motoristaJSON = parseMotoristaDB(motoristaRaw);
            listaDeMotoristas.set(motoristaJSON["ID_MOTORISTA"], motoristaJSON);
        }

        listaDeMotoristas.forEach((motorista) => {
            dataTablesMotoristas.row.add(motorista);
        });

        dataTablesMotoristas.draw();
    }
};

BuscarTodosDados("Motoristas", listaInicialCB);

action = "listarMotoristas";