$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$loProgram = "C:\Program Files\LibreOffice\program"
$env:PATH = "$loProgram;$env:PATH"

$python = "C:\Users\Marketing\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$renderer = "C:\Users\Marketing\.codex\plugins\cache\openai-primary-runtime\documents\26.614.11602\skills\documents\render_docx.py"

$userDoc = Join-Path $repoRoot "docs\denuncias\manual_usuario_plataforma_denuncias.docx"
$operatorDoc = Join-Path $repoRoot "docs\denuncias\manual_operador_plataforma_denuncias.docx"

& $python $renderer $userDoc --output_dir (Join-Path $repoRoot "docs\denuncias\render_usuario")
& $python $renderer $operatorDoc --output_dir (Join-Path $repoRoot "docs\denuncias\render_operador")
