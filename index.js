import express from 'express'
import cors from 'cors'
import consola from 'consola'
import path from 'path'
import { generateRandomId, parsePrntScId } from './utils.js'
import config from './config.js'
const app = express()
const PORT = process.env.PORT || config.PORT

app.use(express.json())
app.use(cors())

const ceche = {}

app.get('/img/:id', async (req, res) => {
  const id = req.params.id
  if (!id) return res.status(401).json({ message: config.MESSAGES.BAD_REQUEST })
  if (!ceche[id])
    return res.status(401).json({ message: config.MESSAGES.BAD_REQUEST })
  const img = ceche[id]

  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': img.length
  })
  res.end(img)
})

app.get('/rimg', async (_, res) => {
  let id
  let src = null
  while (!src) {
    id = generateRandomId()
    consola.info(`Trying to parse id ${id}...`)
    src = await parsePrntScId(id, ceche)
    if (!src) consola.error('Error during parsing id', id)
  }
  consola.success('Parsed id', id, src)
  res.json({ url: src, id })
})

if (process.env.NODE_ENV === 'production') {
  console.log('Connecting Vue client')
  app.use('/', express.static(path.resolve('client', 'dist')))

  app.get('*', (req, res) => {
    res.sendFile(path.resolve('client', 'dist', 'index.html'))
  })
}

app.listen(PORT, async () => {
  consola.info(`Server is running on port ${PORT}`)
})
