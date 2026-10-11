import urllib.request
import xml.etree.ElementTree as ET

def get_ai_news_rss():
    url = 'https://hnrss.org/newest?q=AI'
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    try:
        request = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(request) as response:
            xml_data = response.read()
            root = ET.fromstring(xml_data)
            
            news_items = []
            for item in root.findall('.//item'):
                title = item.find('title').text
                link = item.find('link').text
                news_items.append({'title': title, 'link': link})
            
            return news_items[:10]
    except Exception as e:
        return [f"Error: {str(e)}"]

if __name__ == "__main__":
    print("Fetching latest AI news via Hacker News RSS...")
    news = get_ai_news_rss()
    if not news or isinstance(news[0], str):
        print(news[0] if news else "No news found.")
    else:
        for i, item in enumerate(news, 1):
            print(f"{i}. {item['title']} ({item['link']})")
