"""Token progress, rather than open requests, authorizes concurrent production work."""
try:
    import isolation
except ModuleNotFoundError:
    from tests import isolation
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from harness import capability
from harness.work_queue import WorkQueue

class EvidenceTest(unittest.TestCase):
    def test_a_stalled_open_stream_is_not_parallel_generation(self):
        rows=[{'events':[0,1,2,3], 'first_token':0,'end':20},
              {'events':[4,5,6,7], 'first_token':4,'end':8}]
        self.assertEqual(capability.classify(rows), 'not_supported')

    def test_repeated_interleaved_tokens_support_parallel_generation(self):
        self.assertEqual(capability.classify([{'events':[0,2,4,6,8]}, {'events':[1,3,5,7,9]}]), 'supported')

    def test_short_or_buffered_output_is_unknown(self):
        self.assertEqual(capability.classify([{'events':[0,1]}, {'events':[.5,1.5]}]), 'unknown')
        self.assertEqual(capability.classify([{'events':[1]*8}, {'events':[1]*8}]), 'unknown')

    def test_production_requires_matching_managed_configuration_and_tested_limits(self):
        with tempfile.TemporaryDirectory() as directory:
            key={'digest':'abc','ollama':'v','serving':{'instance':'x','num_ctx':8192,'num_parallel':2},'configuration_verified':True}
            record={**key,'schema':2,'status':'supported','verdict':'parallel','tested_ctx':8192,'tested_slots':2}
            Path(directory,'model-capabilities.json').write_text(json.dumps({'m':record}))
            with patch.object(capability,'keys',return_value={'m':key}):
                self.assertEqual(capability.capacity(directory,'m',8192),2)
                self.assertEqual(capability.capacity(directory,'m',32768),1)
            with patch.object(capability,'keys',return_value={'m':{**key,'serving':{**key['serving'],'instance':'y'}}}):
                self.assertEqual(capability.capacity(directory,'m',8192),1)
            with patch.object(capability,'keys',return_value={'m':{**key,'configuration_verified':False}}):
                self.assertEqual(capability.capacity(directory,'m',8192),1)

class SchedulingTest(unittest.TestCase):
    def test_project_agents_report_actual_admission_and_shared_workspace_exclusion(self):
        with tempfile.TemporaryDirectory() as directory:
            queue=WorkQueue(Path(directory)/'q.json',lambda *args:None,start=False,
                            mode=lambda:('parallel',2),workspace=lambda project:'/projects/'+('p' if project=='alias' else project))
            queue.add('p','chat-p',{'message':'one'})
            queue.jobs[0]['status']='running'
            agents=queue.project_agents([{'id':p,'chat':'chat-'+p} for p in ['p','q','alias']])
            self.assertEqual(agents['p']['running'],[queue.jobs[0]['id']])
            self.assertFalse(agents['p']['available'])
            self.assertFalse(agents['alias']['available'])
            self.assertTrue(agents['q']['available'])
            queue.add('q','chat-q',{'message':'two'})
            queue.jobs[1]['status']='running'
            self.assertFalse(queue.project_agents([{'id':'r','chat':'chat-r'}])['r']['available'])
            queue.jobs[0]['status']='completed'
            queue.mode=lambda:('one at a time',1)
            self.assertFalse(queue.project_agents([{'id':'p','chat':'chat-p'}])['p']['available'])

    def test_agent_snapshot_reserves_older_jobs_without_claiming_and_obeys_terminal_hold(self):
        with tempfile.TemporaryDirectory() as directory:
            held=False
            queue=WorkQueue(Path(directory)/'q.json',lambda *args:None,start=False,
                            mode=lambda:('parallel',2),busy=lambda:held)
            queue.add('p','p-chat',{'message':'older'})
            queue.add('q','q-chat',{'message':'older too'})
            projects=[{'id':'r','chat':'r-chat'}]
            self.assertFalse(queue.project_agents(projects)['r']['available'])
            self.assertEqual([job['status'] for job in queue.jobs],['queued','queued'])
            queue.jobs[0]['status']='completed'
            self.assertTrue(queue.project_agents(projects)['r']['available'])
            held=True
            self.assertFalse(queue.project_agents(projects)['r']['available'])
            held=False
            projects[0]['missing']=True
            self.assertFalse(queue.project_agents(projects)['r']['available'])

    def test_missing_running_workspace_does_not_break_project_agent_status(self):
        with tempfile.TemporaryDirectory() as directory:
            def workspace(project):
                if project=='missing':raise ValueError('Project not found')
                return '/projects/'+project
            queue=WorkQueue(Path(directory)/'q.json',lambda *args:None,start=False,
                            mode=lambda:('parallel',2),workspace=workspace)
            queue.add('missing','old-chat',{'message':'one'})
            queue.jobs[0]['status']='running'
            self.assertFalse(queue.project_agents([{'id':'q','chat':'q-chat'}])['q']['available'])

    def test_unknown_serializes_across_chat_and_work(self):
        with tempfile.TemporaryDirectory() as directory:
            queue=WorkQueue(Path(directory)/'q.json',lambda *args:None,start=False)
            queue.add('p','a',{'message':'action','worker':True}); queue.jobs[0]['status']='running'
            queue.add('q','b',{'message':'chat'})
            self.assertFalse(queue.runnable(queue.jobs[1]))

    def test_parallel_chats_use_total_bound_and_preserve_histories_and_workspaces(self):
        with tempfile.TemporaryDirectory() as directory:
            queue=WorkQueue(Path(directory)/'q.json',lambda *args:None,start=False,mode=lambda:('parallel',2))
            queue.add('p','a',{'message':'one'}); queue.jobs[0]['status']='running'
            queue.add('q','b',{'message':'two'})
            self.assertTrue(queue.runnable(queue.jobs[1])); queue.jobs[1]['status']='running'
            queue.add('r','c',{'message':'three'})
            self.assertFalse(queue.runnable(queue.jobs[2]))
            queue.jobs[1]['status']='completed'
            queue.add('p','a',{'message':'same history','worker':True})
            self.assertFalse(queue.runnable(queue.jobs[-1]))
            queue.add('p','d',{'message':'same workspace','worker':True})
            self.assertFalse(queue.runnable(queue.jobs[-1]))

class FailureTest(unittest.TestCase):
    def test_stream_errors_are_persisted_and_never_authorize_parallelism(self):
        key={'digest':'abc','ollama':'v','serving':{},'num_parallel':'2'}
        with tempfile.TemporaryDirectory() as directory, patch.object(capability,'keys',return_value={'m':key}), patch.object(capability,'together',side_effect=RuntimeError('runner failed')):
            result=capability.check(directory,'m')
            self.assertEqual(result['status'],'error')
            self.assertEqual(capability.status(directory,'m'),'error')
            self.assertEqual(capability.capacity(directory,'m',4096),1)
            self.assertIn('runner failed',result['reason'])

    def test_empty_completed_streams_are_unknown_and_persist_without_crashing(self):
        key={'digest':'abc','ollama':'v','serving':{},'num_parallel':'2'}
        row={'events':[],'tokens':0,'end':1}
        with tempfile.TemporaryDirectory() as directory,patch.object(capability,'keys',return_value={'m':key}),patch.object(capability,'together',side_effect=[[row],[row],[row,row]]):
            self.assertEqual(capability.check(directory,'m')['status'],'unknown')
            self.assertEqual(capability.status(directory,'m'),'unknown')

    def test_digest_backend_endpoint_and_config_changes_invalidate_old_evidence(self):
        key={'digest':'abc','backend':'ollama','ollama':'v','serving':{'url':'http://127.0.0.1:1','num_ctx':8192}}
        with tempfile.TemporaryDirectory() as directory:
            Path(directory,'model-capabilities.json').write_text(json.dumps({'m':{**key,'schema':2,'status':'supported'}}))
            for part,value in [('digest','xyz'),('backend','other'),('ollama','new'),('serving',{'url':'http://127.0.0.1:2','num_ctx':4096})]:
                self.assertEqual(capability.status(directory,'m',{'m':{**key,part:value}}),'unknown')

    def test_workspace_aliases_cannot_run_together(self):
        with tempfile.TemporaryDirectory() as directory:
            queue=WorkQueue(Path(directory)/'q.json',lambda *args:None,start=False,mode=lambda:('parallel',2),workspace=lambda project:'same path')
            queue.add('alias-a','a',{'message':'one'}); queue.jobs[0]['status']='running'
            queue.add('alias-b','b',{'message':'two','worker':True})
            self.assertFalse(queue.runnable(queue.jobs[1]))

    def test_unavailable_memory_or_long_context_reduces_production_admission(self):
        from harness.web_chat import WebChat
        from harness import model
        with tempfile.TemporaryDirectory() as directory:
            chat=WebChat(Path(directory)/'chats',1,2,data_root=Path(directory)/'data')
            try:
                with patch.object(model,'current',return_value={'model':'m','provider':'ollama'}),patch.object(capability,'serving',return_value=({'num_ctx':8192,'token_budget':16384},True)),patch.object(capability,'capacity',return_value=2),patch('harness.parallel_server.memory_available',return_value=4*1024**3):
                    self.assertEqual(chat.mode(),('parallel',2))
                    with patch('harness.parallel_server.memory_available',return_value=None):self.assertEqual(chat.mode(),('one at a time',1))
                    with patch.object(capability,'serving',return_value=({'num_ctx':32768,'token_budget':16384},True)):self.assertEqual(chat.mode(),('one at a time',1))
            finally:chat.close()

    def test_nested_workspaces_are_conflicting_even_with_different_project_ids(self):
        with tempfile.TemporaryDirectory() as directory:
            queue=WorkQueue(Path(directory)/'q.json',lambda *args:None,start=False,mode=lambda:('parallel',2),workspace=lambda project:'/workspace/'+project)
            queue.add('outer','a',{'message':'one'}); queue.jobs[0]['status']='running'
            queue.add('outer/inner','b',{'message':'two'})
            self.assertFalse(queue.runnable(queue.jobs[1]))

class ManagedServerTest(unittest.TestCase):
    def test_child_environment_is_explicit_and_only_owned_process_group_stops(self):
        from harness.parallel_server import ParallelServer
        from unittest.mock import MagicMock
        process=MagicMock(pid=42000); process.poll.return_value=None
        sock=MagicMock();sock.__enter__.return_value.getsockname.return_value=('127.0.0.1',19000)
        with tempfile.TemporaryDirectory() as directory, patch('harness.parallel_server.memory_available',return_value=20*1024**3),patch('harness.parallel_server.model.ollama',return_value={'models':[]}),patch('harness.parallel_server.shutil.which',return_value='/bin/echo'),patch('harness.parallel_server.socket.socket',return_value=sock),patch('harness.parallel_server.subprocess.Popen',return_value=process) as spawn,patch('harness.parallel_server.os.killpg') as kill:
            with patch.dict('os.environ',{'OLLAMA_API_KEY':'private-test-key'}):server=ParallelServer(directory).start()
            self.assertNotIn('private-test-key',json.dumps(server.config))
            try:
                env=spawn.call_args.kwargs['env']
                self.assertEqual((env['OLLAMA_NUM_PARALLEL'],env['OLLAMA_CONTEXT_LENGTH'],env['OLLAMA_MAX_LOADED_MODELS']),('2','8192','1'))
                self.assertEqual(server.config['token_budget'],16384)
                self.assertTrue(server.config['binary_sha256'])
            finally:server.close()
            self.assertEqual(kill.call_args.args[0],42000)

    def test_resident_owner_model_and_unknown_memory_refuse_start_without_stopping_anything(self):
        from harness.parallel_server import ParallelServer
        with tempfile.TemporaryDirectory() as directory,patch('harness.parallel_server.shutil.which',return_value='/bin/echo'),patch('harness.parallel_server.subprocess.Popen') as spawn:
            with patch('harness.parallel_server.memory_available',return_value=None):
                with self.assertRaisesRegex(ValueError,'memory'):ParallelServer(directory).start()
            with patch('harness.parallel_server.memory_available',return_value=20*1024**3),patch('harness.parallel_server.model.ollama',return_value={'models':[{'name':'owner'}]}):
                with self.assertRaisesRegex(ValueError,'nothing was stopped'):ParallelServer(directory).start()
            spawn.assert_not_called()

class AdmissionRaceTest(unittest.TestCase):
    def test_a_claimed_job_blocks_model_switches_and_smoke_before_its_process_starts(self):
        from harness.web_chat import WebChat
        from harness import model
        with tempfile.TemporaryDirectory() as directory:
            chat=WebChat(Path(directory)/'chats',1,2,data_root=Path(directory)/'data')
            try:
                with chat.queue.condition:
                    chat.queue.add('p','a',{'message':'claimed'})
                    chat.queue.jobs[0]['status']='running'
                with patch.object(chat,'listed_models',return_value=([{'id':'m','provider':'ollama','tools':True}],{})),patch.object(model,'switch') as switch:
                    with self.assertRaisesRegex(ValueError,'Pi is working'):chat.choose_model('m')
                    switch.assert_not_called()
                with patch.object(capability,'known',return_value='unknown'):
                    self.assertFalse(chat.measure_if_unknown('m'))
            finally:chat.close()

    def test_stop_of_a_claimed_job_survives_until_its_session_starts(self):
        from harness.web_chat import WebChat
        with tempfile.TemporaryDirectory() as directory:
            chat=WebChat(Path(directory)/'chats',1,2,data_root=Path(directory)/'data')
            try:
                conversation=chat.store.create()
                with chat.queue.condition:
                    job=chat.queue.add(None,conversation['id'],{'message':'cancel before starting'})
                    chat.queue.jobs[0]['status']='running'
                self.assertTrue(chat.stop(job['id'])['stopped'])
                with patch('harness.web_chat.subprocess.Popen') as spawn:
                    with self.assertRaisesRegex(ValueError,'^Stopped$'):chat.send(conversation['id'],{'message':'cancel before starting'},lambda event:None,job=job['id'])
                    spawn.assert_not_called()
                self.assertEqual(chat.active,{})
            finally:chat.close()

    def test_stop_during_prompt_delivery_is_stopped_even_if_the_pipe_breaks(self):
        from harness.web_chat import WebChat
        from unittest.mock import MagicMock
        with tempfile.TemporaryDirectory() as directory:
            chat=WebChat(Path(directory)/'chats',1,2,data_root=Path(directory)/'data')
            try:
                conversation=chat.store.create(); identifier=conversation['id']
                process=MagicMock(pid=42000);process.stdout.__iter__.return_value=iter(())
                def broken(message):
                    chat.stop(identifier)
                    raise BrokenPipeError('terminated while delivering prompt')
                process.stdin.write.side_effect=broken
                with patch.object(chat,'choice',return_value={'provider':'ollama','model':'m','effort':'off','thinking':False,'vision':False}),patch('harness.web_chat.pi_command',return_value=['fake-pi']),patch('harness.web_chat.subprocess.Popen',return_value=process),patch('harness.web_chat.stop_group'):
                    with self.assertRaisesRegex(ValueError,'^Stopped$'):chat.send(identifier,{'message':'work'},lambda event:None)
                self.assertEqual(chat.store.get(identifier)['messages'][-1]['ended']['state'],'stopped')
            finally:chat.close()
