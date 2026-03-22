/** Куда вести после успешного входа (из state.location) */
export function getPostLoginDestination(fromPath?: string | null): string {
  if (
    fromPath &&
    fromPath.length > 0 &&
    fromPath !== '/auth' &&
    fromPath !== '/'
  ) {
    return fromPath;
  }
  return '/market';
}
