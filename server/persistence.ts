import fs from 'node:fs/promises';

type Rename = typeof fs.rename;
export async function durableWrite(destination: string, text: string, options: { rename?: Rename; delays?: number[] } = {}) {
  const temporary = `${destination}.${crypto.randomUUID()}.tmp`;
  const journal = `${destination}.pending`;
  const previous = await fs.readFile(destination).catch(() => null);
  const handle = await fs.open(temporary, 'wx');
  try { await handle.writeFile(text, 'utf8'); await handle.sync(); } finally { await handle.close(); }
  if (previous) await fs.writeFile(`${destination}.bak`, previous);
  const rename = options.rename ?? fs.rename;
  const delays = options.delays ?? [0, 40, 100, 200, 350, 600];
  let locked: unknown;
  for (const delay of delays) {
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    try { await rename(temporary, destination); return; }
    catch (error) { if (!['EPERM', 'EACCES', 'EBUSY'].includes((error as NodeJS.ErrnoException).code ?? '')) throw error; locked = error; }
  }
  // Some Windows readers share write access but deny replacement/deletion.
  // Keep a complete recovery journal before a fallback update of the existing file.
  const recovery = await fs.open(journal, 'w');
  try { await recovery.writeFile(text, 'utf8'); await recovery.sync(); } finally { await recovery.close(); }
  const now = await fs.readFile(destination).catch(() => null);
  if ((previous && !now?.equals(previous)) || (!previous && now)) throw new Error('The saved project changed during Windows lock recovery. Your pending draft is preserved.');
  try {
    const target = await fs.open(destination, previous ? 'r+' : 'wx');
    try { await target.writeFile(text, 'utf8'); await target.truncate(Buffer.byteLength(text)); await target.sync(); } finally { await target.close(); }
    await fs.unlink(temporary).catch(() => {}); await fs.unlink(journal).catch(() => {});
  } catch (error) {
    throw new Error('Windows is holding the project file open. The saved project and a complete recovery draft are preserved; close the conflicting file and retry.', { cause: error ?? locked });
  }
}
