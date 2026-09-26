/** Strip block and line comments so a commented-out route does not count. */
function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

export function registeredPaths(source: string): string[] {
  return [...withoutComments(source).matchAll(/path="([^"]+)"/g)].map((m) => m[1])
}
