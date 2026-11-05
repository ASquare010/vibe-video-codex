"""Transport/durability tests with a mocked GPU backend; no model inference."""
import importlib.util
import io
import json
import os
import sys
from pathlib import Path
import tempfile
import unittest
from unittest.mock import MagicMock, patch
import uuid

from fastapi.testclient import TestClient
import httpx
from PIL import Image

spec = importlib.util.spec_from_file_location('qwen_api', Path(__file__).with_name('app.py'))
api = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = api
spec.loader.exec_module(api)


class JobsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        api.STATE = Path(self.tmp.name) / 'state'
        api.COMFY = Path(self.tmp.name) / 'ComfyUI'
        (api.COMFY / 'input').mkdir(parents=True)
        os.environ['QWEN_DISABLE_WORKER'] = '1'
        self.client = TestClient(api.app)
        self.client.__enter__()
        f = io.BytesIO()
        Image.new('RGB', (32, 32), 'blue').save(f, format='PNG')
        self.png = f.getvalue()
        self.upload = self.client.post('/v1/files', files={'file': ('reference.png', self.png, 'image/png')}).json()
        self.body = {'prompt': 'Keep <image1> unchanged', 'images': [self.upload['id']], 'unload_after': False}
        self.validation = patch.object(api, 'validate_request', side_effect=lambda r: [api.uploaded(x)[0] for x in r.images])
        self.validation.start()

    def tearDown(self):
        self.validation.stop()
        self.client.__exit__(None, None, None)
        self.tmp.cleanup()

    def submit(self, key='test-key-0001', body=None):
        return self.client.post('/v1/jobs', json=body or self.body, headers={'Idempotency-Key': key})

    def backend(self, entry=None, lost=False):
        client = MagicMock()
        client.__enter__.return_value = client
        def get(route):
            if route == '/queue':
                data = {'queue_running': [], 'queue_pending': []}
            else:
                data = {route.split('/')[-1]: entry} if entry else {}
            return httpx.Response(200, json=data, request=httpx.Request('GET', 'http://test' + route))
        def post(route, json):
            if lost:
                raise httpx.ReadTimeout('response lost')
            return httpx.Response(200, json={'prompt_id': json.get('prompt_id')}, request=httpx.Request('POST', 'http://test' + route))
        client.get.side_effect = get
        client.post.side_effect = post
        return client

    def output_entry(self):
        folder = api.COMFY / 'output' / 'qwen_api'
        folder.mkdir(parents=True)
        (folder / 'test.png').write_bytes(self.png)
        return {'status': {'status_str': 'success', 'completed': True}, 'outputs': {'save': {'images': [{'filename': 'test.png', 'subfolder': 'qwen_api', 'type': 'output'}]}}}

    def test_upload_validation_and_content_dedup(self):
        second = self.client.post('/v1/files', files={'file': ('other.png', self.png, 'image/png')})
        self.assertEqual(second.json()['id'], self.upload['id'])
        self.assertEqual(self.client.post('/v1/files', files={'file': ('bad.png', b'not an image')}).status_code, 400)

    def test_idempotency_and_conflicting_body(self):
        a, b = self.submit(), self.submit()
        self.assertEqual(a.status_code, 201)
        self.assertEqual(a.json()['id'], b.json()['id'])
        self.assertEqual(len(api.jobs()), 1)
        self.assertEqual(self.submit(body={**self.body, 'prompt': 'Different'}).status_code, 409)
        self.assertEqual(self.client.post('/v1/jobs', json=self.body).status_code, 422)

    def test_interrupted_job_creation_recovers_same_id(self):
        a = self.submit().json()
        (api.STATE / 'jobs' / (a['id'] + '.json')).unlink()
        b = self.submit().json()
        self.assertEqual(a['id'], b['id'])

    def test_schema_guards(self):
        self.assertEqual(self.submit(body={**self.body, 'images': self.body['images'] * 11}).status_code, 422)
        self.assertEqual(self.submit(body={**self.body, 'width': 1024}).status_code, 422)
        self.assertEqual(self.submit(body={**self.body, 'refine_prompt': True, 'thinking': False}).status_code, 422)
        self.assertEqual(self.client.get('/v1/jobs/../../etc/passwd').status_code, 404)

    def test_completed_job_download_and_existing_prompt_resume(self):
        j = self.submit().json()
        api.update(j['id'], status='running', prompt_id=str(uuid.uuid4()))
        backend = self.backend(self.output_entry())
        with patch.object(api.httpx, 'Client', return_value=backend):
            api.run_job(api.job_get(j['id']))
        self.assertFalse(backend.post.called)
        out = self.client.get('/v1/jobs/' + j['id'] + '/output')
        self.assertEqual(out.status_code, 200)
        self.assertEqual(out.content, self.png)
        self.assertEqual(api.job_get(j['id'])['status'], 'completed')
        self.assertEqual(len(api.jobs()), 1)  # workflow/history files are not jobs

    def test_uncertain_backend_post_is_never_repeated(self):
        j = self.submit().json()
        backend = self.backend(lost=True)
        with patch.object(api.httpx, 'Client', return_value=backend), patch.object(api, 'video_idle', return_value=True), patch.object(api, 'prepare', return_value={}):
            api.run_job(j)
            api.run_job(api.job_get(j['id']))
        self.assertEqual(backend.post.call_count, 1)
        self.assertEqual(api.job_get(j['id'])['status'], 'submission_unknown')
        self.assertIsNotNone(api.job_get(j['id'])['prompt_id'])

    def test_cancelled_queued_job_cannot_start(self):
        j = self.submit().json()
        self.client.post('/v1/jobs/' + j['id'] + '/cancel')
        backend = self.backend()
        with patch.object(api.httpx, 'Client', return_value=backend):
            api.run_job(j)
        self.assertFalse(backend.post.called)
        self.assertEqual(api.job_get(j['id'])['status'], 'cancelled')

    def test_backend_post_waits_for_video_idle(self):
        j = self.submit().json()
        backend = self.backend(self.output_entry())
        with patch.object(api.httpx, 'Client', return_value=backend), patch.object(api, 'video_idle', side_effect=[False, True]) as idle, patch.object(api, 'prepare', return_value={}), patch.object(api.STOP, 'wait'):
            api.run_job(j)
        self.assertEqual(idle.call_count, 2)
        self.assertEqual(backend.post.call_count, 1)
        self.assertEqual(api.job_get(j['id'])['status'], 'completed')

    def test_path_escape_in_backend_history_is_rejected(self):
        j = self.submit().json()
        entry = self.output_entry()
        entry['outputs']['save']['images'][0]['filename'] = '../../outside.png'
        with self.assertRaises(RuntimeError):
            api.collect(j, entry)

    def test_graph_reference_order_and_model_choices(self):
        r = api.Generation(prompt='Use <image1> and <image2>', images=[str(uuid.uuid4())] * 2, precision='bf16', seed=12)
        g = api.graph_for(r, str(uuid.uuid4()), ['a.png', 'b.png'])
        self.assertEqual(g['encode']['inputs']['images.image_2'], ['image_2', 0])
        self.assertEqual(g['sample']['inputs']['latent_image'], ['encode', 2])
        self.assertEqual(g['model']['inputs']['unet_name'], 'qwen_image_2.1_bf16.safetensors')
        self.assertNotIn('enhancer_model', g)


if __name__ == '__main__':
    unittest.main(verbosity=2)
