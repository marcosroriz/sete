// norma-cadastrar-ctrl.js
// Este arquivo contém o script de controle da tela norma-cadastrar-view. 
// O mesmo serve tanto para cadastrar, quanto para alterar os dados de uma norma.

// Verifica se é um cadastro novo ou é uma edição
var estaEditando = false;
if (action == "editarNorma") {
    estaEditando = true;
}

// Conjuntos que indicam as rotas vinculadas ao motorista
var antRotas = new Set();

// Máscaras
// $('.cep').mask('00000-000');
// $(".cpfmask").mask('000.000.000-00', { reverse: true });
// $(".telmask").mask(telmaskbehaviour, teloptions);
// $(".datamask").mask('00/00/0000');
// $(".datavalidacnh").mask('00/00/0000');
// $('.cnh').mask('000000000-00', { reverse: true });
// $('.money').mask('#.##0,00', { reverse: true });

var validadorFormulario = $("#wizardCadastrarNormaForm").validate({
    // Estrutura comum de validação dos nossos formulários (mostrar erros, mostrar OK)
    ...configMostrarResultadoValidacao(),
    ...{
        rules: {
            tipoNorma: {
                required: true
            },
            tipoAssunto: {
                required: true
            },
            // regdata: {
            //     required: true,
            //     datanasc: true
            // },
            // regnome: {
            //     required: true,
            //     lettersonly: true
            // },
            // regcpf: {
            //     required: true,
            //     cpf: true
            // },
            // modoSexo: {
            //     required: true
            // },
            // regcnh: {
            //     required: true,
            //     cnh: true
            // },
            // 'habilitado[]': {
            //     required: true,
            //     minlength: 1
            // },
            // 'temHorario[]': {
            //     required: true,
            //     minlength: 1
            // },
        }
    }
});


$('.card-wizard').bootstrapWizard({
    // Configura ações básica do wizard (ver função em common.js)
    ...configWizardBasico('#wizardCadastrarMotoristaForm'),
    ...{
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

            if (action == "editarMotorista") {
                $($wizard).find('#cancelarAcao').show();
            } else {
                $($wizard).find('#cancelarAcao').hide();
            }
        }
    }
});

var completeForm = () => {
    Swal2.fire({
        title: "Motorista salvo com sucesso",
        text: "O motorista " + $("#regnome").val() + " foi salvo com sucesso. " +
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
    .then(() => {
        navigateDashboard("./modules/motorista/motorista-listar-view.html");
    });
}

$("#salvarnorma").on("click", async () => {
    let tipo = $("#tipoNorma").val()
    let assunto = $("#tipoAssunto").val()
    let modo = $("#tipoModo").val()
    let arq = $("#arqNorma")[0].files[0]
    
    let formData = new FormData();
    formData.append("file", arq);
    formData.append("titulo", $("#titulo").val());
    formData.append("id_tipo", tipo);
    formData.append("id_assunto", assunto);
    formData.append("tipo_veiculo", modo);
    
    let dadoJSON = {
        titulo: $("#titulo").val(),
        id_tipo: Number($("#tipoNorma").val()),
        id_assunto: Number($("#tipoAssunto").val()),
        tipo_veiculo: Number($("#tipoModo").val()),
        file: arq
    }

    debugger
    try {
        let req = await restImpl.dbPOST(DB_TABLE_NORMAS, "", formData)
        console.log("aqui")
        debugger
        console.log(req)
    } catch (error) {
        debugger
        console.log(error)
    }

    console.log('aqui')
});

$("#salvarmotorista").on('click', async () => {
    $("[name='regcnh']").valid();
    $("[name='habilitado[]']").valid();
    $("[name='temHorario[]']").valid();

    var motoristaJSON = GetMotoristaFromForm();
    var $valid = $('#wizardCadastrarMotoristaForm').valid();
    if (!$valid) {
        return false;
    } else {
        // Verifica se já existe um motorista com o dado CPF
        let cpf = motoristaJSON["cpf"];

        let existeCPF = false;
        try {
            let res = await restImpl.dbGETEntidade(DB_TABLE_MOTORISTA, `/${cpf}`);
            existeCPF = true;
            console.log(res);
        } catch (err) {
            existeCPF = false;
            console.log(err);
        }

        if (existeCPF && !estaEditando) {
            errorFn("Já existe um motorista com o CPF indicado. " +
                "Por favor digite outro CPF ou exclua este motorista primeiro.",
                '', "Ops... CPF duplicado")
        } else {
            if ($("#regdocpessoaispdf")[0].files.length != 0) {
                var oriFile = $("#regdocpessoaispdf")[0].files[0].path;
                var dstFile = path.join(userDataDir, $("#regcpf").val() + ".pdf");
                motoristaJSON["ARQUIVO_DOCPESSOAIS_ANEXO"] = dstFile;

                fs.copySync(oriFile, dstFile);
                console.log("Salvando arquivo do motorista", dstFile);
            }

            if (estaEditando) {
                try {
                    var novasRotas = new Set($("#tipoRota").val());
                    var rotasAdicionar = new Set([...novasRotas].filter(x => !antRotas.has(x)));
                    var rotasRemover = new Set([...antRotas].filter(x => !novasRotas.has(x)))

                    await restImpl.dbPUT(DB_TABLE_MOTORISTA, `/${cpf}`, motoristaJSON);

                    if ($("#tipoRota").val() != "-1") {
                        for (var rID of rotasAdicionar) {
                            if (rID != "-1" && rID != -1) {
                                await restImpl.dbPOST(DB_TABLE_ROTA, `/${rID}/motoristas`, { "cpf_motorista": cpf })
                            }
                        }
                    }
                    
                    for (var rID of rotasRemover) {
                        if (rID != "-1" && rID != -1) {
                            await restImpl.dbDELETEComParam(DB_TABLE_ROTA, `/${rID}/motoristas`, { "cpf_motorista": cpf });
                        }
                    }
                    completeForm()
                } catch (err) {
                    errorFn("Erro ao atualizar o motorista.", err);
                }
            } else {
                try {
                    await restImpl.dbPOST(DB_TABLE_MOTORISTA, "", motoristaJSON)
                    if ($("#tipoRota").val() != "-1") {
                        for (var rID of $("#tipoRota").val()) {
                            if (rID != "-1" && rID != -1) {
                                await restImpl.dbPOST(DB_TABLE_ROTA, `/${rID}/motoristas`, { "cpf_motorista": cpf })
                            }
                        }
                    }
                    completeForm()
                } catch (err) {
                    errorFn("Erro ao salvar o motorista.", err);
                }
            }
        }

    }
});

// Lida com a atribuição nas rotas
restImpl.dbGETColecaoRaiz(DB_TABLE_NORMAS, "/tipos")
    .then(resTipos => preprocessarTipos(resTipos))
    .then(() => restImpl.dbGETColecaoRaiz(DB_TABLE_NORMAS, "/assuntos"))
    .then(resAssuntos => preprocessarAssuntos(resAssuntos))
    // .then(() => verificaEdicao())

function preprocessarTipos(resTipos) {
    if (resTipos?.data?.data) {
        let tipos = resTipos.data.data.sort((a, b) => {
            if (a.nm_tipo == "Outro") {
                return 1;
            } else if (b.nm_tipo == "Outro") {
                return -1;
            } else {
                a.nm_tipo.localeCompare(b.nm_tipo)
            }
        });

        for (let t of tipos) {
            $('#tipoNorma').append(`<option value="${t.id_tipo}">${t.nm_tipo}</option>`);
        }
    } else {
        throw "Erro ao recuperar os tipos de normas" 
    }
}

function preprocessarAssuntos(resAssuntos) {
    if (resAssuntos?.data?.data) {
        let assuntos = resAssuntos.data.data.sort((a, b) => {
            if (a.assunto == "Outros") {
                return 1;
            } else if (b.assunto == "Outros") {
                return -1;
            } else {
                a.assunto.localeCompare(b.assunto)
            }
        });

        for (let a of assuntos) {
            $('#tipoAssunto').append(`<option value="${a.id_assunto}">${a.assunto}</option>`);
        }
    } else {
        throw "Erro ao recuperar os tipos de assuntos" 
    }
}

function preprocessarRotas(rotas) {
    // Processando Motoristas
    if (rotas.length != 0) {
        for (let rota of rotas) {
            $('#tipoRota').append(`<option value="${rota.id_rota}">${rota.nome}</option>`);
        }
        $('#tipoRota').selectpicker({
            noneSelectedText: "Escolha pelo menos uma rota"
        });
    } else {
        $('#tipoRota').removeClass("selectpicker")
        $('#tipoRota').addClass("form-control")
        $('#tipoRota').removeAttr("multiple")
        $('#tipoRota').val(-1)
        $('#tipoRota').change()

        $(".marcarTodosLabel").hide()
        $("#tipoRota").parent().addClass("mt-2")
    }

    return Promise.resolve();
}

function verificaEdicao() {
    if (estaEditando) {
        restImpl.dbGETEntidade(DB_TABLE_MOTORISTA, `/${estadoMotorista.ID}`)
            .then((motoristaRaw) => {
                if (motoristaRaw) {
                    estadoMotorista = parseMotoristaREST(motoristaRaw);
                    PopulateMotoristaFromState(estadoMotorista);

                    // Reativa máscaras
                    $('.cep').trigger('input');
                    $(".cpfmask").trigger('input');
                    $(".telmask").trigger('input');
                    $(".datanasc").trigger('input');
                    $('.cnh').trigger('input');
                    $("#regsalario").trigger('input');

                    $("#cancelarAcao").on('click', () => {
                        cancelDialog()
                            .then((result) => {
                                if (result.value) {
                                    navigateDashboard(lastPage);
                                }
                            })
                    });
                }
            }).catch((err) => {
                errorFn("Erro ao editar o motorista", err)
            })
    }
}

$('#tipoRota').on("change", () => {
    $('#tipoRota').valid();
})

$('#tipoRota').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
    // Verificar se quer adicionar depois
    if (clickedIndex == 0) {
        // Ver se não tinha escolhido isso antes
        // previousValue = true se estava ativo antes
        if (!previousValue) {
            // Remover todas as opções escolhidas
            $('.selectpicker').val('-1');
            $('.selectpicker').selectpicker('render');
        }
    } else {
        // Ver se tinha escolhido a opção de escolher depois
        var opcoes = $('.selectpicker').val();
        if (opcoes.includes("-1")) {
            opcoes = opcoes.filter(item => item != '-1')
        }

        $('.selectpicker').val(opcoes);
        $('.selectpicker').selectpicker('render');
    }

    $('.selectpicker').selectpicker('toggle');
});

action = "cadastrarMotorista";