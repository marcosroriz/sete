function GetMotoristaFromForm() {
    let data = {
        "nome": $("#regnome").val(), // string
        "cpf": String($("#regcpf").val()).replace(/\D/g, ''), // string
        "data_nascimento": $("#regdata").val(), // string
        "sexo": Number($("input[name='modoSexo']:checked").val()), // int       
        "cnh": $("#regcnh").val(), // number
        "tem_cnh_a": $("#cnhA").is(":checked") ? "S" : "N", // str
        "tem_cnh_b": $("#cnhB").is(":checked") ? "S" : "N", // str
        "tem_cnh_c": $("#cnhC").is(":checked") ? "S" : "N", // str
        "tem_cnh_d": $("#cnhD").is(":checked") ? "S" : "N", // str
        "tem_cnh_e": $("#cnhE").is(":checked") ? "S" : "N", // str
        "turno_manha": $("#temHorarioManha").is(":checked") ? "S" : "N", // str
        "turno_tarde": $("#temHorarioTarde").is(":checked") ? "S" : "N", // str
        "turno_noite": $("#temHorarioNoite").is(":checked") ? "S" : "N", // str
    }
 
    // if ($("input[name='vinculo']:checked").length > 0) {
    //     data["vinculo"] = Number($("input[name='vinculo']:checked").val()) // int
    // }

    // if ($("#regsalario").val() != "") data["salario"] = $("#regsalario").val();
    // if ($("#regtelresp").val() != "") data["telefone"] = $("#regtelresp").val();
    // if ($("#regcnhvalidade").val() != "") data["data_validade_cnh"] = $("#regcnhvalidade").val();
    // if ($("#regantecedentes").val() != "") data["ant_criminais"] = $("#regantecedentes").val();

    debugger
    return data;
}

function PopulateMotoristaFromState(estadoMotoristaJSON) {
    $(".pageTitle").html("Atualizar Motorista");
    $("#regnome").val(estadoMotoristaJSON["NOME"]);
    $("#regcpf").val(estadoMotoristaJSON["CPF"]);
    $("#regdata").val(estadoMotoristaJSON["DATA_NASCIMENTO"]);
    $("input[name='modoSexo']").val([estadoMotoristaJSON["SEXO"]]);
    $("#regcnh").val(estadoMotoristaJSON["CNH"]);

    if (estadoMotoristaJSON["DATA_VALIDADE_CNH"]) {
        $("#regcnhvalidade").val(estadoMotoristaJSON["DATA_VALIDADE_CNH"]);
    }

    if (estadoMotoristaJSON["TELEFONE"]) {
        $("#regtelresp").val(estadoMotoristaJSON["TELEFONE"]);
    }


    if (estadoMotoristaJSON["SALARIO"]) {
        $("#regsalario").val(estadoMotoristaJSON["SALARIO"]);
    }

    if (estadoMotoristaJSON["ANT_CRIMINAIS"]) {
        $("#regantecedentes").val(estadoMotoristaJSON["ANT_CRIMINAIS"]);
    }

    if (estadoMotoristaJSON["VINCULO"]) {
        $("input[name='vinculo']").val([estadoMotoristaJSON["VINCULO"]]);
    }

    $("#cnhA").prop("checked", estadoMotoristaJSON["TEM_CNH_A"]);
    $("#cnhB").prop("checked", estadoMotoristaJSON["TEM_CNH_B"]);
    $("#cnhC").prop("checked", estadoMotoristaJSON["TEM_CNH_C"]);
    $("#cnhD").prop("checked", estadoMotoristaJSON["TEM_CNH_D"]);
    $("#cnhE").prop("checked", estadoMotoristaJSON["TEM_CNH_E"]);
    $("#temHorarioManha").prop("checked", estadoMotoristaJSON["TURNO_MANHA"]);
    $("#temHorarioTarde").prop("checked", estadoMotoristaJSON["TURNO_TARDE"]);
    $("#temHorarioNoite").prop("checked", estadoMotoristaJSON["TURNO_NOITE"]);
}


// Transformar linha do DB para JSON
var parseMotoristaDB = function (motoristaRaw) {
    var motoristaJSON = Object.assign({}, motoristaRaw);
    motoristaJSON["ROTAS"] = 0;

    if (!motoristaRaw["DATA_VALIDADE_CNH"]) {
        motoristaJSON["DATA_VALIDADE_CNH_STR"] = "Não informada";
    } else {
        motoristaJSON["DATA_VALIDADE_CNH_STR"] = motoristaRaw["DATA_VALIDADE_CNH"];

    }

    var categorias = new Array();
    if (motoristaRaw["TEM_CNH_A"]) categorias.push("A");
    if (motoristaRaw["TEM_CNH_B"]) categorias.push("B");
    if (motoristaRaw["TEM_CNH_C"]) categorias.push("C");
    if (motoristaRaw["TEM_CNH_D"]) categorias.push("D");
    if (motoristaRaw["TEM_CNH_E"]) categorias.push("E");
    motoristaJSON["CATEGORIAS"] = categorias.join(", ");

    var turno = new Array();
    if (motoristaRaw["TURNO_MANHA"]) turno.push("Manhã");
    if (motoristaRaw["TURNO_TARDE"]) turno.push("Tarde");
    if (motoristaRaw["TURNO_NOITE"]) turno.push("Noite");
    motoristaJSON["TURNOSTR"] = turno.join(", ");

    return motoristaJSON;
};