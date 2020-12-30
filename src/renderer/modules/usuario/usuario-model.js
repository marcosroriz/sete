function GetAlunoFromForm() {
    return {
        "LOC_LATITUDE": $("#reglat").val(), // real
        "LOC_LONGITUDE": $("#reglon").val(), // real
        "LOC_ENDERECO": $("#regend").val(), // string
        "LOC_CEP": $("#regcep").val(), // string
        "MEC_TP_LOCALIZACAO": $("input[name='areaUrbana']:checked").val(), // int
        "DA_PORTEIRA": $("#temPorteira").is(":checked"), // bool
        "DA_MATABURRO": $("#temMataBurro").is(":checked"), // bool
        "DA_COLCHETE": $("#temColchete").is(":checked"), // bool
        "DA_ATOLEIRO": $("#temAtoleiro").is(":checked"), // bool
        "DA_PONTERUSTICA": $("#temPonte").is(":checked"), // bool

        "NOME": $("#regnome").val(), // string
        "CPF": $("#regcpf").val(), // number
        "DATA_NASCIMENTO": $("#regdata").val(), // string
        "NOME_RESPONSAVEL": $("#regnomeresp").val(), // string
        "TELEFONE_RESPONSAVEL": $("#regtelresp").val(), // string
        "GRAU_RESPONSAVEL": $("#listareggrauresp").val(),
        "SEXO": $("input[name='modoSexo']:checked").val(), // int
        "COR": $("input[name='corAluno']:checked").val(), // int
        "DEF_CAMINHAR": $("#temDeCaminhar").is(":checked"), // bool
        "DEF_OUVIR": $("#temDeOuvir").is(":checked"), // bool
        "DEF_ENXERGAR": $("#temDeEnxergar").is(":checked"), // bool
        "DEF_MENTAL": $("#temDefMental").is(":checked"), // bool

        "TURNO": $("input[name='turnoAluno']:checked").val(), // int
        "NIVEL": $("input[name='nivelAluno']:checked").val(), // int
    };
}

function PopulateAlunoFromState(estadoAlunoJSON) {
    $(".pageTitle").html("Atualizar Aluno");
    $("#reglat").val(estadoAlunoJSON["LOC_LATITUDE"]);
    $("#reglon").val(estadoAlunoJSON["LOC_LONGITUDE"]);
    $("#regend").val(estadoAlunoJSON["LOC_ENDERECO"]);
    $("#regcep").val(estadoAlunoJSON["LOC_CEP"]);

    $("input[name='areaUrbana']").filter(`[value="${estadoAlunoJSON["MEC_TP_LOCALIZACAO"]}"]`).prop("checked", true);
    $("#temPorteira").prop("checked", estadoAlunoJSON["DA_PORTEIRA"]);
    $("#temMataBurro").prop("checked", estadoAlunoJSON["DA_MATABURRO"]);
    $("#temColchete").prop("checked", estadoAlunoJSON["DA_COLCHETE"]);
    $("#temAtoleiro").prop("checked", estadoAlunoJSON["DA_ATOLEIRO"]);
    $("#temPonte").prop("checked", estadoAlunoJSON["DA_PONTERUSTICA"]);

    $("#regnome").val(estadoAlunoJSON["NOME"]);
    $("#regcpf").val(estadoAlunoJSON["CPF"]);
    $("#regdata").val(estadoAlunoJSON["DATA_NASCIMENTO"]);
    $("#regnomeresp").val(estadoAlunoJSON["NOME_RESPONSAVEL"]);
    $("#regtelresp").val(estadoAlunoJSON["TELEFONE_RESPONSAVEL"]);
    $("#listareggrauresp").val(estadoAlunoJSON["GRAU_RESPONSAVEL"]);
    $("input[name='modoSexo']").val([estadoAlunoJSON["SEXO"]]);
    $("input[name='corAluno']").val([estadoAlunoJSON["COR"]]);
    $("#temDeCaminhar").prop("checked", estadoAlunoJSON["DEF_CAMINHAR"]);
    $("#temDeOuvir").prop("checked", estadoAlunoJSON["DEF_OUVIR"]);
    $("#temDeEnxergar").prop("checked", estadoAlunoJSON["DEF_ENXERGAR"]);
    $("#temDefMental").prop("checked", estadoAlunoJSON["DEF_MENTAL"]);

    $("input[name='turnoAluno']").val([estadoAlunoJSON["TURNO"]]);
    $("input[name='nivelAluno']").val([estadoAlunoJSON["NIVEL"]]);
    $("#listaescola").val(estadoAlunoJSON["ID_ESCOLA"]);
}

// Transformar linha do DB para JSON
var parseUsuarioDB = function (usuarioRaw) {
    var usuarioJSON = Object.assign({}, usuarioRaw);
    return usuarioJSON;
};

/*function InserirUsuarioPromise(alunoJSON) {
    return knex("Usuarios").insert(alunoJSON);
}*/

function BuscarTodosUsuariosPromise() {
    return knex("Usuarios").select()
}

function BuscarTodosUsuarios(callbackFn) {
    return BuscarTodosUsuariosPromise()
        .then((res) => {
            callbackFn(false, res);
        })
        .catch((err) => {
            callbackFn(err);
        });
}

function RemoverUsuario(idUsuario, callbackFn) {
    knex("Usuarios")
        .where("ID", idUsuario)
        .del()
        .then((res) => {
            callbackFn(false, res);
        })
        .catch((err) => {
            callbackFn(err);
        })
}

function AtualizarUsuarioPromise(idUsuario, usuarioJSON) {
    return knex("Usuarios")
        .where('ID', '=', idUsuario)
        .update(usuarioJSON)
}


function ObterUsuarios() {
    return knex.select('*').from('Usuarios');
}

function UsuarioExiste(uid) {
    return knex("Usuarios").select().where("ID", uid);
}

function UsuarioExistePorCPF(CPF) {
    return knex("Usuarios").select().where("CPF", CPF);
}

function InserirUsuario(data) {
    return knex("Usuarios").insert(data);
}

function RecuperarUsuario(uid) {
    return knex("Usuarios").select().where("ID", uid);
}

function AtualizarUsuario(usuario) {
    knex('Usuarios')
        .where('ID', '=', usuario.ID)
        .update(usuario).then(() => { SuccessUsuario(); })
        .catch((err) => { console.log(err); throw err })
        .finally(() => { });
}

function DeleteUsuario(row, id) {
    knex('Usuarios')
        .where('ID', '=', id)
        .del().then(() => { DeleteRow(row); })
        .catch((err) => { console.log(err); throw err })
        .finally(() => { });
}