import puppeteer from 'puppeteer'
import config from './config.js'

const browser = await puppeteer.launch()

export function generateRandomId(size = 6) {
  let result = ''
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < size; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

export async function parsePrntScId(id) {
  const page = await browser.newPage()
  await page.goto(`https://prnt.sc/${id}`)
  let imageSrc = await page.evaluate(() => {
    try {
      const $image = document.querySelector('#screenshot-image')
      const src = $image.getAttribute('src')
      return src
    } catch {
      return null
    }
  })
  if (!imageSrc) return null
  try {
    const viewSource = await page.goto(imageSrc)
    const url = await page.evaluate(() => {
      return window.location.href
    })
    if (url.includes('removed.png')) return null
    if (imageSrc.includes('prntscr')) {
      try {
        const imgBuffer = await viewSource.buffer()
        ceche[id] = imgBuffer
        imageSrc = `${config.API_URL}/img/${id}`
      } catch {
        return null
      }
    }
    return imageSrc
  } catch {
    return null
  }
}
