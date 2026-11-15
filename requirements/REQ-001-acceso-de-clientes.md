# REQ-001 · Acceso de clientes: inicio de sesión y registro

**Como** cliente de la tienda
**quiero** registrarme e iniciar sesión con mi correo y mi clave
**para** ver mi cuenta y comprar con mis datos guardados.

## Pantallas

- Inicio de sesión: `/auth/login`
- Registro: `/auth/register`
- Mi cuenta: `/account`

## Criterios de aceptación

- **CA-1** Un cliente registrado que escribe su correo y su clave correctos entra a la tienda,
  llega a "My account" y ve su nombre en el menú superior.
- **CA-2** Con un correo o una clave incorrectos el cliente no entra y ve el mensaje
  "Invalid email or password".
- **CA-3** El correo y la clave son obligatorios y el correo debe tener formato válido. Cada campo
  muestra su propio mensaje de error y no se envía el formulario.
- **CA-4** Un visitante que llena el registro con datos válidos queda registrado, es llevado al
  inicio de sesión y puede entrar con las credenciales que acaba de crear.
- **CA-5** El registro no acepta campos obligatorios vacíos ni una clave que incumpla la política:
  mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.
- **CA-6** Al cerrar sesión el cliente vuelve a ser visitante: el menú muestra "Sign in" y la
  página "My account" deja de estar disponible.

## Datos y restricciones

- Cuenta de demostración: `customer@practicesoftwaretesting.com` / `welcome01`.
- La cuenta de demostración es compartida y se bloquea tras tres intentos fallidos. Los casos
  negativos de inicio de sesión no deben usarla: se usa un correo que no existe o un cliente
  registrado por la propia prueba.
- La base de datos de la demo se reinicia cada cierto tiempo; cada prueba crea lo que necesita.
