#!/bin/bash

find src -name '*.html' -exec sed -i 's/=\".\/modules/=\"https:\/\/sete-web.transportesufg.eng.br\/src\/renderer\/modules/g' {} \;
find src -name '*.html' -exec sed -i 's/=\".\/img/=\"https:\/\/sete-web.transportesufg.eng.br\/src\/renderer\/img/g' {} \;
find src -name '*.html' -exec sed -i 's/=\"img/=\"https:\/\/sete-web.transportesufg.eng.br\/src\/renderer\/img/g' {} \;
find src -name '*.html' -exec sed -i 's/href=\"css/href=\"https:\/\/sete-web.transportesufg.eng.br\/src\/renderer\/css/g' {} \;
find src -name '*.html' -exec sed -i 's/href=\"css/href=\"https:\/\/sete-web.transportesufg.eng.br\/src\/renderer\/css/g' {} \;
find src -name '*.html' -exec sed -i 's/src=\"js/src=\"https:\/\/sete-web.transportesufg.eng.br\/src\/renderer\/js/g' {} \;
find src -name '*common.js' -exec sed -i 's/remoteNavigation[[:space:]]=[[:space:]]false/remoteNavigation=true/g' {} \;
# find src -name '*.js' -exec sed -i 's/load(target)/load(`https:\/\/sete-web.transportesufg.eng.br\/src\/renderer\/${target}`, (resp, status) => \{ if (status == \"error\") { \$(\"#content\")\.load(target); \} \}\)/g' {} \;

