import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { SesionService } from '@core/services/sesion.service';
import { rolGuard } from './rol.guard';

describe('rolGuard', () => {
  const ejecutar = () =>
    TestBed.runInInjectionContext(() =>
      rolGuard('REPARTIDOR')({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('deja pasar al rol correcto', () => {
    TestBed.inject(SesionService).iniciar('REPARTIDOR', 'rp1');
    expect(ejecutar()).toBe(true);
  });

  it('redirige al acceso con otro rol o sin sesión', () => {
    TestBed.inject(SesionService).iniciar('CLIENTE', 'c1');
    const resultado = ejecutar() as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(resultado)).toBe('/acceso');
  });
});
