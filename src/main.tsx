import { renderStartupFailure, startWebApplication } from './bootstrap'

const rootElement = document.getElementById('root')

/**
 * Starting the served build means proving which release is being served: the
 * descriptor at `/served-release.json`, then the runtime config it names, by
 * digest. A dev server has neither, and the descriptor's own host rules refuse
 * every environment on `localhost` anyway - so `npm run dev` could not start the
 * application at all, and with it the whole end-to-end suite, which sat at a
 * login form that never rendered.
 *
 * `import.meta.env.DEV` is replaced with the literal `false` when Vite builds,
 * so this branch is not present in anything that ships. A release test reads the
 * built bundle and holds that.
 */
const startApplication = async (mount: () => void) => mount()

void (import.meta.env.DEV
  ? (async () => {
      const { registerDevelopmentRuntimeConfig } = await import('@/lib/runtimeConfig')
      // The backend the repository's own instructions say to run beside this.
      // Not a build-time variable: a served build takes its configuration from
      // the descriptor and nothing else, and a release test holds that this file
      // reads no build-time variable at all.
      registerDevelopmentRuntimeConfig('http://localhost:8000', window.location.origin)
      return startApplication(await loadApplication())
    })()
  : startWebApplication({
      webOrigin: window.location.origin,
      renderFailure: () => renderStartupFailure(rootElement),
      loadApplication,
    }))

async function loadApplication() {
  {
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
  }
}
