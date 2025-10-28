// src/test/testServer.js
import { setupServer } from 'msw/node'

// (optional) base handlers used across many features)
const baseHandlers = []

export const server = setupServer(...baseHandlers)
