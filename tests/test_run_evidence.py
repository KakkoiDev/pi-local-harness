try:
    import isolation
except ModuleNotFoundError:
    from tests import isolation
import json
import unittest
from harness.run_evidence import normalize

class RunEvidenceTest(unittest.TestCase):
    def row(self, event, source='pi', project='p', request='r'):
        return dict(project=project, request=request, source=source, event=event)
    def start(self, identity='a', **extra):
        return self.row(dict(type='tool_execution_start',toolCallId=identity,toolName='bash',**extra))
    def end(self, identity='a', error=False):
        return self.row(dict(type='tool_execution_end',toolCallId=identity,isError=error))
    def gate(self, outcome='ALLOW', identity='a'):
        return self.row(dict(phase='gate',outcome=outcome,tool_call=identity,tool='bash'),source='gate')
    def report(self, rows, **kw):return normalize(rows,project='p',request='r',**kw)
    def test_permission_is_not_execution(self):
        rows=self.report([self.gate(),self.gate('BLOCK','b'),self.start('c'),self.end('c',True)])['calls']
        self.assertEqual([r['state'] for r in rows],['unknown','blocked','failed'])
    def test_overlapping_calls_duplicate_and_retry(self):
        a=self.start(); rows=[a,a,self.start('b'),self.end('b'),self.end()]
        report=self.report(rows)
        self.assertEqual(len(report['calls']),2)
        self.assertEqual(report['duplicates'],1)
        self.assertTrue(all(c['state']=='succeeded' for c in report['calls']))
        self.assertEqual(report['calls'][0]['evidence'],[1,5])
    def test_missing_and_conflicting_results_are_honest(self):
        report=self.report([self.start(),self.end(),self.end(error=True),self.start('b'),self.end('c')])
        self.assertEqual([c['state'] for c in report['calls']],['conflicting','incomplete','result_only'])
    def test_scope_and_no_sensitive_text_survives(self):
        secret='SECRET-sensitive-value'
        report=self.report([self.start(args={'command':secret}),self.start(secret),self.start('other') | {'project':'elsewhere'},self.row({'toolCallId':'x','toolName':secret,'type':'tool_execution_start'})])
        self.assertEqual(len(report['calls']),3)
        self.assertNotIn(secret,json.dumps(report))
        self.assertNotIn('elsewhere',json.dumps(report))
    def test_malformed_unknown_and_unscoped_rows(self):
        report=self.report([None,{},self.row(None),self.row({'type':'message_update'}),self.start()])
        self.assertEqual(len(report['calls']),1)
        self.assertEqual(report['malformed'],2)
    def test_more_than_activity_retention_and_bounded_input(self):
        rows=[self.start(str(i)) for i in range(250)]
        self.assertEqual(len(self.report(rows)['calls']),250)
        report=self.report(iter(rows),limit=201)
        self.assertEqual(len(report['calls']),201)
        self.assertTrue(report['truncated'])
    def test_selection_and_limits_are_required(self):
        for kwargs in [dict(project='',request='r'),dict(project='p',request=''),dict(project='p',request='r',limit=0)]:
            with self.assertRaises(ValueError):normalize([],**kwargs)
    def test_refusal_and_start_are_conflicting(self):
        report=self.report([self.gate('BLOCK'),self.start()])
        self.assertEqual(report['calls'][0]['state'],'conflicting')
    def test_malformed_tool_label_does_not_crash_report(self):
        row=self.start();row['event']['toolName']=['not-a-string']
        self.assertEqual(self.report([row])['calls'][0]['tool'],'other')
    def test_all_gate_refusals_prevent_execution(self):
        for outcome in ('BLOCK','REVISE','ESCALATE'):
            self.assertEqual(self.report([self.gate(outcome)])['calls'][0]['state'],'blocked')
    def test_invalid_unicode_is_reported_without_crashing(self):
        self.assertEqual(self.report([self.start('\ud800')])['malformed'],1)
    def test_unknown_result_flag_does_not_mean_success(self):
        row=self.end();row['event']['isError']='false'
        report=self.report([self.start(),row])
        self.assertEqual(report['calls'][0]['state'],'incomplete')
        self.assertEqual(report['malformed'],1)
    def test_report_does_not_open_files_run_tools_or_contact_network(self):
        from unittest.mock import patch
        with patch('builtins.open',side_effect=AssertionError('file access')), patch('subprocess.run',side_effect=AssertionError('execution')), patch('socket.socket',side_effect=AssertionError('network')):
            report=self.report([self.start(args={'command':'touch /should-not-exist'}),self.end()])
        self.assertEqual(report['calls'][0]['state'],'succeeded')
    def test_gate_audit_is_not_a_pi_execution_receipt(self):
        event=dict(phase='audit',outcome='SUCCESS',tool_call='a',tool='read',args={'path':'private'},reason='secret')
        report=self.report([self.row(event,source='gate')])
        self.assertEqual(report['calls'][0]['state'],'unknown')
        self.assertEqual(report['calls'][0]['sources'],['gate'])
        self.assertNotIn('secret',json.dumps(report))
    def test_input_is_not_modified_and_report_is_deterministic(self):
        rows=[self.start(),self.end()];before=json.dumps(rows)
        self.assertEqual(self.report(rows),self.report(rows))
        self.assertEqual(json.dumps(rows),before)
    def test_limit_stops_consuming_a_long_input(self):
        def stream():
            yield self.start('1');yield self.start('2')
            raise AssertionError('read past bound')
        self.assertTrue(self.report(stream(),limit=1)['truncated'])
    def test_check_outcomes_are_retained_without_promoting_to_execution(self):
        rows=[self.gate(),self.row(dict(phase='audit',outcome='SUCCESS',tool_call='a',reason='private'),source='gate')]
        row=self.report(rows)['calls'][0]
        self.assertEqual(row['checks'],[{'phase':'gate','outcome':'ALLOW','position':1},{'phase':'audit','outcome':'SUCCESS','position':2}])
        self.assertEqual(row['state'],'unknown')
    def test_arbitrary_check_outcomes_are_not_exported(self):
        row=self.gate('SECRET-private-outcome')
        report=self.report([row])
        self.assertNotIn('SECRET',json.dumps(report))
        self.assertEqual(report['calls'][0]['checks'][0]['outcome'],'unknown')
