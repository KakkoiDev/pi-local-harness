"""Explicit, pinned Laya setup. Requests never install or download the classifier."""
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import urllib.request
import uuid

ROOT=Path(__file__).resolve().parent.parent
LIMIT=100_000_000


def lock():
    value=json.loads((ROOT/'kit/laya-lock.json').read_text())
    major=int((platform.mac_ver()[0] or '0').split('.')[0])
    if major<26:
        replacements={x['name']:x for x in value['macos14_wheels']}
        value['wheels']=[replacements.get(x['name'],x) for x in value['wheels']]
    return value


def fetch(spec,target):
    target=Path(target)
    if target.exists():
        if target.stat().st_size==spec['size'] and hashlib.sha256(target.read_bytes()).hexdigest()==spec['sha256']:return
        raise ValueError('An existing classifier file differs from the pinned checksum; it was preserved.')
    digest=hashlib.sha256();count=0
    target.parent.mkdir(parents=True,exist_ok=True)
    partial=target.with_name(target.name+'.download-'+uuid.uuid4().hex)
    try:
        with urllib.request.urlopen(spec['url'],timeout=120) as response,partial.open('xb') as output:
            while True:
                chunk=response.read(min(1024*1024,spec['size']-count+1))
                if not chunk:break
                count+=len(chunk)
                if count>spec['size']:raise ValueError('Classifier download exceeds its pinned size.')
                digest.update(chunk);output.write(chunk)
        if count!=spec['size'] or digest.hexdigest()!=spec['sha256']:raise ValueError('Classifier download does not match its pinned checksum.')
        partial.rename(target)
    except BaseException:
        if partial.exists():
            from harness.documents import to_trash
            to_trash(partial)
        raise


def install(data,python=None,cache=None):
    spec=lock()
    if sum(x['size'] for x in spec['wheels'] if x['name']!='laya-mlx')>LIMIT:raise ValueError('Classifier dependencies exceed the approved 100 MB limit.')
    if platform.system()!='Darwin' or platform.machine()!='arm64' or int(platform.mac_ver()[0].split('.')[0])<14:raise ValueError('This pinned Laya runtime needs Apple Silicon and macOS 14 or newer.')
    uv=shutil.which('uv')
    if not uv:raise ValueError('Install uv before setting up the classifier.')
    target=Path(data)/'toolchain/laya';stamp=target/'VERSION'
    identity=hashlib.sha256(json.dumps(spec,sort_keys=True).encode()).hexdigest()
    if stamp.is_file() and stamp.read_text().strip()==identity and (target/'runtime/bin/python').is_file() and (target/'model/model.safetensors').is_file():return 'The local Laya classifier is already installed.'
    env={**os.environ,'UV_PYTHON_DOWNLOADS':'never','UV_CACHE_DIR':str(Path(data)/'toolchain/uv-cache')}
    if python is None:
        found=subprocess.run([uv,'python','find','3.12','--offline'],env=env,check=True,capture_output=True,text=True)
        python=found.stdout.strip()
    folder=target.parent/('laya-install-'+uuid.uuid4().hex);folder.mkdir(parents=True)
    try:
        for item in spec['wheels']:
            destination=folder/'wheels'/item['filename']
            cached=Path(cache)/item['filename'] if cache else None
            if cached and cached.is_file() and cached.stat().st_size==item['size'] and hashlib.sha256(cached.read_bytes()).hexdigest()==item['sha256']:
                destination.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(cached,destination)
            else:fetch(item,destination)
        for item in spec['model']['files']:fetch(item,folder/'model'/item['path'])
        subprocess.run([uv,'venv','--offline','--relocatable','--python',str(python),str(folder/'runtime')],env=env,check=True)
        subprocess.run([uv,'pip','install','--offline','--no-index','--no-deps','--python',str(folder/'runtime/bin/python'),*[str(folder/'wheels'/x['filename']) for x in spec['wheels']]],env=env,check=True)
        (folder/'VERSION').write_text(identity+'\n')
        if target.exists():
            from harness.documents import to_trash
            to_trash(target)
        folder.rename(target)
    except BaseException:
        from harness.documents import to_trash
        to_trash(folder)
        raise
    return f'Installed the local Laya classifier in {target} (pinned downloads, checksums verified).'
