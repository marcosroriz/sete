<html>
<head>
    <title>Sample</title>
</head>
<body>
    <h1>Hi!</h1>
</body>
<script>
"use strict"

window.$ = window.jQuery = require('jquery');
window.Tether = require('tether');
window.Bootstrap = require('bootstrap');
require("jquery-validation");
</script>
</html>
// require("bootstrap-select");

// $(document).ready(function () {
//     $("#loginform").validate({
//         rules: {
//             loginemail: {
//                 required: true,
//                 email: true
//             },
//             loginpassword: {
//                 required: true
//             }
//         },
//         messages: {
//             loginemail: {
//                 required: "Por favor digite seu endereço de e-mail",
//                 email: "Por favor digite um endereço de e-mail válido"
//             },
//             loginpassword: {
//                 required: "Por favor digite sua senha"
//             }
//         },
//         highlight: function (element) {
//             $(element).closest('.form-group').removeClass('has-success').addClass('has-error');
//             $(element).closest('.form-check').removeClass('has-success').addClass('has-error');
//         },
//         success: function (element) {
//             $(element).closest('.form-group').removeClass('has-error').addClass('has-success');
//             $(element).closest('.form-check').removeClass('has-error').addClass('has-success');
//         },
//         errorPlacement: function (error, element) {
//             $(element).closest('.form-group').append(error).addClass('has-error');
//         }
//     });
// });
