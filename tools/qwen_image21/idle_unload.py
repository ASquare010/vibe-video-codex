"""One shared idle-memory policy for all MiniMax/Qwen ComfyUI jobs."""
from __future__ import annotations
import datetime
import json
from pathlib import Path
import threading
import time

import httpx


class IdleUnloader:
    def __init__(self, backend, video_api, local_pending, state_file, idle_seconds=5,
                 clock=time.monotonic, client_factory=httpx.Client):
        self.backend = backend.rstrip('/')
        self.video_api = video_api.rstrip('/')
        self.local_pending = local_pending
        self.file = Path(state_file)
        self.delay = idle_seconds
        self.clock = clock
        self.client_factory = client_factory
        self.lock = threading.RLock()
        self.idle_since = None
        self.dirty = True
        self.requested = None
        self.retry_after = 0
        self.state = {'enabled': True, 'scope': ['MiniMax H3', 'Qwen Image 2.1', 'ComfyUI queue'],
                      'idle_seconds': idle_seconds, 'phase': 'starting',
                      'per_job_keep_loaded_override': False, 'last_unload': None}
        if self.file.exists():
            try:
                self.state['last_unload'] = json.loads(self.file.read_text())['last_unload']
            except (OSError, ValueError, KeyError):
                pass

    def status(self):
        with self.lock:
            return json.loads(json.dumps(self.state))

    def record(self, **changes):
        with self.lock:
            if all(self.state.get(k) == v for k, v in changes.items()):
                return
            self.state.update(changes, updated_at=datetime.datetime.now(datetime.timezone.utc).isoformat())
            self.file.parent.mkdir(parents=True, exist_ok=True)
            tmp = self.file.with_suffix('.tmp')
            tmp.write_text(json.dumps(self.state, indent=2) + '\n')
            tmp.replace(self.file)

    def snapshot(self, client):
        h = client.get(self.video_api + '/v1/health').raise_for_status().json()
        q = client.get(self.backend + '/queue').raise_for_status().json()
        s = client.get(self.backend + '/system_stats').raise_for_status().json()
        # Fail closed on unavailable services or an unexpected response shape.
        if not h.get('ready') or not h.get('backend') or not isinstance(h.get('queue_length'), int):
            raise RuntimeError('MiniMax readiness/queue is unavailable')
        if not isinstance(q.get('queue_running'), list) or not isinstance(q.get('queue_pending'), list):
            raise RuntimeError('ComfyUI queue is unavailable')
        if not s.get('devices'):
            raise RuntimeError('ComfyUI memory statistics are unavailable')
        busy = (self.local_pending() or h.get('active_job') is not None or h['queue_length'] != 0
                or bool(q['queue_running']) or bool(q['queue_pending']))
        return bool(busy), s['devices']

    @staticmethod
    def reserved(devices):
        return sum(d['torch_vram_total'] for d in devices if d.get('type') == 'cuda')

    def tick(self):
        try:
            with self.client_factory(timeout=10) as c:
                busy, devices = self.snapshot(c)
                now = self.clock()
                if busy:
                    self.idle_since, self.dirty, self.requested = None, True, None
                    self.record(phase='jobs-active', error=None)
                    return
                if self.requested is not None:
                    if self.reserved(devices) <= 256 * 1024**2:
                        receipt = {**self.state['pending_unload'], 'verified_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                                   'devices_after': devices, 'weights_in_vram_released': True}
                        self.dirty, self.requested = False, None
                        self.record(phase='unloaded', last_unload=receipt, pending_unload=None, error=None)
                        return
                    if now - self.requested < 30:
                        return
                    self.requested = None
                    self.retry_after = now + 30
                    self.record(phase='awaiting-memory-release', error='Unload accepted but model memory is still reserved; retry only while idle')
                if not self.dirty:
                    if self.reserved(devices) <= 256 * 1024**2:
                        return
                    # Catch a short/direct ComfyUI job even if it finished between polls.
                    self.dirty, self.idle_since = True, None
                if self.idle_since is None:
                    self.idle_since = now
                    self.record(phase='idle-delay', error=None)
                if now - self.idle_since < self.delay or now < self.retry_after:
                    return
                # Recheck all three sources immediately before setting ComfyUI's idle free flags.
                busy, devices = self.snapshot(c)
                if busy:
                    self.idle_since, self.dirty = None, True
                    self.record(phase='jobs-active', error=None)
                    return
                response = c.post(self.backend + '/free', json={'unload_models': True, 'free_memory': True})
                response.raise_for_status()
                self.requested = now
                self.record(phase='unload-requested', pending_unload={
                    'requested_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    'all_api_and_backend_queues_idle': True, 'http_status': response.status_code,
                    'devices_before': devices, 'action': {'unload_models': True, 'free_memory': True}}, error=None)
        except Exception as e:
            self.idle_since = None
            self.record(phase='waiting-for-services', error=str(e))

    def run(self, stop):
        while not stop.is_set():
            self.tick()
            stop.wait(2)
