import puppeteer from 'puppeteer'
import config from './config.js'
import consola from 'consola'

const browser = await puppeteer.launch({
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

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
  consola.info('Starting browser instance...')
    const page = await browser.newPage()
  try {
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

    if (!imageSrc) {
      await page.close()
      return null
    }
    if(imageSrc.includes('st.prntscr.com')){
      await page.close()
      return null
    }
    const viewSource = await page.goto(imageSrc)
    const url = await page.evaluate(() => {
      return window.location.href
    })
    console.log(url)
    if (url.includes('removed.png')) {
      await page.close()
      return null
    } 
   
    if (imageSrc.includes('prntscr')) {
      const imgBuffer = await viewSource.buffer()
      ceche[id] = imgBuffer
      imageSrc = `${config.API_URL}/img/${id}`
    }
    consola.info('Closing tab...')
    await page.close()
    return imageSrc
  } catch (e) {
    consola.error(e.message)
    await page.close()
    return null
  }
}
