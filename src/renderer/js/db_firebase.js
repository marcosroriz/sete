// db_firebase.js
// Este arquivo implementa as funções do banco de dados utilizando o firebase

// Inicializa o firebase
var firebaseDBConfig = {
    apiKey: "AIzaSyDOHCjGDkv-tsIjVhHxOcEt0rzusFJwQxc",
    authDomain: "softwareter.firebaseapp.com",
    databaseURL: "https://softwareter.firebaseio.com",
    projectId: "softwareter",
    storageBucket: "softwareter.appspot.com",
    messagingSenderId: "881352897273"
};
firebase.initializeApp(firebaseDBConfig);

// Configura o firebase para usar cache
firebase.firestore().settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});
firebase.firestore().enablePersistence()

// Nome da coleção raiz que armazena os dados no firebase
const COLECAO_RAIZ = "municipios";

// Função básica que acessa/recupera uma determinada colecao
function dbAcessarDados(nomeColecao) {
    return remotedb.collection(COLECAO_RAIZ)
                   .doc(codCidade)
                   .collection(nomeColecao)
}

// Função que desempacota os documentos do firebase em um vetor de dados
function DesempacotaPromise(snapshotDocumentos) {
    dados = new Array();
    snapshotDocumentos.forEach(documento => dados.push({...{ID: documento.id}, ...documento.data()}))
    return Promise.resolve(dados)
}

// Função que desempacota os documentos do firebase em um dicionário
function DesempacotaComoDicionario(snapshotDocumentos) {
    dados = {}
    snapshotDocumentos.forEach(documento => dados[documento.id] = documento.data())
    return Promise.resolve(dados)
}

// Função que verifica se o banco de dados está sincronizado com o firebase
async function AsyncEstaSincronizado(ultimaAtualizacao) {
    let sync = false;
    let atualizacaoServidor = await dbAcessarDados("status").doc("atualizacao").get();
    if (atualizacaoServidor.exists) {
        sync = ultimaAtualizacao == atualizacaoServidor.data()["LAST_UPDATE"];
    }
    return sync;
}

module.exports = {
    dbFonteDoDado: "cache",

    dbEstaSincronizado: AsyncEstaSincronizado,

    dbObterPerfilUsuario: (uid) => {
        return remotedb.collection("users")
                       .doc(uid)
                       .get({ source: "server" })
                       .then((res) => res.data())
    },

    dbBuscarUltimaVersaoSincronizacao: () => {
        return dbAcessarDados("status").doc("atualizacao")
               .get({ source: "server" })
               .then((res) => res.data())
    },

    dbBuscarTodosDadosPromise: (nomeColecao) => {
        return dbAcessarDados(nomeColecao)
               .get({ source: module.exports.dbFonteDoDado })
               .then((res) => DesempacotaPromise(res));
    },

    dbBuscarDadosEspecificosPromise: (nomeColecao, coluna, valor, operador = "==") => {
        return dbAcessarDados(nomeColecao)
               .where(coluna, operador, valor)
               .get({source: module.exports.dbFonteDoDado})
               .then((res) => DesempacotaPromise(res));
    },

    dbInserirPromise: (nomeColecao, dado, id = "", merge = false) => {
        if (id != "") {
            return dbAcessarDados(nomeColecao)
                   .doc(id)
                   .set(dado, { "merge": merge });
        } else {
            return dbAcessarDados(nomeColecao)
                   .add(dado);
        }
    },

    dbAtualizarPromise: (nomeColecao, dado, id) => {
        return dbAcessarDados(nomeColecao)
               .doc(id)
               .update(dado);
    },

    dbRemoverDadoPorIDPromise: (nomeColecao, coluna, documentoID) => {
        return dbAcessarDados(nomeColecao)
               .doc(documentoID)
               .delete();
    },

    dbRemoverDadoSimplesPromise: (nomeColecao, coluna, id) => {
        return dbAcessarDados(nomeColecao)
               .where(coluna, "==", id)
               .get({source: module.exports.dbFonteDoDado})
               .then((snapshotDocumentos) => {
                   let delPromisseArray = new Array();
                   snapshotDocumentos.forEach(doc => delPromisseArray.push(doc.ref.delete()))

                   return Promise.all(delPromisseArray)
               })
    },

    dbRemoverDadoCompostoPromise: (nomeColecao, c1, id1, c2, id2) => {
        return dbAcessarDados(nomeColecao)
               .where(c1, "==", id1)
               .where(c2, "==", id2)
               .get({source: module.exports.dbFonteDoDado})
               .then((snapshotDocumentos) => {
                    let delPromisseArray = new Array();
                    snapshotDocumentos.forEach(doc => delPromisseArray.push(doc.ref.delete()))

                    return Promise.all(delPromisseArray)
               })
    },

    dbLeftJoinPromise: (colecao1, coluna1, colecao2, coluna2) => {
        if (coluna2 == "" || coluna2 == undefined) coluna2 = coluna1;

        return Promise.all([dbBuscarTodosDadosPromise(colecao1),
                            dbAcessarDados(colecao2).get({source: module.exports.dbFonteDoDado})
                                                    .then((res) => DesempacotaComoDicionario(res))])
        .then((res) => {
            esquerda = res[0]
            direita = res[1]

            for (let i = 0; i < esquerda.length; i++) {
                esquerda[i] = {...esquerda[i], ...direita[esquerda[i][coluna1]]}
            }

            return esquerda;
        })
    }
}
