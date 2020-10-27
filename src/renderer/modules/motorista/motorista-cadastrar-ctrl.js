// Bibliotecas
var fs = require("fs-extra");

// Máscaras
$('.cep').mask('00000-000');
$(".cpfmask").mask('000.000.000-00', { reverse: true });
$(".telmask").mask(telmaskbehaviour, teloptions);
$(".datanasc").mask('00/00/0000');
$('.cnh').mask('000000000-00', { reverse: true });

var validadorFormulario = $("#wizardCadastrarMotoristaForm").validate({
    rules: {
        regdata: {
            required: true,
            datanasc: true
        },
        regnome: {
            required: true,
            lettersonly: true
        },
        regcpf: {
            required: true,
            cpf: true
        },
        modoSexo: {
            required: true
        },
        regcnh: {
            required: true,
            cnh: true
        },
        'habilitado[]': {
            required: true,
            minlength: 1
        },
        'temHorario[]': {
            required: true,
            minlength: 1
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
        var $valid = $('#wizardCadastrarMotoristaForm').valid();
        if (!$valid) {
            validadorFormulario.focusInvalid();
            return false;
        } else {
            window.scroll(0, 0);
        }
    },

    onTabClick: function (tab, navigation, index) {
        var $valid = $('#wizardCadastrarMotoristaForm').valid();
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

        if (action == "editarMotorista") {
            $($wizard).find('#cancelarAcao').show();
        } else {
            $($wizard).find('#cancelarAcao').hide();
        }
    }
});

var completeForm = () => {
    Swal2.fire({
        title: "Motorista salvo com sucesso",
        text: "O motorista " + $("#regnome").val() + " foi salvo com sucesso. " +
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
        navigateDashboard("./modules/motorista/motorista-listar-view.html");
    });
}

$("#salvarmotorista").click(() => {
    $("[name='regcnh']").valid();
    $("[name='habilitado[]']").valid();
    $("[name='temHorario[]']").valid();
    
    var motoristaJSON = GetMotoristaFromForm();

    var $valid = $('#wizardCadastrarMotoristaForm').valid();
    if (!$valid) {
        return false;
    } else {
        if ($("#regdocpessoaispdf")[0].files.length != 0) {
            var oriFile = $("#regdocpessoaispdf")[0].files[0].path;
            var dstFile = path.join(userDataDir, $("#regcpf").val() + ".pdf");
            motoristaJSON["ARQUIVO_DOCPESSOAIS_ANEXO"] = dstFile;

            fs.copySync(oriFile, dstFile);
            console.log("Salvando arquivo do motorista", dstFile);
        }

        if (action == "editarMotorista") {
            AtualizarPromise("Motoristas", motoristaJSON, "CPF", estadoMotorista["CPF"])
            .then((res) => {
                completeForm();
            })
            .catch((err) => {
                errorFn("Erro ao atualizar o motorista!", err);
            });
        } else {
            InserirPromise("Motoristas", motoristaJSON)
            .then((res) => {
                completeForm();
            })
            .catch((err) => {
                errorFn("Erro ao salvar o motorista!", err);
            });
        }
    }
});

if (action == "editarMotorista") {
    PopulateMotoristaFromState(estadoMotorista); 
    $("#cancelarAcao").on('click', () => {
        Swal2.fire({
            title: 'Cancelar Edição?',
            text: "Se você cancelar nenhuma alteração será feita nos dados do motorista.",
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