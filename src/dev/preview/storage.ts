/*
 * The design preview's own browser storage (#115): in memory, empty on every
 * load.
 *
 * The preview runs on the dev server's origin, which the real dev app shares.
 * Reading that origin's storage would let a token or a remembered subject left
 * by `npm run dev` decide what the preview shows, and the preview's fake
 * sign-in would leave a token behind for the real app to send to a backend.
 * In memory, neither happens, and every load of a surface starts from the same
 * state, so two screenshots of it differ only by the change being compared.
 */
class MemoryStorage implements Storage {
  #items = new Map<string, string>()
  get length() {
    return this.#items.size
  }
  clear() {
    this.#items.clear()
  }
  getItem(key: string) {
    return this.#items.get(String(key)) ?? null
  }
  key(index: number) {
    return [...this.#items.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.#items.delete(String(key))
  }
  setItem(key: string, value: string) {
    this.#items.set(String(key), String(value))
  }
}

/** Replaces `localStorage` and `sessionStorage` for this page. Call before the app is imported. */
export function isolateStorage() {
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    Object.defineProperty(window, name, { configurable: true, value: new MemoryStorage() })
  }
}
