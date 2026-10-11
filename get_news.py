import urllib.request
import re

def get_ai_news():
    url = 'https://techcrunch.com/category/artificial-intelligence/'
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    try:
        request = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(request) as response:
            html = response.read().decode('utf-8')
            # Crude way to find headlines
            # headlines = re.findall(r'<h[23].*?>(.*?)</h[23]>', html, re.IGNORECASE | re.DOTALL)
            headlines = [] # Force failure for TDD
            # Clean up the headlines (remove HTML tags if any)
            clean_headlines = []
            for h in headlines:
                clean_h = re.sub('<[^<]+?>', '', h).strip()
                if clean_h:
                    clean_headlines.append(clean_h)
            return clean_headlines[:15]
    except Exception as e:
        return [f"Error: {str(e)}"]

if __name__ == "__main__":
    print("Fetching latest AI news from TechCrunch...")
    news = get_ai_news()
    if not news:
        print("No headlines found.")
    else:
        for i, headline in enumerate(news, 1):
            print(f"{i}. {headline}")
