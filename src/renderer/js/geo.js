var cidadeLatitude = userconfig.get("LATITUDE");
var cidadeLongitude = userconfig.get("LONGITUDE");
var codCidade = userconfig.get("COD_CIDADE");
var codEstado = userconfig.get("COD_ESTADO");
var minZoom = 15;

if (codCidade != null) {
    if (knex) {
        knex("IBGE_Municipios")
        .select()
        .where("codigo_ibge", userconfig.get("COD_CIDADE"))
        .then(res => {
            cidadeLatitude = res[0]["latitude"];
            cidadeLongitude = res[0]["longitude"];
        });
    } else {
        console.log("RODANDO NO BROWSER");
        console.log("SEM KNEX/SQLITE");
    }
    
}