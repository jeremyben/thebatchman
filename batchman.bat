@echo off
setlocal
set sourcedir=
set sourcefile=
set targetexe=
set archive="%temp%\batexe.7z"
if exist %archive% del /q /f %archive%

for /f "tokens=1-7 delims=~" %%i in ('mshta.exe "%~dp0\hta\batchman.hta"') do (
	set "sourcedir=%%i"
	set "sourcefile=%%j"
	set "include=%%k"
	set "hideconsole=%%l"
	set "completion=%%m"
	set "name=%%n"
	set "iconfile=%%o"
)
if "%sourcefile%"=="" goto :eof
copy /y %sourcedir%\%sourcefile% %temp%\%sourcefile%
set "targetexe=%sourcedir%\%name%.exe"
:: Overwrite if target file exists with same name
if exist "%targetexe%" del /q /f "%targetexe%"

::HTA completion feedback
if "%completion%" == "true" (
	>>%temp%\%sourcefile% echo(
	>>%temp%\%sourcefile% echo start /wait "" mshta.exe "javascript:alert('%name% complete');close()"
)

:: Compilation
:: 1. Compress Installer Files
if "%include%" == "true" (
	start /b /wait "Compressing" "%~dp0\bin\7za.exe" a -y %archive% "%temp%\%sourcefile%" "%sourcedir%\*" -x!"%sourcedir%\%sourcefile%"
) else (
	start /b /wait "Compressing" "%~dp0\bin\7za.exe" a -y %archive% "%temp%\%sourcefile%"
)

:: 2. Create Config File
set sfxconfig="%temp%\config.txt"
>%sfxconfig% echo ;!@Install@!UTF-8!
if "%hideconsole%" == "true" (
	>>%sfxconfig% echo RunProgram="hidcon:%sourcefile%"
) else (
	>>%sfxconfig% echo ExecuteFile="%sourcefile%"
)
>>%sfxconfig% echo Title="%name%"
>>%sfxconfig% echo ExtractTitle="%name%"
>>%sfxconfig% echo ExtractDialogText="%name%"
>>%sfxconfig% echo GUiflags="1+4+8+32"
>>%sfxconfig% echo GUimode="2"
>>%sfxconfig% echo ;!@InstallEnd@!

:: 3. Create SFX
copy /y /b "%~dp0\bin\7zsd_LZMA2.sfx" + %sfxconfig% + %archive% "%name%.tmp" 2>nul>nul
del /q /f %sfxconfig% 2>nul>nul

:: 4. Add icon
if NOT "%iconfile%" == "false" (
	copy /y "%name%.tmp" "%name%.icx"
	start /b /wait "SFX_Mode" "%~dp0\bin\resourcer.exe" -op:add -src:"%name%.icx" -type:icon -name:NAME -lang:1033 -file:"%iconfile%"
	copy /b /y "%name%.icx" + "%name%.tmp" "%targetexe%"
	if exist "%name%.icx" del /q /f "%name%.icx"
	if exist "%name%.tmp" del /q /f "%name%.tmp"
)

:: 4. Compress file
if exist "%name%.tmp" (
	start /b /wait "Compress" "bin\upx.exe" -1 -q -o"%targetexe%" "%name%.tmp"
) else (
	start /b /wait "Compress" "bin\upx.exe" -1 -q "%targetexe%"
)
if exist "%name%.tmp" del /q /f "%name%.tmp"
if exist %archive% del /q /f %archive% 2>nul>nul
if exist %temp%\%sourcefile% del /q /f %archive% 2>nul>nul