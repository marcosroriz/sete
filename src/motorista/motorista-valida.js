
function mascara(t, mask){
    var i = t.value.length;
    var saida = mask.substring(1,0);
    var texto = mask.substring(i)
    if (texto.substring(0,1) != saida){
            t.value += texto.substring(0,1);
    }
}

$(".cpfmask").mask('000.000.000-00', { reverse: true });

$("#motoristaForm").validate({
    rules: {
        regnomemot: {
            required: true,
            lettersonly: true
        }
    },
    messages: {
        regnomemot: {
            required: "Por favor digite o nome do motorista.",
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


$("#regsubmit").click(() => {
    $("#motoristaForm").validate();

    if ($("#motoristaForm").valid()) {
        let processingModalWin = swal({
            title: "Processando...",
            text: "Espere um minutinho...",
            icon: "info",
            buttons: false
        });

       
    } else {
        alert("Algum erro no formulário");
    }
});