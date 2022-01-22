function GetMonitorFromForm() {
    let data = {
        "nome": $("#regnome").val(), // string
        "cpf": String($("#regcpf").val()).replace(/\D/g, ''), // string
        "data_nascimento": $("#regdata").val(), // string
        "sexo": Number($("input[name='modoSexo']:checked").val()), // int       
        "turno_manha": $("#temHorarioManha").is(":checked") ? "S" : "N", // str
        "turno_tarde": $("#temHorarioTarde").is(":checked") ? "S" : "N", // str
        "turno_noite": $("#temHorarioNoite").is(":checked") ? "S" : "N", // str
    }

    if ($("input[name='vinculo']:checked").length > 0) {
        data["vinculo"] = Number($("input[name='vinculo']:checked").val()) // int
    }

    if ($("#regsalario").val() != "") {
        data["salario"] = strToNumber(String($("#regsalario").val()))
    }

    return data;
}

function PopulateMonitorFromState(estadoMonitorJSON) {
    $(".pageTitle").html("Atualizar Monitor");
    $("#regnome").val(estadoMonitorJSON["NOME"]);
    $("#regcpf").val(estadoMonitorJSON["CPF"]);
    $("#regdata").val(estadoMonitorJSON["DATA_NASCIMENTO"]);
    $("input[name='modoSexo']").val([estadoMonitorJSON["SEXO"]]);

    if (estadoMonitorJSON["TELEFONE"]) {
        $("#regtelresp").val(estadoMonitorJSON["TELEFONE"]);
    }

    if (estadoMonitorJSON["SALARIO"]) {
        $("#regsalario").val(numberToMoney(estadoMonitorJSON["SALARIO"]));
    }

    if (estadoMonitorJSON["VINCULO"]) {
        $("input[name='vinculo']").val([estadoMonitorJSON["VINCULO"]]);
    }

    $("#temHorarioManha").prop("checked", estadoMonitorJSON["TURNO_MANHA"]);
    $("#temHorarioTarde").prop("checked", estadoMonitorJSON["TURNO_TARDE"]);
    $("#temHorarioNoite").prop("checked", estadoMonitorJSON["TURNO_NOITE"]);
}

// Workarounds
async function getRotasDoMonitor(cpf) {
    let rotas = [];
    try {
        rotas = await restImpl.dbGETColecao(DB_TABLE_MONITOR, `/${cpf}/rota`);
    } catch (error) {
        if (error.response.data?.data) {
            rotas = error.response.data?.data;
        }
    }

    return rotas;
}

async function removeTodasAsRotasDoMonitor(cpf) {
    let rotas = [];
    try {
        rotas = await restImpl.dbGETEntidade(DB_TABLE_MONITOR, `/${cpf}/rota`);
    } catch (error) {
        if (error.response.data?.data) {
            rotas = error.response.data?.data;
        }
    } finally {
        for (let rota of rotas) {
            await restImpl.dbDELETEComParam(DB_TABLE_MONITOR, `/${cpf}/rota`, { "id_rota": rota.id_rota });
        }
    }
}


// Transformar linha da API REST para JSON
var parseMonitorREST = function (motoristaRaw) {
    let monitorJSON = Object.assign({}, motoristaRaw);
    // Arrumando campos novos para os que já usamos. 
    // Atualmente os campos são em caixa alta (e.g. NOME ao invés de nome)
    // Entretanto, a API está retornando valores em minúsculo
    for (let attr of Object.keys(monitorJSON)) {
        monitorJSON[attr.toUpperCase()] = monitorJSON[attr];
    }

    // Fixa o ID
    monitorJSON["ID"] = monitorJSON["cpf"];

    return parseMonitorRESTDB(monitorJSON);
};

// Transformar linha do DB para JSON
var parseMonitorRESTDB = function (monitorRaw) {
    var monitorJSON = Object.assign({}, monitorRaw);
    monitorJSON["ROTAS"] = 0;

    let propParaTransformar = ["TURNO_MANHA", "TURNO_TARDE", "TURNO_NOITE"];

    for (let prop of propParaTransformar) {
        if (monitorJSON[prop] == "S") {
            monitorJSON[prop.toUpperCase()] = true;
        } else {
            monitorJSON[prop.toUpperCase()] = false;
        }
    }

    monitorJSON["SALARIO"] = Number(monitorJSON["salario"]);

    var turno = new Array();
    if (monitorJSON["TURNO_MANHA"]) turno.push("Manhã");
    if (monitorJSON["TURNO_TARDE"]) turno.push("Tarde");
    if (monitorJSON["TURNO_NOITE"]) turno.push("Noite");
    monitorJSON["TURNOSTR"] = turno.join(", ");

    switch (Number(monitorJSON["VINCULO"])) {
        case 1:
            monitorJSON["VINCULOSTR"] = "Servidor Efetivo";
            break;
        case 2:
            monitorJSON["VINCULOSTR"] = "Servidor Comissionado";
            break;
        case 3:
            monitorJSON["VINCULOSTR"] = "Terceirizado";
            break;
        default:
            monitorJSON["VINCULOSTR"] = "Outro";
    }
    return monitorJSON;
};