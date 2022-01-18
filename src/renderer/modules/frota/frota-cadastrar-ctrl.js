// frota-cadastrar-ctrl.js
// Este arquivo contém o script de controle da tela frota-cadastrar-view. 
// O mesmo serve tanto para cadastrar, quanto para alterar os dados de um veículo.

// Verifica se é um cadastro novo ou é uma edição
var estaEditando = false;
if (action == "editarVeiculo") {
    estaEditando = true;
}

// Máscaras
$('.cep').mask("00000-000");
$(".cpfmask").mask("000.000.000-00", { reverse: true });
$(".telmask").mask(telmaskbehaviour, teloptions);
$(".anoaquisicao").mask("0000");
$('.money').mask('#.##0,00', {reverse: true});

$(".placa").mask("ZZZ-ZZZZ", {
    translation: {
        'Z': {
            pattern: /[A-Za-z0-9]/
        }
    }
});

$(".renavam").mask("0000000000-0");
$(".kmmask").mask("000000,00", { reverse: true });

// Esconde tipo de veículo
$(".tipoRodo").hide();
$(".tipoAqua").hide();
$("input[name='tipoModal']").on("change", (evt) => {
    $(".tipoNeutro").hide();
    if (evt.currentTarget.value == "0") {
        $(".tipoAqua").hide();
        $(".tipoRodo").show();

        $("#tipoVeiculo").val($('.tipoRodo')[0].value);
        $("#tipoMarca").val($('.tipoRodo')[0].value);

        $("#input-consumo-label").text("Consumo do veículo (KM/L)");
        $("#input-consumo-unidade").text("KM/L");
    } else {
        $(".tipoRodo").hide();
        $(".tipoAqua").show();

        $("#tipoVeiculo").val($('.tipoAqua')[0].value);
        $("#tipoMarca").val(6);

        $("#input-consumo-label").text("Consumo do veículo (L/HORA)");
        $("#input-consumo-unidade").text("L / HORA");
    }
});

var validadorFormulario = $("#wizardCadastrarVeiculoForm").validate({
    // Estrutura comum de validação dos nossos formulários (mostrar erros, mostrar OK)
    ...configMostrarResultadoValidacao(),
    ...{
        rules: {
            tipoModal: {
                required: true
            },
            tipoVeiculo: {
                required: true
            },
            reganoaquisicao: {
                required: true,
                ano: true,
            },
            marca: {
                required: true
            },
            origemVeiculo: {
                required: true
            },
            regplaca: {
                required: false,
                placa: true
            },
            regrenavam: {
                required: true,
                renavam: true
            },
            capacidade: {
                required: true
            },
            manutencao: {
                required: true
            }
        }
    }
});

$('.card-wizard').bootstrapWizard({
    // Configura ações básica do wizard (ver função em common.js)
    ...configWizardBasico('#wizardCadastrarVeiculoForm'),
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

            if (estaEditando) {
                $($wizard).find('#cancelarAcao').show();
            } else {
                $($wizard).find('#cancelarAcao').hide();
            }
        }
    }
});

var completeForm = () => {
    Swal2.fire({
        title: "Veículo salvo com sucesso",
        text: "Clique abaixo para retornar ao painel.",
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
            navigateDashboard("./modules/frota/frota-listar-view.html");
        });
}

$("#salvarveiculo").on('click', () => {
    $("#capacidade").valid();
    $("[name='manutencao']").valid();
    var veiculoJSON = GetVeiculoFromForm();
    debugger

    var $valid = $('#wizardCadastrarVeiculoForm').valid();
    if (!$valid) {
        return false;
    } else {
        if (estaEditando) {
            loadingFn("Editando o veículo ...")
            let idVeiculo = estadoVeiculo["ID"];
            restImpl.dbPUT(DB_TABLE_VEICULO, "/" + idVeiculo, veiculoJSON)
                .then(() => completeForm())
                .catch((err) => {
                    debugger
                    errorFn("Erro ao atualizar o veículo.", err)
                })
        } else {
            loadingFn("Cadastrando o veículo ...")

            restImpl.dbPOST(DB_TABLE_VEICULO, "", veiculoJSON)
            .then(() => completeForm())
            .catch((err) => {
                debugger
                errorFn("Erro ao salvar o veiculo.", err)
            })
        }
    }
});

if (estaEditando) {
    restImpl.dbGETEntidade(DB_TABLE_VEICULO, `/${estadoVeiculo.ID}`)
    .then((veiculoRaw) => {
        if (veiculoRaw) {
            estadoVeiculo = parseVeiculoREST(veiculoRaw);

            PopulateVeiculoFromState(estadoVeiculo);
            $('.cep').trigger("input");
            $(".cpfmask").trigger("input");
            $(".telmask").trigger("input");
            $(".anoaquisicao").trigger("input");
            $(".placa").trigger("input");
            $(".renavam").trigger("input");
            $(".kmmask").trigger("input");
        
            $("#cancelarAcao").click(() => {
                cancelDialog()
                    .then((result) => {
                        if (result.value) {
                            navigateDashboard(lastPage);
                        }
                    })
            });
        }
    })
}