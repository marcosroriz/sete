// norma-listar-ctrl.js
// Este arquivo contém o script de controle da tela norma-listar-view. O mesmo
// apresenta as normas cadastrados em uma tabela.

// Preenchimento da Tabela via SQL
var listaDeNormas = new Map();
var listaDeTipos = new Map();
var listaDeAssuntos = new Map();

// DataTables
var dataTablesNormas = $("#datatables").DataTable({
    // A função abaixo inicia nossa pré-configuração do datatable
    // ver detalhe da função em js/datatable.extra.js
    ...dtConfigPadraoFem("norma"),
    ...{
        dom: 'rtilp<"clearfix m-2">B',
        select: {
            style: 'multi',
            info: false
        },
        "order": [[ 1, "asc" ]],
        columns: [
            { data: "SELECT", width: "60px" },
            { data: 'TITULO', width: "30%" },
            { data: 'TIPO_STR', width: "20%" },
            { data: 'ASSUNTO_STR', width: "30%" },
            {
                data: "ACOES",
                width: "110px",
                sortable: false,
                defaultContent: '<a href="#" class="btn btn-link btn-primary normaView"><i class="fa fa-search"></i></a>' +
                    '<a href="#" class="btn btn-link btn-warning normaEdit"><i class="fa fa-edit"></i></a>' +
                    '<a href="#" class="btn btn-link btn-danger normaRemove"><i class="fa fa-times"></i></a>'
            }
        ],
        columnDefs: [
            { targets: 0, 'checkboxes': { 'selectRow': true } },
            {
                targets: 1, render: {
                    "filter": data => data,
                    "display": renderAtMostXCharacters(50)
                }
            }
        ],
        buttons: [
            {
                text: 'Remover normas',
                className: 'btnRemover',
                action: function (e, dt, node, config) {
                    var rawDados = dataTablesNormas.rows('.selected').data().toArray();
                    if (rawDados.length == 0) {
                        errorFn("Por favor, selecione pelo menos uma norma a ser removida.", "",
                                "Nenhuma norma selecionada")
                    } else {
                        let msg = `Você tem certeza que deseja remover as ${rawDados.length} normas selecionadas?`;
                        let msgConclusao = "As normas foram removidas com sucesso";
                        if (rawDados.length == 1) {
                            msg = `Você tem certeza que deseja remover a norma selecionada?`;
                            msgConclusao = "A norma foi removida com sucesso";
                        }

                        goaheadDialog(msg ,"Esta operação é irreversível. Você tem certeza?")
                        .then((res) => {
                            if (res.isConfirmed) {
                                Swal2.fire({
                                    title: "Removenda as normas da base de dados...",
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
                                var max = rawDados.length;

                                function updateProgress() {
                                    progresso++;
                                    var progressPorcentagem = Math.round(100 * (progresso / max))

                                    $('.progress-bar').css('width', progressPorcentagem + "%")
                                }

                                var promiseArray = new Array();
                                
                                // Removendo cada motorista
                                rawDados.forEach(m => {
                                    let idMotorista = m["ID"];
                                    promiseArray.push(restImpl.dbDELETE(DB_TABLE_MOTORISTA, `/${idMotorista}`).then(() => updateProgress()));
                                })

                                Promise.all(promiseArray)
                                .then(() => {
                                    successDialog(text = msgConclusao);
                                    dataTablesNormas.rows('.selected').remove();
                                    dataTablesNormas.draw();
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
                title: "Normas cadastradas",
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

                    doc.content[2].text = listaDeNormas?.size +  " " + doc.content[2].text;
                    doc.styles.tableHeader.fontSize = 12;
                }
            }
        ]
    }
});

dataTablesNormas.on('click', '.normaView', function () {
    var $tr = getRowOnClick(this);

    estadoNorma = dataTablesNormas.row($tr).data();
    action = "visualizarNorma";
    navigateDashboard("./modules/motorista/motorista-dados-view.html");
});

dataTablesNormas.on('click', '.normaEdit', function () {
    var $tr = getRowOnClick(this);

    estadoNorma = dataTablesNormas.row($tr).data();
    action = "editarNorma";
    navigateDashboard("./modules/motorista/motorista-cadastrar-view.html");
});

dataTablesNormas.on('click', '.normaRemove', function () {
    var $tr = getRowOnClick(this);
    estadoNorma = dataTablesNormas.row($tr).data();
    var idMotorista = estadoNorma["CPF"];

    action = "apagarNorma";
    confirmDialog('Remover essa norma?',
                  "Você tem certeza?"
    ).then((res) => {
        let listaPromisePraRemover = [];
        if (res.value) {
            listaPromisePraRemover.push(restImpl.dbDELETE(DB_TABLE_MOTORISTA, `/${idMotorista}`));
        }

        return Promise.all(listaPromisePraRemover)
    }).then((res) => {
        if (res.length > 0) {
            dataTablesNormas.row($tr).remove();
            dataTablesNormas.draw();
            Swal2.fire({
                title: "Sucesso!",
                icon: "success",
                text: "Motorista removido com sucesso!",
                confirmButtonText: 'Retornar a página de administração'
            });
        }
    }).catch((err) => errorFn("Erro ao remover a escola", err))
});

function preprocessarTipos(resTipos) {
    let tipos = resTipos.data.data.sort((a, b) => {
        if (a.nm_tipo == "Outro") {
            return 1;
        } else if (b.nm_tipo == "Outro") {
            return -1;
        } else {
            a.nm_tipo.localeCompare(b.nm_tipo)
        }
    });

    if (tipos) {
        for (let t of tipos) {
            listaDeTipos.set(t.id_tipo, t.nm_tipo);
            $('#tipoNorma').append(`<option value="${t.nm_tipo}">${t.nm_tipo}</option>`);
        }
    } else {
        throw "Erro ao recuperar os tipos de normas" 
    }
}

function preprocessarAssuntos(resAssuntos) {
    let assuntos = resAssuntos.data.data.sort((a, b) => {
        if (a.assunto == "Outros") {
            return 1;
        } else if (b.assunto == "Outros") {
            return -1;
        } else {
            a.assunto.localeCompare(b.assunto)
        }
    });

    if (assuntos) {
        for (let a of assuntos) {
            listaDeAssuntos.set(a.id_assunto, a.assunto);
            $('#tipoAssunto').append(`<option value="${a.assunto}">${a.assunto}</option>`);
        }
    } else {
        throw "Erro ao recuperar os tipos de assuntos"
    }
}

function processarNormas(resNormas) {
    for (let normaRaw of resNormas) {
        let normaJSON = parseNormaREST(normaRaw);
        normaJSON["TIPO_STR"] = listaDeTipos.get(normaJSON["id_tipo"]);
        normaJSON["ASSUNTO_STR"] = listaDeAssuntos.get(normaJSON["id_assunto"]);
        listaDeNormas.set(normaJSON["ID"], normaJSON);
    }
    return listaDeNormas;
}

// Adiciona dados na tabela
adicionaDadosTabela = (res) => {
    let i = 0;
    res.forEach((norma) => {
        norma["SELECT"] = i++;
        dataTablesNormas.row.add(norma);
    });

    dataTablesNormas.draw();
    dtInitFiltros(dataTablesNormas, [2, 3]);
}

restImpl.dbGETColecaoRaiz(DB_TABLE_NORMAS, "/tipos")
.then(preprocessarTipos)
.then(() => restImpl.dbGETColecaoRaiz(DB_TABLE_NORMAS, "/assuntos"))
.then(preprocessarAssuntos)
.then(() => restImpl.dbGETColecao(DB_TABLE_NORMAS))
.then(processarNormas)
.then(adicionaDadosTabela)
// .then(res => processarMotoristas(res))
// .then(res => adicionaDadosTabela(res))
// .catch((err) => {
//     console.log(err)
//     errorFn("Erro ao listar os motoristas!", err)
// })


$("#datatables_filter input").on('keyup', function () {
    dataTablesNormas.search(jQuery.fn.dataTable.ext.type.search["locale-compare"](this.value)).draw()
})



action = "listarNormas";