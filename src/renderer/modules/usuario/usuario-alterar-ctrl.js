// Máscaras
$('.cep').mask('00000-000');
$(".cpfmask").mask('000.000.000-00', { reverse: true });
$(".telmask").mask(telmaskbehaviour, teloptions);


$("#uid").val(estadoUsuario.ID);
$("#regnome").val(estadoUsuario.NOME);
$("#regcpf").val(estadoUsuario.CPF);
$("#regtel").val(estadoUsuario.TELEFONE);
$("#regemail").val(estadoUsuario.EMAIL);

var completeForm = () => {
    Swal2.fire({
        title: "Usuário salvo com sucesso",
        text: "O usuário " + $("#regnome").val() + " foi salvo com sucesso. " +
            "Clique abaixo para retornar ao painel.",
        type: "info",
        icon: "info",
        showCancelButton: false,
        closeOnConfirm: false,
        allowOutsideClick: false,
    })
        .then(() => {
            navigateDashboard("./modules/usuario/usuario-listar-view.html");
        });
}

$("#btCancelarCadastroUsuario").click(() => {
    navigateDashboard(lastPage);
})

$("#registerform").validate({
    rules: {
        regnome: {
            required: true,
            lettersonly: true
        },
        regcpf: {
            required: true,
            cpf: true
        },
        regtel: {
            required: true,
            minlength: 10
        },
        regemail: {
            required: true,
            email: true
        }
    },
    messages: {
        regnome: {
            required: "Por favor digite o nome do usuário",
        },
        regcpf: {
            required: "Por favor digite um CPF válido"
        },
        regtel: {
            required: "Por favor digite um telefone válido com DDD"
        },
        regemail: {
            required: "Por favor digite um e-mail válido",
            email: "Por favor digite um e-mail válido"
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
        $(element).closest('.form-group').append(error).addClass('has-error');
    }
});

function SuccessUsuario() {
    Swal2.close();
    Swal2.fire({
        title: "Sucesso!",
        text: "Usuário atualizado com sucesso.",
        icon: "success",
        type: "success",
        button: "Fechar"
    }).then(() => {
        navigateDashboard(lastPage);
    });
}


$("#regsubmit").click(() => {
    $("#registerform").validate();

    if ($("#registerform").valid()) {

        Swal2.fire({
            title: "Cadastrando...",
            text: "Espere um minutinho...",
            imageUrl: "img/icones/processing.gif",
            icon: "img/icones/processing.gif",
            buttons: false,
            showSpinner: true,
            closeOnClickOutside: false,
            allowOutsideClick: false,
            showConfirmButton: false
        });

        var uid = $("#uid").val();
        var email = $("#regemail").val();
        var nome = $("#regnome").val();
        var cpf = $("#regcpf").val();
        var telefone = $("#regtel").val();

        var arDataUpdate = {
            "ID": uid,
            "EMAIL": email,
            "NOME": nome,
            "CPF": cpf,
            "TELEFONE": telefone
        }

        AtualizarUsuario(arDataUpdate);


    }
});



$("#cancelarAcao").click(() => {
    Swal2.fire({
        title: 'Cancelar Edição?',
        text: "Se você cancelar nenhuma alteração será feita nos dados do usuário.",
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