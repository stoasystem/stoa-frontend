/**
 * The Learn tabs, addressed directly.
 *
 * `/question-bank/*` and `/practice/*` still resolve for old links, but they
 * resolve by redirecting. Anything the app links to itself points at the tab.
 */
export type LearnTabName = 'library' | 'path' | 'mistakes' | 'progress'

export function getLearnPath(tab: LearnTabName = 'library') {
  return tab === 'library' ? '/learn' : `/learn/${tab}`
}

export function getLearnMistakesPath() {
  return getLearnPath('mistakes')
}
