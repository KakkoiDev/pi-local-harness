"""Generated media may be written in every phase, only as a new revision under its kind's assets folder (task 291)."""
try:
    import isolation  # noqa: F401
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from gate.phases import refusal

PHASES = ('discussion', 'planning', 'implementation')


class MediaWriteTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = (Path(self.temp.name) / 'project'); self.root.mkdir(); self.root = self.root.resolve()
        (self.root / 'tasks').mkdir()

    def check(self, phase, args, tool='music', cwd=None, task='', approved=False):
        return refusal(phase, self.root, 'write_file', args, cwd=str(cwd or self.root), pi_tool=tool, task=task, approved=approved)

    def composition(self, name='robot', revision=1, kind='music'):
        folder = self.root / 'assets' / kind / name
        for number in range(1, revision + 1):
            (folder / f'{number:04d}').mkdir(parents=True, exist_ok=True)
            (folder / f'{number:04d}' / 'audio.wav').write_bytes(b'RIFF')
        (folder / 'current.json').write_text(json.dumps({'revision': revision}))
        (folder / 'bank.json').write_text('{}')
        return folder

    def test_create_and_revise_succeed_in_every_phase_without_a_task(self):
        for phase in PHASES:
            self.assertIsNone(self.check(phase, {'action': 'create', 'name': 'robot'}), phase)
        self.composition()
        for phase in PHASES:
            for action in ('revise', 'render'):
                self.assertIsNone(self.check(phase, {'action': action, 'name': 'robot', 'base': 1}), (phase, action))

    def test_the_revision_actually_written_is_checked_not_only_the_first(self):
        folder = self.composition(revision=3)
        self.assertIsNone(self.check('discussion', {'action': 'revise', 'name': 'robot', 'base': 3}))
        # A stale base would write over an existing revision, or publish against an old score.
        for base in (1, 2, 4, 0, -1, None, True, '3', 3.0):
            self.assertIsNotNone(self.check('discussion', {'action': 'revise', 'name': 'robot', 'base': base}), base)
        # The next revision folder already exists (left behind, or planted): never overwritten.
        (folder / '0004').mkdir()
        reason = self.check('discussion', {'action': 'revise', 'name': 'robot', 'base': 3})
        self.assertIn('0004', reason)

    def test_create_never_overwrites_an_existing_composition(self):
        self.composition()
        for phase in PHASES:
            self.assertIn('already exists', self.check(phase, {'action': 'create', 'name': 'robot'}, task='Files: assets/music/robot/\n', approved=True))

    def test_unknown_composition_or_unreadable_pointer_is_refused(self):
        self.assertIsNotNone(self.check('discussion', {'action': 'revise', 'name': 'ghost', 'base': 1}))
        folder = self.composition(); (folder / 'current.json').write_text('not json')
        self.assertIsNotNone(self.check('discussion', {'action': 'revise', 'name': 'robot', 'base': 1}))

    def test_traversal_absolute_and_unsafe_names_are_refused(self):
        for name in ('../robot', '/tmp/robot', 'a/b', '', 'Robot', '.hidden', 'x' * 65, None, 7, str(self.root.parent / 'x')):
            for phase in PHASES:
                self.assertIsNotNone(self.check(phase, {'action': 'create', 'name': name}, task='Files: assets/\n', approved=True), (name, phase))

    def test_music_run_outside_the_project_folder_is_refused(self):
        outside = Path(self.temp.name) / 'elsewhere'; outside.mkdir()
        sub = self.root / 'src'; sub.mkdir()
        for cwd in (outside, sub):
            self.assertIsNotNone(self.check('discussion', {'action': 'create', 'name': 'robot'}, cwd=cwd))

    def test_symlinks_anywhere_on_the_way_are_refused(self):
        outside = Path(self.temp.name) / 'outside'; outside.mkdir()
        (self.root / 'assets').symlink_to(outside)
        self.assertIn('symlink', self.check('discussion', {'action': 'create', 'name': 'robot'}))
        (self.root / 'assets').unlink(); (self.root / 'assets').mkdir()
        (self.root / 'assets/music').symlink_to(outside)
        self.assertIn('symlink', self.check('discussion', {'action': 'create', 'name': 'robot'}))
        (self.root / 'assets/music').unlink()
        folder = self.composition()
        (folder / '0002').symlink_to(outside)
        self.assertIsNotNone(self.check('discussion', {'action': 'revise', 'name': 'robot', 'base': 1}))
        (folder / '0002').unlink()
        (folder / 'current.json').unlink(); target = outside / 'current.json'; target.write_text('{"revision": 1}')
        (folder / 'current.json').symlink_to(target)
        self.assertIn('symlink', self.check('discussion', {'action': 'revise', 'name': 'robot', 'base': 1}))
        other = self.root / 'assets/music/other'; other.symlink_to(folder)
        self.assertIn('symlink', self.check('discussion', {'action': 'revise', 'name': 'other', 'base': 1}))

    def test_a_plain_write_into_the_assets_folder_still_follows_the_phases(self):
        self.composition()
        for tool in ('write', 'edit'):
            args = {'path': 'assets/music/robot/0002/audio.wav', 'content': 'x'}
            self.assertIn('Discussion', refusal('discussion', self.root, 'write_file', args, cwd=str(self.root), pi_tool=tool))
            self.assertIn('Planning', refusal('planning', self.root, 'write_file', args, cwd=str(self.root), pi_tool=tool))
            self.assertIn('No approved task', refusal('implementation', self.root, 'write_file', args, cwd=str(self.root), pi_tool=tool))
            self.assertIn('not part of task', refusal('implementation', self.root, 'write_file', args, cwd=str(self.root), pi_tool=tool, task='# 1: X\nFiles: app.py\n', approved=True))
        # A shell command writing there is not the music tool either.
        self.assertIn('Discussion', refusal('discussion', self.root, 'execute_command', {'command': 'cp a.wav assets/music/robot/0002/'}, cwd=str(self.root), pi_tool='bash'))

    def test_other_music_actions_follow_the_phase_rules(self):
        self.assertIsNone(self.check('discussion', {'action': 'read', 'name': 'robot'}))
        self.assertIn('Discussion', self.check('discussion', {'action': 'delete', 'name': 'robot'}))
        self.assertIn('Planning', self.check('planning', {'action': 'delete', 'name': 'robot'}))

    def test_the_rule_is_a_table_a_visual_tool_reuses(self):
        from gate import media
        self.assertEqual(media.KINDS['music'].folder, 'assets/music')
        self.assertEqual(media.KINDS['visual'].folder, 'assets/visual')
        # A stub visual tool: same revision layout, its own folder.
        self.assertIsNone(self.check('discussion', {'action': 'create', 'name': 'meadow'}, tool='visual'))
        self.composition('meadow', kind='visual')
        self.assertIsNone(self.check('planning', {'action': 'revise', 'name': 'meadow', 'base': 1}, tool='visual'))
        self.assertIsNotNone(self.check('planning', {'action': 'revise', 'name': 'meadow', 'base': 0}, tool='visual'))
        self.assertIn('already exists', self.check('discussion', {'action': 'create', 'name': 'meadow'}, tool='visual'))
        # The kinds do not share folders: a music name is not a visual one.
        self.assertIsNotNone(self.check('discussion', {'action': 'revise', 'name': 'meadow', 'base': 1}))
        # A new kind is one table row.
        stub = media.Kind('assets/stub', ('make',), create='make')
        with patch.dict(media.KINDS, {'stub': stub}):
            self.assertIsNone(self.check('discussion', {'action': 'make', 'name': 'one'}, tool='stub'))
            self.assertIn('Discussion', self.check('discussion', {'action': 'erase', 'name': 'one'}, tool='stub'))


class MediaLedgerTest(unittest.TestCase):
    """Through the ledger, as Pi's tool call arrives: music create in Discussion is allowed, overwriting is refused."""
    def setUp(self):
        from gate.engine import GateEngine
        from gate.ledger import ProposalLedger
        from gate.paperwork import Paperwork
        from gate.protocol import Protocol
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = (Path(self.temp.name) / 'project'); self.root.mkdir(); self.root = self.root.resolve()
        (self.root / 'tasks').mkdir(); (self.root / 'ROADMAP.md').write_text('# Plan\n')
        self.ledger = ProposalLedger(GateEngine('', '/dev/null'))
        self.ledger.paperwork = Paperwork(Protocol())

    def test_discussion_create_allowed_and_overwrite_refused(self):
        self.assertEqual(self.ledger.paperwork.phases.get(self.root)['phase'], 'discussion')
        result = self.ledger.propose('write_file', {'action': 'create', 'name': 'robot'}, 'admin', pi_tool='music', cwd=str(self.root))
        self.assertEqual(result['outcome'], 'ALLOW', result)
        folder = self.root / 'assets/music/robot/0001'; folder.mkdir(parents=True)
        (folder.parent / 'current.json').write_text('{"revision": 1}')
        result = self.ledger.propose('write_file', {'action': 'create', 'name': 'robot'}, 'admin', pi_tool='music', cwd=str(self.root))
        self.assertEqual(result.get('rule'), 'G-015')
        result = self.ledger.propose('write_file', {'action': 'revise', 'name': 'robot', 'base': 1}, 'admin', pi_tool='music', cwd=str(self.root))
        self.assertEqual(result['outcome'], 'ALLOW', result)
        result = self.ledger.propose('write_file', {'path': 'assets/music/robot/0002/audio.wav', 'content': 'x'}, 'admin', pi_tool='write', cwd=str(self.root))
        self.assertEqual(result.get('rule'), 'G-015')


if __name__ == '__main__':
    unittest.main()
