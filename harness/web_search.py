"""Discussion search: a fixed HTTPS search endpoint, bounded text results, no page execution."""
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET


def read(url):
    request=urllib.request.Request(url,headers={'User-Agent':'Pi-Workbench/1.0'})
    with urllib.request.urlopen(request,timeout=15) as response:return response.read(512*1024)


def search(query):
    if not isinstance(query,str) or not query.strip() or len(query)>500:raise ValueError('Enter a search query of 1–500 characters.')
    data=read('https://www.bing.com/search?format=rss&q='+urllib.parse.quote(query.strip()))
    results=[]
    for item in ET.fromstring(data).findall('./channel/item')[:10]:
        url=item.findtext('link','')
        if urllib.parse.urlsplit(url).scheme not in ('http','https'):continue
        results.append({'title':item.findtext('title','')[:500],'url':url[:3000],'text':item.findtext('description','')[:2000]})
    return results
