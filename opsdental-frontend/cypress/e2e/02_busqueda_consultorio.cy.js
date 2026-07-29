// Flujo: paciente busca consultorio y ve tratamientos
describe('Búsqueda de consultorio', () => {
  beforeEach(() => {
    cy.loginAs('paciente');
    cy.visit('/paciente/consultorios');
  });

  it('muestra el listado de consultorios activos', () => {
    cy.get('.card', { timeout: 30000 }).should('have.length.at.least', 1);
    cy.contains('Clínica Dental Ruiz').should('exist');
  });

  it('filtra por ciudad', () => {
    // Esperar a que la página esté autenticada y muestre el buscador
    cy.get('input[placeholder*="ciudad"], input[placeholder*="buscar"], input[type="search"]',
      { timeout: 30000 })
      .first()
      .type('CDMX');
    cy.contains('Clínica Dental Ruiz').should('exist');
  });

  it('navega al detalle del consultorio y muestra tratamientos', () => {
    // El nombre no es un enlace — el botón "Ver y agendar" de la card es el link
    cy.contains('Clínica Dental Ruiz', { timeout: 30000 })
      .parents('.card')
      .contains('Ver y agendar')
      .click();
    cy.url({ timeout: 30000 }).should('match', /\/paciente\/consultorios\/\d+/);
    cy.contains('Limpieza dental', { timeout: 30000 }).should('exist');
  });
});
