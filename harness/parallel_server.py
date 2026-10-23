"""An explicitly enabled, isolated Ollama instance. Never reconfigure or stop the owner's server.

Two slots, 8K context each, one resident model. A new instance invalidates its old smoke evidence.
"""
import json
import hashlib
import os
import shutil
import socket
import subprocess
import time
import uuid
from pathlib import Path
from harness import model

CONTEXT = 8192
SLOTS = 2
TOKEN_BUDGET = CONTEXT*SLOTS


def memory_available():
    """Available physical memory, not swap or the model's quantized file size. None fails closed."""
    try:
        if os.uname().sysname=='Darwin':
            import re
            output=subprocess.check_output(['memory_pressure','-Q'],text=True,timeout=3)
            percent=int(re.search(r'free percentage:\s*(\d+)%',output)[1])
            total=int(subprocess.check_output(['sysctl','-n','hw.memsize'],text=True,timeout=3))
            return total*percent//100
        for line in Path('/proc/meminfo').read_text().splitlines():
            if line.startswith('MemAvailable:'): return int(line.split()[1])*1024
    except (OSError,ValueError,TypeError,subprocess.SubprocessError): pass
    return None


class ParallelServer:
    def __init__(self,data):
        self.data=Path(data); self.process=None; self.log=None; self.config=None

    def start(self):
        executable=shutil.which('ollama')
        if not executable: raise ValueError('Parallel serving needs the installed Ollama executable.')
        available=memory_available()
        if available is None or available<16*1024**3:
            raise ValueError('Parallel serving needs a readable memory check and at least 16 GiB available before startup.')
        try:
            if model.ollama('/api/ps',timeout=2).get('models'):
                raise ValueError('Owner Ollama has a model loaded. Unload it before enabling the isolated parallel server; nothing was stopped.')
        except OSError: pass  # Owner Ollama need not be running; this child uses its own port.
        self.data.mkdir(parents=True,exist_ok=True)
        # Bind then close: if another process wins the port, our child exits and startup fails; never adopt it.
        with socket.socket() as probe:
            probe.bind(('127.0.0.1',0)); port=probe.getsockname()[1]
        self.url=f'http://127.0.0.1:{port}'
        settings={'OLLAMA_HOST':f'127.0.0.1:{port}','OLLAMA_NUM_PARALLEL':str(SLOTS),
                  'OLLAMA_CONTEXT_LENGTH':str(CONTEXT),'OLLAMA_MAX_LOADED_MODELS':'1',
                  'OLLAMA_FLASH_ATTENTION':'1','OLLAMA_KV_CACHE_TYPE':'q8_0', 'OLLAMA_KEEP_ALIVE':'30m'}
        # Hash inherited runner/GPU options so configuration changes invalidate evidence without recording credentials.
        serving={key:hashlib.sha256(value.encode()).hexdigest() for key,value in os.environ.items() if key.startswith(('OLLAMA_','GGML_','CUDA_','HIP_','ROCR_'))}
        serving.update(settings)
        self.log=(self.data/'parallel-ollama.log').open('a')
        try:
            self.process=subprocess.Popen([executable,'serve'],env={**os.environ,**settings},stdout=self.log,stderr=self.log,start_new_session=True)
            self.config={'previous_url':model.ollama_url(),'url':self.url,'pid':self.process.pid,'instance':uuid.uuid4().hex,'executable':str(Path(executable).resolve()),
                         'binary_sha256':hashlib.sha256(Path(executable).resolve().read_bytes()).hexdigest(),
                         'num_parallel':SLOTS,'num_ctx':CONTEXT,'token_budget':TOKEN_BUDGET,'environment':serving}
            deadline=time.monotonic()+7
            while time.monotonic()<deadline:
                if self.process.poll() is not None: raise ValueError('The isolated Ollama server stopped. See parallel-ollama.log.')
                try: model.ollama('/api/version',url=self.url,timeout=.3); return self
                except (OSError,ValueError): time.sleep(.1)
            raise ValueError('The isolated Ollama server did not start in seven seconds.')
        except BaseException:
            self.close(); raise

    def activate(self):
        os.environ['PI_OLLAMA_URL']=self.url
        os.environ['PI_OLLAMA_SERVING_CONFIG']=json.dumps(self.config,sort_keys=True)
        os.environ['PI_HARNESS_CONTEXT_WINDOW']=str(CONTEXT)

    def close(self):
        if self.process:
            # Only our own process group, including runners it spawned, ever receives a signal.
            import signal
            try: os.killpg(self.process.pid,signal.SIGTERM); self.process.wait(timeout=5)
            except ProcessLookupError: pass
            except subprocess.TimeoutExpired:
                try: os.killpg(self.process.pid,signal.SIGKILL)
                except ProcessLookupError: pass
                self.process.wait(timeout=5)
            self.process=None
        if self.log: self.log.close(); self.log=None
