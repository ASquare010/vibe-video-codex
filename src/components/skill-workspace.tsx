import { useEffect, useState } from 'react';
import { BookOpen, Check, Save, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Field, FieldGroup, FieldLabel, FieldDescription } from './ui/field';
import { Badge } from './ui/badge';
import { api } from '../lib/api';
import type { Project, VideoSkill } from '../../shared/project';

export function SkillWorkspace({ project: p, edit, reportError }: { project: Project; edit: (f: (p: Project) => void) => void; reportError: (message: string) => void }) {
  const [catalog, setCatalog] = useState<VideoSkill[]>([]), [saved, setSaved] = useState(false);
  useEffect(() => { void api<VideoSkill[]>('/api/skills').then(setCatalog).catch(e => reportError(e.message)); }, []);
  const apply = (id: string) => { const skill = catalog.find(s => s.id === id); if (skill) edit(p => { p.skill = structuredClone(skill); }); };
  const saveLibrary = async () => {
    if (!p.skill) return;
    try { const content = p.skill.content.match(/^name:/m) ? p.skill.content.replace(/^name:.*$/m, `name: ${p.skill.name}`) : p.skill.content; const value = await api<VideoSkill>(`/api/skills/${p.skill.id}`, 'PUT', { ...p.skill, content }); edit(p => { p.skill = value; }); setCatalog(c => [...c.filter(s => s.id !== value.id), value]); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    catch (e) { reportError((e as Error).message); }
  };
  return <div className="skill-workspace"><div className="workspace-title"><div><span className="panel-eyebrow">ONE PROJECT · ONE SKILL</span><h2>The way this film is made.</h2><p>Voice, story, visuals, continuity and production rules in one editable guide.</p></div><Badge variant="outline"><BookOpen/>SKILL.md</Badge></div><FieldGroup><Field><FieldLabel htmlFor="selected-skill">Project skill</FieldLabel><select id="selected-skill" value={p.skill?.id ?? ''} onChange={e => apply(e.target.value)}><option value="" disabled>Choose a skill</option>{catalog.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><FieldDescription>Selecting a skill copies it into this project. Your project edits stay independent until you save them to the library.</FieldDescription></Field>{p.skill && <><Field><FieldLabel htmlFor="skill-name">Name</FieldLabel><Input id="skill-name" value={p.skill.name} onChange={e => edit(p => { p.skill!.name = e.target.value; })}/></Field><Field><FieldLabel htmlFor="skill-content">Instructions · Markdown</FieldLabel><Textarea id="skill-content" className="skill-markdown" value={p.skill.content} onChange={e => edit(p => { p.skill!.content = e.target.value; })} spellCheck={false} rows={24}/></Field><div className="skill-save-actions"><span>Library source: video-skills/{p.skill.id}/SKILL.md</span><Button variant="outline" size="sm" onClick={() => void saveLibrary()}>{saved ? <Check/> : <Save/>}{saved ? 'Saved to library' : 'Save to shared library'}</Button></div></>}</FieldGroup></div>;
}
