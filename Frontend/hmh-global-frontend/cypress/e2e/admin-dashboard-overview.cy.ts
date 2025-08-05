describe('Admin Dashboard - Overview', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
    cy.visit('/admin/dashboard')
  })

  it('displays dashboard overview correctly', () => {
    // Check if dashboard page loads
    cy.contains('Admin Dashboard').should('be.visible')
    
    // Check overview tab is active by default
    cy.get('[data-value="overview"]').should('have.attr', 'data-state', 'active')
    
    // Verify summary tiles are present
    cy.contains('Total Users').should('be.visible')
    cy.contains('Total Products').should('be.visible')
    cy.contains('Total Orders').should('be.visible')
    cy.contains('Total Revenue').should('be.visible')
    
    // Check if stats are loading or have values
    cy.get('.text-3xl.font-bold').should('have.length', 4)
  })

  it('shows scraper import functionality', () => {
    // Check import button exists
    cy.contains('Import from Northwest Cosmetics').should('be.visible')
    
    // Verify button is not disabled initially
    cy.contains('Import from Northwest Cosmetics').should('not.be.disabled')
  })

  it('can trigger product import', () => {
    // Mock the scraper API call to avoid actual scraping
    cy.intercept('POST', '/api/admin/scrape-northwest', { fixture: 'scraper-success.json' })
    
    // Click import button
    cy.contains('Import from Northwest Cosmetics').click()
    
    // Verify button changes to "Importing..."
    cy.contains('Importing...').should('be.visible')
    
    // Check if progress bar appears
    cy.contains('Scraper Progress').should('be.visible')
    cy.get('.bg-blue-600').should('be.visible') // Progress bar
  })

  it('displays navigation tabs correctly', () => {
    // Check all tabs are present
    cy.contains('Overview').should('be.visible')
    cy.contains('Products').should('be.visible')
    cy.contains('Orders').should('be.visible')
    
    // Test tab navigation
    cy.contains('Products').click()
    cy.get('[data-value="products"]').should('have.attr', 'data-state', 'active')
    
    cy.contains('Orders').click()
    cy.get('[data-value="orders"]').should('have.attr', 'data-state', 'active')
    
    cy.contains('Overview').click()
    cy.get('[data-value="overview"]').should('have.attr', 'data-state', 'active')
  })
})
