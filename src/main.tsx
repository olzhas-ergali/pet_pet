import { createRoot } from 'react-dom/client';
import App from './app/App';
import './i18n';
import './styles/index.css';
import { initWebVitalsReporting } from '@/lib/reportWebVitals';

initWebVitalsReporting();

createRoot(document.getElementById('root')!).render(<App />);
  