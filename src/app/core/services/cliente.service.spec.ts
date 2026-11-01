import { TestBed } from '@angular/core/testing';
import { ClienteService } from './cliente.service';
import { SesionService } from './sesion.service';

describe('ClienteService (RN-05)', () => {
  let cliente: ClienteService;

  beforeEach(() => {
    TestBed.inject(SesionService).iniciar('CLIENTE', 'c2');
    cliente = TestBed.inject(ClienteService);
  });

  it('lista las direcciones y métodos de pago del cliente en sesión', () => {
    expect(cliente.direcciones().length).toBeGreaterThan(0);
    expect(cliente.metodosPago().length).toBeGreaterThan(0);
  });

  it('guarda una dirección nueva y la devuelve en la lista', () => {
    const antes = cliente.direcciones().length;
    const r = cliente.agregarDireccion({
      etiqueta: 'Otra',
      linea: ' Calle 10 # 5-20 ',
      ciudad: 'Armenia',
    });
    expect(r.ok).toBe(true);
    expect(cliente.direcciones().length).toBe(antes + 1);
    expect(r.ok && r.valor.linea).toBe('Calle 10 # 5-20');
  });

  it('rechaza una dirección demasiado corta', () => {
    const r = cliente.agregarDireccion({ etiqueta: 'Casa', linea: 'abc', ciudad: 'Armenia' });
    expect(r.ok).toBe(false);
  });

  it('rechaza guardar sin cliente en sesión', () => {
    TestBed.inject(SesionService).cerrar();
    const r = cliente.agregarDireccion({
      etiqueta: 'Casa',
      linea: 'Calle 10 # 5-20',
      ciudad: 'Armenia',
    });
    expect(r.ok).toBe(false);
  });
});
