import express from 'express'
import cors from 'cors'
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
    console.log(`Trying to parse id ${id}...`)
    src = await parsePrntScId(id)
    if (!src) console.log('Error during parsing id', id)
  }
  console.log('Parsed id', id, src)
  res.json({ url: src, id })
})

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`)
})
