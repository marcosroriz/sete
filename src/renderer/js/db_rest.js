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

    dbGETColecao: (nomeColecao, path = "") => {
        let caminho = nomeColecao + "/" + codCidade + path;
        return restAPI.get(caminho)
            .then((res) => Promise.resolve(res.data.data));
    },

    dbGETEntidade: (nomeColecao, path) => {
        let caminho = nomeColecao + "/" + codCidade + path;
        return restAPI.get(caminho)
            .then((res) => Promise.resolve(res.data));
    },

    dbPOST: (nomeColecao, path, dado) => {
        let caminho = nomeColecao + "/" + codCidade + path;
        return restAPI.post(caminho, dado)
    },

    dbPUT: (nomeColecao, path, dado) => {
        let caminho = nomeColecao + "/" + codCidade + path;

        return restAPI.put(caminho, dado)
            .then((res) => {
                return Promise.resolve(res.data.result)
            })
    },

    dbDELETE: (nomeColecao, path) => {
        let caminho = nomeColecao + "/" + codCidade + path;

        return restAPI.delete(caminho)
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
