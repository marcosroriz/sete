function mascara(t, mask) {
    var i = t.value.length;
    var saida = mask.substring(1, 0);
    var texto = mask.substring(i)
    if (texto.substring(0, 1) != saida) {
        t.value += texto.substring(0, 1);
    }
}

$(".cpfmask").mask('000.000.000-00', { reverse: true });

$("#motorista-form").validate({
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

$(document).ready(function() {

    $("#motorista-form").submit(function(e) {
        e.preventDefault();
        $("#motorista-form").validate();

        if ($("#motorista-form").valid()) {
            InsertMotoristaCTRL();
        }

    });

    // Máscaras
    $(".datanasc").mask('00/00/0000');
    $(".telmask").mask(telmaskbehaviour, teloptions);

});;