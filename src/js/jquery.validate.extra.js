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

// Validar CEP
window.$.validator.addMethod("cep", function (value, element) {
    return this.optional(element) || /^[0-9]{5}-[0-9]{3}$/.test(value);
}, "Por favor, digite um CEP válido");

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

// Validar campo com data de nascimento no formato dd-mm-yyyy
window.$.validator.addMethod("datanasc", function (value, element) {
    return this.optional(element) || /^(?=\d)(?:(?:31(?!.(?:0?[2469]|11))|(?:30|29)(?!.0?2)|29(?=.0?2.(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00)))(?:\x20|$))|(?:2[0-8]|1\d|0?[1-9]))([-.\/])(?:1[012]|0?[1-9])\1(?:1[6-9]|[2-9]\d)?\d\d(?:(?=\x20\d)\x20|$))?(((0?[1-9]|1[012])(:[0-5]\d){0,2}(\x20[AP]M))|([01]\d|2[0-3])(:[0-5]\d){1,2})?$/.test(value);
}, "Informe uma data de nascimento válida");

// Validar campos que só podem ter letras
window.$.validator.addMethod("lettersonly", function (value, element) {
    return this.optional(element) || /^[a-z áàäéêëíïóõôöúûüùçñ]+$/i.test(value);
}, "Informe apenas caracteres válidos");

// Validar escolha de estado em um select
window.$.validator.addMethod("pickstate", function (value, element) {
    return value != " ";
}, "Informe um Estado válido");

// Validar escolha de município em um select
window.$.validator.addMethod("pickcity", function (value, element) {
    return value != " ";
}, "Informe um Município válido");

window.$.extend(window.$.validator.messages, {
    required: "Campo obrigatório!",
    remote: "Por favor, corrija este campo.",
    email: "Por favor, forneça um endereço eletrônico válido.",
    url: "Por favor, forneça uma URL válida.",
    date: "Por favor, forneça uma data válida.",
    dateISO: "Por favor, forneça uma data válida (ISO).",
    number: "Por favor, forneça um número válido.",
    digits: "Por favor, forneça somente dígitos.",
    creditcard: "Por favor, forneça um cartão de crédito válido.",
    equalTo: "Por favor, forneça o mesmo valor novamente.",
    accept: "Por favor, forneça um valor com uma extensão válida.",
    maxlength: jQuery.validator.format("Por favor, forneça não mais que {0} caracteres."),
    minlength: jQuery.validator.format("Por favor, forneça ao menos {0} caracteres."),
    rangelength: jQuery.validator.format("Por favor, forneça um valor entre {0} e {1} caracteres de comprimento."),
    range: jQuery.validator.format("Por favor, forneça um valor entre {0} e {1}."),
    max: jQuery.validator.format("Por favor, forneça um valor menor ou igual a {0}."),
    min: jQuery.validator.format("Por favor, forneça um valor maior ou igual a {0}.")
});
