import { renderStartupFailure, startWebApplication } from './bootstrap'

const rootElement = document.getElementById('root')

void startWebApplication({
  webOrigin: window.location.origin,
  renderFailure: () => renderStartupFailure(rootElement),
  loadApplication: async () => {
    if (rootElement === null) throw new Error('startup root unavailable')

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
