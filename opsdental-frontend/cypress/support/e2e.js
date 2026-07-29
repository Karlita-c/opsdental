import './commands';

// Next.js lanza excepciones internas durante la hidratación que no afectan
// el comportamiento de la app — las ignoramos para que no fallen los tests.
Cypress.on('uncaught:exception', () => false);
