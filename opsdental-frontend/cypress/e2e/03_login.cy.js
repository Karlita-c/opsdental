const URL_TIMEOUT = { timeout: 30000 };

// ─── Login por rol ─────────────────────────────────────────────────────────
describe('Inicio de sesión por rol', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('paciente inicia sesión y llega a su dashboard', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('demo_pac@OpsDental.com');
    cy.get('input[name="password"]').type('Demo1234!');
    cy.get('button[type="submit"]').click();
    cy.url(URL_TIMEOUT).should('include', '/paciente/dashboard');
  });

  it('consultorio inicia sesión y llega a su dashboard', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('demo_cons@OpsDental.com');
    cy.get('input[name="password"]').type('Demo1234!');
    cy.get('button[type="submit"]').click();
    cy.url(URL_TIMEOUT).should('include', '/consultorio/dashboard');
  });

  it('gestor inicia sesión y llega al panel admin', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('gestor@OpsDental.com');
    cy.get('input[name="password"]').type('Gestor1234!');
    cy.get('button[type="submit"]').click();
    cy.url(URL_TIMEOUT).should('include', '/admin/dashboard');
  });

  it('rechaza credenciales incorrectas', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('noexiste@OpsDental.com');
    cy.get('input[name="password"]').type('contrasena_mala');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/login');
    cy.contains('Credenciales incorrectas', URL_TIMEOUT).should('exist');
  });
});

// ─── Aislamiento de roles ──────────────────────────────────────────────────
describe('Aislamiento de roles', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('paciente no puede acceder al panel admin', () => {
    cy.loginAs('paciente');
    cy.visit('/admin/dashboard');
    cy.url(URL_TIMEOUT).should('include', '/login');
  });

  it('paciente no puede acceder al panel de consultorio', () => {
    cy.loginAs('paciente');
    cy.visit('/consultorio/dashboard');
    cy.url(URL_TIMEOUT).should('include', '/login');
  });

  it('consultorio no puede acceder al panel admin', () => {
    cy.loginAs('consultorio');
    cy.visit('/admin/dashboard');
    cy.url(URL_TIMEOUT).should('include', '/login');
  });

  it('consultorio no puede acceder al panel de paciente', () => {
    cy.loginAs('consultorio');
    cy.visit('/paciente/dashboard');
    cy.url(URL_TIMEOUT).should('include', '/login');
  });

  it('gestor no puede acceder al panel de paciente', () => {
    cy.loginAs('gestor');
    cy.visit('/paciente/dashboard');
    cy.url(URL_TIMEOUT).should('include', '/login');
  });

  it('usuario sin sesión es redirigido al login', () => {
    cy.visit('/paciente/dashboard');
    cy.url(URL_TIMEOUT).should('include', '/login');
  });
});

