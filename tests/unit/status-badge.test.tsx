import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  OrderStatusBadge,
  ItemStatusBadge,
  TableStatusBadge,
  TabStatusBadge,
} from '@/components/shared/status-badge'

describe('OrderStatusBadge', () => {
  it.each([
    ['pending', 'Pending'],
    ['in_progress', 'In Progress'],
    ['ready', 'Ready'],
    ['served', 'Served'],
    ['paid', 'Paid'],
    ['cancelled', 'Cancelled'],
  ] as const)('renders correct label for %s', (status, label) => {
    render(<OrderStatusBadge status={status} />)
    expect(screen.getByText(label)).toBeDefined()
  })
})

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

describe('TableStatusBadge', () => {
  it('renders Available for available tables', () => {
    render(<TableStatusBadge status="available" />)
    expect(screen.getByText('Available')).toBeDefined()
  })

  it('renders Occupied for occupied tables', () => {
    render(<TableStatusBadge status="occupied" />)
    expect(screen.getByText('Occupied')).toBeDefined()
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
