function GetFornecedorFromForm() {
    return {
        "LOC_LATITUDE": $("#reglat").val(), // real
        "LOC_LONGITUDE": $("#reglon").val(), // real
        "LOC_ENDERECO": $("#regend").val(), // string
        "LOC_CEP": $("#regcep").val(), // string
        "TELEFONE": $("#regtel").val(), // string
        "NOME": $("#regnome").val(), // string
        "CNPJ": $("#regcnpj").val(), // number
        "RAMO_MECANICA": $("#temMecanica").is(":checked"), // bool
        "RAMO_COMBUSTIVEL": $("#temCombustivel").is(":checked"), // bool
        "RAMO_SEGURO": $("#temSeguro").is(":checked"), // bool
    }
}

function PopulateFornecedorFromState(estadoFornecedorJSON) {
    $(".pageTitle").html("Atualizar Fornecedor");
    $("#regnome").val(estadoFornecedorJSON["NOME"]);
    $("#regcnpj").val(estadoFornecedorJSON["CNPJ"]);
    $("#regtel").val(estadoFornecedorJSON["TELEFONE"]);

    $("#temMecanica").prop("checked", estadoFornecedorJSON["RAMO_MECANICA"]);
    $("#temCombustivel").prop("checked", estadoFornecedorJSON["RAMO_COMBUSTIVEL"]);
    $("#temSeguro").prop("checked", estadoFornecedorJSON["RAMO_SEGURO"]);

    $("#reglat").val(estadoFornecedorJSON["LOC_LATITUDE"]);
    $("#reglon").val(estadoFornecedorJSON["LOC_LONGITUDE"]);
    $("#regend").val(estadoFornecedorJSON["LOC_ENDERECO"]);
    $("#regcep").val(estadoFornecedorJSON["LOC_CEP"]);
}


// Transformar linha do DB para JSON
var parseFornecedorDB = function (fornecedorRaw) {
    var fornecedorJSON = Object.assign({}, fornecedorRaw);

    var servicos = new Array();
    if (fornecedorRaw["RAMO_MECANICA"]) servicos.push("Mecânica");
    if (fornecedorRaw["RAMO_COMBUSTIVEL"]) servicos.push("Combustível");
    if (fornecedorRaw["RAMO_SEGURO"]) servicos.push("Seguros");
    fornecedorJSON["SERVICOSTR"] = servicos.join(", ");

    return fornecedorJSON;
};