// Flujo: consultorio configura tratamientos y horarios (Flujo 2 del diagrama)
describe('Panel de consultorio', () => {
  beforeEach(() => {
    cy.loginAs('consultorio');
  });

  it('muestra el dashboard con citas del día', () => {
    cy.visit('/consultorio/dashboard');
    cy.url().should('include', '/consultorio/dashboard');
    cy.get('nav', { timeout: 8000 }).should('exist');
  });

  it('muestra la lista de tratamientos', () => {
    cy.visit('/consultorio/tratamientos');
    cy.contains('Limpieza dental', { timeout: 8000 }).should('exist');
  });

  it('crea un nuevo tratamiento', () => {
    cy.visit('/consultorio/tratamientos');

    cy.get('button').contains(/nuevo|agregar/i).click();

    cy.get('input[name="nombre"]').type('Fluorización');
    cy.get('input[name="duracion_minutos"]').clear().type('20');
    cy.get('input[name="precio"]').clear().type('300');

    cy.get('button[type="submit"]').click();

    cy.contains('Fluorización', { timeout: 8000 }).should('exist');
  });

  it('muestra la agenda del día', () => {
    cy.visit('/consultorio/agenda');
    cy.contains('Agenda', { timeout: 8000 }).should('exist');
  });

  it('muestra estadísticas', () => {
    cy.visit('/consultorio/estadisticas');
    cy.contains('Estadísticas', { timeout: 8000 }).should('exist');
    cy.contains('Citas este mes', { timeout: 8000 }).should('exist');
  });

  it('muestra lista de pacientes', () => {
    cy.visit('/consultorio/pacientes');
    cy.contains('Historial de pacientes', { timeout: 8000 }).should('exist');
  });
});
