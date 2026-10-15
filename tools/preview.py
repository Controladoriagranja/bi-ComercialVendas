"""Preview local de layout; dados de produção continuam protegidos pela CENTRAL."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
import argparse
root=Path(__file__).resolve().parents[1]
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=8129);a=p.parse_args()
 class Handler(SimpleHTTPRequestHandler):
  def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(root),**kwargs)
 print(f'Comercial: http://127.0.0.1:{a.port}/ (Ctrl+C para encerrar)',flush=True)
 try:ThreadingHTTPServer(('127.0.0.1',a.port),Handler).serve_forever()
 except KeyboardInterrupt:pass
