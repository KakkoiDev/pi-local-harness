"""Observed Pi abort variants must not erase a pending control or hide real provider failures."""
try:
    import isolation
except ModuleNotFoundError:
    from tests import isolation
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from harness.web_chat import WebChat, ConversationStore


class IntentionalPauseTest(unittest.TestCase):
    def test_abort_is_only_intentional_with_control_or_recovery_context(self):
        from harness.web_chat import intentional_pause
        for kind in ('aborted','error'):
            message={'stopReason':kind,'errorMessage':'This operation was aborted'}
            self.assertTrue(intentional_pause(message,choice={'pending':True}))
            self.assertTrue(intentional_pause(message,plan={'pending':True}))
            self.assertTrue(intentional_pause(message,recovering=True))
            self.assertFalse(intentional_pause(message))
            self.assertFalse(intentional_pause(message,choice={'pending':False}))
        for error in ('Model crashed','404: model missing','This operation was aborted because authentication failed'):
            self.assertFalse(intentional_pause({'stopReason':'error','errorMessage':error},choice={'pending':True}))

    def test_rpc_control_pauses_persist_the_answer_and_control(self):
        for marker,key,text in [('TEST_ERROR_CHOICE','choice','Context before your choice.'),('TEST_ERROR_PLAN','plan','Context before your plan.')]:
            with self.subTest(marker=marker),tempfile.TemporaryDirectory() as directory:
                root=Path(directory);executable=root/'pi'
                executable.write_text('#!'+sys.executable+'\n'+Path('tests/fixtures/fake-pi.py').read_text());executable.chmod(0o755)
                chat=WebChat(root/'data',12345,3000,gate_token='scratch');self.addCleanup(chat.close)
                conversation=chat.store.create();events=[]
                with patch.dict(os.environ,{'PI_BINARY':str(executable)}):
                    chat.send(conversation['id'],{'message':marker},events.append)
                messages=ConversationStore(root/'data').get(conversation['id'])['messages']
                self.assertEqual(len(messages),2)
                self.assertEqual(messages[-1]['content'],text)
                self.assertTrue(messages[-1][key]['pending'])
                self.assertEqual(events[-1]['type'],'done')

    def test_pending_control_does_not_hide_a_real_provider_error(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);executable=root/'pi'
            executable.write_text('#!'+sys.executable+'\n'+Path('tests/fixtures/fake-pi.py').read_text());executable.chmod(0o755)
            chat=WebChat(root/'data',12345,3000,gate_token='scratch');self.addCleanup(chat.close)
            conversation=chat.store.create()
            with patch.dict(os.environ,{'PI_BINARY':str(executable)}):
                with self.assertRaisesRegex(ValueError,'Model crashed'):
                    chat.send(conversation['id'],{'message':'TEST_BROKEN_CHOICE'},lambda event:None)
