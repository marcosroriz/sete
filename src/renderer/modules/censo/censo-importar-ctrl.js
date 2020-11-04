// Variáveis
var baseDados;
var ultArquivoAnalisado = "";

var dataTableCenso = $("#datatables").DataTable({
    columns: [
        { data: "SELECT", width: "5%" },
        { data: 'NOME', width: "95%" },
        { data: 'NUMERO', width: "200px" },
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
    dataTableCenso.search(jQuery.fn.dataTable.ext.type.search["locale-compare"](this.value)).draw()
})

function callbackPreprocessCenso(err, arqProcessado, baseDadosProcessada) {
    dataTableCenso.clear();
    dataTableCenso.draw();
    if (err) {
        errorFn("Erro ao realizar o préprocessamento da base!");
        console.error(err)
        $('.card-wizard').bootstrapWizard('first')
    } else {
        ultArquivoAnalisado = arqProcessado;
        baseDados = baseDadosProcessada;
        setTimeout(() => Swal2.close(), 500)

        var count = 0;
        for (let [escolaID, escolaValues] of Object.entries(baseDadosProcessada)) {
            let escola = {
                ID: escolaID,
                NOME: escolaValues["NOME"],
                NUMERO: Object.keys(escolaValues["ALUNOS"]).length,
                SELECT: count++
            }
            dataTableCenso.row.add(escola);
        }
        dataTableCenso.draw();
        $("#datatables thead input[type='checkbox']").trigger('click');

    }
}

function preprocess(arquivo) {
    if (arquivo == undefined) {
        Swal2.fire({
            title: "Ops... tivemos um problema!",
            text: "É necessário informar o arquivo da base de dados para realizar a importação.",
            icon: "error",
            confirmButtonColor: "red",
            confirmButtonText: "Fechar",
        });
        return false;
    } else {
        Swal2.fire({
            title: "Importando a base de dados...",
            imageUrl: "img/icones/processing.gif",
            closeOnClickOutside: false,
            allowOutsideClick: false,
            showConfirmButton: false,
            text: "Aguarde, estamos pré-processando a base de dados..."
        })
        parseBaseCenso(arquivo, callbackPreprocessCenso);
        return true;
    }
}

function realizaImportacao(rawDados) {
    Swal2.fire({
        title: "Importando os dados...",
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

    // Remover os dados selecionados do banco
    var dados = [].concat(rawDados);

    // Barra de progresso (valor atual)
    var progresso = 0;

    // Numero de operações a serem realizadas
    var numEscolas = dados.length;
    var numAlunos = 0;
    dados.forEach((escolaSelecionada) => {
        numAlunos += Object.keys(baseDados[escolaSelecionada["ID"]]["ALUNOS"]).length
    })
    var max = numEscolas + numAlunos +  // Remover
        numEscolas + numAlunos + numAlunos; // Inserir

    function updateProgress() {
        progresso++;
        let progressPorcentagem = Math.round(100 * (progresso / max))
        $('.progress-bar').css('width', progressPorcentagem + "%")
        $('.progress-bar').text(progressPorcentagem + "%")
    }

    var promiseArray = new Array();
    dados.forEach((escolaSelecionada) => {
        // Remove escola
        var idEscola = escolaSelecionada["ID"];
        var escola = baseDados[idEscola]
        promiseArray.push(RemoverPromise("Escolas", "MEC_NO_ENTIDADE", escola["MEC_NO_ENTIDADE"])
            .then(() => updateProgress()))

        // Remove alunos
        var alunos = escola["ALUNOS"]
        for (let aluno of Object.values(alunos)) {
            promiseArray.push(RemoverComposedPromise(
                "Alunos",
                "NOME", aluno["NOME"],
                "DATA_NASCIMENTO", aluno["DATA_NASCIMENTO"])
                .then(() => updateProgress())
            )
        }
    })
    var relEscolaAluno = {};
    Promise.all(promiseArray).then(() => {
        var promiseArrayBasicos = new Array();
        dados.forEach((escolaSelecionada) => {
            // Obtem uma cópia da escola
            let idEscola = escolaSelecionada["ID"];
            var escola = Object.assign({}, baseDados[idEscola])

            // Obtem alunos
            var alunos = Object.assign({}, escola["ALUNOS"]);

            relEscolaAluno[idEscola] = new Array();
            for (var aluno of Object.values(alunos)) {
                // Inserir alunos
                promiseArrayBasicos.push(InserirPromise("Alunos", aluno)
                    .then((idAluno) => {
                        relEscolaAluno[idEscola].push(idAluno[0]);
                        updateProgress();
                    })
                )
            }

            delete escola["ALUNOS"];
            promiseArrayBasicos.push(InserirPromise("Escolas", escola)
                .then(() => updateProgress()))
        })

        return Promise.all(promiseArrayBasicos)
    }).then(() => {
        var promiseArrayRelacoes = new Array();
        for (let [idEscola, alunos] of Object.entries(relEscolaAluno)) {
            for (let idAluno of Object.values(alunos)) {
                promiseArrayRelacoes.push(InserirPromise("EscolaTemAlunos", {
                    "ID_ESCOLA": Number(idEscola),
                    "ID_ALUNO": idAluno
                })
                .then(() => updateProgress()))
            }
        }

        return Promise.all(promiseArrayRelacoes)
    })
    .catch(err => {
        errorFn("Erro ao importar os dados. Por favor contate a equipe de suporte em cecateufg@gmail.com")
    })
    .then(() => {
        Swal2.fire({
            title: "Parabéns!",
            text: "Os dados foram importados com sucesso.",
            icon: "success",
            type: "success",
            closeOnClickOutside: false,
            allowOutsideClick: false,
            button: "Fechar"
        })
            .then(() => {
                navigateDashboard("./dashboard-main.html");
            });
    })
}

$('#importarAlunosCenso').on('click', () => {
    var rawDados = dataTableCenso.rows('.selected').data().toArray();
    if (rawDados.length == 0) {
        Swal2.fire({
            title: "Nenhuma escola selecionada",
            text: "Por favor, selecione pelo menos uma escola a ser importarda para prosseguir.",
            icon: "error",
            confirmButtonText: "Fechar"
        })
    } else {
        Swal2.fire({
            title: 'Você quer importar os dados selecionados?',
            text: "Você irá importar " + rawDados.length + " escolas para o banco de dados.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            cancelButtonText: "Cancelar",
            confirmButtonText: 'Sim'
        }).then((result) => {
            if (result.isConfirmed) {
                realizaImportacao(rawDados)
            }
        });
    }
});

// Wizard
$('.card-wizard').bootstrapWizard({
    'tabClass': 'nav nav-pills',
    'nextSelector': '.btn-next',
    'previousSelector': '.btn-back',

    onNext: function (tab, navigation, index) {
        window.scroll(0, 0);
        return true;
    },

    onTabClick: function (tab, navigation, index) {
        window.scroll(0, 0);
        return true;
    },

    onTabShow: function (tab, navigation, index) {
        var $total = navigation.find('li').length;
        var $current = index + 1;

        var $wizard = navigation.closest('.card-wizard');

        // If it's the last tab then hide the last button and show the finish instead
        if ($current >= $total) {
            var arquivo = $("#arqCenso")[0].files[0];
            if (ultArquivoAnalisado != arquivo) {
                if(preprocess(arquivo)) {
                    $($wizard).find('.btn-next').hide();
                    $($wizard).find('.btn-finish').show();
                } else {
                    setTimeout(() => $('.btn-back').trigger('click'), 200);
                    return false;
                }
            }
        } else {
            $($wizard).find('.btn-next').show();
            $($wizard).find('.btn-finish').hide();
        }
    }
});

action = "importarCenso";