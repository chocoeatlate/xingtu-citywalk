@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js 22 或 24，然后重新运行本文件。
  pause
  exit /b 1
)
if not exist node_modules (
  call npm ci
  if errorlevel 1 (
    echo 依赖安装失败，请检查网络并参考 README。
    pause
    exit /b 1
  )
)
echo 服务就绪后，在浏览器打开 http://127.0.0.1:5173/
echo 请保留本窗口，按 Ctrl+C 停止服务。
call npm run dev
pause
