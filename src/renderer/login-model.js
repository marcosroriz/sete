function UsuarioExiste(uid) {
    return knex("Usuarios").select().where("ID", uid);
}

function InserirUsuario(data) {
    return knex("Usuarios").insert(data);
}

function RecuperarUsuario(uid) {
    return knex("Usuarios").select().where("ID", uid);
}

// Indica que o script terminou seu carregamento
window.loadedLoginModel = true;
