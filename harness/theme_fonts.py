"""Task 312, fonts: every Google Fonts family for the theme panel, and the files of a chosen one in the project.

The list is Google's public metadata (no key), cached in the data folder and refreshed at most once a day; offline,
the cache answers. The app itself never points at a CDN: when the person Saves a font, its woff2 files for the needed
weights and its licence come into the project's static/fonts/<family>/ (that click is the approval), from three hosts
only, each file checked to be woff2 and capped in size."""
from kit.project_paths import project_path
import json
from pathlib import Path
import re
import shutil
import time
import urllib.parse
import urllib.request
import uuid

CATALOGUE = 'https://fonts.google.com/metadata/fonts'
CSS = 'https://fonts.googleapis.com/css2'
LICENCES = [('ofl', 'OFL.txt'), ('apache', 'LICENSE.txt'), ('ufl', 'UFL.txt')]  # github.com/google/fonts folders
HOSTS = {'fonts.googleapis.com', 'fonts.gstatic.com', 'raw.githubusercontent.com'}  # downloads; the list comes from fonts.google.com
DAY = 24 * 3600
FILE_CAP = 2 * 1024 * 1024
TOTAL_CAP = 40 * 1024 * 1024
FACES_CAP = 300  # a Japanese family comes in about 120 slices per weight
WEIGHTS = (400, 700)  # body and bold; headings use the bold
# A current browser's User-Agent: with an old or unknown one, the css2 API answers with TrueType instead of woff2.
AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'


class Refused(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, url):
        if urllib.parse.urlsplit(url).hostname not in HOSTS | {'fonts.google.com'}: raise ValueError(f'A font download was redirected to {url}: refused.')
        return super().redirect_request(request, fp, code, message, headers, url)


def fetch(url, limit=FILE_CAP):
    """The bytes at an https address on an allowed host, at most limit bytes (ValueError beyond)."""
    parts = urllib.parse.urlsplit(url)
    if parts.scheme != 'https' or parts.hostname not in HOSTS | {'fonts.google.com'}: raise ValueError(f'Not a font host: {url}')
    request = urllib.request.Request(url, headers={'User-Agent': AGENT, 'Accept': 'text/css,*/*'})
    with urllib.request.build_opener(Refused).open(request, timeout=20) as response:
        body = response.read(limit + 1)
    if len(body) > limit: raise ValueError(f'{url} is larger than {limit // 1024} KB: refused.')
    return body


def slug(name):
    return re.sub(r'[^A-Za-z0-9]+', '-', name).strip('-')


def parse_catalogue(raw):
    """Google's metadata (it starts with a )]}' guard line) → [{'family', 'category', 'weights', 'italic'}]."""
    text = raw.decode('utf-8') if isinstance(raw, bytes) else raw
    if text.startswith(")]}'"): text = text.split('\n', 1)[1] if '\n' in text else text[4:]
    families = []
    for item in json.loads(text).get('familyMetadataList', []):
        name = item.get('family')
        if not isinstance(name, str) or not re.fullmatch(r'[A-Za-z0-9 ]{1,60}', name): continue
        keys = [str(key) for key in (item.get('fonts') or {})]
        weights = sorted({int(key.rstrip('i')) for key in keys if key.rstrip('i').isdigit()}) or [400]
        families.append({'family': name, 'category': str(item.get('category', '')), 'weights': weights, 'italic': any(key.endswith('i') for key in keys)})
    return families


class Fonts:
    """The catalogue, cached at <data>/cache/google-fonts.json, and the download of a chosen family."""
    def __init__(self, data, fetch=fetch, clock=time.time):
        self.cache, self.fetch, self.clock = Path(data) / 'cache' / 'google-fonts.json', fetch, clock

    def catalogue(self):
        """{'families', 'fetched', 'offline'}: the cache when it is less than a day old, else a fresh copy; offline the
        cache as it is (an empty list when there has never been one)."""
        cached = None
        try: cached = json.loads(self.cache.read_text(encoding='utf-8'))
        except (OSError, ValueError): pass
        if cached and self.clock() - cached.get('fetched', 0) < DAY: return {**cached, 'offline': False}
        try: families = parse_catalogue(self.fetch(CATALOGUE, limit=16 * 1024 * 1024))
        except (OSError, ValueError) as error:
            return {**(cached or {'families': [], 'fetched': 0}), 'offline': True, 'problem': f'The font list could not be updated ({error}).'}
        fresh = {'families': families, 'fetched': self.clock()}
        self.cache.parent.mkdir(parents=True, exist_ok=True)
        temporary = self.cache.with_name(f'.{self.cache.name}.{uuid.uuid4().hex}.tmp')
        temporary.write_text(json.dumps(fresh, ensure_ascii=False), encoding='utf-8'); temporary.replace(self.cache)
        return {**fresh, 'offline': False}

    def search(self, query='', limit=40):
        found = self.catalogue(); words = str(query or '').lower().split()
        families = [item for item in found['families'] if all(word in item['family'].lower() for word in words)]
        return {'families': families[:limit], 'total': len(families), 'offline': found['offline'], **({'problem': found['problem']} if found.get('problem') else {})}

    def entry(self, name):
        return next((item for item in self.catalogue()['families'] if item['family'] == name), None)

    def download(self, name, root):
        """Bring a family into root/static/fonts/<family>/: woff2 files, licence and font-face.css. Returns {'family',
        'category', 'faces' (for the theme block), 'files' (project paths to commit)}. All or nothing."""
        root = Path(root); folder = project_path(root, Path('static/fonts') / slug(name)); entry = self.entry(name)
        if not entry: raise ValueError(f'“{name}” is not in the Google Fonts list (or the list is not available offline yet).')
        if (folder / 'font-face.css').is_file():  # chosen before: its files are already here
            return {'family': name, 'category': entry['category'], 'faces': faces_of((folder / 'font-face.css').read_text(encoding='utf-8')), 'files': []}
        weights = [weight for weight in WEIGHTS if weight in entry['weights']] or entry['weights'][:2]
        query = urllib.parse.urlencode({'family': f'{name}:wght@{";".join(map(str, weights))}', 'display': 'swap'}, safe=':@;')
        css = self.fetch(f'{CSS}?{query}', limit=1024 * 1024).decode('utf-8')
        blocks = re.findall(r'@font-face\s*\{([^}]*)\}', css)
        if not blocks: raise ValueError(f'Google Fonts sent no font files for “{name}”.')
        if len(blocks) > FACES_CAP: raise ValueError(f'“{name}” comes in {len(blocks)} files, more than the {FACES_CAP} the workbench downloads.')
        temporary = folder.with_name(f'.{folder.name}.{uuid.uuid4().hex}.partial')
        try:
            temporary.mkdir(parents=True); total = 0; faces = []
            for index, block in enumerate(blocks):
                props = dict((key.strip(), value.strip()) for key, value in (line.split(':', 1) for line in block.split(';') if ':' in line))
                address = re.search(r'url\((https://[^)\s]+)\)', props.get('src', ''))
                if not address or urllib.parse.urlsplit(address[1]).hostname != 'fonts.gstatic.com': raise ValueError(f'A font file for “{name}” is not on fonts.gstatic.com.')
                body = self.fetch(address[1], limit=FILE_CAP)
                if body[:4] != b'wOF2': raise ValueError(f'A file for “{name}” is not a woff2 font: refused.')
                total += len(body)
                if total > TOTAL_CAP: raise ValueError(f'“{name}” is larger than {TOTAL_CAP // (1024 * 1024)} MB: refused.')
                weight = re.sub(r'[^0-9 ]', '', props.get('font-weight', '400')).strip().replace(' ', '-') or '400'
                style = 'italic' if props.get('font-style') == 'italic' else 'normal'
                file = f'{weight}{"i" if style == "italic" else ""}-{index:03d}.woff2'
                (temporary / file).write_bytes(body)
                face = [('font-family', f'"{name}"'), ('font-style', style), ('font-weight', weight.replace('-', ' ')), ('font-display', 'swap'),
                        ('src', f'url("fonts/{slug(name)}/{file}") format("woff2")')]  # relative to static/app.css, which Tailwind writes
                if re.fullmatch(r'[Uu]\+[0-9A-Fa-f?,\s+Uu-]+', props.get('unicode-range', '')): face.append(('unicode-range', props['unicode-range']))
                faces.append(face)
            licence = self.licence(name)
            (temporary / licence[0]).write_bytes(licence[1])
            (temporary / 'font-face.css').write_text(''.join('@font-face { ' + '; '.join(f'{key}: {value}' for key, value in face) + '; }\n' for face in faces), encoding='utf-8')
            folder.parent.mkdir(parents=True, exist_ok=True)
            if folder.exists(): raise ValueError(f'{folder.relative_to(root)} already exists and was left as it is.')
            temporary.replace(folder)
        finally:
            if temporary.exists(): shutil.rmtree(temporary)  # only the half-finished download this call made
        return {'family': name, 'category': entry['category'], 'faces': faces, 'files': [str(path.relative_to(root)) for path in sorted(folder.iterdir())]}

    def licence(self, name):
        """(file name, text) of the family's licence from github.com/google/fonts, else a note pointing at it."""
        folder = re.sub(r'[^a-z0-9]', '', name.lower())
        for kind, file in LICENCES:
            try: return file, self.fetch(f'https://raw.githubusercontent.com/google/fonts/main/{kind}/{folder}/{file}', limit=256 * 1024)
            except (OSError, ValueError): continue
        return 'LICENSE.txt', f'{name} is from Google Fonts. Its licence: https://fonts.google.com/specimen/{name.replace(" ", "+")}/license\n'.encode()


def faces_of(css):
    """@font-face rules → the block's [(property, value)] lists."""
    return [[(key.strip(), value.strip()) for key, value in (line.split(':', 1) for line in block.split(';') if ':' in line)] for block in re.findall(r'@font-face\s*\{([^}]*)\}', css)]
