/** Read-only preflight. Generation tools must still honor their live quotes. */
import path from 'node:path';
import {ProjectStore} from '../server/store.ts';
import {assertBudget} from '../shared/compact-plan.ts';
const i=process.argv.indexOf('--project'),id=process.argv[i+1];if(i<0||!id)throw new Error('Use --project UUID');
const p=await new ProjectStore(path.resolve(process.env.VIBECUT_DATA_DIR||'data/projects')).read(id);
console.log(JSON.stringify(assertBudget(p)));
