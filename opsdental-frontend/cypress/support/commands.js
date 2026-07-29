const CUENTAS = {
  paciente:    { email: 'demo_pac@OpsDental.com',  password: 'Demo1234!' },
  consultorio: { email: 'demo_cons@OpsDental.com', password: 'Demo1234!' },
  gestor:      { email: 'gestor@OpsDental.com',    password: 'Gestor1234!' },
};

// Login rápido vía API — evita pasar por la UI en cada test.
// cy.session() cachea el estado del browser (localStorage) para reutilizarlo
// en tests del mismo spec sin hacer una nueva petición de login.
Cypress.Commands.add('loginAs', (role) => {
  const { email, password } = CUENTAS[role];
  const apiUrl = Cypress.env('API_URL') || 'http://localhost:8000/api';

  cy.session(
    role,
    () => {
      cy.request('POST', `${apiUrl}/login`, { email, password }).then(({ body }) => {
        // Visitar la raíz para establecer el origen correcto en el AUT,
        // luego setear el token en el localStorage real del navegador.
        cy.visit('/', { failOnStatusCode: false });
        cy.window().then(win => {
          win.localStorage.setItem('bb-token', body.token);
        });
      });
    }
  );
});

