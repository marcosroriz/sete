$(document).ready(function() {
    $("formCadastroManutencao").validate({
        // Specify validation rules
        rules: {
            descricao: "required",
            data_prevista: "required"
        },
        messages: {
            descricao: {
                required: "Preenchimento  da descrição é obrigatório.",
            },
            data_prevista: {
                required: "Preenchimento data presquisa é obrigatório.",
            }
        },

    });

    $("#formCadastroManutencao").submit(function(event) {
        event.preventDefault();

        $("#formCadastroManutencao").validate();

        if ($("#formCadastroManutencao").valid()) {

            InsertPrevisaoManutencaoCTRL();
        }
    });

});