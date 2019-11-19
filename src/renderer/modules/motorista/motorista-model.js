function GetMotoristaFromForm() {
    return {
        "NOME": $("#regnome").val(), // string
        "CPF": $("#regcpf").val(), // number
        "DATA_NASCIMENTO": $("#regdata").val(), // string
        "TELEFONE": $("#regtelresp").val(), // string
        "SEXO": $("input[name='modoSexo']:checked").val(), // int
        "ANT_CRIMINAIS": $("#regantecedentes").val(), // int

        "CNH": $("#regcnh").val(), // number
        "TEM_CNH_A": $("#cnhA").is(":checked"), // bool
        "TEM_CNH_B": $("#cnhB").is(":checked"), // bool
        "TEM_CNH_C": $("#cnhC").is(":checked"), // bool
        "TEM_CNH_D": $("#cnhD").is(":checked"), // bool
        "TEM_CNH_E": $("#cnhE").is(":checked"), // bool
        "TURNO_MANHA": $("#temHorarioManha").is(":checked"), // bool
        "TURNO_TARDE": $("#temHorarioTarde").is(":checked"), // bool
        "TURNO_NOITE": $("#temHorarioNoite").is(":checked"), // bool
    }
}

function PopulateMotoristaFromState(estadoMotoristaJSON) {
    $(".pageTitle").html("Atualizar Motorista");
    $("#regnome").val(estadoMotoristaJSON["NOME"]);
    $("#regcpf").val(estadoMotoristaJSON["CPF"]);
    $("#regdata").val(estadoMotoristaJSON["DATA_NASCIMENTO"]);
    $("#regtelresp").val(estadoMotoristaJSON["TELEFONE"]);
    $("input[name='modoSexo']").val([estadoMotoristaJSON["SEXO"]]);
    $("#regantecedentes").val(estadoMotoristaJSON["ANT_CRIMINAIS"]);

    $("#regcnh").val(estadoMotoristaJSON["CNH"]);
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