import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@/components/theme-provider'

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('ThemeProvider', () => {
  it('should render children correctly', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Test Child</div>
      </ThemeProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('should pass through props to NextThemesProvider', () => {
    render(
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <div>Test</div>
      </ThemeProvider>
    )

    // The component should render without errors when props are passed
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('should handle empty children', () => {
    render(<ThemeProvider></ThemeProvider>)

    // Should render without errors even with no children
    expect(document.body).toBeInTheDocument()
  })

  it('should handle multiple children', () => {
    render(
      <ThemeProvider>
        <div>First Child</div>
        <div>Second Child</div>
        <span>Third Child</span>
      </ThemeProvider>
    )

    expect(screen.getByText('First Child')).toBeInTheDocument()
    expect(screen.getByText('Second Child')).toBeInTheDocument()
    expect(screen.getByText('Third Child')).toBeInTheDocument()
  })
})