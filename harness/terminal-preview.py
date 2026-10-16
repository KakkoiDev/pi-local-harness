"""Run the project's own Textual server, adding the Preview's narrow keyboard bridge in memory."""
from pathlib import Path
import runpy
import sys
import re
from contextvars import ContextVar
from textual_serve.app_service import AppService
from aiohttp import web
from textual_serve.server import Server

sys.path.insert(0,str(Path.cwd()))
script=(Path(__file__).with_name('terminal-bridge.js')).read_text()
original=Server._make_app
request_language=ContextVar('preview_language',default=None)
environment=AppService._build_environment
def build_environment(service,*args,**kwargs):
    values=environment(service,*args,**kwargs)
    if request_language.get() in ('en','ja'):values['APP_LANG']=request_language.get()
    return values
AppService._build_environment=build_environment

@web.middleware
async def bridge(request,handler):
    language=request.query.get('lang');token=request_language.set(language if language in ('en','ja') else None)
    try:response=await handler(request)
    finally:request_language.reset(token)
    if isinstance(response,web.Response) and response.content_type=='text/html':
        response.text=re.sub(r'https?://(?:127\.0\.0\.1|localhost):\d+(?=/static/)', '', response.text)
        response.text=re.sub(r'<link[^>]+fonts\.googleapis\.com[^>]*>', '', response.text)
        response.text=response.text.replace('<head>','<head><script>'+script+'</script>',1)
    return response

async def make_app(server):
    app=await original(server)
    app.middlewares.append(bridge)
    return app

Server._make_app=make_app
runpy.run_path('serve.py',run_name='__main__')
