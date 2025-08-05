// Custom commands for Cypress tests

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('[data-testid="email-input"]').type(email)
  cy.get('[data-testid="password-input"]').type(password)
  cy.get('[data-testid="login-submit"]').click()
  cy.url().should('not.include', '/login')
})

// Login as admin command
Cypress.Commands.add('loginAsAdmin', () => {
  cy.login('admin@hmhglobal.co.uk', 'TempPassword123!')
})

// Create test user command
Cypress.Commands.add('createTestUser', (userData: any) => {
  cy.request('POST', '/api/admin/users', userData)
})

// Clean up database command
Cypress.Commands.add('cleanDatabase', () => {
  cy.task('db:seed')
})

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      loginAsAdmin(): Chainable<void>
      createTestUser(userData: any): Chainable<void>
      cleanDatabase(): Chainable<void>
    }
  }
}
