import { createRoot } from 'react-dom/client';
import AppEntry from './AppEntry';

const container = document.getElementById('app');
const root = createRoot(container!);

root.render(<AppEntry />);
