import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/vue'
import HelloWorld from '../components/HelloWorld.vue'

describe('HelloWorld.vue', () => {
  it('renders message when passed', async () => {
    render(HelloWorld, {})

    const el = await screen.findByText(/Hello World/i)
    expect(el).not.toBeNull()
  })
})
