// norma-cadastrar-ctrl.js
// Este arquivo contém o script de controle da tela norma-cadastrar-view. 
// O mesmo serve tanto para cadastrar, quanto para alterar os dados de uma norma.

// Verifica se é um cadastro novo ou é uma edição
var estaEditando = false;
if (action == "editarNorma") {
    estaEditando = true;
    $("#arqDivObr").removeClass("obr");
    $("#arqDivObrText").removeClass("obrlabel").addClass("optlabel")
    $("#arqDivObrText").text("Optativo")
}

// Conjuntos que indicam as rotas vinculadas ao motorista
var antRotas = new Set();

// Máscaras
$(".outroTipoNormaDiv").hide()
$("#tipoNorma").on("change", (evt) => {
    if (evt.target.value == '8') { // Outro
        $(".outroTipoNormaDiv").show();
    } else {
        $(".outroTipoNormaDiv").hide();
    }
})

$(".outroAssuntoNormaDiv").hide()
$("#tipoAssunto").on("change", () => {
    if ($("#tipoAssunto").val().includes("14")) { // Outro
        $(".outroAssuntoNormaDiv").show();
    } else {
        $(".outroAssuntoNormaDiv").hide();
    }
})

var validadorFormulario = $("#wizardCadastrarNormaForm").validate({
    // Estrutura comum de validação dos nossos formulários (mostrar erros, mostrar OK)
    ...configMostrarResultadoValidacao(),
    ...{
        rules: {
            titulo: {
                required: true
            },
            regdata: {
                required: true,
                date: true
            },
            tipoNorma: {
                required: true
            },
            tipoAssunto: {
                required: true,
            },
            arqNorma: {
                required: !estaEditando,
                fileType: {
                    types: ["pdf"]
                }
            }
        }
    }
});


$('.card-wizard').bootstrapWizard({
    // Configura ações básica do wizard (ver função em common.js)
    ...configWizardBasico('#wizardCadastrarNormaForm'),
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

            if (action == "editarNorma") {
                $($wizard).find('#cancelarAcao').show();
            } else {
                $($wizard).find('#cancelarAcao').hide();
            }
        }
    }
});

var completeForm = () => {
    Swal2.fire({
        title: "Norma salva com sucesso",
        text: "A norma " + $("#titulo").val() + " foi salva com sucesso. " +
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
        navigateDashboard("./modules/norma/norma-listar-view.html");
    });
}

$("#salvarnorma").on("click", async () => {
    let $valid = $('#wizardCadastrarNormaForm').valid();
    if (!$valid) {
        return false;
    } else {
        // Monta payload
        let payload = GetNormaFromForm();
        try {
            if (!estaEditando) {
                // Salvando
                loadingFn("Salvando a norma")

                let reqSalvar = await restImpl.dbPOST(DB_TABLE_NORMAS, "", payload);
                let idNorma = reqSalvar?.data?.messages?.id;
                
                let formData = new FormData();
                formData.append("file", $("#arqNorma")[0].files[0]);
                await restImpl.dbPOST(DB_TABLE_NORMAS, `/${idNorma}/file`, formData);
            } else {
                // Atualizando
                loadingFn("Atualizando a norma")

                await restImpl.dbPUT(DB_TABLE_NORMAS, `/${estadoNorma.ID}`, payload);
                
                if ($("#arqNorma")[0].files.length) {
                    let formData = new FormData();
                    formData.append("file", $("#arqNorma")[0].files[0]);
                    await restImpl.dbPOST(DB_TABLE_NORMAS, `/${estadoNorma.ID}/file`, formData);
                }
            }
            completeForm();
        } catch (err) {
            debugger
            errorFn("Erro ao salvar a norma.", err)
        }
    }
        // let titulo = $("#titulo").val();
        // let dataNorma = $("#regdata").val();
        // let tipo = $("#tipoNorma").val();
        // let outroTipo = Number($("#tipoNorma").val()) == 8 ? true : false;
        // let outroTipoText = outroTipo ? $("#outroTipoText").val() : null;
        // let assunto = $("#tipoAssunto").val();
        // let modo = $("#tipoModo").val();
        // let arq = $("#arqNorma")[0].files[0];

        // let formData = new FormData();
        // formData.append("titulo", titulo);
        // formData.append("data_norma", dataNorma);
        // formData.append("tipo_veiculo", modo);
        // formData.append("file", arq);
        // formData.append("id_tipo", tipo);
        // if (outroTipo) {
        //     formData.append("outro_tipo", outroTipoText);
        // }

        // for (let a of assunto) {
        //     formData.append("id_assunto[]", a);
        // }
        // formData.append("outro_assunto", "OII");
        // console.log(formData)
        // if (!estaEditando) {
        //     try {
        //         loadingFn("Cadastrando a norma...")
        //         await restImpl.dbPOST(DB_TABLE_NORMAS, "", formData)
        //         completeForm()
        //     } catch (error) {
        //         errorFn("Erro ao salvar norma", error);
        //     }
        // }
    // }
});

// Lida com a atribuição nas rotas
restImpl.dbGETColecaoRaiz(DB_TABLE_NORMAS, "/tipos")
    .then(resTipos => preprocessarTipos(resTipos))
    .then(() => restImpl.dbGETColecaoRaiz(DB_TABLE_NORMAS, "/assuntos"))
    .then(resAssuntos => preprocessarAssuntos(resAssuntos))
    .then(() => verificaEdicao())

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
        $('#tipoAssunto').selectpicker({
            noneSelectedText: "Escolha pelo menos um assunto"
        });
        $('#tipoAssunto').on("change", () => $('#wizardCadastrarNormaForm').valid())
    } else {
        throw "Erro ao recuperar os tipos de assuntos"
    }
}

function verificaEdicao() {
    if (estaEditando) {
        PopulateNormaFromForm(estadoNorma)
        restImpl.dbGETEntidade(DB_TABLE_NORMAS, `/${estadoNorma.ID}`)
            .then((normaRaw) => {
                if (normaRaw) {
                    estadoNorma = parseNormaREST(normaRaw);
                    PopulateNormaFromForm(estadoNorma);
                }
            }).catch((err) => {
                errorFn("Erro ao editar a norma", err)
            })
    }
}

action = "cadastrarNorma";