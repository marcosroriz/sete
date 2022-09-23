function GetNormaFromForm() {
    let payload = {
        id_tipo: Number($("#tipoNorma").val()),
        titulo: $("#titulo").val(),
        tipo_veiculo: Number($("#tipoModo").val()),
        id_assunto: $("#tipoAssunto").val().map(a => Number(a)),
        data_norma: moment($("#regdata").val()).format("DD/MM/YYYY")
    }

    let outroTipo = Number($("#tipoNorma").val()) == 8 ? true : false;
    let outroAssunto = $("#tipoAssunto").val().includes("14");

    if (outroTipo) { payload.outro_tipo = $("#outroTipoText").val() }
    if (outroAssunto) { payload.outro_assunto = $("#outroAssuntoText").val() }

    return payload;
}


function PopulateNormaFromForm(estadoNormaJSON) {
    $(".pageTitle").html("Atualizar Norma");
    $("#titulo").val(estadoNormaJSON.titulo);
    $("#regdata").val(moment(estadoNorma.data_norma).format("yyyy-MM-DD"));
    $("#tipoNorma").val(estadoNormaJSON.id_tipo);
    $("#tipoNorma").trigger("change");
    
    if (estadoNormaJSON.id_tipo == 8) {
        $("#outroTipoText").val(estadoNormaJSON.outro_tipo);
    }

    $("#tipoAssunto").selectpicker('val', estadoNorma.assuntos.map(a => a.id_assunto));
    $("#tipoAssunto").trigger("change");
    if (estadoNorma.assuntos.map(a => a.id_assunto).includes(14)) {
        let outrosAssuntos = estadoNorma.assuntos.map(a => a.outro_assunto).filter(e => e != null);
        if (outrosAssuntos.length) {
            $("#outroAssuntoText").val(outrosAssuntos[0]);
        }
    }

    $("#tipoModo").val(estadoNormaJSON.tipo_veiculo);
}
// Transformar linha da API REST para JSON
var parseNormaREST = function (normaRaw) {
    let normaJSON = Object.assign({}, normaRaw);
    // Arrumando campos novos para os que já usamos. 
    // Atualmente os campos são em caixa alta (e.g. NOME ao invés de nome)
    // Entretanto, a API está retornando valores em minúsculo
    for (let attr of Object.keys(normaJSON)) {
        normaJSON[attr.toUpperCase()] = normaJSON[attr];
    }

    return normaJSON;
};