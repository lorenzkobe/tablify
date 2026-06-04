import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock next/navigation for client components
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/',
  redirect: vi.fn(),
}))

// Mock next/cache for server actions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))
