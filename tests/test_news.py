import unittest
from unittest.mock import patch, MagicMock
import get_news

class TestNewsScraper(unittest.TestCase):
    def test_get_ai_news_extraction(self):
        sample_html = b'<html><body><h2>AI Breakthrough</h2><h3>New LLM Released</h3></body></html>'
        
        with patch('urllib.request.urlopen') as mock_urlopen:
            mock_response = MagicMock()
            mock_response.read.return_value = sample_html
            mock_urlopen.return_value.__enter__.return_value = mock_response
            
            headlines = get_news.get_ai_news()
            self.assertIn("AI Breakthrough", headlines)
            self.assertIn("New LLM Released", headlines)

if __name__ == "__main__":
    unittest.main()
