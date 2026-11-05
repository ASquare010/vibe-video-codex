"""Shared batch-end cleanup tests; all services and memory readings are simulated."""
import tempfile
from pathlib import Path
import unittest
import httpx

from idle_unload import IdleUnloader


class Backend:
    def __init__(self):
        self.video_active = None
        self.video_pending = 0
        self.qwen_pending = False
        self.running, self.pending = [], []
        self.reserved = 30 * 1024**3
        self.ready = True
        self.failed = False
        self.frees = []
        self.local_checks = 0
        self.busy_on_check = None

    def __enter__(self): return self
    def __exit__(self, *args): pass

    def local_pending(self):
        self.local_checks += 1
        return self.qwen_pending or self.local_checks == self.busy_on_check

    def get(self, url):
        if self.failed:
            raise httpx.ConnectError('service unavailable')
        if url.endswith('/v1/health'):
            data = {'ready': self.ready, 'backend': True, 'active_job': self.video_active, 'queue_length': self.video_pending}
        elif url.endswith('/queue'):
            data = {'queue_running': self.running, 'queue_pending': self.pending}
        else:
            data = {'devices': [{'type': 'cuda', 'torch_vram_total': self.reserved, 'vram_free': 40 * 1024**3 - self.reserved}]}
        return httpx.Response(200, json=data, request=httpx.Request('GET', url))

    def post(self, url, json):
        self.frees.append((url, json))
        self.reserved = 32 * 1024**2
        return httpx.Response(200, json={}, request=httpx.Request('POST', url))


class IdleTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.b = Backend()
        self.now = 0
        self.u = IdleUnloader('http://comfy', 'http://video', self.b.local_pending,
                              Path(self.tmp.name) / 'memory.json', clock=lambda: self.now,
                              client_factory=lambda **kwargs: self.b)

    def tearDown(self): self.tmp.cleanup()

    def tick(self, t):
        self.now = t
        self.u.tick()

    def test_unloads_both_models_once_after_all_idle(self):
        self.tick(0)
        self.tick(4)
        self.assertEqual(len(self.b.frees), 0)
        self.tick(5)
        self.tick(7)
        self.tick(100)
        self.assertEqual(self.b.frees, [('http://comfy/free', {'unload_models': True, 'free_memory': True})])
        self.assertEqual(self.u.status()['phase'], 'unloaded')
        self.assertTrue(self.u.status()['last_unload']['weights_in_vram_released'])

    def test_no_unload_for_any_active_or_queued_work(self):
        cases = [('video_active', 'preparing-job'), ('video_pending', 1), ('qwen_pending', True),
                 ('running', [[0, 'prompt']]), ('pending', [[1, 'prompt']])]
        for field, value in cases:
            with self.subTest(field=field):
                original = getattr(self.b, field)
                setattr(self.b, field, value)
                self.tick(0)
                self.tick(100)
                self.assertEqual(self.b.frees, [])
                setattr(self.b, field, original)

    def test_batch_handoff_does_not_unload_between_jobs(self):
        self.b.video_active = 'video'
        self.tick(0)
        self.b.video_active, self.b.qwen_pending = None, True
        self.tick(30)
        self.b.qwen_pending = False
        self.tick(40)
        self.tick(44)
        self.assertEqual(self.b.frees, [])
        self.tick(45)
        self.assertEqual(len(self.b.frees), 1)

    def test_new_job_during_final_recheck_prevents_unload(self):
        self.b.busy_on_check = 3
        self.tick(0)
        self.tick(6)
        self.assertEqual(self.b.frees, [])
        self.assertEqual(self.u.status()['phase'], 'jobs-active')

    def test_unavailable_or_not_ready_services_fail_closed(self):
        self.b.failed = True
        self.tick(0)
        self.tick(100)
        self.assertEqual(self.b.frees, [])
        self.b.failed, self.b.ready = False, False
        self.tick(200)
        self.tick(300)
        self.assertEqual(self.b.frees, [])
        self.assertEqual(self.u.status()['phase'], 'waiting-for-services')

    def test_next_batch_triggers_a_new_cleanup(self):
        self.tick(0)
        self.tick(5)
        self.tick(7)
        self.b.qwen_pending = True
        self.b.reserved = 25 * 1024**3
        self.tick(10)
        self.b.qwen_pending = False
        self.tick(20)
        self.tick(25)
        self.tick(27)
        self.assertEqual(len(self.b.frees), 2)

    def test_short_direct_job_cached_memory_is_detected(self):
        self.tick(0)
        self.tick(5)
        self.tick(7)
        self.b.reserved = 25 * 1024**3
        self.tick(20)
        self.tick(25)
        self.assertEqual(len(self.b.frees), 2)

    def test_startup_preserves_last_receipt_but_rechecks_current_state(self):
        self.tick(0)
        self.tick(5)
        self.tick(7)
        other = IdleUnloader('http://comfy', 'http://video', self.b.local_pending, self.u.file,
                             clock=lambda: self.now, client_factory=lambda **kwargs: self.b)
        self.assertIsNotNone(other.status()['last_unload'])
        self.b.video_pending = 1
        other.tick()
        self.assertEqual(other.status()['phase'], 'jobs-active')
        self.assertEqual(len(self.b.frees), 1)


if __name__ == '__main__': unittest.main(verbosity=2)
