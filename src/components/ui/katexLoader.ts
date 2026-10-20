/**
 * A lazy boundary for KaTeX and its stylesheet.
 *
 * Both are a third of the shared bundle and most screens never show a formula,
 * so importing this module is what pulls them in.
 *
 * The stylesheet travels inside this module, not as a file beside it. Vite
 * fetches a lazy module's stylesheet before the module and never asks for it
 * again in the same document once it has failed: the next formula then loaded
 * KaTeX without it, and showed every formula twice, typeset and again as raw
 * text (#401). One file arrives whole or not at all.
 */
import katex from 'katex'
import stylesheet from 'katex/dist/katex.min.css?inline'

if (!document.head.querySelector('style[data-katex]')) {
  const style = document.createElement('style')
  style.dataset.katex = ''
  style.textContent = stylesheet
  document.head.append(style)
}

export default katex
