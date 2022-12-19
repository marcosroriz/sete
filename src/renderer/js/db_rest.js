// db_rest.js
// Este arquivo implementa as funções do banco de dados utilizando a API rest

// Inicializa a API
var restAPI = axios.create({
    baseURL: BASE_URL,
    headers: { 'Authorization': userconfig.get("TOKEN") }
});

// src/utils/cache.js
function writeToCache(url, data) {
    try {
        sessionStorage.setItem(url, JSON.stringify(data));   
    } catch (e) {
        console.log("CHACHE ERROR", e)
        sessionStorage.removeItem(url);
    }   
}

function readFromCache(url) {
    return JSON.parse(sessionStorage.getItem(url)) || null;
}

function deleteFromCache(url) {
    sessionStorage.removeItem(url)
}

function cacheKeys() {
    return Object.keys(sessionStorage)
}

// Cache Request
// https://gist.github.com/javisperez/4bb09e0437994a659bbcd06f90eeebbf
restAPI.interceptors.request.use((request) => {
    // debugger
    if (request.method === "get") {
        let url = request.url;
        let dadoCache = readFromCache(url);

        if (dadoCache) {
            request.adapter = () => {
                return Promise.resolve({
                    data: dadoCache,
                    status: request.status,
                    statusText: request.statusText,
                    headers: request.headers,
                    config: request,
                    request: request
                });
            };
        }
    }
    return request
})


// Refresh do token
restAPI.interceptors.response.use((response) => {
    let url = response.config.url;

    if (response.config.method === "get") {
        writeToCache(url, response.data)
    } else {
        let chaves = cacheKeys();

        deleteFromCache(url);
        chaves.forEach(chave => {
            if (chave.includes(codCidade) && !chave.includes("shape")) {
                console.log("APAGANDO", chave)
                deleteFromCache(chave);
            }
        })
    }
    return response
}, async function (error) {
    const originalRequest = error.config;

    if (error.response.status === 403 && !originalRequest._retry &&
        userconfig.get("EMAIL") && userconfig.get("PASSWORD")) {
        originalRequest._retry = true;
        const username = userconfig.get("EMAIL");
        const userpass = MD5(userconfig.get("PASSWORD"));
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

var restModule = {
    restAPI,

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

// if (module) {
//     module.exports = restModule;
// }
