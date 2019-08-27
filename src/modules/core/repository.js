function GetAllData(table) {
    return knex.select('*').from(table);
}

function GetData(table, column, id) {
    return knex.select('*').where(column, '=', id).from(table);
}

function Inserir(table, data) {
    const _data = [data];
    knex(table).insert(_data).then(() => { SuccessData(table); })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}

function Atualizar(table, column, data, id) {
    knex(table)
        .where(column, '=', id)
        .update(data).then(() => { SuccessData(table); })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}

function Delete(table, column, id, row) {
    knex(table)
        .where(column, '=', id)
        .del().then(() => {
            DeleteRow(row);
        })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}

function DeleteData(table, data) {
    knex(table)
        .where(data)
        .del().then(() => {
            SuccessData(table);
        })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}