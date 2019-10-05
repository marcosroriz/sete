$(document).ready(function() {
    $("#formGaragem").validate({
        rules: {
            LATITUDE: "required",
            LONGITUDE: "required",
            NOME: "required",
            CEP: "required",
            ENDERECO: "required"
        },
        messages: {
            LATITUDE: {
                required: "Latitude é obrigatório.",
            },
            LONGITUDE: {
                required: "Longitude é obrigatório.",
            },
            NOME: {
                required: "Nome é obrigatório",
            },
            CEP: {
                required: "CEP Obrigatório."
            },
            ENDERECO: {
                required: "Endereço Obrigatório."
            }
        }

    });


    $("#formGaragem").submit(function(event) {
        event.preventDefault();

        $("#formGaragem").validate();

        if ($("#formGaragem").valid()) {

            InsertCTRL();
        }
    });
});