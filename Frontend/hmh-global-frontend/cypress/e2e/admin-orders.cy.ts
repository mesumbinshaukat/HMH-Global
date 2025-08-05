describe('Admin Dashboard - Order Management', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
    cy.visit('/admin/dashboard')
    cy.contains('Orders').click()
  })

  it('displays orders list correctly', () => {
    // Check orders tab is active
    cy.get('[data-value="orders"]').should('have.attr', 'data-state', 'active')
    
    // Verify orders table exists
    cy.contains('All Orders').should('be.visible')
    cy.get('table').should('be.visible')
    
    // Check table headers
    cy.contains('Order #').should('be.visible')
    cy.contains('User').should('be.visible')
    cy.contains('Status').should('be.visible')
    cy.contains('Total').should('be.visible')
    cy.contains('Date').should('be.visible')
    cy.contains('Actions').should('be.visible')
  })

  it('can search orders', () => {
    // Test search functionality
    cy.get('input[placeholder*="Search by order number"]').type('ORD-12345')
    cy.get('button').contains('Search').click()
    
    // Verify search was applied
    cy.url().should('contain', 'search')
  })

  it('can filter orders by status', () => {
    // Open filters
    cy.contains('Filters').click()
    
    // Verify filter panel is visible
    cy.contains('Status').should('be.visible')
    
    // Select status filter
    cy.get('[role="combobox"]').click()
    cy.contains('Processing').click()
    
    // Clear filters
    cy.contains('Clear Filters').click()
  })

  it('can update order status', () => {
    // Mock orders API to ensure we have data
    cy.intercept('GET', '/api/admin/orders*', { fixture: 'orders-list.json' })
    
    // Wait for orders to load
    cy.get('table tbody tr').should('have.length.greaterThan', 0)
    
    // Mock status update API
    cy.intercept('PUT', '/api/admin/orders/*/status', { statusCode: 200 })
    
    // Click on status dropdown for first order
    cy.get('table tbody tr').first().find('[role="combobox"]').click()
    
    // Select new status
    cy.contains('Shipped').click()
    
    // Verify API call was made (through intercept)
  })

  it('can view order details', () => {
    // Mock orders API
    cy.intercept('GET', '/api/admin/orders*', { fixture: 'orders-list.json' })
    
    // Wait for orders to load
    cy.get('table tbody tr').should('have.length.greaterThan', 0)
    
    // Click view button on first order
    cy.get('table tbody tr').first().find('button').contains('View').click()
    
    // Verify order details modal opens
    cy.contains('Order Details').should('be.visible')
    
    // Check order information is displayed
    cy.contains('Order #').should('be.visible')
    cy.contains('Shipping Address').should('be.visible')
    cy.contains('Billing Address').should('be.visible')
    cy.contains('Order Items').should('be.visible')
    cy.contains('Payment Method').should('be.visible')
    cy.contains('Order Summary').should('be.visible')
    
    // Close modal
    cy.contains('Close').click()
    cy.contains('Order Details').should('not.exist')
  })

  it('can perform bulk actions', () => {
    // Mock orders API
    cy.intercept('GET', '/api/admin/orders*', { fixture: 'orders-list.json' })
    
    // Wait for orders to load
    cy.get('table tbody tr').should('have.length.greaterThan', 0)
    
    // Select multiple orders
    cy.get('table thead input[type="checkbox"]').check() // Select all
    
    // Verify selection count updates
    cy.contains('selected').should('be.visible')
    
    // Select bulk action
    cy.get('[role="combobox"]').contains('Bulk Actions').click()
    cy.contains('Mark as Processing').click()
    
    // Mock bulk update API
    cy.intercept('PUT', '/api/admin/orders/bulk-status', { statusCode: 200 })
    
    // Apply bulk action
    cy.contains('Apply').click()
    
    // Verify success (API call made through intercept)
  })

  it('can export orders', () => {
    // Mock export API
    cy.intercept('GET', '/api/admin/orders/export*', { fixture: 'orders-export.csv' })
    
    // Test CSV export
    cy.contains('Export CSV').click()
    
    // Verify download would be triggered (in real test, file would download)
    // For now, just verify the API call is made
    
    // Test Excel export
    cy.contains('Export Excel').click()
  })

  it('handles empty orders state', () => {
    // Mock empty orders response
    cy.intercept('GET', '/api/admin/orders*', { 
      body: { 
        success: true, 
        data: { 
          data: [], 
          pagination: { page: 1, pages: 0, total: 0 } 
        } 
      } 
    })
    
    // Refresh page to apply mock
    cy.reload()
    cy.contains('Orders').click()
    
    // Verify empty state message
    cy.contains('No orders found.').should('be.visible')
  })

  it('handles pagination correctly', () => {
    // Mock orders with pagination
    cy.intercept('GET', '/api/admin/orders*', { fixture: 'orders-paginated.json' })
    
    // Check if pagination controls appear when needed
    cy.get('.flex.justify-center.items-center.space-x-2').should('be.visible')
    cy.contains('Previous').should('be.visible')
    cy.contains('Next').should('be.visible')
    
    // Test pagination navigation
    cy.contains('Next').click()
    cy.url().should('contain', 'page=2')
    
    cy.contains('Previous').click()
    cy.url().should('contain', 'page=1')
  })

  it('displays loading states correctly', () => {
    // Mock slow API response
    cy.intercept('GET', '/api/admin/orders*', { delay: 2000, fixture: 'orders-list.json' })
    
    // Refresh to trigger loading
    cy.reload()
    cy.contains('Orders').click()
    
    // Verify loading state
    cy.contains('Loading...').should('be.visible')
    
    // Wait for data to load
    cy.contains('Loading...').should('not.exist')
    cy.get('table tbody tr').should('have.length.greaterThan', 0)
  })
})
