$(document).ready(function() {
    $("#formServidor").validate({
        // Specify validation rules
        rules: {
            LATITUDE: "required",
            LONGITUDE: "required",
            ENDERECO: "required",
            CEP: "required",
            NOME: "required",
            DATA_NASCIMENTO: "required",
            SEXO: "required",
            TELEFONE: "required",
            TURNO: "required"
        },
        messages: {
            LATITUDE: {
                required: "Latitude é obrigatório.",
            },
            LONGITUDE: {
                required: "Longitude é obrigatório.",
            },
            ENDERECO: {
                required: "Endereço é obrigatório.",
            },
            CEP: {
                required: "CEP Obrigatório.",
            },
            NOME: {
                required: "Nome é obrigatório",
            },
            DATA_NASCIMENTO: {
                required: "Data de nascimento é obrigatório",
            },
            SEXO: {
                required: "Informe o sexo.",
            },
            TELEFONE: {
                required: "Informe o telefone.",
            },
            TURNO: {
                required: "Informe o turno.",
            }
        }

    });


    $("#formServidor").submit(function(event) {
        event.preventDefault();

        $("#formServidor").validate();

        if ($("#formServidor").valid()) {

            InsertServidorCTRL();
        }
    });
});