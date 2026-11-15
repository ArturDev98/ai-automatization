import { expect, type Locator, type Page, type Request, type Response, type Route } from '@playwright/test';
import { abrirLimpio, type Variante } from '../data/acceso';
import type { Archivo, CampoDeContacto, FormularioDeContacto } from '../data/contacto';

// Por ruta y método, no por host: la versión con bugs usa otra API.
const ENVIO = /\/messages$/;
const ADJUNTO = /\/messages\/[^/]+\/attach-file$/;
const SESION = /\/users\/me$/;

function esPost(peticion: Request, ruta: RegExp): boolean {
  return peticion.method() === 'POST' && ruta.test(new URL(peticion.url()).pathname);
}

function esComprobacionDeSesion(peticion: Request): boolean {
  return peticion.method() === 'GET' && SESION.test(new URL(peticion.url()).pathname);
}

/** Peticiones `GET /users/me` detenidas sin respuesta; `soltar()` las deja seguir hacia la API real. */
export interface RetencionDeSesion {
  readonly retenidas: Route[];
  soltar(): Promise<void>;
}

export class ContactPage {
  readonly nombre: Locator;
  readonly apellido: Locator;
  readonly correo: Locator;
  readonly asunto: Locator;
  readonly mensaje: Locator;
  readonly adjunto: Locator;
  readonly enviar: Locator;
  /** Cualquier mensaje de error de campo del formulario. */
  readonly erroresDeCampo: Locator;
  // Por rol y texto: la confirmación no tiene data-test.
  readonly confirmacion: Locator;
  /** Peticiones `POST /messages` y `POST /messages/{id}/attach-file` vistas desde que se creó el objeto. */
  readonly envios: string[] = [];

  constructor(readonly page: Page, readonly variante: Variante = 'actual') {
    this.nombre = page.getByTestId('first-name');
    this.apellido = page.getByTestId('last-name');
    this.correo = page.getByTestId('email');
    this.asunto = page.getByTestId('subject');
    this.mensaje = page.getByTestId('message');
    this.adjunto = page.getByTestId('attachment');
    this.enviar = page.getByTestId('contact-submit');
    this.erroresDeCampo = page.locator('[data-test$="-error"]');
    this.confirmacion = page.getByRole('alert').filter({ hasText: 'Thanks for your message' });
    page.on('request', (peticion) => {
      if (esPost(peticion, ENVIO) || esPost(peticion, ADJUNTO)) this.envios.push(peticion.url());
    });
  }

  error(campo: CampoDeContacto | 'attachment'): Locator {
    return this.page.getByTestId(`${campo}-error`);
  }

  /** Saludo que aparece cuando la pantalla ya cargó el perfil del cliente con sesión. */
  saludo(nombreCompleto: string): Locator {
    return this.page.getByText(`Hello ${nombreCompleto}, please fill out this form to submit your message.`);
  }

  /** Abre la pantalla y espera a que aplique el resultado de la comprobación de sesión. */
  async abrir(): Promise<void> {
    const sesion = this.page.waitForResponse((r) => esComprobacionDeSesion(r.request()));
    await abrirLimpio(this.page, this.variante, '/contact');
    // Sin sesión, nombre, apellido y correo solo pasan a obligatorios tras el 401 de GET /users/me (H-1).
    if ((await sesion).ok()) await expect(this.nombre).toBeHidden();
    else await expect(this.nombre).toHaveClass(/\bng-invalid\b/);
  }

  /** Abre la pantalla sin esperar la comprobación de sesión; para el envío temprano de TC-014. */
  async abrirSinEsperarSesion(): Promise<void> {
    await abrirLimpio(this.page, this.variante, '/contact');
  }

  /** Retiene todas las `GET /users/me` desde ahora: salen varias (menú, chat, contacto) y no se sabe cuál es la del formulario. */
  async retenerSesion(): Promise<RetencionDeSesion> {
    const retenidas: Route[] = [];
    const manejador = (ruta: Route) => {
      if (esComprobacionDeSesion(ruta.request())) retenidas.push(ruta);
      else return ruta.fallback();
    };
    await this.page.route(SESION, manejador);
    return {
      retenidas,
      soltar: async () => {
        await this.page.unroute(SESION, manejador);
        // Puede que la página ya se haya cerrado o la petición se haya cancelado.
        await Promise.all(retenidas.map((r) => r.continue().catch(() => undefined)));
      },
    };
  }

  /** Llena los campos del formulario, salvo los indicados en `sin`. */
  async llenar(datos: FormularioDeContacto, sin: CampoDeContacto[] = []): Promise<void> {
    if (!sin.includes('first-name')) await this.nombre.fill(datos.nombre);
    if (!sin.includes('last-name')) await this.apellido.fill(datos.apellido);
    if (!sin.includes('email')) await this.correo.fill(datos.correo);
    if (!sin.includes('subject')) await this.elegirAsunto(datos.asunto);
    if (!sin.includes('message')) await this.mensaje.fill(datos.mensaje);
  }

  // Por teclado: en la versión con bugs `selectOption` cambia lo visible pero no el control de Angular.
  async elegirAsunto(etiqueta: string): Promise<void> {
    await this.asunto.focus();
    await this.page.keyboard.type(etiqueta);
  }

  async adjuntar(archivo: Archivo): Promise<void> {
    await this.adjunto.setInputFiles(archivo);
  }

  /** Promesa de la respuesta al envío del mensaje; se crea antes de pulsar `enviar`. */
  respuestaDeEnvio(): Promise<Response> {
    return this.page.waitForResponse((r) => esPost(r.request(), ENVIO));
  }

  respuestaDeAdjunto(): Promise<Response> {
    return this.page.waitForResponse((r) => esPost(r.request(), ADJUNTO));
  }
}
