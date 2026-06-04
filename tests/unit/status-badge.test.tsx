import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ItemStatusBadge, TabStatusBadge } from '@/components/shared/status-badge'

describe('ItemStatusBadge', () => {
  it.each([
    ['ordered', 'Ordered'],
    ['in_progress', 'In Progress'],
    ['ready', 'Ready'],
    ['served', 'Served'],
    ['returned', 'Returned'],
  ] as const)('renders correct label for %s', (status, label) => {
    render(<ItemStatusBadge status={status} />)
    expect(screen.getByText(label)).toBeDefined()
  })
})

describe('TabStatusBadge', () => {
  it('renders Open for open tabs', () => {
    render(<TabStatusBadge status="open" />)
    expect(screen.getByText('Open')).toBeDefined()
  })

  it('renders Closed for closed tabs', () => {
    render(<TabStatusBadge status="closed" />)
    expect(screen.getByText('Closed')).toBeDefined()
  })
})
