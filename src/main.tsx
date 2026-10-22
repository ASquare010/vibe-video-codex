import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Dashboard } from './components/dashboard';
import { Editor } from './components/workspace';
import { api } from './lib/api';
import './style.css';

function App() {
  const readId = () => new URLSearchParams(location.hash.slice(1)).get('project');
  const [projectId, setProjectId] = useState(readId);
  const [health, setHealth] = useState({ available: false, message: 'Checking Codex…' });
  useEffect(() => {
    const listen = () => setProjectId(readId()); window.addEventListener('hashchange', listen);
    void api<typeof health>('/api/health').then(setHealth).catch(() => setHealth({ available: false, message: 'Local bridge is unavailable' }));
    return () => window.removeEventListener('hashchange', listen);
  }, []);
  return projectId ? <Editor key={projectId} projectId={projectId} back={() => { location.hash = ''; }} health={health}/> : <Dashboard open={id => { location.hash = `project=${id}`; }} health={health}/>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
