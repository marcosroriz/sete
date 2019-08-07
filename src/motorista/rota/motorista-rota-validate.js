$("#formCadastroRotaMotorista").validate({
    rules: {
        rota_nome: {
            required: true,
            lettersonly: true
        },
        rota_km: {
            required: true,
            lettersonly: true
        },
        rota_motorista: {
            required: true,
            lettersonly: true
        },
        rota_escola: {
            required: true,
            lettersonly: true
        }
    },
    messages: {
        rota_nome: {
            required: "Por favor digite uma descrição para rota.",
        }
    },
    highlight: function(element) {
        $(element).closest('.form-group').removeClass('has-success').addClass('has-error');
        $(element).closest('.form-check').removeClass('has-success').addClass('has-error');
    },
    success: function(element) {
        $(element).closest('.form-group').removeClass('has-error').addClass('has-success');
        $(element).closest('.form-check').removeClass('has-error').addClass('has-success');
    },
    errorPlacement: function(error, element) {
        $(element).closest('.form-group').append(error).addClass('has-error');
    }
});

$(document).ready(function() {

    $("#formCadastroRotaMotorista").submit(function(e) {
        e.preventDefault();
        $("#formCadastroRotaMotorista").validate();

        if ($("#formCadastroRotaMotorista").valid()) {
            InsertRotaMotoristaCTRL();
        }

    });

});;