@echo off
setlocal
color 0B
chcp 65001 >nul
title Quest Log — Gestor de Inicialização

:menu
cls
goto silent_mode
echo.
echo  =======================================================
echo             QUEST LOG — CENTRAL DE COMANDO
echo  =======================================================
echo.
echo    [1] MODO DESENVOLVEDOR 
echo        (Vite + HMR, Terminal Visível)
echo.
echo    [2] MODO SILENCIOSO / EXECUTÁVEL
echo        (Segundo Plano, Ícone na Bandeja)
echo.
echo    [3] SAIR
echo.
echo  =======================================================
echo.
set /p opt="> Selecione uma opção: "

if "%opt%"=="1" goto dev_mode
if "%opt%"=="2" goto silent_mode
if "%opt%"=="3" exit
goto menu

:dev_mode
echo.
echo  [!] Iniciando Ambiente de Desenvolvimento...
echo.
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [!] Erro: Node.js não encontrado.
    pause
    goto menu
)
call npm install --no-audit --no-fund --silent
echo.
echo  [OK] Dependências verificadas.
echo  [!] Abrindo servidor Vite...
echo.
call npm run dev -- --open
goto end

:silent_mode
echo.
echo  [!] Ativando Modo Silencioso...
echo.
if not exist "dist\index.html" (
    echo [!] Pasta 'dist' não encontrada. Gerando build...
    call npm run build
)
if exist "QuestLog_Hidden.vbs" (
    start wscript.exe "QuestLog_Hidden.vbs"
    exit
) else (
    echo [ERRO] QuestLog_Hidden.vbs não encontrado!
    pause
    goto menu
)

:end
pause
exit

