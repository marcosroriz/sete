// motorista-listar-ctrl.js
// Este arquivo contém o script de controle da tela motorista-listar-view. O mesmo
// apresenta os motoristas cadastrados em uma tabela.

// Preenchimento da Tabela via SQL
var listaDeMotoristas = new Map();

// DataTables
var dataTablesMotoristas = $("#datatables").DataTable({
    // A função abaixo inicia nossa pré-configuração do datatable
    // ver detalhe da função em js/datatable.extra.js
    ...dtConfigPadrao("motorista"),
    ...{
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
        columnDefs: [{ targets: 0,  render: renderAtMostXCharacters(50) }],
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
    }
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
    var idMotorista = estadoMotorista["CPF"];

    action = "apagarMotorista";
    confirmDialog('Remover esse motorista?',
                  "Ao remover esse motorista ele será retirado do sistema das  " + 
                  "rotas e das escolas que possuir vínculo."
    ).then((res) => {
        let listaPromisePraRemover = []
        if (res.value) {
            listaPromisePraRemover.push(dbRemoverDadoPorIDPromise(DB_TABLE_MOTORISTA, "ID_MOTORISTA", estadoMotorista["ID"]));
            listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_DIRIGIDA_POR_MOTORISTA, "ID_MOTORISTA", estadoMotorista["ID"]));
            listaPromisePraRemover.push(dbAtualizaVersao());
        }

        return Promise.all(listaPromisePraRemover)
    }).then((res) => {
        if (res.length > 0) {
            dataTableEscolas.row($tr).remove();
            dataTableEscolas.draw();
            Swal2.fire({
                title: "Sucesso!",
                icon: "success",
                text: "Motorista removido com sucesso!",
                confirmButtonText: 'Retornar a página de administração'
            });
        }
    }).catch((err) => errorFn("Erro ao remover a escola", err))
});

dbBuscarTodosDadosPromise(DB_TABLE_MOTORISTA)
.then(res => processarMotoristas(res))
.then(res => adicionaDadosTabela(res))
.catch((err) => errorFn("Erro ao listar os motoristas!", err))

// Processar motoristas
var processarMotoristas = (res) => {
    $("#totalNumMotoristas").text(res.length);
    for (let motoristaRaw of res) {
        let motoristaJSON = parseMotoristaDB(motoristaRaw);
        listaDeMotoristas.set(motoristaJSON["ID"], motoristaJSON);
    }
    return listaDeMotoristas;
}

// Adiciona dados na tabela
adicionaDadosTabela = (res) => {
    res.forEach((motorista) => {
        dataTablesMotoristas.row.add(motorista);
    });

    dataTablesMotoristas.draw();
}

action = "listarMotoristas";