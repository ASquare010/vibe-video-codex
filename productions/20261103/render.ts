/** Offline reproduction: validates the saved timeline/media, then uses the native renderer. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {projectSchema, totalFrames} from '../../shared/project.ts';
import {ProjectStore} from '../../server/store.ts';
import {renderProject} from '../../server/export.ts';
import {ffmpegPath, probePath, runMedia} from '../../server/media.ts';

const root = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), key = args[0];
const manifest = JSON.parse(await fs.readFile(path.join(root, 'manifest.json'), 'utf8'));
const films = manifest.films.filter((f: any) => args.includes('--verify-all') || f.key === key);
if (!films.length) throw Error('Provide a manifest film key, or --verify-all --verify-only');
const mediaRoot = args.includes('--media-root') ? path.resolve(args[args.indexOf('--media-root') + 1]) : path.join(root, 'local-media');
for (const film of films) {
  const project = projectSchema.parse(JSON.parse(await fs.readFile(path.join(root, film.key, 'timeline.json'), 'utf8')));
  const store = new ProjectStore(path.join(mediaRoot, film.key));
  const records = JSON.parse(await fs.readFile(path.join(root, film.key, 'media.json'), 'utf8'));
  for (const record of records) {
    const file = await store.safeFile(project.id, record.path);
    const hash = createHash('sha256').update(await fs.readFile(file)).digest('hex');
    if (hash !== record.sha256) throw Error('Media hash mismatch: ' + record.path);
  }
  if (totalFrames(project) !== film.frames || project.settings.fps !== film.fps) throw Error('Saved timing mismatch');
  console.log(`${film.key}: schema, ${records.length} media hashes and ${film.frames} frames verified`);
  if (args.includes('--verify-only')) continue;
  const relative = await renderProject(store, project);
  let output = path.join(store.folder(project.id), relative);
  if (film.masterGainDb) {
    const mastered = path.join(path.dirname(output), 'film-master.mp4');
    await runMedia(ffmpegPath(), ['-v', 'error', '-i', output, '-c:v', 'copy', '-af', `volume=${film.masterGainDb}dB`, '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', mastered]);
    output = mastered;
  }
  await runMedia(ffmpegPath(), ['-v', 'error', '-i', output, '-f', 'null', '-']);
  const probe = JSON.parse((await runMedia(probePath(), ['-v', 'error', '-count_frames', '-show_streams', '-of', 'json', output])).toString());
  const video = probe.streams.find((s: any) => s.codec_type === 'video');
  if (video.width !== 720 || video.height !== 1280 || video.avg_frame_rate !== '24/1' || Number(video.nb_read_frames) !== film.frames) throw Error('Export verification failed');
  const out = path.join(root, 'rendered'); await fs.mkdir(out, {recursive: true});
  const destination = path.join(out, `${film.key}-${Date.now()}.mp4`);
  await fs.copyFile(output, destination);
  console.log(JSON.stringify({film: film.key, output: destination, fullDecode: 'passed', frames: film.frames}));
}
