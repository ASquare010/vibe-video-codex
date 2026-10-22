import fs from 'node:fs/promises';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import chokidar from 'chokidar';
import { projectSchema, type Project } from '../shared/project.ts';
import { durableWrite } from './persistence.ts';
import { writeAgentGuide } from './handoff.ts';

export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export class ProjectStore extends EventEmitter {
  private locks = new Map<string, Promise<unknown>>();
  private revisions = new Map<string, string>();
  constructor(public root: string) { super(); }
  folder(id: string) {
    if (!/^[\da-f-]{36}$/i.test(id)) throw new HttpError(400, 'Invalid project ID');
    return path.join(this.root, id);
  }
  async safeFile(id: string, relative: string) {
    const base = await fs.realpath(this.folder(id));
    const candidate = path.resolve(base, relative);
    const inside = (p: string) => p !== base && !path.relative(base, p).startsWith('..') && !path.isAbsolute(path.relative(base, p));
    if (!inside(candidate)) throw new HttpError(400, 'File must stay inside the project');
    const real = await fs.realpath(candidate);
    if (!inside(real)) throw new HttpError(400, 'Linked files outside the project are not allowed');
    return real;
  }
  async init() {
    await fs.mkdir(this.root, { recursive: true });
    const watcher = chokidar.watch(this.root, {
      ignoreInitial: true, depth: 2, usePolling: process.platform === 'win32', interval: 300,
      ignored: file => { const parts = path.relative(this.root, file).split(path.sep).filter(Boolean); return parts.length > 2 || (parts.length === 2 && parts[1] !== 'project.json'); },
      awaitWriteFinish: { stabilityThreshold: 250, pollInterval: 100 },
    });
    watcher.on('error', error => console.warn('Project watcher:', (error as Error).message));
    const notify = (file: string) => {
      if (path.basename(file) !== 'project.json') return;
      const projectId = path.basename(path.dirname(file));
      this.read(projectId).then(p => {
        const signature = JSON.stringify(p);
        if (this.revisions.get(projectId) === signature) return;
        this.revisions.set(projectId, signature);
        this.emit('change', { projectId, type: 'project', project: p });
      }).catch(error => this.emit('change', { projectId, type: 'invalid', message: `External project change rejected: ${error.message}` }));
    };
    watcher.on('change', notify);
    watcher.on('add', notify);
    return watcher;
  }
  async list(): Promise<Project[]> {
    const entries = await fs.readdir(this.root, { withFileTypes: true });
    const values = await Promise.all(entries.filter(e => e.isDirectory() && /^[\da-f-]{36}$/i.test(e.name)).map(e => this.read(e.name).catch(() => null)));
    return values.filter((p): p is Project => !!p).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  async read(id: string): Promise<Project> {
    try {
      const file = path.join(this.folder(id), 'project.json');
      for (let attempt = 0; ; attempt++) {
        try {
          const p = projectSchema.parse(JSON.parse(await fs.readFile(file, 'utf8')));
          if (!p.skill) {
            const content = await fs.readFile(path.resolve('video-skills/cinematic-story/SKILL.md'), 'utf8').catch(() => '');
            if (content) p.skill = { id: 'cinematic-story', name: 'Cinematic storyteller', content };
          }
          return p;
        }
        catch (error) {
          if (error instanceof SyntaxError && attempt < 4) { await new Promise(resolve => setTimeout(resolve, 40)); continue; }
          if (error instanceof SyntaxError) {
            try { return projectSchema.parse(JSON.parse(await fs.readFile(`${file}.pending`, 'utf8'))); } catch { /* Preserve and report the malformed canonical file. */ }
          }
          throw error;
        }
      }
    }
    catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') throw new HttpError(404, 'Project not found'); throw e; }
  }
  async create(project: Project) {
    const folder = this.folder(project.id);
    await fs.mkdir(folder, { recursive: false });
    for (const child of ['media', 'jobs', 'exports', 'revisions', 'annotations']) await fs.mkdir(path.join(folder, child));
    await writeAgentGuide(folder, project);
    await this.write(project);
    return project;
  }
  async write(project: Project) {
    const valid = projectSchema.parse(project);
    const destination = path.join(this.folder(project.id), 'project.json');
    await durableWrite(destination, JSON.stringify(valid, null, 2));
    this.revisions.set(project.id, JSON.stringify(valid));
    this.emit('change', { projectId: project.id, type: 'project', project: valid });
    return valid;
  }
  async mutate(id: string, update: (p: Project) => void | Promise<void>, revision?: number) {
    const previous = this.locks.get(id) ?? Promise.resolve();
    const next = previous.catch(() => {}).then(async () => {
      const p = await this.read(id);
      if (revision !== undefined && revision !== p.revision) throw new HttpError(409, 'Project changed elsewhere. Your edits are kept; reload the saved version before applying them again.');
      const before = JSON.stringify(p);
      await update(p);
      const disk = await this.read(id);
      if (JSON.stringify(disk) !== before) throw new HttpError(409, 'External change detected during save. Your edits have not overwritten it.');
      p.revision++;
      p.updatedAt = new Date().toISOString();
      return this.write(p);
    });
    this.locks.set(id, next);
    try { return await next; } finally { if (this.locks.get(id) === next) this.locks.delete(id); }
  }
}
