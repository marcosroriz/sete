#!/bin/bash

find src -name '*.html' -exec sed -i '' 's/=\".\/modules/=\"https:\/\/cdn.jsdelivr.net\/gh\/marcosroriz\/sete@master\/src\/renderer\/modules/g' {} \;
find src -name '*.html' -exec sed -i '' 's/href=\"css/href=\"https:\/\/cdn.jsdelivr.net\/gh\/marcosroriz\/sete@master\/src\/renderer\/css/g' {} \;
find src -name '*.html' -exec sed -i '' 's/src=\"js/src=\"https:\/\/cdn.jsdelivr.net\/gh\/marcosroriz\/sete@master\/src\/renderer\/js/g' {} \;
find src -name '*common.js' -exec sed -i '' 's/remoteNavigation[[:space:]]=[[:space:]]false/remoteNavigation=true/g' {} \;
# find src -name '*.js' -exec sed -i 's/load(target)/load(`https:\/\/cdn.jsdelivr.net\/gh\/marcosroriz\/sete@master\/src\/renderer\/${target}`, (resp, status) => \{ if (status == \"error\") { \$(\"#content\")\.load(target); \} \}\)/g' {} \;

