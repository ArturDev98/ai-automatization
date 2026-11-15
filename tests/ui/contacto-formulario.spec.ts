import { test, expect } from '../../src/fixtures';
import { varianteDe } from '../../src/data/acceso';
import {
  ASUNTO,
  CAMPOS_OBLIGATORIOS,
  CONFIRMACION,
  CORREOS_INVALIDOS,
  ERROR_ADJUNTO_NO_VACIO,
  ERROR_EXTENSION,
  ERROR_MINIMO,
  MINIMO_DEL_MENSAJE,
  adjuntos,
  correoDeContacto,
  formularioValido,
  mensajesDeLimite,
  type CampoDeContacto,
} from '../../src/data/contacto';
import { ContactPage } from '../../src/pages/ContactPage';

/** Solo los campos indicados muestran su error; los demás obligatorios, ninguno. */
async function soloConError(contacto: ContactPage, conError: CampoDeContacto[], paso: string): Promise<void> {
  for (const campo of CAMPOS_OBLIGATORIOS) {
    const error = contacto.error(campo);
    if (conError.includes(campo)) await expect(error, `${paso}: error de ${campo}`).toBeVisible();
    else await expect(error, `${paso}: sin error en ${campo}`).toBeHidden();
  }
}

/** El formulario sigue en pantalla, sin confirmación y sin ninguna petición de envío. */
async function sinEnvio(contacto: ContactPage, paso: string): Promise<void> {
  await expect(contacto.enviar, paso).toBeVisible();
  await expect(contacto.confirmacion, paso).toBeHidden();
  expect(contacto.envios, `${paso}: no debe salir POST /messages`).toEqual([]);
}

async function confirmado(contacto: ContactPage): Promise<void> {
  await expect(contacto.confirmacion).toHaveText(CONFIRMACION);
  for (const campo of [contacto.nombre, contacto.apellido, contacto.correo, contacto.asunto, contacto.mensaje, contacto.enviar]) {
    await expect(campo).toBeHidden();
  }
}

test.describe('Formulario de contacto sin sesión', () => {
  test('TC-001 un visitante envía el formulario completo y ve la confirmación', {
    tag: ['@REQ-004', '@TC-001'],
  }, async ({ page }, testInfo) => {
    const contacto = new ContactPage(page, varianteDe(testInfo.project.name));
    const datos = formularioValido();
    await contacto.abrir();
    await contacto.llenar(datos);

    const respuesta = contacto.respuestaDeEnvio();
    await contacto.enviar.click();

    const envio = await respuesta;
    expect(envio.ok(), `POST /messages respondió ${envio.status()}`).toBe(true);
    expect(envio.request().postDataJSON()).toMatchObject({ email: datos.correo, message: datos.mensaje });
    await confirmado(contacto);
    expect(contacto.envios).toHaveLength(1);
  });

  test('TC-002 envío del formulario vacío', {
    tag: ['@REQ-004', '@TC-002'],
  }, async ({ page }, testInfo) => {
    const contacto = new ContactPage(page, varianteDe(testInfo.project.name));
    await contacto.abrir();

    await contacto.enviar.click();

    await soloConError(contacto, CAMPOS_OBLIGATORIOS, 'vacío');
    await expect(contacto.error('attachment')).toBeHidden();
    await sinEnvio(contacto, 'vacío');
  });

  test('TC-003 falta un solo campo obligatorio y los demás son válidos', {
    tag: ['@REQ-004', '@TC-003'],
  }, async ({ page }, testInfo) => {
    const contacto = new ContactPage(page, varianteDe(testInfo.project.name));

    for (const falta of CAMPOS_OBLIGATORIOS) {
      await test.step(`sin ${falta}`, async () => {
        await contacto.abrir();
        await contacto.llenar(formularioValido(), [falta]);

        await contacto.enviar.click();

        await soloConError(contacto, [falta], `sin ${falta}`);
        await sinEnvio(contacto, `sin ${falta}`);
      });
    }
  });

  test('TC-004 correo con formato inválido', {
    tag: ['@REQ-004', '@TC-004'],
  }, async ({ page }, testInfo) => {
    test.fail(testInfo.project.name === 'ui-bugs', 'esperado: error en el correo y sin envío; obtenido: "no-es-correo" pasa como válido y no aparece email-error');
    const contacto = new ContactPage(page, varianteDe(testInfo.project.name));

    for (const correo of CORREOS_INVALIDOS) {
      await test.step(correo, async () => {
        await contacto.abrir();
        await contacto.llenar({ ...formularioValido(), correo });

        await contacto.enviar.click();

        await soloConError(contacto, ['email'], correo);
        await sinEnvio(contacto, correo);
      });
    }
  });

  test('TC-005 largo del mensaje: 49 y 50 caracteres', {
    tag: ['@REQ-004', '@TC-005'],
  }, async ({ page }, testInfo) => {
    const { corto, justo } = mensajesDeLimite();
    expect(corto).toHaveLength(MINIMO_DEL_MENSAJE - 1);
    expect(justo).toHaveLength(MINIMO_DEL_MENSAJE);
    expect(justo.startsWith(corto)).toBe(true);
    const contacto = new ContactPage(page, varianteDe(testInfo.project.name));

    await test.step('49 caracteres', async () => {
      await contacto.abrir();
      await contacto.llenar({ ...formularioValido(), mensaje: corto });

      await contacto.enviar.click();

      await soloConError(contacto, ['message'], '49');
      await expect(contacto.error('message')).toHaveText(ERROR_MINIMO);
      await sinEnvio(contacto, '49');
    });

    await test.step('50 caracteres', async () => {
      await contacto.abrir();
      await contacto.llenar({ ...formularioValido(), mensaje: justo });

      await contacto.enviar.click();

      await confirmado(contacto);
    });
  });

  test('TC-011 corregir los errores y enviar', {
    tag: ['@REQ-004', '@TC-011'],
  }, async ({ page }, testInfo) => {
    test.fail(testInfo.project.name === 'ui-bugs', 'esperado: error en el correo "no-es-correo"; obtenido: el correo pasa como válido');
    test.fail(testInfo.project.name === 'ui', 'esperado: un clic en Send tras corregir envía y confirma; obtenido: el error del mensaje se quita al perder el foco, Send sube y el clic se pierde');
    const { corto, justo } = mensajesDeLimite();
    const contacto = new ContactPage(page, varianteDe(testInfo.project.name));
    await contacto.abrir();
    await contacto.llenar({ ...formularioValido(), correo: CORREOS_INVALIDOS[0], mensaje: corto }, ['subject']);

    await contacto.enviar.click();

    await soloConError(contacto, ['email', 'subject', 'message'], 'con errores');
    await sinEnvio(contacto, 'con errores');

    await contacto.correo.fill(correoDeContacto());
    await contacto.elegirAsunto(ASUNTO);
    await contacto.mensaje.fill(justo);
    await contacto.enviar.click();

    await confirmado(contacto);
    await expect(contacto.erroresDeCampo).toHaveCount(0);
    expect(contacto.envios).toHaveLength(1);
  });

  test('TC-014 envío sin nombre, apellido ni correo antes de que la pantalla compruebe la sesión', {
    tag: ['@REQ-004', '@TC-014'],
  }, async ({ page }, testInfo) => {
    const contacto = new ContactPage(page, varianteDe(testInfo.project.name));
    const faltan: CampoDeContacto[] = ['first-name', 'last-name', 'email'];
    const retencion = await contacto.retenerSesion();
    try {
      await contacto.abrirSinEsperarSesion();
      await expect.poll(() => retencion.retenidas.length, 'PREPARACIÓN: ninguna GET /users/me quedó retenida').toBeGreaterThan(0);
      await expect(contacto.enviar, 'PREPARACIÓN: contact-submit no apareció').toBeVisible();
      // La marca va después de la preparación: si esta falla, la prueba sale en rojo y no como fallo esperado.
      test.fail(['ui', 'ui-bugs'].includes(testInfo.project.name), 'BUG-013: esperado: error en nombre, apellido y correo y sin envío; obtenido: POST /messages 200 sin esos datos y confirmación');

      await contacto.llenar(formularioValido(), faltan);
      await contacto.enviar.click();

      await soloConError(contacto, faltan, 'envío temprano');
      await sinEnvio(contacto, 'envío temprano');
    } finally {
      await retencion.soltar();
    }
  });
});

test.describe('Adjunto del formulario de contacto', () => {
  test('TC-006 envío con un adjunto aceptado', {
    tag: ['@REQ-004', '@TC-006'],
  }, async ({ page }, testInfo) => {
    const contacto = new ContactPage(page, varianteDe(testInfo.project.name));
    await contacto.abrir();
    await contacto.llenar(formularioValido());
    await contacto.adjuntar(adjuntos.txtVacio());

    const respuestas = Promise.all([contacto.respuestaDeEnvio(), contacto.respuestaDeAdjunto()]);
    await contacto.enviar.click();

    const [envio, adjunto] = await respuestas;
    expect(envio.ok(), `POST /messages respondió ${envio.status()}`).toBe(true);
    expect(adjunto.ok(), `POST /messages/{id}/attach-file respondió ${adjunto.status()}`).toBe(true);
    await expect(contacto.error('attachment')).toBeHidden();
    await confirmado(contacto);
  });

  test('TC-007 adjunto con extensión no aceptada', {
    tag: ['@REQ-004', '@TC-007'],
  }, async ({ page }, testInfo) => {
    test.fail(testInfo.project.name === 'ui-bugs', 'esperado: error de extensión junto al adjunto y sin envío; obtenido: sale POST /messages y el error llega después, fuera del campo');
    const contacto = new ContactPage(page, varianteDe(testInfo.project.name));
    await contacto.abrir();
    await contacto.llenar(formularioValido());
    await contacto.adjuntar(adjuntos.pdfVacio());

    await contacto.enviar.click();

    await expect(contacto.error('attachment')).toHaveText(ERROR_EXTENSION);
    await sinEnvio(contacto, '.pdf vacío');
  });

  test('TC-008 adjunto de extensión aceptada que no está vacío', {
    tag: ['@REQ-004', '@TC-008'],
  }, async ({ page }, testInfo) => {
    test.fail(testInfo.project.name === 'ui-bugs', 'esperado: error "el archivo debe estar vacío" y sin envío; obtenido: el .txt con texto se acepta y se envía');
    const contacto = new ContactPage(page, varianteDe(testInfo.project.name));
    await contacto.abrir();
    await contacto.llenar(formularioValido());
    await contacto.adjuntar(adjuntos.txtConTexto());

    await contacto.enviar.click();

    await expect(contacto.error('attachment')).toHaveText(ERROR_ADJUNTO_NO_VACIO);
    await sinEnvio(contacto, '.txt con texto');
  });
});
