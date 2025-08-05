import * as React from "react"
import { AlertCircle } from "lucide-react"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./select"
import { cn } from "../../lib/utils"

interface SelectWithNullStateProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  emptyStateMessage?: string
  className?: string
  disabled?: boolean
  children?: React.ReactNode
  data?: Array<{ id: string; _id?: string; name: string; [key: string]: any }>
  nullStateContent?: React.ReactNode
  'data-testid'?: string
}

const SelectWithNullState = React.forwardRef<
  React.ElementRef<typeof Select>,
  SelectWithNullStateProps
>(({ 
  value, 
  onValueChange, 
  placeholder = "Select an option", 
  emptyStateMessage = "No options available",
  className,
  disabled,
  children,
  data,
  nullStateContent,
  'data-testid': testId,
  ...props 
}, ref) => {
  // Handle null/empty data arrays
  const hasData = data && Array.isArray(data) && data.length > 0
  const hasChildren = React.Children.count(children) > 0
  const hasOptions = hasData || hasChildren

  // Default null state content
  const defaultNullStateContent = (
    <div className="flex items-center justify-center py-6 px-4 text-center">
      <div className="space-y-2">
        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground font-medium">
          {emptyStateMessage}
        </p>
        <p className="text-xs text-muted-foreground">
          Please check your connection or try again later
        </p>
      </div>
    </div>
  )

  if (!hasOptions) {
    return (
      <div className={cn("w-full", className)}>
        <div 
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-muted px-3 py-2 text-sm cursor-not-allowed opacity-50"
          data-testid={testId ? `${testId}-disabled` : undefined}
        >
          <span className="text-muted-foreground">{emptyStateMessage}</span>
          <AlertCircle className="h-4 w-4 opacity-50" />
        </div>
      </div>
    )
  }

  return (
    <Select 
      value={value} 
      onValueChange={onValueChange} 
      disabled={disabled}
      {...props}
    >
      <SelectTrigger className={className} data-testid={testId}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {/* Render data items if provided */}
        {hasData && data!.map((item) => {
          const itemId = item._id || item.id
          const itemName = item.name
          
          // Skip items with invalid id or name
          if (!itemId || !itemName) {
            console.warn('SelectWithNullState: Skipping item with missing id or name', item)
            return null
          }

          return (
            <SelectItem 
              key={itemId} 
              value={itemId}
              data-testid={testId ? `${testId}-item-${itemId}` : undefined}
            >
              {itemName}
            </SelectItem>
          )
        })}
        
        {/* Render children if no data provided */}
        {!hasData && children}
        
        {/* Show null state content if no options */}
        {!hasOptions && (nullStateContent || defaultNullStateContent)}
      </SelectContent>
    </Select>
  )
})

SelectWithNullState.displayName = "SelectWithNullState"

export { SelectWithNullState }
export type { SelectWithNullStateProps }
