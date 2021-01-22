// VERIFICANDO ESTADO DA CONEXÃO DE INTERNET
function StateNetwork(){
    if (navigator.onLine) {
        return true;
    } else {
        return false;
    }
}