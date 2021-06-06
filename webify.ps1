$configFiles = Get-ChildItem src *.html -rec
foreach ($file in $configFiles)
{
    (Get-Content $file.PSPath) |
    Foreach-Object { $_ -replace "./modules", "https://cdn.jsdelivr.net/gh/marcosroriz/sete@master/src/renderer/modules" } |
    Set-Content $file.PSPath
}

$configFiles = Get-ChildItem src *.html -rec
foreach ($file in $configFiles)
{
    (Get-Content $file.PSPath) |
    Foreach-Object { $_ -replace "href=""css", "href=""https://cdn.jsdelivr.net/gh/marcosroriz/sete@master/src/renderer/css" } |
    Set-Content $file.PSPath
}

$configFiles = Get-ChildItem src *.html -rec
foreach ($file in $configFiles)
{
    (Get-Content $file.PSPath) |
    Foreach-Object { $_ -replace "src=""js", "src=""https://cdn.jsdelivr.net/gh/marcosroriz/sete@master/src/renderer/js" } |
    Set-Content $file.PSPath
}

$configFiles = Get-ChildItem src/renderer/js/common.js
foreach ($file in $configFiles)
{
    (Get-Content $file.PSPath) |
    Foreach-Object { $_ -replace "remoteNavigation = false", "remoteNavigation = true" } |
    Set-Content $file.PSPath
}
