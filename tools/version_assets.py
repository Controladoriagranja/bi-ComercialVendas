"""Renova versões de recursos locais em todos osHTMLs para evitar cache antigo."""
from pathlib import Path
import re,hashlib
root=Path(__file__).resolve().parents[1]
for path in root.glob('*.html'):
 source=path.read_text(encoding='utf-8-sig')
 def replace(match):
  asset=match.group(1)
  return asset+'?v='+hashlib.sha256((root/asset).read_bytes()).hexdigest()[:12]
 source=re.sub(r'(assets/(?:css|js)/[a-z0-9-]+\.(?:css|js))(?:\?v=[^"\s>]+)?',replace,source)
 path.write_text(source,encoding='utf-8')
print('Versões de CSS/JS atualizadas')
