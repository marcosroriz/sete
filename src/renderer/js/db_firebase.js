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

// Configura firebase para usar cache
firebase.firestore().settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});
firebase.firestore().enablePersistence()

// Nome da coleção raiz que armazena os dados no firebase
const COLECAO_RAIZ = "municipios";

// Função que desempacota os documentos do firebase em um vetor de dados
function DesempacotaPromise(promessaAlvo) {
    return promessaAlvo.then(snapshotDocumentos => {
        dados = new Array();
        snapshotDocumentos.forEach(documento => dados.push(documento.data()))
        return Promise.resolve(dados)
    }).catch(err => Promise.reject(err))
}

module.exports = {
    FonteDoDado: "cache",

    BuscarTodosDadosPromise: (nomeColecao) => {
        console.log(module.exports.FonteDoDado);
        return DesempacotaPromise(remotedb.collection(COLECAO_RAIZ)
                                          .doc(codCidade)
                                          .collection(nomeColecao)
                                          .get({ source: module.exports.FonteDoDado }));
    },

    BuscarDadosEspecificosPromise: (nomeColecao, coluna, valor, operador = "==") => {
        return DesempacotaPromise(remotedb.collection(COLECAO_RAIZ)
                                          .doc(codCidade)
                                          .collection(nomeColecao)
                                          .where(coluna, operador, valor)
                                          .get({source: module.exports.FonteDoDado}));
    },

    InserirPromise: (nomeColecao, dado, id = "", merge = false) => {
        if (id != "") {
            return remotedb.collection(COLECAO_RAIZ)
                           .doc(codCidade)
                           .collection(nomeColecao)
                           .doc(id)
                           .set(dado, { "merge": merge });
        } else {
            return remotedb.collection(COLECAO_RAIZ)
                           .doc(codCidade)
                           .collection(nomeColecao)
                           .add(dado);
        }
    }
}
