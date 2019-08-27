function GetForm() {
    return {
        "ID_GARAGEM": _garagem.id, //int primarykey
        "NOME": $("#NOME").val(), // string
        "ENDERECO": $("#ENDERECO").val(), // string
        "LATITUDE": $("#LATITUDE").val(), //string
        "LONGITUDE": $("#LONGITUDE").val(), //sring
        "CEP": $("#CEP").val() //int
    };
}