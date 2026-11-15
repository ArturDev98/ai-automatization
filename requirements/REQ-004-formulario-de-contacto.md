# REQ-004 · Formulario de contacto

**Como** visitante o cliente de la tienda
**quiero** escribirle a la tienda desde un formulario
**para** resolver una duda sin tener que buscar un correo.

## Pantallas

- Contacto: `/contact`
- Acceso, para la variante con sesión: `/auth/login`

## Criterios de aceptación

- **CA-1** Un visitante sin sesión puede enviar el formulario con nombre, apellido, correo, un
  asunto elegido de la lista y un mensaje. Al enviarlo ve una confirmación y el formulario ya no
  se muestra.
- **CA-2** Si envía el formulario vacío, cada campo obligatorio dice que falta y no se envía nada.
- **CA-3** Un correo con formato inválido se rechaza con un mensaje en ese campo.
- **CA-4** El mensaje tiene un largo mínimo. Uno más corto se rechaza diciendo cuál es el mínimo, y
  uno que lo cumple justo se acepta.
- **CA-5** Se puede adjuntar un archivo. Si el archivo no es aceptado, el formulario dice por qué
  y no se envía.
- **CA-6** Un cliente con sesión iniciada no tiene que volver a escribir su nombre ni su correo
  para enviar el formulario.

## Datos y restricciones

- Cliente de prueba: cada corrida registra su propio cliente con `POST /users/register` de la API
  (correo único) y entra con él. Las cuentas de demostración son compartidas y no se usan.
- Los mensajes de prueba llevan datos ficticios y correos de `example.com`.
- La misma suite debe poder correr contra la versión con bugs sembrados
  (`https://with-bugs.practicesoftwaretesting.com`) sin cambios.
