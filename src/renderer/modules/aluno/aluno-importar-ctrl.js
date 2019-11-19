// Lista de Imports
var fs = require("fs-extra");
var readXlsxFile = require('read-excel-file/node');
var schema = {
    'Nome': {
        prop: 'NOME',
        type: String
    },
    'Data de Nascimento': {
        prop: 'data',
        type: Date
    },
    'Sexo': {
        prop: 'sexo',
        type: String
    },
    'Cor': {
        prop: 'cor',
        type: String
    },
    'Nome Responsável': {
        prop: 'NOME_RESPONSAVEL',
        type: String
    },
    'Grau de Parentesco': {
        prop: 'grauResponsavel',
        type: String
    },
    'Endereço Aluno': {
        prop: 'LOC_ENDERECO',
        type: String
    },
    'Localização do Aluno': {
        prop: 'localizacao',
        type: String
    },
    'Nível': {
        prop: 'nivel',
        type: String
    },
    'Turno': {
        prop: 'turno',
        type: String
    }
}

$("#baixarPlanilha").click(() => {
    dialog.showSaveDialog(win, {
        title: "Salvar Planilha Exemplo",
        buttonLabel: "Salvar",
        filters: [
            { name: "XLSX", extensions: ["xlsx"] }
        ]
    }, (arqDestino) => {
        let arqOrigem = path.join(__dirname, "templates", "FormatoImportacaoAluno.xlsx");
        fs.copySync(arqOrigem, arqDestino)
    });
});

$('#importarAlunos').click(() => {
    if ($("#arqPlanilha")[0].files.length == 0) {
        Swal2.fire({
            title: "Ops... tivemos um problema!",
            text: "É necessário informar o arquivo contendo a planilha para realizar a importação.",
            type: "error",
            icon: "error",
            button: "Fechar"
        });
        return;
    }

    swal({
        title: "Importando o arquivo...",
        text: "Espere um minutinho...",
        type: "warning",
        imageUrl: "img/icones/processing.gif",
        icon: "img/icones/processing.gif",
        buttons: false,
        showSpinner: true,
        closeOnClickOutside: false,
        allowOutsideClick: false,
        showConfirmButton: false
    });

    var xlsFilePath = $("#arqPlanilha")[0].files[0].path;

    readXlsxFile(xlsFilePath, { schema }).then(({ rows, errors }) => {
        // Alunos a serem importados
        var promiseAlunos = new Array();
        for (let linha of rows) {
            if (!(linha["NOME"].toLowerCase().includes("exemplo"))) {
                var alunoJSON = {};
                alunoJSON["NOME"] = linha["NOME"];
                alunoJSON["NOME_RESPONSAVEL"] = linha["NOME_RESPONSAVEL"];
                alunoJSON["LOC_ENDERECO"] = linha["LOC_ENDERECO"];
                alunoJSON["LOC_LATITUDE"] = cidadeLatitude;
                alunoJSON["LOC_LONGITUDE"] = cidadeLongitude;

                var alunoSexo = linha["sexo"].toLowerCase();
                var alunoCor = linha["cor"].toLowerCase();
                var alunoGrauResp = linha["grauResponsavel"].toLowerCase();
                var alunoLocalizacao = linha["localizacao"].toLowerCase();
                var alunoNivel = linha["nivel"].toLowerCase();
                var alunoTurno = linha["turno"].toLowerCase();

                if (alunoSexo.includes("masculino")) {
                    alunoJSON["SEXO"] = 1;
                } else if (alunoSexo.includes("feminino")) {
                    alunoJSON["SEXO"] = 2;
                } else {
                    alunoJSON["SEXO"] = 3;
                }

                if (alunoCor.includes("amarelo")) {
                    alunoJSON["COR"] = 1;
                } else if (alunoCor.includes("branco")) {
                    alunoJSON["COR"] = 2;
                } else if (alunoCor.includes("indígena") || alunoCor.includes("indigena")) {
                    alunoJSON["COR"] = 3;
                } else if (alunoCor.includes("pardo")) {
                    alunoJSON["COR"] = 4;
                } else if (alunoCor.includes("preto")) {
                    alunoJSON["COR"] = 5;
                }

                if (alunoGrauResp.includes("pai") || alunoGrauResp.includes("mãe") || 
                    alunoGrauResp.includes("padrasto") || alunoGrauResp.includes("madrasta")) {
                    alunoJSON["GRAU_RESPONSAVEL"] = 0;
                } else if (alunoGrauResp.includes("avó") || alunoGrauResp.includes("avô")) {
                    alunoJSON["GRAU_RESPONSAVEL"] = 1;
                } else if (alunoGrauResp.includes("irmão") || alunoGrauResp.includes("irmã")) {
                    alunoJSON["GRAU_RESPONSAVEL"] = 2;
                } else if (alunoCor.includes("outro")) {
                    alunoJSON["GRAU_RESPONSAVEL"] = 4;
                }

                if (alunoLocalizacao.includes("urbana")) {
                    alunoJSON["MEC_TP_LOCALIZACAO"] = 1;
                } else if (alunoLocalizacao.includes("rural")) {
                    alunoJSON["MEC_TP_LOCALIZACAO"] = 2;
                }

                if (alunoNivel.includes("infantil")) {
                    alunoJSON["NIVEL"] = 1;
                } else if (alunoNivel.includes("fundamental")) {
                    alunoJSON["NIVEL"] = 2;
                } else if (alunoNivel.includes("médio") || alunoNivel.includes("medio")) {
                    alunoJSON["NIVEL"] = 3;
                } else if (alunoNivel.includes("superior")) {
                    alunoJSON["NIVEL"] = 4;
                } else if (alunoNivel.includes("outro")) {
                    alunoJSON["NIVEL"] = 5;
                }

                if (alunoTurno.includes("manhã") || alunoTurno.includes("manha")) {
                    alunoJSON["TURNO"] = 1;
                } else if (alunoTurno.includes("tarde")) {
                    alunoJSON["TURNO"] = 2;
                } else if (alunoTurno.includes("integral")) {
                    alunoJSON["TURNO"] = 3;
                } else if (alunoTurno.includes("noturno") || alunoTurno.includes("noite")) {
                    alunoJSON["TURNO"] = 4;
                }

                alunoJSON["DATA_NASCIMENTO"] = moment(linha["data"]).format("DD/MM/YYYY");

                promiseAlunos.push(InserirAlunoPromise(alunoJSON));
            }
        }

        Promise.all(promiseAlunos)
            .then((res) => {
                swal.close();
                Swal2.fire({
                    title: "Sucesso",
                    text: "Os alunos foram importados com sucesso no sistema. " +
                        "Clique abaixo para retornar ao painel.",
                    type: "success",
                    icon: "success",
                    showCancelButton: false,
                    confirmButtonClass: "btn-success",
                    confirmButtonText: "Retornar ao painel",
                    closeOnConfirm: false,
                    closeOnClickOutside: false,
                    allowOutsideClick: false,
                    showConfirmButton: true
                })
                    .then(() => {
                        navigateDashboard("./modules/aluno/aluno-listar-view.html");
                    });
            })
            .catch((err) => {
                swal.close();
                errorFn("Erro ao importar os alunos", err);
            });
    })

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
            $($wizard).find('.btn-next').hide();
            $($wizard).find('.btn-finish').show();
        } else {
            $($wizard).find('.btn-next').show();

            $($wizard).find('.btn-finish').hide();
        }
    }
});

action = "importarAluno";