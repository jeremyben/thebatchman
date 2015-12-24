@echo off
setlocal
cd /D %~dp0
set sourcedir=
set target=
set archive="%temp%\batexe.7z"
if exist %archive% del /Q /F %archive%

for /f "tokens=1-5 delims=~" %%i in ('mshta.exe "%~dp0\hta\batchman.hta"') do (
	set "sourcedir=%%i"
	set "sourcefile=%%j"
	set "name=%%k"
	set "iconfile=%%l"
	set "hideconsole=%%m"
)
if "%sourcefile%"=="" goto :eof
set "targetexe=%sourcedir%\%name%.exe"
:: Overwrite if target file exists with same name
if exist "%targetexe%" del /q /f "%targetexe%"

:Compilation
:: 1. Compress Installer Files
start /b /wait "Compressing" "bin\7za.exe" a -y %archive% "%sourcedir%\*"
:: -x!"%sourcedir%\%iconfile%"

:: 2. Create Config File
set sfxconfig="%temp%\config.txt"
>%sfxconfig% echo ;!@Install@!UTF-8!
:: >>%sfxconfig% echo ExecuteFile="%sourcefile%"
>>%sfxconfig% echo RunProgram="hidcon:%sourcefile%"
:: >>%sfxconfig% echo ExecuteParameters="%*"
>>%sfxconfig% echo Title="%name%"
>>%sfxconfig% echo ExtractTitle="Extracting %name%"
>>%sfxconfig% echo ExtractDialogText="%name%"
>>%sfxconfig% echo GUiflags="1+4+8+32"
>>%sfxconfig% echo GUimode="2"
>>%sfxconfig% echo ;!@InstallEnd@!

:: 3. Create SFX
copy /y /b "bin\7zsd_LZMA2.sfx" + %sfxconfig% + %archive% "%name%.tmp" 2>nul>nul
del /q /f %sfxconfig% 2>nul>nul

:: 4. Add icon
if NOT "%iconfile%" == "false" (
	copy /y "%name%.tmp" "%name%.icx"
	start /B /Wait "SFX_Mode" "bin\resourcer.exe" -op:add -src:"%name%.icx" -type:icon -name:NAME -lang:1033 -file:"%iconfile%"
	copy /b /y "%name%.icx" + "%name%.tmp" "%targetexe%"
	if exist "%name%.icx" del /Q /F "%name%.icx"
	if exist "%name%.tmp" del /Q /F "%name%.tmp"
)

:: 4. Compress file
if exist "%name%.tmp" (
		Start /B /wait "Compress" "bin\upx.exe" -1 -q -o"%targetexe%" "%name%.tmp"
	) else (
		Start /B /wait "Compress" "bin\upx.exe" -1 -q "%targetexe%"
	)
if exist "%name%.tmp" del /Q /F "%name%.tmp"
if exist %archive% del /Q /F %archive% 2>nul>nul
goto :eof