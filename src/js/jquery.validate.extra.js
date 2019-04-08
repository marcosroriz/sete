// Funções extra para validar formulários com o JQuery Validator

// Inicia máscaras de telefone e cpf do registro
let telmaskbehaviour = function (val) {
    return val.replace(/\D/g, '').length === 11 ? '(00) 00000-0000' : '(00) 0000-00009';
};

let teloptions = {
    onKeyPress: function (val, e, field, options) {
        field.mask(telmaskbehaviour.apply({}, arguments), options);
    }
};

// Validar CPF
window.$.validator.addMethod("cpf", function (value, element) {
    value = jQuery.trim(value);

    value = value.replace('.', '');
    value = value.replace('.', '');
    let cpf = value.replace('-', '');

    while (cpf.length < 11) cpf = "0" + cpf;
    let expReg = /^0+$|^1+$|^2+$|^3+$|^4+$|^5+$|^6+$|^7+$|^8+$|^9+$/;
    let a = [];
    let b = new Number;
    let c = 11;
    for (let i = 0; i < 11; i++) {
        a[i] = cpf.charAt(i);
        if (i < 9) b += (a[i] * --c);
    }
    let x = b % 11;
    if (x < 2) {
        a[9] = 0;
    } else {
        a[9] = 11 - x;
    }
    b = 0;
    c = 11;
    let y = 0;
    for (y = 0; y < 10; y++) {
        b += (a[y] * c--);
    }
    x = b % 11;
    if (x < 2) {
        a[10] = 0;
    } else {
        a[10] = 11 - x;
    }

    let retorno = true;
    if ((cpf.charAt(9) != a[9]) || (cpf.charAt(10) != a[10]) || cpf.match(expReg)) retorno = false;

    return this.optional(element) || retorno;

}, "Informe um CPF válido");

// Validar campos que só podem ter letras
window.$.validator.addMethod("lettersonly", function (value, element) {
    return this.optional(element) || /^[a-z áàäéêëíïóõôöúûüùçñ]+$/i.test(value);
}, "Informe apenas caracteres válidos");

// Validar escolha de estado em um select
window.$.validator.addMethod("pickstate", function (value, element) {
    console.log(element);
    console.log(value);
    return value != " ";
}, "Informe um Estado válido");

// Validar escolha de município em um select
window.$.validator.addMethod("pickcity", function (value, element) {
    console.log(element);
    console.log(value);
    return value != " ";
}, "Informe um Município válido");
