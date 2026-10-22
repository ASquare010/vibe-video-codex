import fs from 'node:fs/promises';
import path from 'node:path';
import { skillSchema, type VideoSkill } from '../shared/project.ts';
import { HttpError } from './store.ts';
import { durableWrite } from './persistence.ts';

export class SkillCatalog {
  constructor(public root = path.resolve('video-skills')) {}
  file(id: string) { if (!/^[a-z][a-z0-9-]{0,60}$/.test(id)) throw new HttpError(400, 'Use a skill ID with lowercase letters, numbers and hyphens'); return path.join(this.root, id, 'SKILL.md'); }
  async read(id: string): Promise<VideoSkill> {
    const content = await fs.readFile(this.file(id), 'utf8');
    const name = content.match(/^name:\s*(.+)$/m)?.[1]?.replace(/^["']|["']$/g, '') ?? id;
    return skillSchema.parse({ id, name, content });
  }
  async list() {
    const dirs = await fs.readdir(this.root, { withFileTypes: true });
    return Promise.all(dirs.filter(d => d.isDirectory() && /^[a-z][a-z0-9-]*$/.test(d.name)).map(d => this.read(d.name)));
  }
  async save(value: VideoSkill) {
    const skill = skillSchema.parse(value); const file = this.file(skill.id);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await durableWrite(file, skill.content);
    return this.read(skill.id);
  }
}
