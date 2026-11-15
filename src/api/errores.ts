// La API usa `error` en login y `message` en el resto; devuelve el que haya.
export function textoDeError(cuerpo: unknown): string | undefined {
  if (typeof cuerpo !== 'object' || cuerpo === null) return undefined;
  const { message, error } = cuerpo as { message?: unknown; error?: unknown };
  if (typeof message === 'string') return message;
  if (typeof error === 'string') return error;
  return undefined;
}
