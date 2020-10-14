// Preenchimento da Tabela via SQL
var listaDeEscolas = new Map();

// DataTables
var dataTableEscolas = $("#datatables").DataTable({
    // fixedHeader: true,
    columns: [
        { data: 'NOME', width: "40%" },
        { data: 'LOCALIZACAO', width: "15%" },
        { data: 'ENSINO', width: "20%" },
        { data: 'REGIME', width: "20%" },
        {
            data: "ACOES",
            width: "110px",
            sortable: false,
            defaultContent: '<a href="#" class="btn btn-link btn-info escolaStudent"><i class="fa fa-user"></i></a>' +
                '<a href="#" class="btn btn-link btn-primary escolaView"><i class="fa fa-search"></i></a>' +
                '<a href="#" class="btn btn-link btn-warning escolaEdit"><i class="fa fa-edit"></i></a>' +
                '<a href="#" class="btn btn-link btn-danger escolaRemove"><i class="fa fa-times"></i></a>'
        }
    ],
    order: [[0, "desc"]],
    columnDefs: [{
        targets: 0,
        type: 'locale-compare',
    }],
    autoWidth: false,
    bAutoWidth: false,
    lengthMenu: [[10, 50, -1], [10, 50, "Todas"]],
    pagingType: "full_numbers",
    language: {
        "search": "_INPUT_",
        "searchPlaceholder": "Procurar escolas",
        "lengthMenu": "Mostrar _MENU_ escolas por página",
        "zeroRecords": "Não encontrei nenhuma escola para importar",
        "info": "Mostrando página _PAGE_ de _PAGES_",
        "infoEmpty": "Sem registros disponíveis",
        "infoFiltered": "(Escolas filtradas a partir do total de _MAX_ escolas)",
        "paginate": {
            "first": "Primeira",
            "last": "Última",
            "next": "Próxima",
            "previous": "Anterior"
        },
    },
    dom: 'lfrtipB',
    buttons: [
        {
            extend: 'pdfHtml5',
            orientation: "landscape",
            title: "Escolas cadastradas no MEC",
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

$('input[type="search"]').keyup(function () {
    dataTableEscolas.search(jQuery.fn.dataTable.ext.type.search.string(this.value)).draw()
})

dataTableEscolas.on('click', '.escolaStudent', function () {
    var $tr = getRowOnClick(this);

    estadoEscola = dataTableEscolas.row($tr).data();
    action = "gerirAlunosEscola";
    navigateDashboard("./modules/escola/escola-gerir-alunos-view.html");
});

dataTableEscolas.on('click', '.escolaView', function () {
    var $tr = getRowOnClick(this);

    estadoEscola = dataTableEscolas.row($tr).data();
    action = "visualizarEscola";
    navigateDashboard("./modules/escola/escola-dados-view.html");
});

dataTableEscolas.on('click', '.escolaEdit', function () {
    var $tr = getRowOnClick(this);

    estadoEscola = dataTableEscolas.row($tr).data();
    action = "editarEscola";
    navigateDashboard("./modules/escola/escola-cadastrar-view.html");
});

dataTableEscolas.on('click', '.escolaRemove', function () {
    var $tr = getRowOnClick(this);

    estadoEscola = dataTableEscolas.row($tr).data();
    action = "apagarEscola";
    Swal2.fire({
        title: 'Remover essa escola?',
        text: "Ao remover uma escola os alunos remanescentes da mesma deverão ser alocados novamente a outra(s) escola(s).",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        cancelButtonText: "Cancelar",
        confirmButtonText: 'Sim, remover'
    }).then((result) => {
        if (result.value) {
            RemoverEscola(estadoEscola["ID_ESCOLA"], (err, result) => {
                if (result) {
                    dataTableEscolas.row($tr).remove();
                    dataTableEscolas.draw();
                    Swal2.fire({
                        type: 'success',
                        title: "Sucesso!",
                        text: "Escola removida com sucesso!",
                        confirmButtonText: 'Retornar a página de administração'
                    });
                } else {
                    Swal2.fire({
                        type: 'error',
                        title: 'Oops...',
                        text: 'Tivemos algum problema. Por favor, reinicie o software!',
                    });
                }
            })
        }
    })
});

// Função para relatar erro
var errorFnEscolas = (err) => {
    Swal2.fire({
        title: "Ops... tivemos um problema!",
        text: "Erro ao importar as escolas! Feche e abra o software novamente. \n" + err,
        icon: "error",
        button: "Fechar"
    });
}

// Callback para pegar número de alunos da escola
var listaNumAlunosCB = (err, result) => {
    if (err) {
        errorFnEscolas(err);
    } else {
        for (let escolaRaw of result) {
            let eID = escolaRaw["ID_ESCOLA"];
            let qtde = escolaRaw["NUM_ALUNOS"];
            let escolaJSON = listaDeEscolas.get(eID);
            escolaJSON["NUM_ALUNOS"] = qtde;
            listaDeEscolas.set(eID, escolaJSON);
        }

        listaDeEscolas.forEach((escola) => {
            dataTableEscolas.row.add(escola);
        });

        dataTableEscolas.draw();
    }
};

// Callback para pegar dados inicia da escolas
var listaInicialCB = (err, result) => {
    if (err) {
        errorFnEscolas(err);
    } else {
        $("#totalNumEscolas").text(result.length);
        for (let escolaRaw of result) {
            let escolaJSON = parseEscolaDB(escolaRaw);
            listaDeEscolas.set(escolaJSON["ID_ESCOLA"], escolaJSON);
        }
        NumeroDeAlunosEscolas(listaNumAlunosCB);
    }
};

console.log("CO_MUNICIPIO", codCidade)
BuscarDadoEspecificoPromise("MEC_Escolas", "CO_MUNICIPIO", codCidade)
    .then(result => {
        $("#totalNumEscolas").text(result.length);
        for (let escolaRaw of result) {
            let escolaJSON = parseEscolaMECDB(escolaRaw);
            console.log(escolaJSON);

            listaDeEscolas.set(escolaJSON["CO_ENTIDADE"], escolaJSON);
            dataTableEscolas.row.add(escolaJSON);

        }

        dataTableEscolas.draw();

    })
    .catch(err => {
        errorFn
    })
