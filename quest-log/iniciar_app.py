import http.server
import socketserver
import webbrowser
import os
import threading
import sys
import time
import pystray
import traceback
from PIL import Image
from pathlib import Path

# Configurações
PORT = 14777
HOST = "127.0.0.1"
DIST_DIR = "dist"
ICON_PATH = os.path.join("assets", "quest-log.ico")
APP_NAME = "Quest Log"

def resource_path(relative_path):
    """ Obtém o caminho absoluto para o recurso, funcionando para dev e PyInstaller """
    try:
        if hasattr(sys, '_MEIPASS'):
            return os.path.join(sys._MEIPASS, relative_path)
    except Exception:
        pass
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), relative_path)

def log_error(msg):
    try:
        with open("questlog_error.log", "a", encoding="utf-8") as f:
            f.write(f"[{time.ctime()}] {msg}\n")
    except:
        pass

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    """ Handler que suporta SPA (Single Page Application) redirecionando para index.html """
    def __init__(self, *args, **kwargs):
        directory = resource_path(DIST_DIR)
        super().__init__(*args, directory=directory, **kwargs)

    def do_GET(self):
        # Limpa o caminho para evitar problemas
        requested_path = self.path.split('?')[0].split('#')[0]
        full_path = os.path.join(self.directory, requested_path.lstrip('/'))
        
        # Se o arquivo não existir, envia o index.html (padrão SPA)
        if not os.path.exists(full_path) or os.path.isdir(full_path):
            self.path = "/index.html"
        
        return super().do_GET()

    def log_message(self, format, *args):
        # Silencia logs no terminal para não poluir
        pass

class ThreadingSimpleServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True
    allow_reuse_address = True

def main():
    try:
        # 1. Garante que o diretório 'dist' existe
        dist_path = resource_path(DIST_DIR)
        if not os.path.exists(dist_path):
            log_error(f"Erro: Diretorio '{DIST_DIR}' nao encontrado.")
            # Se não houver dist, talvez estejamos em modo dev? 
            # Mas o 'executavel falso' espera o dist.
        
        # 2. Inicia o Servidor
        server = ThreadingSimpleServer((HOST, PORT), SPAHandler)
        server_thread = threading.Thread(target=server.serve_forever)
        server_thread.daemon = True
        server_thread.start()

        url = f"http://{HOST}:{PORT}/"
        
        # 3. Pequeno delay para garantir o startup e abre browser
        time.sleep(1.0)
        webbrowser.open(url)

        # 4. Interface na Bandeja (System Tray)
        def on_quit(icon, item):
            icon.stop()
            server.shutdown()
            os._exit(0)

        try:
            full_icon_path = resource_path(ICON_PATH)
            if os.path.exists(full_icon_path):
                image = Image.open(full_icon_path)
            else:
                # Fallback: cria um quadrado colorido se o ícone sumir
                image = Image.new('RGB', (64, 64), color=(73, 109, 137))
            
            icon = pystray.Icon(
                APP_NAME,
                image,
                f"{APP_NAME} Server",
                menu=pystray.Menu(
                    pystray.MenuItem(f"{APP_NAME} está rodando", lambda: None, enabled=False),
                    pystray.MenuItem("Abrir no Navegador", lambda: webbrowser.open(url)),
                    pystray.Menu.Separator(),
                    pystray.MenuItem("Sair", on_quit)
                )
            )
            icon.run()
        except Exception as e:
            log_error(f"Erro no Tray Icon: {traceback.format_exc()}")
            # Se falhar o tray, mantém o processo vivo
            while True:
                time.sleep(3600)

    except Exception as e:
        log_error(f"Erro Crítico: {traceback.format_exc()}")
        sys.exit(1)

if __name__ == "__main__":
    main()
