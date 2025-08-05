import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../select'
import { SelectWithNullState } from '../select-with-null-state'

// Mock console.warn to check for warnings
const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

describe('Select Component', () => {
  beforeEach(() => {
    consoleSpy.mockClear()
  })

  afterAll(() => {
    consoleSpy.mockRestore()
  })

  describe('SelectItem', () => {
    it('renders with valid value', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="test-value">Test Item</SelectItem>
          </SelectContent>
        </Select>
      )

      // The SelectItem should render without warnings
      expect(consoleSpy).not.toHaveBeenCalled()
    })

    it('renders with non-empty string value', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
          </SelectContent>
        </Select>
      )

      // Non-empty string should be allowed
      expect(consoleSpy).not.toHaveBeenCalled()
    })

    it('warns and returns null for undefined value', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={undefined as any}>Invalid Item</SelectItem>
          </SelectContent>
        </Select>
      )

      expect(consoleSpy).toHaveBeenCalledWith(
        'SelectItem: value prop is required and cannot be undefined or null'
      )
    })

    it('warns and returns null for null value', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null as any}>Invalid Item</SelectItem>
          </SelectContent>
        </Select>
      )

      expect(consoleSpy).toHaveBeenCalledWith(
        'SelectItem: value prop is required and cannot be undefined or null'
      )
    })

    it('accepts additional props', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem 
              value="test" 
              data-testid="custom-select-item"
              className="custom-class"
            >
              Test Item
            </SelectItem>
          </SelectContent>
        </Select>
      )

      // Should not warn for valid value
      expect(consoleSpy).not.toHaveBeenCalled()
    })
  })

  describe('Basic Select functionality', () => {
    it('opens and closes dropdown', async () => {
      
      render(
        <Select>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByTestId('select-trigger')
      
      // Click to open
      await userEvent.click(trigger)
      
      // Should show content
      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument()
        expect(screen.getByText('Option 2')).toBeInTheDocument()
      })
    })

    it('selects an option', async () => {
      const onValueChange = jest.fn()
      
      render(
        <Select onValueChange={onValueChange}>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )

      const trigger = screen.getByTestId('select-trigger')
      
      // Click to open
      await userEvent.click(trigger)
      
      // Click option
      await userEvent.click(screen.getByText('Option 1'))
      
      expect(onValueChange).toHaveBeenCalledWith('option1')
    })
  })
})

describe('SelectWithNullState Component', () => {
  beforeEach(() => {
    consoleSpy.mockClear()
  })

  const mockCategories = [
    { id: '1', name: 'Electronics' },
    { id: '2', name: 'Clothing' },
    { id: '3', name: 'Books' }
  ]

  describe('with valid data', () => {
    it('renders select with data prop', async () => {
      const onValueChange = jest.fn()

      render(
        <SelectWithNullState
          data={mockCategories}
          onValueChange={onValueChange}
          placeholder="Select category"
          data-testid="category-select"
        />
      )

      const trigger = screen.getByRole('combobox')
      await userEvent.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument()
        expect(screen.getByText('Clothing')).toBeInTheDocument()
        expect(screen.getByText('Books')).toBeInTheDocument()
      })
    })

    it('renders select with children', async () => {
      const onValueChange = jest.fn()

      render(
        <SelectWithNullState onValueChange={onValueChange} data-testid="category-select">
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectWithNullState>
      )

      const trigger = screen.getByRole('combobox')
      await userEvent.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument()
        expect(screen.getByText('Option 2')).toBeInTheDocument()
      })
    })

    it('handles selection correctly', async () => {
      const onValueChange = jest.fn()

      render(
        <SelectWithNullState
          data={mockCategories}
          onValueChange={onValueChange}
          data-testid="category-select"
        />
      )

      const trigger = screen.getByRole('combobox')
      await userEvent.click(trigger)

      const electronicsOption = await screen.findByText('Electronics')
      await userEvent.click(electronicsOption)

      expect(onValueChange).toHaveBeenCalledWith('1')
    })
  })

  describe('with empty/null data', () => {
    it('shows disabled state for empty array', () => {
      render(
        <SelectWithNullState
          data={[]}
          emptyStateMessage="No categories found"
          data-testid="category-select"
        />
      )

      const disabledElement = screen.getByTestId('category-select-disabled')
      expect(disabledElement).toBeInTheDocument()
      expect(disabledElement).toHaveClass('cursor-not-allowed', 'opacity-50')
      expect(screen.getByText('No categories found')).toBeInTheDocument()
    })

    it('shows disabled state for null data', () => {
      render(
        <SelectWithNullState
          data={null as any}
          emptyStateMessage="No data available"
          data-testid="category-select"
        />
      )

      const disabledElement = screen.getByTestId('category-select-disabled')
      expect(disabledElement).toBeInTheDocument()
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('shows disabled state for undefined data and no children', () => {
      render(
        <SelectWithNullState
          emptyStateMessage="Loading categories..."
          data-testid="category-select"
        />
      )

      const disabledElement = screen.getByTestId('category-select-disabled')
      expect(disabledElement).toBeInTheDocument()
      expect(screen.getByText('Loading categories...')).toBeInTheDocument()
    })

    it('uses default empty state message', () => {
      render(
        <SelectWithNullState
          data={[]}
          data-testid="category-select"
        />
      )

      expect(screen.getByText('No options available')).toBeInTheDocument()
    })
  })

  describe('data validation and filtering', () => {
    it('skips items with missing id', async () => {
      const invalidData = [
        { id: '1', name: 'Valid Item' },
        { name: 'Invalid Item - No ID' }, // Missing id
        { id: '2', name: 'Another Valid Item' }
      ]

      render(
        <SelectWithNullState
          data={invalidData as any}
          data-testid="category-select"
        />
      )

      const trigger = screen.getByRole('combobox')
      await userEvent.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Valid Item')).toBeInTheDocument()
        expect(screen.getByText('Another Valid Item')).toBeInTheDocument()
        expect(screen.queryByText('Invalid Item - No ID')).not.toBeInTheDocument()
      })

      // Should log warning for invalid item
      expect(consoleSpy).toHaveBeenCalledWith(
        'SelectWithNullState: Skipping item with missing id or name',
        { name: 'Invalid Item - No ID' }
      )
    })

    it('skips items with missing name', async () => {
      const invalidData = [
        { id: '1', name: 'Valid Item' },
        { id: '2' }, // Missing name
        { id: '3', name: 'Another Valid Item' }
      ]

      render(
        <SelectWithNullState
          data={invalidData as any}
          data-testid="category-select"
        />
      )

      const trigger = screen.getByRole('combobox')
      await userEvent.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('Valid Item')).toBeInTheDocument()
        expect(screen.getByText('Another Valid Item')).toBeInTheDocument()
      })

      // Should log warning for invalid item
      expect(consoleSpy).toHaveBeenCalledWith(
        'SelectWithNullState: Skipping item with missing id or name',
        { id: '2' }
      )
    })

    it('handles _id field as fallback', async () => {
      const dataWithMongoId = [
        { _id: 'mongo1', name: 'MongoDB Item 1' },
        { _id: 'mongo2', name: 'MongoDB Item 2' }
      ]

      render(
        <SelectWithNullState
          data={dataWithMongoId}
          data-testid="category-select"
        />
      )

      const trigger = screen.getByRole('combobox')
      await userEvent.click(trigger)

      await waitFor(() => {
        expect(screen.getByText('MongoDB Item 1')).toBeInTheDocument()
        expect(screen.getByText('MongoDB Item 2')).toBeInTheDocument()
      })
    })

    it('prefers id over _id', async () => {
      const onValueChange = jest.fn()
      const dataWithBothIds = [
        { id: 'preferred-id', _id: 'fallback-id', name: 'Test Item' }
      ]

      render(
        <SelectWithNullState
          data={dataWithBothIds}
          onValueChange={onValueChange}
          data-testid="category-select"
        />
      )

      const trigger = screen.getByRole('combobox')
      await userEvent.click(trigger)

      const item = await screen.findByText('Test Item')
      await userEvent.click(item)

      // Should use regular 'id' field
      expect(onValueChange).toHaveBeenCalledWith('preferred-id')
    })
  })

  describe('accessibility and props', () => {
    it('forwards data-testid to components', () => {
      render(
        <SelectWithNullState
          data={mockCategories}
          data-testid="category-select"
        />
      )

      // Should find the trigger with the testid
      expect(screen.getByTestId('category-select')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(
        <SelectWithNullState
          data={mockCategories}
          className="custom-select-class"
          data-testid="category-select"
        />
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveClass('custom-select-class')
    })

    it('handles disabled state', () => {
      render(
        <SelectWithNullState
          data={mockCategories}
          disabled={true}
          data-testid="category-select"
        />
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toBeDisabled()
    })

    it('uses custom placeholder', () => {
      render(
        <SelectWithNullState
          data={mockCategories}
          placeholder="Choose a category"
          data-testid="category-select"
        />
      )

      expect(screen.getByText('Choose a category')).toBeInTheDocument()
    })
  })

  describe('error handling and edge cases', () => {
    it('handles data changing from valid to empty', () => {
      const { rerender } = render(
        <SelectWithNullState
          data={mockCategories}
          data-testid="category-select"
        />
      )

      // Initially shows select
      expect(screen.getByRole('combobox')).toBeInTheDocument()

      // Update to empty data
      rerender(
        <SelectWithNullState
          data={[]}
          emptyStateMessage="No categories available"
          data-testid="category-select"
        />
      )

      // Should show disabled state
      expect(screen.getByTestId('category-select-disabled')).toBeInTheDocument()
      expect(screen.getByText('No categories available')).toBeInTheDocument()
    })

    it('handles custom null state content', () => {
      const customNullContent = (
        <div data-testid="custom-null-state">
          Custom empty state message
        </div>
      )

      render(
        <SelectWithNullState
          data={[]}
          nullStateContent={customNullContent}
          data-testid="category-select"
        />
      )

      // The component shows disabled state when no options, not custom null content
      expect(screen.getByTestId('category-select-disabled')).toBeInTheDocument()
      expect(screen.getByText('No options available')).toBeInTheDocument()
    })

    it('applies testids to individual items', async () => {
      render(
        <SelectWithNullState
          data={[{ id: 'test-id', name: 'Test Item' }]}
          data-testid="category-select"
        />
      )

      const trigger = screen.getByRole('combobox')
      await userEvent.click(trigger)

      // Should apply testid pattern to items
      await waitFor(() => {
        const item = screen.getByTestId('category-select-item-test-id')
        expect(item).toBeInTheDocument()
      })
    })
  })
})
