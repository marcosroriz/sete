// Preenchimento da Tabela via SQL
var listaDeAlunos = new Map();

// DataTables
var dataTablesAlunos = $("#datatables").DataTable({
    // fixedHeader: true,
    columns: [
        { data: 'NOME', width: "25%" },
        { data: 'LOCALIZACAO', width: "15%" },
        { data: 'ESCOLA', width: "25%" },
        { data: 'NIVELSTR', width: "200px" },
        { data: 'TURNOSTR', width: "200px" },
        {
            data: "ACOES",
            width: "90px",
            sortable: false,
            defaultContent: '<a href="#" class="btn btn-link btn-primary alunoView"><i class="fa fa-search"></i></a>' +
                '<a href="#" class="btn btn-link btn-warning alunoEdit"><i class="fa fa-edit"></i></a>' +
                '<a href="#" class="btn btn-link btn-danger alunoRemove"><i class="fa fa-times"></i></a>'
        }
    ],
    columnDefs: [{
        targets: 0,
        render: function (data, type, row) {
            return data.length > 50 ?
                data.substr(0, 50) + '…' :
                data;
        }
    },
    {
        targets: 2,
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
        "searchPlaceholder": "Procurar alunos",
        "lengthMenu": "Mostrar _MENU_ alunos por página",
        "zeroRecords": "Não encontrei nenhum aluno cadastrado",
        "info": "Mostrando página _PAGE_ de _PAGES_",
        "infoEmpty": "Sem registros disponíveis",
        "infoFiltered": "(Alunos filtrados a partir do total de _MAX_ alunos)",
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
            title: "Alunos cadastrados",
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

dataTablesAlunos.on('click', '.alunoView', function () {
    var $tr = getRowOnClick(this);

    estadoAluno = dataTablesAlunos.row($tr).data();
    action = "visualizarAluno";
    navigateDashboard("./modules/aluno/aluno-dados-view.html");
});

dataTablesAlunos.on('click', '.alunoEdit', function () {
    var $tr = getRowOnClick(this);

    estadoAluno = dataTablesAlunos.row($tr).data();
    action = "editarAluno";
    navigateDashboard("./modules/aluno/aluno-cadastrar-view.html");
});

dataTablesAlunos.on('click', '.alunoRemove', function () {
    var $tr = getRowOnClick(this);

    estadoAluno = dataTablesAlunos.row($tr).data();
    action = "apagarAluno";
    Swal2.fire({
        title: 'Remover esse aluno?',
        text: "Ao remover esse aluno ele será retirado do sistema das rotas e das escolas que possuir vínculo.",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        cancelButtonText: "Cancelar",
        confirmButtonText: 'Sim, remover'
    }).then((result) => {
        if (result.value) {
            RemoverAluno(estadoAluno["ID_ALUNO"], (err, result) => {
                if (result) {
                    dataTablesAlunos.row($tr).remove();
                    dataTablesAlunos.draw();
                    Swal2.fire({
                        type: 'success',
                        title: "Sucesso!",
                        text: "Aluno removido com sucesso!",
                        confirmButtonText: 'Retornar a página de administração'
                    });
                } else {
                    Swal2.fire({
                        type: 'error',
                        title: 'Oops...',
                        text: 'Tivemos algum problema. Por favor, reinicie o software!',
                    });
                }
            });
        }
    })
});


// Função para relatar erro
var errorFnAlunos = (err) => {
    Swal2.fire({
        title: "Ops... tivemos um problema!",
        text: "Erro ao listar os alunos! Feche e abra o software novamente. \n" + err,
        icon: "error",
        button: "Fechar"
    });
}

// Callback para pegar número de alunos da escola
var listarEscolasAlunosCB = (err, result) => {
    if (err) {
        errorFnAlunos(err);
    } else {
        for (let alunoRaw of result) {
            let aID = alunoRaw["ID_ALUNO"];
            let eID = alunoRaw["ID_ESCOLA"];
            let eNome = alunoRaw["NOME"];

            let alunoJSON = listaDeAlunos.get(aID);
            alunoJSON["ID_ESCOLA"] = eID;
            alunoJSON["ESCOLA"] = eNome;
            alunoJSON["ESCOLA_LOC_LATITUDE"] = alunoRaw["LOC_LATITUDE"];
            alunoJSON["ESCOLA_LOC_LONGITUDE"] = alunoRaw["LOC_LONGITUDE"];
            alunoJSON["ESCOLA_MEC_CO_UF"] = alunoRaw["MEC_CO_UF"];
            alunoJSON["ESCOLA_MEC_CO_MUNICIPIO"] = alunoRaw["MEC_CO_MUNICIPIO"];
            alunoJSON["ESCOLA_MEC_TP_LOCALIZACAO"] = alunoRaw["MEC_TP_LOCALIZACAO"];
            alunoJSON["ESCOLA_MEC_TP_LOCALIZACAO_DIFERENCIADA"] = alunoRaw["MEC_TP_LOCALIZACAO_DIFERENCIADA"];
            alunoJSON["ESCOLA_CONTATO_RESPONSAVEL"] = alunoRaw["CONTATO_RESPONSAVEL"];
            alunoJSON["ESCOLA_CONTATO_TELEFONE"] = alunoRaw["CONTATO_TELEFONE"];

            listaDeAlunos.set(aID, alunoJSON);
        }

        listaDeAlunos.forEach((aluno) => {
            dataTablesAlunos.row.add(aluno);
        });

        dataTablesAlunos.draw();
    }
};

// Callback para pegar dados inicia da escolas
var listaInicialCB = (err, result) => {
    if (err) {
        errorFnAlunos(err);
    } else {
        $("#totalNumAlunos").text(result.length);

        for (let alunoRaw of result) {
            let alunoJSON = parseAlunoDB(alunoRaw);
            listaDeAlunos.set(alunoJSON["ID_ALUNO"], alunoJSON);
        }

        ListarEscolasDeAlunos(listarEscolasAlunosCB);
    }
};

BuscarTodosAlunos(listaInicialCB);

action = "listarAluno";