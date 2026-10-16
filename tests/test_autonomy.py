"""One live global auto setting, explicit risk confirmation, durable reports; all data is scratch."""
try:
    import isolation  # noqa: F401
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import json
from pathlib import Path
import tempfile
import unittest
from harness.autonomy import enabled, set_enabled, RunReports
from harness.settings import validate


class AutonomyTest(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.data=Path(self.temp.name)

    def test_report_list_keeps_unseen_finished_runs_when_a_new_run_starts(self):
        runs=RunReports(self.data)
        first=runs.begin('/scratch/one');runs.finish('/scratch/one','roadmap done')
        runs.begin('/scratch/two')
        self.assertEqual([r['id'] for r in runs.list() if r.get('ended') and not r['seen']],[first])
        runs.mark_seen(first)
        self.assertEqual([r for r in runs.list() if r.get('ended') and not r['seen']],[])

    def test_every_enable_needs_the_risks_confirmed_and_the_setting_is_global_and_live(self):
        self.assertFalse(validate({})['auto_accept']);self.assertFalse(enabled(self.data))
        for _ in range(2):
            preview=set_enabled(self.data,True)
            self.assertTrue(preview['confirm']);self.assertTrue(preview['destructive'])
            for word in ['publish','push','download','send','Trash']:
                self.assertIn(word,preview['detail'])
            self.assertEqual(preview['action'],'Turn On')
            set_enabled(self.data,True,confirmed=True);self.assertTrue(enabled(self.data))
        set_enabled(self.data,False);self.assertFalse(enabled(self.data))
        self.assertFalse(RunReports(self.data).latest())
        for bad in ['true',1,None]:
            with self.assertRaises(ValueError):set_enabled(self.data,bad,confirmed=True)

    def test_reports_keep_four_sections_counts_and_unseen_state_across_restart(self):
        reports=RunReports(self.data);run=reports.begin('/scratch/game')
        self.assertEqual(reports.begin('/scratch/game'),run,'one run across task turns')
        for kind,value in [('done',{'task':'Ball','verified':True}),('decisions',{'question':'Speed','answer':'Medium'}),('external',{'action':'git push'}),('problems',{'reason':'A failed test was fixed'})]:
            reports.add('/scratch/game',kind,value)
        reports.finish('/scratch/game','roadmap done')
        saved=RunReports(self.data).latest()
        self.assertEqual(saved['id'],run);self.assertFalse(saved['seen']);self.assertEqual(saved['counts'],dict.fromkeys(['done','decisions','external','problems'],1))
        self.assertEqual(saved['outcome'],'roadmap done');self.assertTrue(saved['ended'])
        reports.mark_seen(run);self.assertTrue(RunReports(self.data).latest()['seen'])
        self.assertNotEqual(reports.begin('/scratch/game'),run,'a new run has its own report')

    def test_console_auto_and_config_alias_require_the_same_risk_confirmation(self):
        from harness.admin import Console,build
        console=Console(self.data,web_port=None)
        for command,args in [('auto',['on']),('config',['set','auto','true']),('config',['set','auto_accept','true'])]:
            preview,_=build(console,command,args)
            self.assertTrue(preview['confirm']);self.assertTrue(preview['destructive']);self.assertIn('cannot be taken back',preview['detail'])
            result,_=build(console,command,args,yes=True);self.assertTrue(result['enabled'])
        build(console,'auto',['off']);self.assertFalse(enabled(self.data))

    def test_bench_plan_scores_are_separate_from_app_success(self):
        from bench.runner import planning_metrics
        project=self.data/'project';(project/'tasks').mkdir(parents=True)
        (project/'tasks/001-ball.md').write_text('# Ball\n- [ ] Bounce\nDone when: Bounces.\n')
        (project/'tasks/002-ready-to-publish.md').write_text('# Audit\nDone when: Ready.\n')
        reports=RunReports(self.data);reports.begin(project)
        reports.add(project,'decisions',{'question':'Speed','answer':'Medium'})
        reports.add(project,'decisions',{'question':'Plan approval','answer':'Approved'})
        self.assertEqual(planning_metrics(project,self.data),{'tasks':1,'done_when':1,'decisions_asked':1})

    def test_publication_evidence_belongs_to_the_project_and_current_readme(self):
        import subprocess
        from harness import audit
        project=self.data/'app';project.mkdir();(project/'README.md').write_text('# Pong\n')
        subprocess.run(['git','init','-q',str(project)],check=True)
        folder=self.data/'audits';folder.mkdir();record=folder/'1.json';task='tasks/002-ready-to-publish.md'
        proof={'project':str(project),'task':task,'state':audit.project_state(project),'checks':[{'key':key,'passed':True} for key in audit.LABELS]}
        record.write_text(json.dumps(proof));self.assertTrue(audit.verified(project,self.data,task))
        self.assertFalse(audit.verified(self.data,self.data,task))
        (project/'README.md').write_text('# Changed app\n')
        self.assertFalse(audit.verified(project,self.data,task))

    def test_turning_off_closes_an_active_report_without_continuing_tasks(self):
        set_enabled(self.data,True,confirmed=True)
        reports=RunReports(self.data);reports.begin('/scratch/app');reports.step_finished('/scratch/app')
        result=set_enabled(self.data,False)
        self.assertEqual(result['report']['outcome'],'turned off')
        self.assertFalse(reports.index()['active']);self.assertFalse(enabled(self.data))

    def test_turning_off_during_a_step_leaves_the_report_open_until_that_step_finishes(self):
        set_enabled(self.data,True,confirmed=True)
        reports=RunReports(self.data);reports.begin('/scratch/app')
        set_enabled(self.data,False)
        self.assertIsNone(reports.latest()['ended'])
        reports.add('/scratch/app','done',{'task':'Current step','verified':True})
        reports.step_finished('/scratch/app');reports.finish('/scratch/app','turned off')
        self.assertEqual(reports.latest()['counts']['done'],1)
