@echo off
color 0B
title Quest Log - Inicializador Local
echo =======================================================
echo.
echo        INICIALIZANDO O SERVIDOR DO QUEST LOG
echo.
echo =======================================================
echo.
echo [1/2] Verificando e instalando dependencias (se necessario)...
call npm install --no-audit --no-fund --silent
echo.
echo [2/2] Iniciando o servidor Vite e abrindo o navegador...
echo.
echo DICA: Para encerrar o servidor, simplesmente feche esta janela.
echo =======================================================
echo.
call npm run dev -- --open
