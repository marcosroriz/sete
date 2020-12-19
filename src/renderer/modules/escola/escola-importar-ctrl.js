// escola-importar-ctrl.js
// Este arquivo contém o script de controle da tela escola-importar-view. O mesmo
// possibilita  as escoladas cadastras em uma tabela. Para tal, é feito uma consulta

// Preenchimento da Tabela via SQL
var listaDeEscolas = new Map();

// DataTables
var dataTableEscolas = $("#datatables").DataTable({
        // A função abaixo inicia nossa pré-configuração do datatable
    // ver detalhe da função em js/datatable.extra.js
    ...dtConfigPadraoFem("escola"),
    ...{
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
        dom: 'lfrtip',
    }
});

$("#datatables_filter input").on('keyup', function () {
    dataTableEscolas.search(jQuery.fn.dataTable.ext.type.search["locale-compare"](this.value)).draw()
})

$("#importarEscolasBtn").on('click', () => {
    var rawDados = dataTableEscolas.rows('.selected').data().toArray();
    if (rawDados.length == 0) {
        errorFn("Por favor, selecione pelo menos uma escola a ser importarda para prosseguir.", "",
                "Nenhuma escola selecionada")
    } else {
        goaheadDialog('Você quer importar as escolas selecionadas?',
                      "Você irá importar " + rawDados.length + " escolas para o banco de dados.")
        .then((res) => {
            if (res.isConfirmed) {
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

                    let idEscola = escola["ID_ESCOLA"];
                    promiseArray.push(dbInserirPromise("escolas", escola, String(idEscola))
                                     .then(() => updateProgress()))
                })
                return Promise.all(promiseArray)
                       .then(() => successDialog(text = "As escolas foram importadas com sucesso."))
            }
        })
        .catch((err) => {
            Swal2.close()
            errorFn("Erro ao importar as escolas", err)
        })
    }
});

dbLocalBuscarDadoEspecificoPromise("MEC_Escolas", "CO_MUNICIPIO", codCidade)
.then(result => {
    var count = 0;
    for (let escolaRaw of result) {
        let escolaJSON = parseEscolaMECDB(escolaRaw);

        if (escolaJSON["ENSINO"] != "") {
            listaDeEscolas.set(escolaJSON["CO_ENTIDADE"], escolaJSON);
            escolaJSON["SELECT"] = count++;
            dataTableEscolas.row.add(escolaJSON);
        }
    }
    $("#totalNumEscolas").text(count);
    dataTableEscolas.draw();
})
.catch(err => {
    errorFn("Erro ao listar as escolas a serem importadas")
})
