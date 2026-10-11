import unittest
from unittest.mock import patch, MagicMock
import get_news_rss

class TestNewsRSS(unittest.TestCase):
    def test_get_ai_news_rss_limit(self):
        # Sample XML with 15 items to test the limit of 10
        sample_xml = b'<?xml version="1.0"?><rss><channel>' + \
                     b'<item><title>T1</title><link>L1</link></item>' * 15 + \
                     b'</channel></rss>'
        
        with patch('urllib.request.urlopen') as mock_urlopen:
            mock_response = MagicMock()
            mock_response.read.return_value = sample_xml
            # The context manager __enter__ should return the mock_response
            mock_urlopen.return_value.__enter__.return_value = mock_response
            
            news = get_news_rss.get_ai_news_rss()
            self.assertEqual(len(news), 10)

if __name__ == "__main__":
    unittest.main()
