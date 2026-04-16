/* Remove .next — fixes stale webpack chunks (e.g. Cannot find module './948.js'). */
const fs = require('fs')
const path = require('path')
const dir = path.join(__dirname, '..', '.next')
fs.rmSync(dir, { recursive: true, force: true })
console.log('Removed .next — run npm run dev')
