// Replaces the running stack's data with an appdata export: node seed.mjs <file.jsonl[.gz]>
import path from 'node:path'
import { seed } from './lib/seed.mjs'

const file = process.argv[2]
if (!file) { console.error('usage: node seed.mjs <appdata.jsonl[.gz]>'); process.exit(1) }
const result = await seed(path.resolve(file))
console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2))
