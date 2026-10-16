import tempfile
import unittest
from pathlib import Path
from harness.music_artifacts import music_attachments


class MusicAttachmentsTest(unittest.TestCase):
    def test_only_successful_project_music_is_published_as_immutable_chat_files(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp); project=root/'project'; output=project/'assets/music/robot/0001'
            output.mkdir(parents=True); wav=output/'audio.wav'; wav.write_bytes(b'first')
            source=output/'score.json';source.write_text('{}')
            outside=root/'audio.wav';outside.write_bytes(b'private')
            event={'toolName':'music','result':{'details':{'artifacts':[str(wav),str(source),str(outside)]}}}
            uploads=root/'uploads'
            published=music_attachments(event,project,uploads,'chat-id')
            self.assertEqual([f['mime'] for f in published],['audio/wav','application/json'])
            self.assertTrue(all(f['url'].startswith('/api/files/chat-id/') for f in published))
            wav.write_bytes(b'revised');self.assertEqual((uploads/published[0]['url'].split('/')[-1]).read_bytes(),b'first')
            self.assertEqual(music_attachments({**event,'isError':True},project,uploads,'chat-id'),[])
            self.assertEqual(music_attachments({**event,'toolName':'bash'},project,uploads,'chat-id'),[])
            wav.unlink();wav.symlink_to(outside)
            self.assertEqual(len(music_attachments(event,project,uploads,'chat-id')),1)
