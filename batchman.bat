@echo off
setlocal

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
set "targetexe=%sourcedir%\%name%.exe"
copy /y %sourcedir%\%sourcefile% %temp%\%sourcefile%

:: Overwrite if target filename exists
if exist "%targetexe%" del /q /f "%targetexe%"

::HTA completion feedback
if "%completion%" == "true" (
	>>%temp%\%sourcefile% echo(
	>>%temp%\%sourcefile% echo :batchmanCompletion
	>>%temp%\%sourcefile% echo start /wait "" mshta.exe "javascript:alert('%name% complete');close()"
)

:: Compress files
set "archive=%temp%\batchman-archive.7z"
if "%include%" == "true" (
	start /b /wait "Compressing" "%~dp0\bin\7za.exe" a -y %archive% "%temp%\%sourcefile%" "%sourcedir%\*" -x!"%sourcedir%\%sourcefile%"
) else (
	start /b /wait "Compressing" "%~dp0\bin\7za.exe" a -y %archive% "%temp%\%sourcefile%"
)

:: Create Config File
set "sfxconfig=%temp%\batchman-config.txt"
>%sfxconfig% echo ;!@Install@!UTF-8!
if "%hideconsole%" == "true" (
	>>%sfxconfig% echo RunProgram="hidcon:%sourcefile%"
) else (
	>>%sfxconfig% echo ExecuteFile="%sourcefile%"
)
>>%sfxconfig% echo Title="%name%"
>>%sfxconfig% echo ExtractTitle="%name%"
>>%sfxconfig% echo GUIFlags="2+8+512"
>>%sfxconfig% echo GUIMode="1"
>>%sfxconfig% echo ;!@InstallEnd@!

:: Create SFX
copy /y /b %~dp0\bin\7zsd_LZMA2.sfx + %sfxconfig% + %archive% %name%.tmp 2>nul>nul

:: Add icon
if "%iconfile%" == "false" set "iconfile=%~dp0\bin\default_icon.ico"
copy /y %name%.tmp %name%.icx
start /b /wait "Resourcer" "%~dp0\bin\resourcer.exe" -op:add -src:"%name%.icx" -type:icon -name:NAME -lang:1033 -file:"%iconfile%"
copy /b /y %name%.icx + %name%.tmp %targetexe%

:: Compress target executable
start /b /wait "Compressing" "bin\upx.exe" -1 -q "%targetexe%"

:: Cleaning
if exist %sfxconfig% del /q /f %sfxconfig%
if exist %name%.icx del /q /f %name%.icx
if exist %name%.tmp del /q /f %name%.tmp
if exist %archive% del /q /f %archive%
if exist %temp%\%sourcefile% del /q /f %temp%\%sourcefile%