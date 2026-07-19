@echo off
REM Arranca el servidor de IA local de Klozet (rembg + Ollama)
cd /d "%~dp0ai-server"
if not exist .venv (
  echo Creando entorno virtual e instalando dependencias (solo la primera vez)...
  python -m venv .venv
  .venv\Scripts\pip install -r requirements.txt
)
.venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8000
