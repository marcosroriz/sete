// Popula usuario na tela de cadastro para alteração
function popularCamposUsuario(estadoUsuario) {
    $("#regnome").val(estadoUsuario["nome"]);
    $("#regcpf").val(estadoUsuario["cpf"]);
    $("#regtel").val(estadoUsuario["telefone"]);
    $("#regemail").val(estadoUsuario["email"]);
    $("#regpapel").val(estadoUsuario["nivel_permissao"]);
}

// Transformar linha do DB para JSON
var parseUsuarioDB = function (usuarioRaw) {
    var usuarioJSON = Object.assign({}, usuarioRaw);
    return usuarioJSON;
};

// Função que recupera todo os usuários cadastrados (independente se estão ou não ativos neste município)
function dbBuscarTodosUsuarios() {
    return remotedb.collection("users")
                   .get({source: "server"})
}

// Função que recupera todos os usuários habilitados naquele município
function dbBuscarUsuariosDoMunicipioPromise() {
    return remotedb.collection("config")
                   .doc(codCidade)
                   .get({source: "server"})
}

// Função que verifica se existe algum usuário com um dado CPF
function dbBuscarUsuarioPorCPFPromise(cpf) {
    return remotedb.collection("users")
                   .where("CPF", "==", cpf)
                   .get({source: "server"})
}

// Função que insere um usuário no Firebase
function dbInsereUsuarioFirebasePromise(uid, userdata) {
    return remotedb.collection("users").doc(uid).set(userdata)
}

// Função que atualiza um usuário no Firebase
function dbAtualizaUsuarioFirebasePromise(uid, userdata) {
    return remotedb.collection("users").doc(uid).update(userdata)
}

// Função que habilita um usuário na coleção de configuração
function dbHabilitaUsuarioConfigPromise(uid, papel) {
    switch (parseInt(papel)) {
        case 0: // admin
            return remotedb.collection("config").doc(codCidade).update({
                "admin": firebase.firestore.FieldValue.arrayUnion(uid),
                "users": firebase.firestore.FieldValue.arrayUnion(uid)
            })
        case 1: //
            return remotedb.collection("config").doc(codCidade).update({
                "users": firebase.firestore.FieldValue.arrayUnion(uid)
            })
        case 2:
            return remotedb.collection("config").doc(codCidade).update({
                "readers": firebase.firestore.FieldValue.arrayUnion(uid)
            })
        default:
            return remotedb.collection("config").doc(codCidade).update({
                "users": firebase.firestore.FieldValue.arrayUnion(uid)
            })

    }
}

function dbRemoverUsuarioPromise(uid) {
    return remotedb.collection("users").doc(uid).delete()
}

function dbDesabilitaUsuarioConfigPromise(uid, papel) {
    switch (parseInt(papel)) {
        case 0: // admin
            return remotedb.collection("config").doc(codCidade).update({
                "admin": firebase.firestore.FieldValue.arrayRemove(uid),
                "users": firebase.firestore.FieldValue.arrayRemove(uid)
            })
        case 1: //
            return remotedb.collection("config").doc(codCidade).update({
                "users": firebase.firestore.FieldValue.arrayRemove(uid)
            })
        case 2:
            return remotedb.collection("config").doc(codCidade).update({
                "readers": firebase.firestore.FieldValue.arrayRemove(uid)
            })
        default:
            return remotedb.collection("config").doc(codCidade).update({
                "users": firebase.firestore.FieldValue.arrayRemove(uid)
            })
    }
}

function dbDesabilitaUsuarioEmTudoConfigPromise(uid) {
    return remotedb.collection("config").doc(codCidade).update({
        "admin": firebase.firestore.FieldValue.arrayRemove(uid),
        "users": firebase.firestore.FieldValue.arrayRemove(uid),
        "readers": firebase.firestore.FieldValue.arrayRemove(uid)
    })
}


function RemoverUsuarioLocalPromise(uid) {
    return knex("Usuarios")
           .where("ID", uid)
           .del()
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