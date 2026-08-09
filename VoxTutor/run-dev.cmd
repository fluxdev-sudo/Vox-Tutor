@ECHO OFF
SET "PATH=C:\Program Files\nodejs;%PATH%"
CD /D "%~dp0"
CALL npm run dev -- --port 8081
