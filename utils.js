import puppeteer from 'puppeteer'
import config from './config.js'
import consola from 'consola'

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
    consola.info('Starting browser instance...')
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()
    page.setDefaultNavigationTimeout(0)
    consola.info(`Parsing page with id ${id}`)
    await page.goto(`https://prnt.sc/${id}`)
    consola.info(`Page parsed with id ${id}!`)
    let imageSrc = await page.evaluate(() => {
      const $image = document.querySelector('#screenshot-image')
      const src = $image.getAttribute('src')
      return src
    })
    consola.info(`Evaluated page with id ${id}`)

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
    browser.close()
    return imageSrc
  } catch (e) {
    consola.error(e)
    browser.close()

    return null
  }
}
