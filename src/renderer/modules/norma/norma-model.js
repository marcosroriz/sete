// Transformar linha da API REST para JSON
var parseNormaREST = function (normaRaw) {
    let normaJSON = Object.assign({}, normaRaw);
    // Arrumando campos novos para os que já usamos. 
    // Atualmente os campos são em caixa alta (e.g. NOME ao invés de nome)
    // Entretanto, a API está retornando valores em minúsculo
    for (let attr of Object.keys(normaJSON)) {
        normaJSON[attr.toUpperCase()] = normaJSON[attr];
    }

    return normaJSON;
};