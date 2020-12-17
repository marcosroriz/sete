// rota-listar-ctrl.js
// Este arquivo contém o script de controle da tela rota-listar-view. O mesmo
// apresenta as rotas cadastradas em uma tabela. Também é feito uma busca nas
// base de dados de alunos e escolas para conhecer o quantitativo atendido por rota.

// Preenchimento da Tabela via SQL
var listaDeRotas = new Map();

// DataTables
var dataTablesRotas = $("#datatables").DataTable({
    ...dtConfigPadraoFem("rota"),
    ...{
        columns: [
            { data: 'NOME', width: "30%" },
            { data: 'TURNOSTR', width: "20%" },
            { data: 'KMSTR', width: "20%" },
            { data: 'NUMALUNOS', width: "15%" },
            { data: 'NUMESCOLAS', width: "15%" },
            {
                data: "ACOES",
                width: "110px",
                sortable: false,
                defaultContent: '<a href="#" class="btn btn-link btn-primary rotaView"><i class="fa fa-search"></i></a>' +
                    '<a href="#" class="btn btn-link btn-warning rotaEdit"><i class="fa fa-edit"></i></a>' +
                    '<a href="#" class="btn btn-link btn-danger rotaRemove"><i class="fa fa-times"></i></a>'
            }
        ],
        columnDefs: [{ targets: 0,  render: renderAtMostXCharacters(50) }],
        buttons: [
            {
                extend: 'pdfHtml5',
                orientation: "landscape",
                title: "Rotas cadastradas",
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

dataTablesRotas.on('click', '.rotaView', function () {
    var $tr = getRowOnClick(this);

    estadoRota = dataTablesRotas.row($tr).data();
    action = "visualizarRota";
    navigateDashboard("./modules/rota/rota-dados-view.html");
});

dataTablesRotas.on('click', '.rotaEdit', function () {
    var $tr = getRowOnClick(this);

    estadoRota = dataTablesRotas.row($tr).data();
    action = "editarRota";
    navigateDashboard("./modules/rota/rota-cadastrar-view.html");
});

dataTablesRotas.on('click', '.rotaRemove', function () {
    var $tr = getRowOnClick(this);
    estadoRota = dataTablesRotas.row($tr).data();
    var idRota = estadoRota["ID"];

    action = "apagarMotorista";
    confirmDialog("Remover essa rota?",
                  "Ao remover essa rota ela será retirado do sistema e os alunos e "
                + "escolas que possuir vínculo deverão ser rearranjadas novamente."
    ).then((res) => {
        let listaPromisePraRemover = []
        if (res.value) {
            listaPromisePraRemover.push(dbRemoverDadoPorIDPromise(DB_TABLE_ROTA, "ID_ROTA", idRota));
            listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_ATENDE_ALUNO, "ID_ROTA", idRota));
            listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_PASSA_POR_ESCOLA, "ID_ROTA", idRota));
            listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_DIRIGIDA_POR_MOTORISTA, "ID_ROTA", idRota));
            listaPromisePraRemover.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_POSSUI_VEICULO, "ID_ROTA", idRota));
            listaPromisePraRemover.push(dbAtualizaVersao());
        }

        return Promise.all(listaPromisePraRemover)
    }).then((res) => {
        if (res.length > 0) {
            dataTablesRotas.row($tr).remove();
            dataTablesRotas.draw();
            Swal2.fire({
                title: "Sucesso!",
                icon: "success",
                text: "Rota removida com sucesso!",
                confirmButtonText: 'Retornar a página de administração'
            });
        }
    }).catch((err) => errorFn("Erro ao remover a rota", err))
});


dbBuscarTodosDadosPromise(DB_TABLE_ROTA)
.then(res => processarRotas(res))


// Processar rotas
var processarRotas = (res) => {
    $("#totalNumVeiculos").text(res.length);
    for (let veiculoRaw of res) {
        let veiculoJSON = parseVeiculoDB(veiculoRaw);
        veiculoJSON["ID_VEICULO"] = veiculoJSON["ID"]
        listaDeVeiculos.set(veiculoJSON["ID_VEICULO"], veiculoJSON);
    }
    return listaDeVeiculos;
}

// Callback para pegar dados inicia da escolas
var listaInicialCB = (err, result) => {
    if (err) {
        errorFn("Erro ao listar as rotas", err);
    } else {
        $("#totalNumRotas").text(result.length);

        for (let rotaRaw of result) {
            let rotaJSON = parseRotaDB(rotaRaw);
            rotaJSON["STRESCOLAS"] = "Não cadastrado"
            rotaJSON["STRALUNOS"]  = "Não cadastrado"
            rotaJSON["NUMESCOLAS"] = 0
            rotaJSON["NUMALUNOS"]  = 0
            listaDeRotas.set(rotaJSON["ID_ROTA"], rotaJSON);
        }

        var promiseArray = new Array();

        listaDeRotas.forEach((rota) => {
            promiseArray.push(ListarTodasAsEscolasAtendidasPorRotaPromise(rota["ID_ROTA"]))
            promiseArray.push(ListarTodosOsAlunosAtendidosPorRotaPromise(rota["ID_ROTA"]))
        });

        Promise.all(promiseArray)
        .then((res) => {
            var handleEscolasAtendidas = new Array();
            var handleAlunosAtendidos = new Array();
            for (let i = 0; i < res.length; i++) {
                if (i % 2 == 0) {
                    handleEscolasAtendidas.push(res[i]);
                } else {
                    handleAlunosAtendidos.push(res[i]);
                }
            }

            handleEscolasAtendidas.forEach((e) => {
                if (e != null && e != undefined && e.length != 0) {
                    let rotaJSON = listaDeRotas.get(e[0]["ID_ROTA"]);
                    rotaJSON["NUMESCOLAS"] = e.length;
                }
            });
            
            handleAlunosAtendidos.forEach((a) => {
                if (a != null && a != undefined && a.length != 0) {
                    let rotaJSON = listaDeRotas.get(a[0]["ID_ROTA"]);
                    rotaJSON["NUMALUNOS"] = a.length;
                }
            });
            listaDeRotas.forEach((rota) => {
                dataTablesRotas.row.add(rota);
            });

            dataTablesRotas.draw();
        });

    }
};

BuscarTodosDados("Rotas", listaInicialCB);

action = "listarRotas";