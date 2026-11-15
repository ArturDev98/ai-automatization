import { randomBytes } from 'node:crypto';
import { nuevoCliente, type Cliente } from './clientes';

// Umbral observado en la app (demo y versión con bugs); el requisito no dice el número.
export const MINIMO_DEL_MENSAJE = 50;

export const CONFIRMACION = 'Thanks for your message! We will contact you shortly.';
export const ERROR_MINIMO = `Message must be minimal ${MINIMO_DEL_MENSAJE} characters`;
export const ERROR_EXTENSION = 'File should have a txt extension.';
export const ERROR_ADJUNTO_NO_VACIO = 'File should be empty.';

export const ASUNTO = 'Customer service';
export const ASUNTO_CON_SESION = 'Payments';

/** Clases inválidas sin discusión; `a@b` queda fuera porque la app lo acepta y el requisito no lo define. */
export const CORREOS_INVALIDOS = ['no-es-correo', 'cliente@', '@example.com'] as const;

export type CampoDeContacto = 'first-name' | 'last-name' | 'email' | 'subject' | 'message';
export const CAMPOS_OBLIGATORIOS: CampoDeContacto[] = ['first-name', 'last-name', 'email', 'subject', 'message'];

export interface FormularioDeContacto {
  nombre: string;
  apellido: string;
  correo: string;
  asunto: string;
  mensaje: string;
}

export interface Archivo {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

export function correoDeContacto(): string {
  return `req004.${Date.now()}.${randomBytes(3).toString('hex')}@example.com`;
}

/** Mensajes de 49 y 50 caracteres; el de 50 es el de 49 más una letra, sin espacios en los bordes. */
export function mensajesDeLimite(): { corto: string; justo: string } {
  const justo = 'REQ-004 consulta ficticia sobre envio de prueba ok';
  return { corto: justo.slice(0, MINIMO_DEL_MENSAJE - 1), justo };
}

export function formularioValido(): FormularioDeContacto {
  return {
    nombre: 'Lucia',
    apellido: 'Contacto',
    correo: correoDeContacto(),
    asunto: ASUNTO,
    mensaje: 'REQ-004 mensaje ficticio de prueba: consulta sobre el estado de un pedido de herramientas.',
  };
}

/** Cliente propio con nombre reconocible para buscarlo en el saludo y en el cuerpo del envío. */
export function clienteDeContacto(): Cliente {
  return { ...nuevoCliente('req004'), first_name: 'Marta', last_name: 'Sesionada' };
}

export const adjuntos = {
  txtVacio: (): Archivo => ({ name: 'req004-vacio.txt', mimeType: 'text/plain', buffer: Buffer.alloc(0) }),
  pdfVacio: (): Archivo => ({ name: 'req004-vacio.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(0) }),
  txtConTexto: (): Archivo => ({ name: 'req004-texto.txt', mimeType: 'text/plain', buffer: Buffer.from('REQ-004 linea ficticia\n') }),
};

/** Cuerpo de `POST /messages` tal como lo envía el formulario sin sesión. */
export function cuerpoDeMensaje(cambios: Partial<Record<'name' | 'subject' | 'message' | 'email', string>> = {}): object {
  return {
    name: 'Lucia Contacto',
    subject: 'customer-service',
    message: mensajesDeLimite().justo,
    email: correoDeContacto(),
    ...cambios,
  };
}
