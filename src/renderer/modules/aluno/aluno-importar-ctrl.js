// aluno-importar-ctrl.js
// Este arquivo contém o script de controle da tela aluno-importar-view. O memso
// permite importar os dados de alunos a partir de uma planilha.

// Base de dados
var alunos = [];
var ultArquivoAnalisado = "";

// Schema da planilha
var schema = {
    'OBRIGATORIO_NOME': {
        prop: 'OBRIGATORIO_NOME',
        type: String
    },
    'OBRIGATORIO_DATA_NASCIMENTO': {
        prop: 'OBRIGATORIO_DATA_NASCIMENTO',
        type: Date
    },
    'OBRIGATORIO_SEXO': {
        prop: 'OBRIGATORIO_SEXO',
        type: String
    },
    'OBRIGATORIO_COR': {
        prop: 'OBRIGATORIO_COR',
        type: String
    },
    'OBRIGATORIO_LOCALIZACAO': {
        prop: 'OBRIGATORIO_LOCALIZACAO',
        type: String
    },
    'OBRIGATORIO_NIVEL_ENSINO': {
        prop: 'OBRIGATORIO_NIVEL_ENSINO',
        type: String
    },
    'OBRIGATORIO_TURNO_ENSINO': {
        prop: 'OBRIGATORIO_TURNO_ENSINO',
        type: String
    },
    'OPTATIVO_CPF': {
        prop: 'OPTATIVO_CPF',
        type: String
    },
    'OPTATIVO_NOME_RESPONSAVEL': {
        prop: 'NOME_RESPONSAVEL',
        type: String
    },
    'OPTATIVO_GRAU_PARENTESCO': {
        prop: 'OPTATIVO_GRAU_PARENTESCO',
        type: String
    },
    'OPTATIVO_ENDERECO': {
        prop: 'OPTATIVO_ENDERECO',
        type: String
    },
    'OPTATIVO_LATITUDE': {
        prop: 'OPTATIVO_LATITUDE',
        type: String
    },
    'OPTATIVO_LONGITUDE': {
        prop: 'OPTATIVO_LONGITUDE',
        type: String
    },
}

$("#baixarPlanilha").on('click', () => {
    let arqDestino = dialog.showSaveDialogSync(win, {
        title: "Salvar Planilha Exemplo",
        buttonLabel: "Salvar",
        filters: [
            { name: "XLSX", extensions: ["xlsx"] }
        ]
    });
    
    if (arqDestino != "" && arqDestino != undefined) {
        let arqOrigem = path.join(__dirname, "templates", "FormatoImportacaoAluno.xlsx");
        console.log("Copiando de: ", arqOrigem, arqDestino)
        fs.copySync(arqOrigem, arqDestino)
        Swal2.fire({
            icon: "success",
            title: "Planilha baixada com sucesso"
        })
    }
});

function preprocess(arquivo) {
    if (arquivo == undefined) {
        Swal2.fire({
            title: "Ops... tivemos um problema!",
            text: "É necessário informar o arquivo contendo a planilha para realizar a importação.",
            icon: "error",
            confirmButtonColor: "red",
            confirmButtonText: "Fechar",
        });
        return false;
    } else {
        Swal2.fire({
            title: "Pré-processando a planilha...",
            imageUrl: "img/icones/processing.gif",
            closeOnClickOutside: false,
            allowOutsideClick: false,
            showConfirmButton: false,
            text: "Aguarde, estamos pré-processando a planilha..."
        })
        parsePlanilha(arquivo);
        return true;
    }
}

async function parsePlanilha(arquivo) {
    readXlsxFile(arquivo, { schema }).then(({ rows, errors }) => {
        // Alunos a serem importados
        let erroDeProcessamento = false;
        let alunosErrosOpt = {};
        let numErros = 0;

        alunos = [];
        for (let linha of rows) {
            let alunoJSON = {};

            try {
                if (!(linha["OBRIGATORIO_NOME"].toLowerCase().includes("exemplo"))) {
                    ////////////////////////////////////////////////////////////
                    // TRATAMENTO DOS CAMPOS OBRIGATÓRIOS
                    ////////////////////////////////////////////////////////////
                    alunoJSON["nome"] = linha["OBRIGATORIO_NOME"].toUpperCase().trim();
                    alunoJSON["data_nascimento"] = moment(linha["OBRIGATORIO_DATA_NASCIMENTO"]).format("DD/MM/YYYY");

                    var alunoSexo = linha["OBRIGATORIO_SEXO"].toLowerCase().trim();
                    var alunoCor = linha["OBRIGATORIO_COR"].toLowerCase().trim();
                    var alunoLocalizacao = linha["OBRIGATORIO_LOCALIZACAO"].toLowerCase().trim();
                    var alunoNivel = linha["OBRIGATORIO_NIVEL_ENSINO"].toLowerCase().trim();
                    var alunoTurno = linha["OBRIGATORIO_TURNO_ENSINO"].toLowerCase().trim();

                    if (alunoSexo.includes("masculino")) {
                        alunoJSON["sexo"] = 1;
                    } else if (alunoSexo.includes("feminino")) {
                        alunoJSON["sexo"] = 2;
                    } else {
                        alunoJSON["sexo"] = 3;
                    }

                    if (alunoCor.includes("amarelo")) {
                        alunoJSON["cor"] = 4;
                    } else if (alunoCor.includes("branco")) {
                        alunoJSON["cor"] = 1;
                    } else if (alunoCor.includes("indígena") || alunoCor.includes("indigena")) {
                        alunoJSON["cor"] = 5;
                    } else if (alunoCor.includes("pardo")) {
                        alunoJSON["cor"] = 3;
                    } else if (alunoCor.includes("preto")) {
                        alunoJSON["cor"] = 2;
                    } else {
                        alunoJSON["cor"] = 0;
                    }

                    if (alunoLocalizacao.includes("urbana")) {
                        alunoJSON["mec_tp_localizacao"] = 1;
                    } else if (alunoLocalizacao.includes("rural")) {
                        alunoJSON["mec_tp_localizacao"] = 2;
                    }

                    if (alunoNivel.includes("infantil")) {
                        alunoJSON["nivel"] = 1;
                    } else if (alunoNivel.includes("fundamental")) {
                        alunoJSON["nivel"] = 2;
                    } else if (alunoNivel.includes("médio") || alunoNivel.includes("medio")) {
                        alunoJSON["nivel"] = 3;
                    } else if (alunoNivel.includes("superior")) {
                        alunoJSON["nivel"] = 4;
                    } else if (alunoNivel.includes("outro")) {
                        alunoJSON["nivel"] = 5;
                    }

                    if (alunoTurno.includes("manhã") || alunoTurno.includes("manha")) {
                        alunoJSON["turno"] = 1;
                    } else if (alunoTurno.includes("tarde")) {
                        alunoJSON["turno"] = 2;
                    } else if (alunoTurno.includes("integral")) {
                        alunoJSON["turno"] = 3;
                    } else if (alunoTurno.includes("noturno") || alunoTurno.includes("noite")) {
                        alunoJSON["turno"] = 4;
                    }


                    ////////////////////////////////////////////////////////////
                    // TRATAMENTO DOS CAMPOS OPTATIVOS
                    ////////////////////////////////////////////////////////////
                    if (linha["OPTATIVO_CPF"]) {
                        alunoJSON["cpf"] = linha["OPTATIVO_CPF"];
                    }

                    if (linha["OPTATIVO_NOME_RESPONSAVEL"]) {
                        alunoJSON["nome_responsavel"] = linha["OPTATIVO_NOME_RESPONSAVEL"];
                    }

                    if (linha["OPTATIVO_GRAU_PARENTESCO"]) {
                        let alunoGrauResp = linha["OPTATIVO_GRAU_PARENTESCO"].toLowerCase();
                        
                        if (alunoGrauResp.includes("pai") || alunoGrauResp.includes("mãe") ||
                            alunoGrauResp.includes("padrasto") || alunoGrauResp.includes("madrasta")) {
                            alunoJSON["grau_responsavel"] = 0;
                        } else if (alunoGrauResp.includes("avó") || alunoGrauResp.includes("avô")) {
                            alunoJSON["grau_responsavel"] = 1;
                        } else if (alunoGrauResp.includes("irmão") || alunoGrauResp.includes("irmã")) {
                            alunoJSON["grau_responsavel"] = 2;
                        } else if (alunoCor.includes("outro")) {
                            alunoJSON["grau_responsavel"] = 4;
                        } else {
                            alunoJSON["grau_responsavel"] = -1;
                        }
                    }

                    if (linha["OPTATIVO_ENDERECO"]) {
                        alunoJSON["loc_endereco"] = linha["OPTATIVO_ENDERECO"];
                    }

                    if (linha["OPTATIVO_LATITUDE"] && linha["OPTATIVO_LONGITUDE"]) {
                        alunoJSON["loc_latitude"] = Number(String(linha["OPTATIVO_LATITUDE"]).replace(",", "."));
                        alunoJSON["loc_longitude"] = Number(String(linha["OPTATIVO_LONGITUDE"]).replace(",", "."));
                        alunoJSON["georef"] = "Sim";
                    } else {
                        alunoJSON["georef"] = "Não";
                    }

                    alunos.push(alunoJSON)
                    // promiseAlunos.push(dbInserirPromise("alunos", alunoJSON, idAluno));
                }
            } catch (err) {
                erroDeProcessamento = true;
                numErros++;

                if (linha["OBRIGATORIO_NOME"]) {
                    alunosErrosOpt[linha["OBRIGATORIO_NOME"]] = linha["OBRIGATORIO_NOME"];
                }
            }
        }

        let count = 0;
        for (let aluno of alunos) {
            aluno["SELECT"] = count++;
            dataTableImportar.row.add(aluno);
        }
        dataTableImportar.draw();

        if (erroDeProcessamento) {
            Swal2.fire({
                icon: "warning",
                title: "Aviso",
                text: `Ocorreu um erro ao processar os seguintes ${numErros} alunos da planilha:`,
                input: "select",
                inputOptions: alunosErrosOpt
            })
        } else {
            Swal2.close();
        }
    }).catch(err => {
        errorFn("Ocorreu um erro ao processar a planilha", err)
    })
}

var dataTableImportar = $("#datatables").DataTable({
    columns: [
        { data: "SELECT", width: "80px" },
        { data: 'nome', width: "40%" },
        { data: 'data_nascimento', width: "20%" },
        { data: 'georef' },
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
        "searchPlaceholder": "Procurar alunos",
        "lengthMenu": "Mostrar _MENU_ alunos por página",
        "zeroRecords": "Não encontrei nenhum aluno com este filtro",
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
    dom: 'lfrtip',
});

$('#importarAlunos').on('click', () => {
    let rawDados = dataTableImportar.rows('.selected').data().toArray();

    if (rawDados.length == 0) {
        Swal2.fire({
            title: "Nenhum aluno selecionado",
            text: "Por favor, selecione pelo menos um aluno a ser importardo para prosseguir.",
            icon: "error",
            confirmButtonText: "Fechar"
        })
    } else {
        Swal2.fire({
            title: 'Você quer importar os alunos selecionados?',
            text: "Você irá importar " + rawDados.length + " alunos para o banco de dados.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            cancelButtonText: "Cancelar",
            confirmButtonText: 'Sim'
        }).then((result) => {
            if (result.isConfirmed) {
                realizaImportacao(rawDados);
            }
        });
    }
});


function realizaImportacao(rawDados) {
    Swal2.fire({
        title: "Importando os dados...",
        imageUrl: "img/icones/processing.gif",
        closeOnClickOutside: false,
        allowOutsideClick: false,
        showConfirmButton: false,
        html: `<br />
        <div class="progress" style="height: 20px;">
            <div id="pbar" class="progress-bar" role="progressbar" 
                 aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" 
                 style="width: 0%;">
            </div>
        </div>`
    })

    // Numero de operações a serem realizadas
    var totalOperacoes = rawDados.length; 

    // Barra de progresso (valor atual)
    var progresso = 0;

    function updateProgresso() {
        progresso++;
        let progressoPorcentagem = Math.round(100 * (progresso / totalOperacoes))
        $('.progress-bar').css('width', progressoPorcentagem + "%")
        $('.progress-bar').text(progressoPorcentagem + "%")
    }

    let promiseAlunos = new Array();

    for (let aluno of rawDados) {
        delete aluno["SELECT"];
        delete aluno["georef"];
        aluno["cpf"] = String(aluno["cpf"]).replace(/\D/g, '');
        promiseAlunos.push(restImpl.dbPOST(DB_TABLE_IMPORTACAO, "/planilha/aluno", aluno)
                           .then(() => updateProgresso()));
    }

    Promise.all(promiseAlunos)
    .then(() => {
        return Swal2.fire({
            title: "Sucesso",
            text: "Os alunos foram importados com sucesso no sistema. " +
                "Clique abaixo para retornar ao painel.",
            icon: "success",
            showCancelButton: false,
            confirmButtonClass: "btn-success",
            confirmButtonText: "Retornar ao painel",
            closeOnConfirm: false,
            closeOnClickOutside: false,
            allowOutsideClick: false,
            showConfirmButton: true
        })
    })
    .then(() => {
        $("a[name='aluno/aluno-listar-view']").trigger('click')
    })
    .catch((err) => {
        Swal2.close()
        errorFn("Erro ao importar os alunos", err);
    });
}


// Wizard
$('.card-wizard').bootstrapWizard({
    ...configWizardBasico("", usarValidador = false),
    ...{
        onTabShow: function (tab, navigation, index) {
            var $total = navigation.find('li').length;
            var $current = index + 1;
    
            var $wizard = navigation.closest('.card-wizard');
            
            // If it's the last tab then hide the last button and show the finish instead
            if ($current >= $total) {
                if ($("#arqPlanilha").length > 0) {
                    var arquivo;

                    if (isElectron) {
                        arquivo = $("#arqPlanilha")[0].files[0].path;
                    } else {
                        arquivo = $("#arqPlanilha")[0].files[0];
                    }
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
                    Swal2.fire({
                        title: "Ops... tivemos um problema!",
                        text: "É necessário informar o arquivo contendo a planilha para realizar a importação.",
                        icon: "error",
                        confirmButtonColor: "red",
                        confirmButtonText: "Fechar",
                    });
                    setTimeout(() => $('.btn-back').trigger('click'), 200);
                    return false;
                }
            } else {
                $($wizard).find('.btn-next').show();
                $($wizard).find('.btn-finish').hide();
            }
        }
    }
})

action = "importarAluno";