// Lista de veiculo e fornecedor anterior
var antVeiculo;
var antFornecedor;

// Máscaras
$(".datanasc").mask('00/00/0000');

var validadorFormulario = $("#wizardCadastrarOSForm").validate({
    rules: {
        tipoServico: {
            required: true
        },
        regdata: {
            required: true,
        },
        tipoVeiculo: {
            required: true,
            mltselect: true
        },
        tipoFornecedor: {
            required: true,
            pickselect: true
        },
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
        var $valid = $('#wizardCadastrarOSForm').valid();
        if (!$valid) {
            validadorFormulario.focusInvalid();
            return false;
        } else {
            window.scroll(0, 0);
        }
    },

    onTabClick: function (tab, navigation, index) {
        var $valid = $('#wizardCadastrarOSForm').valid();
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

        if (action == "editarFornecedor") {
            $($wizard).find('#cancelarAcao').show();
        } else {
            $($wizard).find('#cancelarAcao').hide();
        }

    }
});

var completeForm = () => {
    Swal2.fire({
        title: "Ordem de serviço salva com sucesso",
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
            $("a[name='frota/frota-os-view']").click();
        });
}

$("#salvaros").click(() => {
    var $valid = $('#wizardCadastrarOSForm').valid();
    var osJSON = GetOSFromForm();

    if (!$valid) {
        return false;
    } else {
        if (action == "editarOS") {
            RemoverComposedPromise("OrdemDeServico",
                "ID_FORNECEDOR", estadoOS["ID_FORNECEDOR"],
                "ID_VEICULO", estadoOS["ID_VEICULO"])
                .then(() => {
                    InserirPromise("OrdemDeServico", osJSON)
                        .then(() => {
                            completeForm();
                        })
                        .catch((err) => {
                            errorFn("Erro ao salvar a ordem de serviço!", err);
                        });
                });
        } else {
            InserirPromise("OrdemDeServico", osJSON)
                .then(() => {
                    completeForm();
                })
                .catch((err) => {
                    errorFn("Erro ao salvar a ordem de serviço!", err);
                });
        }
    }
});


if (action == "editarOS") {
    PopulateOSFromState(estadoOS);

    $("#cancelarAcao").click(() => {
        Swal2.fire({
            title: 'Cancelar Edição?',
            text: "Se você cancelar nenhum alteração será feita nos dados da ordem de serviço.",
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

Promise.all([BuscarTodosDadosPromise("Veiculos"), BuscarTodosDadosPromise("Fornecedores")])
    .then((res) => {
        // Resultado
        var veiculosRes = res[0];
        var fornecedoresRes = res[1];

        for (let veiculoRaw of veiculosRes) {
            let veiculoJSON = parseVeiculoDB(veiculoRaw);
            let vSTR = `${veiculoJSON["TIPOSTR"]} (${veiculoJSON["PLACA"]})`;
            $('#tipoVeiculo').append(`<option value="${veiculoJSON["ID_VEICULO"]}">${vSTR}</option>`);

            antVeiculo = veiculoJSON["ID_VEICULO"];
        }

        for (let fornecedorRaw of fornecedoresRes) {
            let fSTR = `${fornecedorRaw["NOME"]} (${fornecedorRaw["CNPJ"]})`;
            $('#tipoFornecedor').append(`<option value="${fornecedorRaw["ID_FORNECEDOR"]}">${fSTR}</option>`);

            antFornecedor = fornecedorRaw["ID_FORNECEDOR"];
        }

    })
