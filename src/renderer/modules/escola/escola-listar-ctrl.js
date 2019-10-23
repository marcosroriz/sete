// Preenchimento da Tabela via SQL
var listaDeEscolas = new Map();
var dTable = $("#datatables").DataTable({
    // fixedHeader: true,
    columns: [
        { data: 'NOME', width: "55%" },
        { data: 'LOCALIZACAO',  width: "15%" },
        { data: 'ENSINO', width: "15%" },
        { data: 'HORARIO', width: "25%" },
        { data: 'NUMALUNOS', width: "100px" },
        {
            data: "ACOES",
            width: "100px",
            sortable: false,
            defaultContent: '<a href="#" class="btn btn-link btn-info like"><i class="fa fa-heart"></i></a>' +
                            '<a href="#" class="btn btn-link btn-warning edit"><i class="fa fa-edit"></i></a>' +
                            '<a href="#" class="btn btn-link btn-danger remove"><i class="fa fa-times"></i></a>'
        }
    ],
    autoWidth: false,
    bAutoWidth: false,
    lengthMenu: [[10, 50, -1], [10, 50, "Todas"]],
    pagingType: "full_numbers",
    order: [[ 0, "desc" ]],
    language: {
        "search": "_INPUT_",
        "searchPlaceholder": "Procurar escolas",
        "lengthMenu": "Mostrar _MENU_ escolas por página",
        "zeroRecords": "Não achamos essa escola",
        "info": "Mostrando página _PAGE_ de _PAGES_",
        "infoEmpty": "Sem registros disponíveis",
        "infoFiltered": "(Escolas filtradas a partir do total de _MAX_ escolas)",
        "paginate": {
            "first":      "Primeira",
            "last":       "Última",
            "next":       "Próxima",
            "previous":   "Anterior"
        },
    },
    dom: 'frtipB',
    buttons: [
        {
            extend: 'pdfHtml5',
            orientation: "landscape",
            title: "Escolas cadastradas",
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
                doc.styles.tableHeader.fontSize = 14;
            }
        }
    ]
});

// $('a[data-toggle="tab"]').on( 'shown.bs.tab', function (e) {
//     dTable.columns.adjust().draw();
// } ); 


// Transformar linha do DB para JSON
var parseEscolaDB = function (escolaRaw) {
    var escolaJSON = Object.assign({}, escolaRaw);
    escolaJSON["NOME"] = escolaJSON["NOME"] + " UNIVERSIDADE FEDERAL DE GOIÁS";
    switch (escolaRaw["MEC_TP_LOCALIZACAO"]) {
        case 1:
            escolaJSON["LOCALIZACAO"] = "Urbana";
            break;
        case 2:
            escolaJSON["LOCALIZACAO"] = "Rural";
            break;
        default:
            escolaJSON["LOCALIZACAO"] = "Urbana";
    }

    switch (escolaRaw["TP_DEPENDENCIA"]) {
        case 1:
            escolaJSON["DEPENDENCIA"] = "Federal";
            break;
        case 2:
            escolaJSON["DEPENDENCIA"] = "Estadual";
            break;
        case 3:
            escolaJSON["DEPENDENCIA"] = "Municipal";
            break;
        case 4:
            escolaJSON["DEPENDENCIA"] = "Privada";
            break;
        default:
            escolaJSON["DEPENDENCIA"] = "Municipal";
    }
    
    var tipoEnsino = new Array();
    if (escolaRaw["ENSINO_FUNDAMENTAL"]) tipoEnsino.push("Fundamental");
    if (escolaRaw["ENSINO_MEDIO"]) tipoEnsino.push("Médio");
    if (escolaRaw["ENSINO_SUPERIOR"]) tipoEnsino.push("Superior");
    escolaJSON["ENSINO"] = tipoEnsino.join(", ");
    
    var horarioEnsino = new Array();
    if (escolaRaw["HORARIO_MATUTINO"]) horarioEnsino.push("Manhã");
    if (escolaRaw["HORARIO_NOTURNO"]) horarioEnsino.push("Tarde");
    if (escolaRaw["HORARIO_VESPERTINO"]) horarioEnsino.push("Noite");
    escolaJSON["HORARIO"] = horarioEnsino.join(", ");

    escolaJSON["NUMALUNOS"] = 0;

    return escolaJSON;
};

// Callback para listar escolas
var listaInicialCB = (err, result) => {
    if (err) {
        Swal2.fire({
            title: "Ops... tivemos um problema!",
            text: "Erro ao listar as escolas! Feche e abra o software novamente. \n" + err,
            icon: "error",
            button: "Fechar"
        });
    } else {
        for (let escolaRaw of result) {
            let escolaJSON = parseEscolaDB(escolaRaw);
            listaDeEscolas.set(escolaJSON["ID_ESCOLA"], escolaJSON);
            dTable.row.add(escolaJSON);
            dTable.row.add(escolaJSON);
            dTable.row.add(escolaJSON);
            dTable.row.add(escolaJSON);
            dTable.row.add(escolaJSON);
            dTable.row.add(escolaJSON);
            dTable.row.add(escolaJSON);
            dTable.row.add(escolaJSON);
            dTable.row.add(escolaJSON);
            dTable.row.add(escolaJSON);
            dTable.row.add(escolaJSON);
            dTable.row.add(escolaJSON);
            dTable.row.add(escolaJSON);
            dTable.row.add(escolaJSON);
            dTable.row.add(escolaJSON);
            dTable.row.add(escolaJSON);
            dTable.row.add(escolaJSON);
        }
        dTable.draw();
    }
};

BuscarTodasEscolas(listaInicialCB);

