export function stripComments(source: string, extension: string): string
export function findForeignDefinitions(
  source: string,
  extension: string,
  tokens: Iterable<string>,
): { token: string; line: number }[]
