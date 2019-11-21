// Máscaras
$('.cep').mask("00000-000");
$(".cpfmask").mask("000.000.000-00", { reverse: true });
$(".telmask").mask(telmaskbehaviour, teloptions);
$(".anoaquisicao").mask("0000");
$(".placa").mask("SSS-0000");
$(".renavam").mask("0000000000-0");
$(".kmmask").mask("0000,00", { reverse: true });

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
    } else {
        $(".tipoRodo").hide();
        $(".tipoAqua").show();

        $("#tipoVeiculo").val($('.tipoAqua')[0].value);
        $("#tipoMarca").val($('.tipoAqua')[0].value);
    }
});

var validadorFormulario = $("#wizardCadastrarVeiculoForm").validate({
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
            required: true,
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
    },
    highlight: function (element) {
        $(element).closest('.form-group').removeClass('has-success').addClass('has-error');
        $(element).closest('.form-check').removeClass('has-success').addClass('has-error');
    },
    success: function (element) {
        $(element).closest('.form-group').removeClass('has-error').addClass('has-success');
        $(element).closest('.form-check').removeClass('has-error').addClass('has-success');
    },
    errorPlacement: function (error, element) {
        console.log(error);
        console.log(element);
        $(element).closest('.form-group').append(error).addClass('has-error');
    }
});

$('.card-wizard').bootstrapWizard({
    'tabClass': 'nav nav-pills',
    'nextSelector': '.btn-next',
    'previousSelector': '.btn-back',

    onNext: function (tab, navigation, index) {
        var $valid = $('#wizardCadastrarVeiculoForm').valid();
        if (!$valid) {
            validadorFormulario.focusInvalid();
            return false;
        } else {
            window.scroll(0, 0);
        }
    },

    onTabClick: function (tab, navigation, index) {
        var $valid = $('#wizardCadastrarVeiculoForm').valid();
        if (!$valid) {
            return false;
        } else {
            window.scroll(0, 0);
            return true;
        }
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

        if (action == "editarVeiculo") {
            $($wizard).find('#cancelarAcao').show();
        } else {
            $($wizard).find('#cancelarAcao').hide();
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

$("#salvarveiculo").click(() => {
    $("#regplaca").valid();
    $("#regrenavam").valid();
    $("#capacidade").valid();
    $("[name='manutencao']").valid();

    var veiculoJSON = GetVeiculoFromForm();

    var $valid = $('#wizardCadastrarVeiculoForm').valid();
    if (!$valid) {
        return false;
    } else {
        if (action == "editarVeiculo") {
            AtualizarPromise("Veiculos", veiculoJSON, "ID_VEICULO", estadoVeiculo["ID_VEICULO"])
            .then((res) => {
                completeForm();
            })
            .catch((err) => {
                errorFn("Erro ao atualizar o motorista!", err);
            });
        } else {
            InserirPromise("Veiculos", veiculoJSON)
            .then((res) => {
                completeForm();
            })
            .catch((err) => {
                errorFn("Erro ao salvar o motorista!", err);
            });
        }
    }
});


if (action == "editarVeiculo") {
    PopulateVeiculoFromState(estadoVeiculo);
    $("#cancelarAcao").click(() => {
        Swal2.fire({
            title: 'Cancelar Edição?',
            text: "Se você cancelar nenhum alteração será feita nos dados do veículo.",
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            cancelButtonText: "Voltar a editar",
            confirmButtonText: 'Sim, cancelar'
        }).then((result) => {
            if (result.value) {
                navigateDashboard(lastPage);
            }
        })
    });
}