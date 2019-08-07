function GetRotaMotoristaForm() {
    return {
        "id": _rota.id, //int primarykey
        "nome_rota": $("#rota_nome").val(), //string
        "motorista_id": $("#rota_motorista").val(), //int
        "escola_id": $("#rota_escola").val(), //int
        "km": $("#rota_km").val(), //int
    };
}

function ObterDados(tabela) {
    return knex.select('*').from(tabela);
}

function ObterDadosPorCondicao(tabela, field, value) {
    return knex.select('*').from(tabela).where(field, '=', value);
}

function InserirRotaMotorista(rota) {
    if (rota.id > 0)
        AtualizarMotorista(rota);
    else {
        rota.id = undefined;
        const rotas = [rota];
        knex('RotaMotorista').insert(rotas).then((d) => {
                InserirRotaAlunos(d[0]);
            })
            .catch((err) => { console.log(err); throw err })
            .finally(() => {});
    }
}

function InserirRotaAlunos(id_rota) {
    var rota_alunos = [];
    for (let i = 0; i < _alunos.length; i++) {
        var rota_aluno = {
            "id": undefined,
            "rota_id": id_rota,
            "aluno_id": _alunos[i]
        };
        rota_alunos.push(rota_aluno);
    }
    if (rota_alunos.length > 0)
        knex('RelacaoRotaAluno').insert(rota_alunos).then(() => {})
        .catch((err) => { console.log(err); throw err })
        .finally(() => {
            SuccessRotaMotorista();
        });
    else
        SuccessRotaMotorista();
}

function AtualizarMotorista(motorista) {
    knex('RotaMotorista')
        .where('id', '=', motorista.ID_MOTORISTA)
        .update(motorista).then(() => { SuccessMotorista(); })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}

function DeleteRotaMotorista(row, id) {
    knex('RotaMotorista')
        .where('id', '=', id)
        .del().then(() => {
            DeleteRelacaoRotaAluno(id);
            DeleteRow(row);
        })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}

function DeleteRelacaoRotaAluno(id) {
    knex('RelacaoRotaAluno')
        .where('rota_id', '=', id)
        .del().then(() => {})
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}