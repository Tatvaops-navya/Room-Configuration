/* Remove .next — fixes stale webpack chunks (e.g. ./948.js, ./chunks/vendor-chunks/next.js). */
const fs = require('fs')
const path = require('path')
const dir = path.join(__dirname, '..', '.next')
fs.rmSync(dir, { recursive: true, force: true })
console.log('Removed .next — run npm run dev')
