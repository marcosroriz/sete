// db_rest.js
// Este arquivo implementa as funções do banco de dados utilizando a API rest

// Inicializa a API
var BASE_URL = "https://sete.transportesufg.eng.br";

var restAPI = axios.create({
    baseURL: BASE_URL,
    headers: { 'Authorization': userconfig.get("TOKEN") }
});

// Refresh do token
restAPI.interceptors.response.use((response) => {
    return response
}, async function (error) {
    const originalRequest = error.config;

    if (error.response.status === 403 && !originalRequest._retry) {
        originalRequest._retry = true;
        const username = userconfig.get("EMAIL");
        const userpass = md5(userconfig.get("PASSWORD"));
        const resp = await axios.post(BASE_URL + "/authenticator/sete", {
            usuario: username,
            senha: userpass
        });
        userconfig.set("TOKEN", resp.data.access_token.access_token)
        restAPI.defaults.headers.Authorization = resp.data.access_token.access_token;
        return restAPI(originalRequest);
    }
    return Promise.reject(error);
});

// Função que desempacota os documentos da API em um vetor de dados
function DesempacotaPromise(snapshotDocumentos) {
    dados = snapshotDocumentos.data.data;
    return Promise.resolve(dados);
}

// Função que desempacota os documentos do firebase em um vetor de dados

module.exports = {
    restAPI,
    dbFonteDoDado: "cache",

    dbGETRaiz: (nomeColecao, path = "") => {
        let caminho = nomeColecao + path;
        if (DEBUG) { console.debug("GET RAIZ REQUEST ", caminho) }

        return restAPI.get(caminho)
            .then((res) => {
                if (DEBUG) { console.debug("GET RAIZ REPLY", caminho, res) }
                return Promise.resolve(res)
            });
    },

    dbGETColecaoRaiz: (nomeColecao, path = "") => {
        let caminho = nomeColecao + path;
        if (DEBUG) { console.debug("GET COLECAO REQUEST ", caminho) }

        return restAPI.get(caminho)
            .then((res) => {
                if (DEBUG) { console.debug("GET COLECAO REPLY", caminho, res) }
                return Promise.resolve(res)
            });
    },

    dbGETColecao: (nomeColecao, path = "") => {
        let caminho = nomeColecao + "/" + codCidade + path;
        if (DEBUG) { console.debug("GET COLECAO REQUEST ", caminho) }

        return restAPI.get(caminho)
            .then((res) => {
                if (DEBUG) { console.debug("GET COLECAO REPLY", caminho, res.data.data) }
                return Promise.resolve(res.data.data)
            });
    },

    dbGETEntidade: (nomeColecao, path) => {
        let caminho = nomeColecao + "/" + codCidade + path;
        if (DEBUG) { console.debug("GET ENTIDADE REQUEST", caminho) }

        return restAPI.get(caminho)
            .then((res) => {
                if (DEBUG) { console.debug("GET ENTIDADE REPLY", caminho, res.data) }
                return Promise.resolve(res.data)
            });
    },

    dbPOST: (nomeColecao, path, dado) => {
        let caminho = nomeColecao + "/" + codCidade + path;
        if (DEBUG) { console.debug("POST REQUEST", caminho, dado) }

        return restAPI.post(caminho, dado)
            .then((res) => {
                if (DEBUG) { console.debug("POST REPLY", caminho, res) }
                return Promise.resolve(res);
            })
    },

    dbPUT: (nomeColecao, path, dado) => {
        let caminho = nomeColecao + "/" + codCidade + path;
        if (DEBUG) { console.debug("PUT REQUEST", caminho, dado) }

        return restAPI.put(caminho, dado)
            .then((res) => {
                if (DEBUG) { console.debug("PUT REPLY", caminho, res.data.result) }
                return Promise.resolve(res.data.result)
            })
    },

    dbDELETE: (nomeColecao, path) => {
        let caminho = nomeColecao + "/" + codCidade + path;
        if (DEBUG) { console.debug("DELETE REQUEST", caminho) }

        return restAPI.delete(caminho)
    },

    dbDELETEComParam: (nomeColecao, path, dado) => {
        let caminho = nomeColecao + "/" + codCidade + path;
        if (DEBUG) { console.debug("DELETE REQUEST COM PARAM", caminho, dado) }

        return restAPI.delete(caminho, { data: dado })
    },

    dbBuscarTodosDadosPromise: (nomeColecao) => {
        let caminho = nomeColecao + "/" + codCidade;
        return restAPI.get(caminho)
            .then((res) => Promise.resolve(res.data.data));
    },

    dbBuscarDadosEspecificosPromise: (nomeColecao, path) => {
        let caminho = nomeColecao + "/" + codCidade + "/" + path;
        return restAPI.get(caminho)
            .then((res) => Promise.resolve(res.data));
    },

    dbAtualizarPromise: (nomeColecao, dado, id) => {
        let caminho = nomeColecao + "/" + codCidade + "/" + id;

        return restAPI.put(caminho, dado)
            .then((res) => {
                debugger
                return Promise.resolve(res.data)
            })
            .catch((err) => {
                debugger
                console.log(err);
            });
    },


}
