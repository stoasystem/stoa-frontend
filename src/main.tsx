import { renderStartupFailure, startWebApplication } from './bootstrap'

const rootElement = document.getElementById('root')

async function prepareApp(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MSW === 'true') {
    const { worker } = await import('./mocks/browser')
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: { url: '/mockServiceWorker.js' },
    })
  }
}

void startWebApplication({
  webOrigin: window.location.origin,
  renderFailure: () => renderStartupFailure(rootElement),
  loadApplication: async () => {
    if (rootElement === null) throw new Error('startup root unavailable')

    await prepareApp()
    await Promise.all([
      import('./index.css'),
      import('@/i18n'),
    ])
    const [React, ReactDOM, { default: App }] = await Promise.all([
      import('react'),
      import('react-dom/client'),
      import('./App'),
    ])

    return () => {
      ReactDOM.createRoot(rootElement).render(
        React.createElement(
          React.StrictMode,
          null,
          React.createElement(App),
        ),
      )
    }
  },
})
