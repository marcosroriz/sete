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
        dom: 'rtilp<"clearfix m-2">B',
        select: {
            style: 'multi',
            info: false
        },
        "order": [[ 1, "asc" ]],
        columns: [
            { data: "SELECT", width: "60px" },
            { data: 'NOME', width: "15%" },
            { data: 'TELEFONE', width: "15%" },
            { data: 'TURNOSTR', width: "300px" },
            { data: 'CNH', width: "15%" },
            { data: 'DATA_VALIDADE_CNH_STR', width: "15%" },
            { data: 'ROTAS', width: "15%" },
            {
                data: "ACOES",
                width: "110px",
                sortable: false,
                defaultContent: '<a href="#" class="btn btn-link btn-primary motoristaView"><i class="fa fa-search"></i></a>' +
                    '<a href="#" class="btn btn-link btn-warning motoristaEdit"><i class="fa fa-edit"></i></a>' +
                    '<a href="#" class="btn btn-link btn-danger motoristaRemove"><i class="fa fa-times"></i></a>'
            }
        ],
        columnDefs: [
            { targets: 0, 'checkboxes': { 'selectRow': true } },
            { targets: 1,  render: renderAtMostXCharacters(50) }
        ],
        buttons: [
            {
                text: 'Remover motoristas',
                className: 'btnRemover',
                action: function (e, dt, node, config) {
                    var rawDados = dataTablesMotoristas.rows('.selected').data().toArray();
                    if (rawDados.length == 0) {
                        errorFn("Por favor, selecione pelo menos um motorista a ser removido.", "",
                                "Nenhuma motorista selecionado")
                    } else {
                        let msg = `Você tem certeza que deseja remover os ${rawDados.length} motoristas selecionados?`;
                        let msgConclusao = "Os motoristas foram removidos com sucesso";
                        if (rawDados.length == 1) {
                            msg = `Você tem certeza que deseja remover o motorista selecionado?`;
                            msgConclusao = "O motorista foi removido com sucesso";
                        }

                        goaheadDialog(msg ,"Esta operação é irreversível. Você tem certeza?")
                        .then((res) => {
                            if (res.isConfirmed) {
                                Swal2.fire({
                                    title: "Removendo os motoristas da base de dados...",
                                    imageUrl: "img/icones/processing.gif",
                                    closeOnClickOutside: false,
                                    allowOutsideClick: false,
                                    showConfirmButton: false,
                                    html: `
                                <br />
                                <div class="progress" style="height: 20px;">
                                    <div id="pbar" class="progress-bar" role="progressbar" 
                                            aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" 
                                            style="width: 0%;">
                                    </div>
                                </div>
                                `
                                })

                                var progresso = 0;
                                var max = rawDados.length * 2 + 1;

                                function updateProgress() {
                                    progresso++;
                                    var progressPorcentagem = Math.round(100 * (progresso / max))

                                    $('.progress-bar').css('width', progressPorcentagem + "%")
                                }

                                var promiseArray = new Array();
                                
                                // Removendo cada motorista
                                rawDados.forEach(m => {
                                    let idMotorista = m["ID"];
                                    promiseArray.push(
                                        dbRemoverDadoPorIDPromise(DB_TABLE_MOTORISTA, "ID_MOTORISTA", idMotorista)
                                        .then(() => updateProgress())
                                    );
                                    promiseArray.push(
                                        dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_DIRIGIDA_POR_MOTORISTA, "ID_MOTORISTA", idMotorista)
                                        .then(() => updateProgress())
                                    );
                                })

                                promiseArray.push(dbAtualizaVersao().then(() => updateProgress()));
                                Promise.all(promiseArray)
                                .then(() => {
                                    successDialog(text = msgConclusao);
                                    dataTablesMotoristas.rows('.selected').remove();
                                    dataTablesMotoristas.draw();
                                })
                            }
                        })
                        .catch((err) => {
                            Swal2.close()
                            errorFn("Erro ao remover os motoristas", err)
                        })
                    }
                }
            },
            {
                extend: 'excel',
                className: 'btnExcel',
                filename: "Relatorio",
                title: appTitle,
                text: 'Exportar para Planilha',
                exportOptions: {
                    columns: [ 1, 2, 3, 4, 5, 6]
                },
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
                title: "Motoristas cadastrados",
                text: "Exportar para PDF",
                exportOptions: {
                    columns: [1, 2, 3, 4, 5, 6]
                },
                customize: function (doc) {
                    doc.content[1].table.widths = ['25%', '15%', '10%', '20%', '15%', '15%'];
                    doc = docReport(doc);
                    
                    // O datatable coloca o select dentro do header, vamos tirar isso
                    for (col of doc.content[3].table.body[0]) {
                        col.text = col.text.split("    ")[0];
                    }

                    doc.content[2].text = listaDeMotoristas?.size +  " " + doc.content[2].text;
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
    let i = 0;
    res.forEach((motorista) => {
        motorista["SELECT"] = i++;
        dataTablesMotoristas.row.add(motorista);
    });

    dataTablesMotoristas.draw();
    dtInitFiltros(dataTablesMotoristas, [1, 2, 3, 4, 5, 6]);
}


$("#datatables_filter input").on('keyup', function () {
    dataTablesMotoristas.search(jQuery.fn.dataTable.ext.type.search["locale-compare"](this.value)).draw()
})

action = "listarMotoristas";