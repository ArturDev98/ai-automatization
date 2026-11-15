import { randomBytes } from 'node:crypto';

export interface Direccion {
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

export interface Cliente {
  first_name: string;
  last_name: string;
  dob: string;
  phone: string;
  email: string;
  password: string;
  address: Direccion;
}

export function sufijoUnico(): string {
  return `${Date.now()}-${randomBytes(3).toString('hex')}`;
}

// La API rechaza claves filtradas: el sufijo aleatorio la hace única y cumple la política.
export function claveSegura(): string {
  return `Qf!${randomBytes(4).toString('hex')}#Zt9`;
}

export function nuevoCliente(prefijo = 'qa-flow'): Cliente {
  return {
    first_name: 'Qa',
    last_name: 'Flow',
    dob: '1990-05-10',
    phone: '3001234567',
    email: `${prefijo}-${sufijoUnico()}@example.com`,
    password: claveSegura(),
    address: {
      street: 'Calle 10 # 20-30',
      city: 'Bogota',
      state: 'Cundinamarca',
      country: 'CO',
      postal_code: '110111',
    },
  };
}

// Dominio reservado: nunca corresponde a una cuenta real que se pueda bloquear.
export function correoInexistente(): string {
  return `nadie-qa-flow-${sufijoUnico()}@example.com`;
}
