// custo-parametros-ctrl.js
// Este arquivo contém o script que lista e possibilita editar os parâmetros
// utilizandos na fórmula de cálculo do custo do SETE.

// DataTables
var dataTablesParametros = $("#datatables").DataTable({
    // A função abaixo inicia nossa pré-configuração do datatable
    // ver detalhe da função em js/datatable.extra.js
    autoWidth: false,
    bAutoWidth: false,
    order: [[0, "asc"]],
    paging: false,
    language: {
        "search": "_INPUT_",
        "searchPlaceholder": "Procurar parâmetro",
        "zeroRecords": `Não encontrei nenhum parâmetro cadastrado`,
        "info": "Filtro retornou _TOTAL_ registros",
        "infoEmpty": "Sem registros disponíveis",
        "infoFiltered": `(do total de _MAX_ parâmetros)`,
        "paginate": {
            "first": "Primeira",
            "last": "Última",
            "next": "Próxima",
            "previous": "Anterior"
        },
    },
    dom: 'rti',
    order: [[0, "asc"]],
    columns: [
        { data: 'descricao_parametro', width: "60%" },
        { data: 'valor_padrao', width: "15%" },
        { data: 'valor', width: "15%" },
        {

            data: "ACOES",
            width: "110px",
            sortable: false,
            orderable: false,
            defaultContent: '<a href="#" class="btn btn-link paramInfo"><i class="fa fa-info-circle"></i></a>' + 
                            '<a href="#" class="btn btn-link btn-warning paramEdit"><i class="fa fa-edit"></i></a>'
        }
    ],
});

// Info Registro
dataTablesParametros.on('click', '.paramInfo', function (e) {
    e.preventDefault();

    const paramRow = getRowOnClick(this);
    let param = dataTablesParametros.row(paramRow).data();

    Swal2.fire({
        title: param["descricao_parametro"],
        text: param["descricao_parametro"]
    })
})

// Editar Registro
dataTablesParametros.on('click', '.paramEdit', function (e) {
    e.preventDefault();

    const paramRow = getRowOnClick(this);
    let param = dataTablesParametros.row(paramRow).data();

    Swal2.fire({
        title: 'Editar parâmetro',
        icon: "question",
        showCancelButton: true,
        title: "Atualizar parâmetro",
        text: param['descricao_parametro'],
        input: 'number',
        inputValue: param["valor"],
        inputAttributes: {
            min: 0,
            step: "any"
        },
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        cancelButtonText: "Cancelar",
        confirmButtonText: "Atualizar",
    }).then((result) => {
        let promiseAtualizar = [];
        if (result.value) {
            param["valor"] = strToNumber(result.value);
            promiseAtualizar.push(restImpl.dbPOST(DB_TABLE_PARAMETROS, `/${param["codigo_parametro"]}`,
                {
                    "valor": strToNumber(result.value)
                }));
        }
        return Promise.all(promiseAtualizar)
    }).then((res) => {
        if (res.length > 0) {
            dataTablesParametros.row(paramRow).data(param).draw();
            Swal2.fire({
                title: "Sucesso!",
                icon: "success",
                text: "Parâmetro atualizado com sucesso",
                confirmButtonText: 'Retornar a página'
            });
        }
    }).catch((err) => {
        debugger
        errorFn("Erro ao atualizar o parâmetro", err)
    })
});

restImpl.dbGETColecao(DB_TABLE_PARAMETROS)
    .then(res => adicionaDadosTabela(res))
    .catch((err) => {
        debugger
        console.log(err)
        errorFn("Erro ao listar os motoristas!", err)
    })


// Adiciona dados na tabela
function adicionaDadosTabela(parametros) {
    parametros.forEach((param) => {
        param["descricao_parametro"] = param["descricao_parametro"].toUpperCase();
        param["valor_padrao"] = param["valor"];
        dataTablesParametros.row.add(param);
    });

    dataTablesParametros.draw();
}


$("#datatables_filter input").on('keyup', function () {
    dataTablesParametros.search(jQuery.fn.dataTable.ext.type.search["locale-compare"](this.value)).draw()
})

action = "listarParametros";

