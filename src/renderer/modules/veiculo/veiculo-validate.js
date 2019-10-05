$(document).ready(function() {
    $("#formVeiculo").validate({
        // Specify validation rules
        rules: {
            PLACA: "required",
            ANO: "required",
            MODELO: "required",
            ORIGEM: "required",
            AQUISICAO: "required",
            POSSUI_GARAGEM: "required",
            KM_VEICULO: "required",
            ULTIMA_MANUTENCAO: "required",
            CAPACIDADE_MAX: "required",
            CAPACIDADE_ATUAL: "required",
            TIPO_TRANSPORTE: {
                required: true,
                minlength: 1
            },
            email: {
                required: true,
                email: true
            },
            phone: {
                required: true,
                digits: true,
                minlength: 10,
                maxlength: 10,
            },
            password: {
                required: true,
                minlength: 5,
            }
        },
        messages: {
            PLACA: {
                required: "Preenchimento  da placa é obrigatório.",
            },
            MODELO: {
                required: "Preenchimento modelo é obrigatório.",
            },
            ANO: {
                required: "Informe o ano do veiculo.",
            },
            TIPO_TRANSPORTE: {
                required: "Informe o tipo de transporte.",
            },
            ORIGEM: {
                required: "Campo Obrigatório.",
            },
            AQUISICAO: {
                required: "Campo Obrigatório.",
            },
            POSSUI_GARAGEM: {
                required: "Informe o tipo de transporte.",
            },
            KM_VEICULO: {
                required: "Informe o tipo de transporte.",
            },
            ULTIMA_MANUTENCAO: {
                required: "Informe o tipo de transporte.",
            },
            CAPACIDADE_MAX: {
                required: "Informe o tipo de transporte.",
            },
            CAPACIDADE_ATUAL: {
                required: "Informe o tipo de transporte.",
            },
            phone: {
                required: "Please enter phone number",
                digits: "Please enter valid phone number",
                minlength: "Phone number field accept only 10 digits",
                maxlength: "Phone number field accept only 10 digits",
            },
            email: {
                required: "Please enter email address",
                email: "Please enter a valid email address.",
            },
        },

    });

    $("#formVeiculo").submit(function(event) {
        event.preventDefault();

        $("#formVeiculo").validate();

        if ($("#formVeiculo").valid()) {

            InsertVeiculoCTRL();
        }
    });

});