try:
    import isolation
except ModuleNotFoundError:
    from tests import isolation
import unittest
from unittest.mock import patch
from harness.web_search import search

class SearchTest(unittest.TestCase):
    def test_search_returns_bounded_links_without_executing_page_content(self):
        xml=b'<rss><channel><item><title>Official guide</title><link>https://example.org/guide</link><description>Read this.</description></item><item><title>Bad</title><link>file:///etc/passwd</link></item></channel></rss>'
        with patch('harness.web_search.read',return_value=xml):
            self.assertEqual(search('guide')[0]['url'],'https://example.org/guide')
            self.assertEqual(len(search('guide')),1)
        with self.assertRaises(ValueError):search('')
