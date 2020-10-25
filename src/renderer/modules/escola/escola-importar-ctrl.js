// Preenchimento da Tabela via SQL
var listaDeEscolas = new Map();

// DataTables
var dataTableEscolas = $("#datatables").DataTable({
    // fixedHeader: true,
    columns: [
        { data: "SELECT", width: "5%" },
        { data: 'NOME', width: "40%" },
        { data: 'LOCALIZACAO', width: "20%" },
        { data: 'ENSINO', width: "20%" },
        { data: 'REGIME', width: "25%" },
    ],
    columnDefs: [
        {
            targets: 1,
            type: 'locale-compare',
        },
        {
            targets: 0,
            'checkboxes': {
                'selectRow': true
            }
        }
    ],
    order: [[1, "asc"]],
    select: {
        style: 'multi',
        info: false
    },
    autoWidth: false,
    bAutoWidth: false,
    lengthMenu: [[10, 50, -1], [10, 50, "Todas"]],
    pagingType: "full_numbers",
    language: {
        "search": "_INPUT_",
        "searchPlaceholder": "Procurar escolas",
        "lengthMenu": "Mostrar _MENU_ escolas por página",
        "zeroRecords": "Não encontrei nenhuma escola com este filtro",
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
    dom: 'lfrtip',
});

$("#datatables_filter input").on('keyup', function () {
    dataTableEscolas.search(jQuery.fn.dataTable.ext.type.search["locale-compare"](this.value)).draw()
})

$("#importarEscolasBtn").on('click', () => {
    var rawDados = dataTableEscolas.rows('.selected').data().toArray();
    if (rawDados.length == 0) {
        Swal2.fire({
            title: "Nenhuma escola selecionada",
            text: "Por favor, selecione pelo menos uma escolas a ser importarda para prosseguir.",
            icon: "error",
            confirmButtonText: "Fechar"
        })
    } else {
        Swal2.fire({
            title: 'Você quer importar as escolas selecionadas?',
            text: "Você irá importar " + rawDados.length + " escolas para o banco de dados.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            cancelButtonText: "Cancelar",
            confirmButtonText: 'Sim'
        }).then((result) => {
            if (result.isConfirmed) {
                console.log("SIM")
                Swal2.fire({
                    title: "Importando as escolas...",
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
                    console.log(Math.round(100 * (progresso/max)));
                    var progressPorcentagem = Math.round(100 * (progresso/max))

                    $('.progress-bar').css('width', progressPorcentagem + "%")
                }

                var dados = [].concat(rawDados)
                var promiseArray = new Array();
                dados.forEach((escola) => {
                    delete escola["LOCALIZACAO"];
                    delete escola["DEPENDENCIA"];
                    delete escola["ENSINO"];
                    delete escola["REGIME"];
                    delete escola["SELECT"];

                    promiseArray.push(InserirPromise("Escolas", escola).then(() => updateProgress()))
                })
                Promise.all(promiseArray).then(() => {
                    Swal2.fire({
                        title: "Parabéns!",
                        text: "As escolas foram importadas com sucesso.",
                        icon: "success",
                        type: "success",
                        button: "Fechar"
                    });
                })

            }
        })
    }


    // var dados = [].concat(rawDados)
    // dados.forEach((k) => {
    //     delete k["LOCALIZACAO"];
    //     delete k["DEPENDENCIA"];
    //     delete k["ENSINO"];
    //     delete k["REGIME"];
    //     delete k["SELECT"];
    // })
    // InserirPromise("Escolas", dados).then((res) => console.log(res))
});



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
        var count = 0;
        for (let escolaRaw of result) {
            let escolaJSON = parseEscolaMECDB(escolaRaw);

            if (escolaJSON["ENSINO"] != "") {
                listaDeEscolas.set(escolaJSON["CO_ENTIDADE"], escolaJSON);
                escolaJSON["SELECT"] = count++;
                dataTableEscolas.row.add(escolaJSON);
            }
        }

        dataTableEscolas.draw();
    })
    .catch(err => {
        errorFn("Erro ao listar as escolas a serem importadas")
    })
