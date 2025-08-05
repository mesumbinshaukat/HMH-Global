describe('Admin Dashboard - Product Management', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
    cy.visit('/admin/dashboard')
    cy.contains('Products').click()
  })

  it('displays products list correctly', () => {
    // Check products tab is active
    cy.get('[data-value="products"]').should('have.attr', 'data-state', 'active')
    
    // Verify products table exists
    cy.contains('All Products').should('be.visible')
    cy.get('table').should('be.visible')
    
    // Check table headers
    cy.contains('Image').should('be.visible')
    cy.contains('Name').should('be.visible')
    cy.contains('Category').should('be.visible')
    cy.contains('Brand').should('be.visible')
    cy.contains('Price').should('be.visible')
    cy.contains('Stock').should('be.visible')
    cy.contains('Status').should('be.visible')
    cy.contains('Actions').should('be.visible')
  })

  it('can search products', () => {
    // Test search functionality
    cy.get('input[placeholder="Search products..."]').type('test product')
    cy.get('button').contains('Search').click()
    
    // Verify search was applied (URL or table update)
    cy.url().should('contain', 'search') // or check if table updates
  })

  it('can filter products', () => {
    // Open filters
    cy.contains('Filters').click()
    
    // Verify filter panel is visible
    cy.contains('Category').should('be.visible')
    cy.contains('Brand').should('be.visible')
    cy.contains('Sort By').should('be.visible')
    
    // Test brand filter
    cy.get('input[placeholder="Brand name"]').type('Nike')
    
    // Clear filters
    cy.contains('Clear Filters').click()
  })

  it('can add a new product', () => {
    // Click add product button
    cy.contains('Add Product').click()
    
    // Verify modal opens
    cy.contains('Add New Product').should('be.visible')
    
    // Fill out form
    cy.get('#name').type('Test Product')
    cy.get('#brand').type('Test Brand')
    cy.get('#description').type('Test description for the product')
    cy.get('#price').type('29.99')
    cy.get('#salePrice').type('24.99')
    cy.get('#stockQuantity').type('50')
    
    // Select category (mock interaction)
    cy.get('.relative').first().click() // Category selector
    
    // Check featured and active checkboxes
    cy.get('#isFeatured').check()
    cy.get('#isActive').check()
    
    // Mock API call
    cy.intercept('POST', '/api/admin/products', { fixture: 'product-created.json' })
    
    // Submit form
    cy.contains('Add Product').click()
    
    // Verify success message or modal closure
    cy.contains('Add New Product').should('not.exist')
  })

  it('can edit an existing product', () => {
    // Mock products API to ensure we have data
    cy.intercept('GET', '/api/products*', { fixture: 'products-list.json' })
    
    // Wait for products to load
    cy.get('table tbody tr').should('have.length.greaterThan', 0)
    
    // Click edit button on first product
    cy.get('table tbody tr').first().find('button').contains('Edit').click()
    
    // Verify edit modal opens
    cy.contains('Edit Product').should('be.visible')
    
    // Update product name
    cy.get('#edit-name').clear().type('Updated Product Name')
    
    // Mock update API call
    cy.intercept('PUT', '/api/admin/products/*', { fixture: 'product-updated.json' })
    
    // Submit update
    cy.contains('Update Product').click()
    
    // Verify modal closes
    cy.contains('Edit Product').should('not.exist')
  })

  it('can delete a product', () => {
    // Mock products API
    cy.intercept('GET', '/api/products*', { fixture: 'products-list.json' })
    
    // Wait for products to load
    cy.get('table tbody tr').should('have.length.greaterThan', 0)
    
    // Click delete button on first product
    cy.get('table tbody tr').first().find('button[variant="destructive"]').click()
    
    // Verify confirmation dialog
    cy.contains('Delete Product').should('be.visible')
    cy.contains('Are you sure you want to delete this product?').should('be.visible')
    
    // Mock delete API call
    cy.intercept('DELETE', '/api/admin/products/*', { statusCode: 200 })
    
    // Confirm deletion
    cy.get('button').contains('Delete').click()
    
    // Verify dialog closes
    cy.contains('Delete Product').should('not.exist')
  })

  it('displays imported products section', () => {
    // Scroll down to imported products section
    cy.contains('Imported Products (Northwest Cosmetics)').should('be.visible')
    
    // Check if section has proper structure
    cy.contains('Imported Products (Northwest Cosmetics)').parent().within(() => {
      cy.get('table').should('exist')
    })
  })

  it('handles pagination correctly', () => {
    // Mock products with pagination
    cy.intercept('GET', '/api/products*', { fixture: 'products-paginated.json' })
    
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
})
