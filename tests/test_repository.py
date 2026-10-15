from pathlib import Path
from html.parser import HTMLParser
import json,re,unittest
ROOT=Path(__file__).resolve().parents[1]
class Assets(HTMLParser):
 def __init__(self):super().__init__();self.assets=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag in ('script','link'):
   v=a.get('src') or a.get('href')
   if v and v.startswith('assets/'):self.assets.append(v.split('?')[0])
class RepositoryTests(unittest.TestCase):
 def test_html_assets_exist(self):
  for p in ROOT.glob('*.html'):
   parser=Assets();parser.feed(p.read_text(encoding='utf-8-sig'));self.assertTrue(parser.assets)
   for a in parser.assets:self.assertTrue((ROOT/a).is_file(),str(p)+': '+a)
 def test_exclusive_api_and_no_basic_in_browser(self):
  source='\n'.join(p.read_text(encoding='utf-8-sig') for p in (ROOT/'assets/js').glob('*.js'))
  self.assertIn('/api/comercial-html',source)
  self.assertNotIn('/api/bi/faturamento-nf',source);self.assertNotIn('/api/pcp/',source)
  self.assertNotRegex(source,r'Authorization\s*:\s*[\'\"]Basic');self.assertNotRegex(source,r'password\s*[:=]')
  self.assertIn('granjabi_auth_token',source)
 def test_model_inventory_is_explicit(self):
  pages=json.loads((ROOT/'docs/mapa-paginas.json').read_text(encoding='utf-8'));measures=json.loads((ROOT/'docs/medidas.json').read_text(encoding='utf-8'))
  self.assertEqual(len(pages['paginas']),11);self.assertEqual(len(measures),125)
  self.assertEqual(len({p['tela_html'] for p in pages['paginas']}),7)
  self.assertTrue(any(m['estado']=='a_conferir' for m in measures))
 def test_no_operational_files_in_project(self):
  for p in ROOT.rglob('*'):
   if '.git' in p.parts or not p.is_file():continue
   self.assertNotIn(p.suffix.lower(),{'.parquet','.pbix','.vpax','.xlsx','.csv'},str(p))
   self.assertNotRegex(p.name,r'^\.env(?:\.|$)')
if __name__=='__main__':unittest.main()
