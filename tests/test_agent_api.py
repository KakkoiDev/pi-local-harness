import unittest
import urllib.request
import json

class TestAgentAPI(unittest.TestCase):
    def setUp(self):
        self.url = "http://localhost:8000/chat"

    def test_chat_endpoint_returns_success(self):
        """Test that the /chat endpoint returns a 200 status and a valid JSON response."""
        data = json.dumps({"message": "Hello, Agent!"}).encode('utf-8')
        req = urllib.request.Request(
            self.url, 
            data=data, 
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                self.assertEqual(response.getcode(), 200)
                res_data = json.loads(response.read().decode('utf-8'))
                self.assertIn('reply', res_data)
                self.assertTrue(len(res_data['reply']) > 0)
        except urllib.error.URLError as e:
            self.fail(f"Failed to connect to the Agent API. Is it running? Error: {e}")

if __name__ == '__main__':
    unittest.main()
