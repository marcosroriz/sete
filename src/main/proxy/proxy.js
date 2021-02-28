const knex = require("knex");

class Proxy {
    constructor(sqliteDB) {
        this.sqliteDB = sqliteDB;
    }


    async obterConfiguracao() {

        var resp = await this.sqliteDB.column('is_usa_proxy', 'servidor', 'porta').select().from('config_proxy').where("parametro", 'proxy');
        return resp;
        // let sqlProxy = "SELECT * FROM config_proxy WHERE parametro = '?'";
    }


}


module.exports = Proxy;