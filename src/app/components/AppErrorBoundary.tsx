import { Component, type ErrorInfo, type ReactNode } from 'react';
import i18n from '@/i18n';

type Props = { children: ReactNode };

type State = { error: Error | null };

/**
 * Ловит необработанные ошибки рендера; не заменяет обработку сетевых ошибок в формах.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
          <p className="text-lg font-semibold text-center max-w-md">{i18n.t('errorBoundary.title')}</p>
          <p className="text-sm text-gray-600 dark:text-zinc-400 text-center max-w-md leading-relaxed">
            {i18n.t('errorBoundary.hint')}
          </p>
          <button
            type="button"
            className="rounded-xl bg-emerald-600 text-white px-5 py-2.5 font-medium hover:bg-emerald-700 transition-colors"
            onClick={() => window.location.reload()}
          >
            {i18n.t('errorBoundary.reload')}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
