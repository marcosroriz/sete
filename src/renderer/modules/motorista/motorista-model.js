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
 
    if ($("input[name='vinculo']:checked").length > 0) {
        data["vinculo"] = Number($("input[name='vinculo']:checked").val()) // int
    }

    if ($("#regsalario").val() != "") {
        data["salario"] = strToNumber($("#regsalario").val());
    }

    if ($("#regtelresp").val() != "") {
        data["telefone"] = $("#regtelresp").val();
    }

    if ($("#regcnhvalidade").val() != "") data["data_validade_cnh"] = $("#regcnhvalidade").val();
    if ($("#regantecedentes").val() != "") data["ant_criminais"] = $("#regantecedentes").val();

    return data;
}

function PopulateMotoristaFromState(estadoMotoristaJSON) {
    $(".pageTitle").html("Atualizar Motorista");
    $("#regnome").val(estadoMotoristaJSON["NOME"]);
    $("#regcpf").val(estadoMotoristaJSON["CPF"]);
    $("#regdata").val(estadoMotoristaJSON["DATA_NASCIMENTO"]);
    
    if (!isNaN(estadoMotoristaJSON["SEXO"])) {
        $("input[name='modoSexo']").val([Number(estadoMotoristaJSON["SEXO"])]);
    } else {
        let sexo = 3;
        if (estadoMotoristaJSON["SEXO"] == "M") {
            sexo = 1;
        } else if (estadoMotoristaJSON["SEXO"] == "F") {
            sexo = 2;
        }
        $("input[name='modoSexo']").val([sexo]);
    }
    
    $("#regcnh").val(estadoMotoristaJSON["CNH"]);

    if (estadoMotoristaJSON["DATA_VALIDADE_CNH"]) {
        $("#regcnhvalidade").val(estadoMotoristaJSON["DATA_VALIDADE_CNH"]);
    }

    if (estadoMotoristaJSON["TELEFONE"]) {
        $("#regtelresp").val(estadoMotoristaJSON["TELEFONE"]);
    }


    if (estadoMotoristaJSON["SALARIO"]) {
        $("#regsalario").val(numberToMoney(estadoMotoristaJSON["SALARIO"]));
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

// Transformar linha da API REST para JSON
var parseMotoristaREST = function (motoristaRaw) {
    let motoristaJSON = Object.assign({}, motoristaRaw);
    // Arrumando campos novos para os que já usamos. 
    // Atualmente os campos são em caixa alta (e.g. NOME ao invés de nome)
    // Entretanto, a API está retornando valores em minúsculo
    for (let attr of Object.keys(motoristaJSON)) {
        motoristaJSON[attr.toUpperCase()] = motoristaJSON[attr];
    }

    // Fixa o ID
    motoristaJSON["ID"] = motoristaJSON["cpf"];

    return parseMotoristaDB(motoristaJSON);
};

// Transformar linha do DB para JSON
var parseMotoristaDB = function (motoristaRaw) {
    var motoristaJSON = Object.assign({}, motoristaRaw);
    motoristaJSON["ROTAS"] = 0;

    if (motoristaRaw["DATA_VALIDADE_CNH"] == "" || motoristaRaw["DATA_VALIDADE_CNH"] == null) {
        motoristaJSON["DATA_VALIDADE_CNH_STR"] = "Não informada";
    } else {
        motoristaJSON["DATA_VALIDADE_CNH_STR"] = moment(motoristaRaw["DATA_VALIDADE_CNH"], "YYYY-MM-DD").format("DD/MM/YYYY");
    }

    let propParaTransformar = ["TEM_CNH_A", "TEM_CNH_B", "TEM_CNH_C", "TEM_CNH_D", "TEM_CNH_E", 
                               "TURNO_MANHA", "TURNO_TARDE", "TURNO_NOITE"];

    for (let prop of propParaTransformar) {
        if (motoristaJSON[prop] == "S") {
            motoristaJSON[prop.toUpperCase()] = true;
        } else {
            motoristaJSON[prop.toUpperCase()] = false;
        }
    }

    motoristaJSON["SALARIO"] = Number(motoristaJSON["SALARIO"]);

    var categorias = new Array();
    if (motoristaJSON["TEM_CNH_A"]) categorias.push("A");
    if (motoristaJSON["TEM_CNH_B"]) categorias.push("B");
    if (motoristaJSON["TEM_CNH_C"]) categorias.push("C");
    if (motoristaJSON["TEM_CNH_D"]) categorias.push("D");
    if (motoristaJSON["TEM_CNH_E"]) categorias.push("E");
    motoristaJSON["CATEGORIAS"] = categorias.join(", ");

    var turno = new Array();
    if (motoristaJSON["TURNO_MANHA"]) turno.push("Manhã");
    if (motoristaJSON["TURNO_TARDE"]) turno.push("Tarde");
    if (motoristaJSON["TURNO_NOITE"]) turno.push("Noite");
    motoristaJSON["TURNOSTR"] = turno.join(", ");

    return motoristaJSON;
};