$(document).ready(function() {
    $("#formRota").validate({
        rules: {
            nome: "required",
            quilometragem: "required",
            funcionamento: "required",
            hora_inicio: "required",
            hora_retorno: "required",
            motorista_id: "required",
            data_criacao: "required",
            garagem_id_partida: "required",
            garagem_id_terminio: "required"
        },
        messages: {
            nome: { required: "Nome é obrigatório." },
            quilometragem: { required: "Quilometragem é obrigatório." },
            funcionamento: { required: "Funcionamento é obrigatório." },
            hora_inicio: { required: "Hora de inicio é obrigatório." },
            hora_retorno: { required: "Hora de retorno é obrigatório." },
            data_criacao: { required: "Data de criação é obrigatório." },
            motorista_id: { required: "Motorista é obrigatório." },
            garagem_id_partida: { required: "Garagem partida é obrigatório." },
            garagem_id_terminio: { required: "Garagem é obrigatório." }
        }

    });


    $("#formRota").submit(function(event) {
        event.preventDefault();
        $("#formRota").validate();
        if ($("#formRota").valid())
            InsertCTRL();
    });
});