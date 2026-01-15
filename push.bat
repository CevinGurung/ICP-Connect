@echo off
for /f "tokens=*" %%i in ('git branch --show-current') do set branch=%%i
set /p msg=Enter commit message:
git add .
git commit -m "%msg%"
git push origin %branch%
pause