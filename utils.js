import puppeteer from 'puppeteer'
import config from './config.js'
import consola from 'consola'
consola.info('Starting browser instance...')
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

export async function parsePrntScId(id, ceche) {
  try {
    const page = await browser.newPage()
    await page.goto(`https://prnt.sc/${id}`)
    let imageSrc = await page.evaluate(() => {
      const $image = document.querySelector('#screenshot-image')
      const src = $image.getAttribute('src')
      return src
    })
    if (!imageSrc) return null
    const viewSource = await page.goto(imageSrc)
    const url = await page.evaluate(() => {
      return window.location.href
    })
    if (url.includes('removed.png')) return null
    if (imageSrc.includes('prntscr')) {
      const imgBuffer = await viewSource.buffer()
      ceche[id] = imgBuffer
      imageSrc = `${config.API_URL}/img/${id}`
    }
    return imageSrc
  } catch (e) {
    consola.error(e)
    return null
  }
}
