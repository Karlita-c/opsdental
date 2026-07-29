// Flujo: gestor administra consultorios (Flujo 3 del diagrama)
describe('Panel de administración', () => {
  beforeEach(() => {
    cy.loginAs('gestor');
  });

  it('muestra el dashboard del gestor con estadísticas', () => {
    cy.visit('/admin/dashboard');
    cy.contains('Dashboard', { timeout: 8000 }).should('exist');
  });

  it('lista todos los consultorios registrados', () => {
    cy.visit('/admin/consultorios');
    cy.contains('Clínica Dental Ruiz', { timeout: 8000 }).should('exist');
  });

  it('muestra el botón de acción sobre un consultorio activo', () => {
    cy.visit('/admin/consultorios');
    cy.contains('Clínica Dental Ruiz', { timeout: 8000 }).should('exist');
    // Los consultorios activos tienen botón Bloquear; los pendientes, Validar
    cy.get('button').contains(/Validar|Bloquear/i, { timeout: 8000 })
      .should('exist');
  });

  it('redirige a login si no es gestor', () => {
    cy.loginAs('paciente');
    cy.visit('/admin/dashboard');
    cy.url({ timeout: 8000 }).should('include', '/login');
  });
});
