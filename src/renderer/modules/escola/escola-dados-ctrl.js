// Cria mapa
var elat = estadoEscola["LOC_LATITUDE"];
var elng = estadoEscola["LOC_LONGITUDE"]
var mapaDetalhe = novoMapaOpenLayers("mapDetalheEscola", elat, elng);
mapaDetalhe["activateImageLayerSwitcher"]();

window.onresize = function () {
    setTimeout(function () { 
        if (mapaDetalhe != null) { mapaDetalhe["map"].updateSize(); }
    }, 200);
}

// Desenha marcador
var posicaoEscola = new ol.Feature({
    "geometry": new ol.geom.Point(ol.proj.fromLonLat([elng, elat]))
});
posicaoEscola.setStyle(new ol.style.Style({
    image: new ol.style.Icon({
        anchor: [12, 37],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        opacity: 1,
        src: "img/icones/escola-marcador.png"
    })
}));
mapaDetalhe["vectorSource"].addFeature(posicaoEscola);

// Tira o btn group do datatable
$.fn.dataTable.Buttons.defaults.dom.container.className = 'dt-buttons';

// Cria DataTable Institucional
var dataTableInstitucional = $("#dataTableInstitucional").DataTable({
    columns: [
        { width: "20%", className: "text-right detalheChave" },
        { width: "60%", className: "text-left detalheValor" },
    ],
    autoWidth: false,
    paging: false,
    searching: false,
    ordering: false,
    dom: 't<"detalheToolBar"B>',
    buttons: [
        {
            text: "Voltar",
            className: "btn-info",
            action: function(e, dt, node, config) {
                navigateDashboard(lastPage);
            }
        },
        {
            extend: 'excel',
            className: 'btnExcel',
            filename: "EscolaCadastrada",
            title: appTitle,
            messageTop: "Dados da Escola: " + estadoEscola["NOME"],
            text: 'Exportar para Excel/LibreOffice',
            customize: function (xlsx) {
                var sheet = xlsx.xl.worksheets['sheet1.xml'];

                $('row c[r^="A"]', sheet).attr('s', '2');
                $('row[r="1"] c[r^="A"]', sheet).attr('s', '27');
                $('row[r="2"] c[r^="A"]', sheet).attr('s', '3');
            }
        },
        {
            extend: 'pdfHtml5',
            orientation: "landscape",
            title: "Escolas cadastradas",
            text: "Exportar para PDF",
            exportOptions: {
                columns: [0, 1]
            },
            customize: function (doc) {
                doc = docReport(doc);
                doc.content[2].table.widths = ['30%', '70%'];
            }
        },
        {
            text: "Modificar",
            className: "btnMoficar",
            action: function(e, dt, node, config) {
                alert("Modificar");
            }
        },
        {
            text: "Apagar",
            className: "btnApagar",
            action: function(e, dt, node, config) {
                alert("Apagar");
            }
        },
        // { 
        //     text: "Salvar Mapa",
        //     action: function (e, dt, node, config) {
        //         alert('Button activated');
        //         htmlToImage.toPng(document.getElementById("mapaCanvas"))
        //             .then(function (dataUrl) {
        //                 var link = document.createElement('a');
        //                 link.download = 'my-image-name.jpeg';
        //                 link.href = dataUrl;
        //                 link.click();
        //             });
        //     }
        // },
    ]
});

var popularTabelaInstitucional = () => {
    // Popular tabela utilizando escola escolhida (estado)
    $("#detalheNomeEscola").html(estadoEscola["NOME"]);

    dataTableInstitucional.row.add(["Nome da escola", estadoEscola["NOME"]]);
    dataTableInstitucional.row.add(["Estado", ibgeEstados[estadoEscola["MEC_CO_UF"]]["nome"]]);
    dataTableInstitucional.row.add(["Município", ibgeMunicipios[estadoEscola["MEC_CO_MUNICIPIO"]]]);

    if (estadoEscola["LOC_CEP"] != "") {
        dataTableInstitucional.row.add(["CEP", estadoEscola["DEPENDENCIA"]]);
    } else {
        dataTableInstitucional.row.add(["CEP", "CEP não informado"]);
    }

    if (estadoEscola["LOC_ENDERECO"] != "") {
        dataTableInstitucional.row.add(["Endereço", estadoEscola["LOC_ENDERECO"]]);
    } else {
        dataTableInstitucional.row.add(["Endereço", "Endereço não informado"]);
    }

    dataTableInstitucional.row.add(["Tipo de Localização", estadoEscola["LOCALIZACAO"]]);
    switch (estadoEscola["MEC_TP_LOCALIZACAO_DIFERENCIADA"]) {
        case 1:
            dataTableInstitucional.row.add(["Localização diferenciada", "Área de assentamento"]);
            break;
        case 2:
            dataTableInstitucional.row.add(["Localização diferenciada", "Terra índigena"]);
            break;
        case 3:
            dataTableInstitucional.row.add(["Localização diferenciada", "Área remanescente de quilombo"]);
            break;
        default:
            break;
    }
    dataTableInstitucional.row.add(["Dependência", estadoEscola["DEPENDENCIA"]]);

    if (estadoEscola["CONTATO_RESPONSAVEL"] != "") {
        dataTableInstitucional.row.add(["Contato", estadoEscola["CONTATO_RESPONSAVEL"]]);
    } else {
        dataTableInstitucional.row.add(["Contato", "Contato não informado"]);
    }

    if (estadoEscola["CONTATO_TELEFONE"] != "") {
        dataTableInstitucional.row.add(["Telefone de Contato", estadoEscola["CONTATO_TELEFONE"]]);
    } else {
        dataTableInstitucional.row.add(["Telefone de Contato", "Telefone de contato não informado"]);
    }

    dataTableInstitucional.row.add(["Número de alunos atendidos", estadoEscola["NUM_ALUNOS"]]);
    dataTableInstitucional.row.add(["Tipo de ensino oferecido", estadoEscola["ENSINO"]]);
    dataTableInstitucional.row.add(["Horário de funcionamento", estadoEscola["HORARIO"]]);
    dataTableInstitucional.row.add(["Regime de funcionamento", estadoEscola["REGIME"]]);

    dataTableInstitucional.draw();
}

popularTabelaInstitucional();

// Tabela Lista de Alunos
var dataTableListaDeAlunos = $('#dataTableListaDeAlunos').DataTable( {
    columns: [
        { data: 'NOME', width: "40%" },
        { data: 'DATA_NASCIMENTO', width: "300px" },
        { data: 'NOME_RESPONSAVEL', width: "250px" },
        // {
        //     data: "ACOES",
        //     width: "200px",
        //     sortable: false,
        //     defaultContent: '<a href="#" class="btn btn-link btn-primary alunoView"><i class="fa fa-search"></i></a>' +
        //                     '<a href="#" class="btn btn-link btn-warning alunoEdit"><i class="fa fa-edit"></i></a>' +
        //                     '<a href="#" class="btn btn-link btn-danger alunoRemove"><i class="fa fa-times"></i></a>'
        // },
        // { data: 'TELEFONE_RESPONSAVEL' },
        // { data: 'GRAU_RESPONSAVEL' },
        // { data: 'ENDERECO' },
        // { data: 'TURNO' },
    ],
    autoWidth: false,
    bAutoWidth: false,
    lengthMenu: [[10, 50, -1], [10, 50, "Todos"]],
    pagingType: "full_numbers",
    order: [[ 0, "asc" ]],
    language: {
        "search": "_INPUT_",
        "searchPlaceholder": "Procurar alunos",
        "lengthMenu": "Mostrar _MENU_ alunos por página",
        "zeroRecords": "Não encontrei nenhum aluno cadastrado",
        "info": "Mostrando página _PAGE_ de _PAGES_",
        "infoEmpty": "Sem registros disponíveis",
        "infoFiltered": "(Alunos filtrados a partir do total de _MAX_ alunos)",
        "paginate": {
            "first":      "Primeira",
            "last":       "Última",
            "next":       "Próxima",
            "previous":   "Anterior"
        },
    },
    dom: 't<"detalheToolBar"B>',
    buttons: [
        {
            text: "Voltar",
            className: "btn-info",
            action: function(e, dt, node, config) {
                navigateDashboard(lastPage);
            }
        },
        {
            extend: 'excel',
            className: 'btnExcel',
            filename: "AlunosAtendidos",
            title: appTitle,
            messageTop: "Alunos Atendidos pela Escola: " + estadoEscola["NOME"],
            text: 'Exportar para Excel/LibreOffice',
            customize: function (xlsx) {
                var sheet = xlsx.xl.worksheets['sheet1.xml'];
                $('row c[r^="A"]', sheet).attr('s', '2');
                $('row[r="1"] c[r^="A"]', sheet).attr('s', '27');
                $('row[r="2"] c[r^="A"]', sheet).attr('s', '3');
            }
        },
        {
            extend: 'pdfHtml5',
            orientation: "landscape",
            title: appTitle,
            messageTop: "Alunos Atendidos pela Escola: " + estadoEscola["NOME"],
            text: "Exportar para PDF",
            exportOptions: {
                columns: [0, 1]
            },
            customize: function (doc) {
                doc = docReport(doc);
            }
        },
    ]
} );

ListaDeAlunosPorEscola(estadoEscola["ID_ESCOLA"], (err, result) => {
    result.forEach((v) => {
        dataTableListaDeAlunos.row.add(v);
    });
    dataTableListaDeAlunos.draw();
});

$("#detalheInitBtn").click();
$("#detalheMapa").on('click', (evt) => {
    console.log("cheogu aqui");
    setTimeout(function () { 
        mapaDetalhe["map"].updateSize();
    }, 200);
});
