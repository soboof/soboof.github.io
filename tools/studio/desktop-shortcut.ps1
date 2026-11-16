# ═══════════════════════════════════════════════════════════════════════════
#  SOBOOF STUDIO — put a "Soboof Studio" icon on the desktop.
#
#    Right-click this file > Run with PowerShell
#    or:  powershell -ExecutionPolicy Bypass -File tools\studio\desktop-shortcut.ps1
#
#  The shortcut runs studio.cmd from the site's folder, with Studio's own icon
#  (studio.ico, drawn by make-icon.js), its black window minimised to the
#  taskbar (close it there to stop Studio). Run it again after moving the
#  folder: it rewrites the shortcut. Nothing here touches the site.
# ═══════════════════════════════════════════════════════════════════════════
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$desktop = [Environment]::GetFolderPath('Desktop')
$lnk = Join-Path $desktop 'Soboof Studio.lnk'

$sh = New-Object -ComObject WScript.Shell
$s = $sh.CreateShortcut($lnk)
$s.TargetPath = Join-Path $repo 'studio.cmd'
$s.WorkingDirectory = $repo
$s.IconLocation = (Join-Path $PSScriptRoot 'studio.ico') + ',0'
$s.Description = 'Soboof Studio: edit soboof.com and upload it'
$s.WindowStyle = 7
$s.Save()

Write-Host "  Soboof Studio is on the desktop: $lnk"
