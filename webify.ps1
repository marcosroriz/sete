$configFiles = Get-ChildItem src *.html -rec
foreach ($file in $configFiles)
{
    (Get-Content $file.PSPath) |
    Foreach-Object { $_ -replace "./modules", "https://sete-web.transportesufg.eng.br/src/renderer/modules" } |
    Set-Content $file.PSPath
}

$configFiles = Get-ChildItem src *.html -rec
foreach ($file in $configFiles)
{
    (Get-Content $file.PSPath) |
    Foreach-Object { $_ -replace "src=""./img", "src=""https://sete-web.transportesufg.eng.br/src/renderer/img" } |
    Foreach-Object { $_ -replace "src=""img",   "src=""https://sete-web.transportesufg.eng.br/src/renderer/img" } |
    Set-Content $file.PSPath
}


$configFiles = Get-ChildItem src *.html -rec
foreach ($file in $configFiles)
{
    (Get-Content $file.PSPath) |
    Foreach-Object { $_ -replace "href=""css", "href=""https://sete-web.transportesufg.eng.br/src/renderer/css" } |
    Set-Content $file.PSPath
}

$configFiles = Get-ChildItem src *.html -rec
foreach ($file in $configFiles)
{
    (Get-Content $file.PSPath) |
    Foreach-Object { $_ -replace "src=""js", "src=""https://sete-web.transportesufg.eng.br/src/renderer/js" } |
    Set-Content $file.PSPath
}

$configFiles = Get-ChildItem src/renderer/js/common.js
foreach ($file in $configFiles)
{
    (Get-Content $file.PSPath) |
    Foreach-Object { $_ -replace "remoteNavigation = false", "remoteNavigation = true" } |
    Set-Content $file.PSPath
}
