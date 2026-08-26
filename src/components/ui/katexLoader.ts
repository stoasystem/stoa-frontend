/**
 * A lazy boundary for KaTeX and its stylesheet.
 *
 * Both are a third of the shared bundle and most screens never show a formula,
 * so importing this module is what pulls them in.
 */
import katex from 'katex'
import 'katex/dist/katex.min.css'

export default katex
