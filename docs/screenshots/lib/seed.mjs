import { readFileSync } from 'node:fs'
import { api } from './api.mjs'

// Replaces all application data with the given appdata export (.jsonl or .jsonl.gz).
export async function seed(filePath) {
  const gz = filePath.endsWith('.gz')
  const body = readFileSync(filePath)
  return api('/op/appdata?elevate=true', {
    method: 'POST',
    headers: { 'Content-Type': gz ? 'application/gzip' : 'application/jsonl' },
    body,
  })
}
