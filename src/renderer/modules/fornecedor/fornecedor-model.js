function GetFornecedorFromForm() {
    let data = {
        "nome": $("#regnome").val(), // string
        "cnpj": String($("#regcnpj").val()).replace(/\D/g, ''), // string
        "ramo_mecanica": $("#temMecanica").is(":checked") ? "S" : "N", // str
        "ramo_combustivel": $("#temCombustivel").is(":checked") ? "S" : "N", // str
        "ramo_seguro": $("#temSeguro").is(":checked") ? "S" : "N", // str
    }

    if ($("#regtel").val() != "") { data["telefone"] = $("#regtel").val(); }
    if ($("#reglat").val()) data["loc_latitude"] = $("#reglat").val();
    if ($("#reglon").val()) data["loc_longitude"] = $("#reglon").val();
    if ($("#regend").val()) data["loc_endereco"] = $("#regend").val();
    if ($("#regcep").val()) data["loc_cep"] = $("#regcep").val();

    return data;
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


// Transformar linha da API REST para JSON
var parseFornecedorREST = function (fornecedorRaw) {
    let fornecedorJSON = Object.assign({}, fornecedorRaw);
    // Arrumando campos novos para os que já usamos. 
    // Atualmente os campos são em caixa alta (e.g. NOME ao invés de nome)
    // Entretanto, a API está retornando valores em minúsculo
    for (let attr of Object.keys(fornecedorJSON)) {
        fornecedorJSON[attr.toUpperCase()] = fornecedorJSON[attr];
    }

    // Fixa o ID
    fornecedorJSON["ID"] = fornecedorJSON["id_fornecedor"];

    return parseFornecedorDB(fornecedorJSON);
};

// Transformar linha do DB para JSON
var parseFornecedorDB = function (fornecedorRaw) {
    var fornecedorJSON = Object.assign({}, fornecedorRaw);

    let propParaTransformar = ["RAMO_MECANICA", "RAMO_COMBUSTIVEL", "RAMO_SEGURO"];

    for (let prop of propParaTransformar) {
        if (fornecedorJSON[prop] == "S") {
            fornecedorJSON[prop.toUpperCase()] = true;
        } else {
            fornecedorJSON[prop.toUpperCase()] = false;
        }
    }


    var servicos = new Array();
    if (fornecedorRaw["RAMO_MECANICA"]) servicos.push("Mecânica");
    if (fornecedorRaw["RAMO_COMBUSTIVEL"]) servicos.push("Combustível");
    if (fornecedorRaw["RAMO_SEGURO"]) servicos.push("Seguros");
    fornecedorJSON["SERVICOSTR"] = servicos.join(", ");

    return fornecedorJSON;
};