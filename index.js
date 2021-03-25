const puppeteer = require("puppeteer");
const cors = require("cors");
const express = require("express");
const app = express();
app.use(express.json());
app.use(cors());
let browser;

const ceche = {};

const API_URL = "http://localhost:3000/img";

function generateRandomId() {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
async function parse(id) {
  const page = await browser.newPage();
  await page.goto(`https://prnt.sc/${id}`);
  let imageSrc = await page.evaluate(() => {
    try {
      const $image = document.querySelector("#screenshot-image");
      const src = $image.getAttribute("src");
      return src;
    } catch {
      return null;
    }
  });
  if (!imageSrc) return null;
  try {
  const viewSource = await page.goto(imageSrc);
  const url = await page.evaluate(() => {
    return window.location.href
  })
  if(url.includes('removed.png')) return null
  if (imageSrc.includes("prntscr")) {
    try {
      const imgBuffer = await viewSource.buffer();
      ceche[id] = imgBuffer;
      imageSrc = `${API_URL}/${id}`;
    } catch {
      return null;
    }
  }
  // const imgBuffer = await viewSource.buffer()
  // console.log('IMG', imageSrc)
  // console.log('BUFF', imgBuffer)
  return imageSrc;
  } catch {
    return null
  }
}

app.get("/img/:id", async (req, res) => {
  const id = req.params.id;
  if (id === "favicon.ico") res.status(401).json({ message: "плохой запрос" });
  // console.log(id)
  if (!id) return res.status(401).json({ message: "плохой запрос" });
  if (!ceche[id]) return res.status(401).json({ message: "плохой запрос" });
  // const buff = await parse(id)
  // if(!buff) res.status(401).json({message: 'плохой запрос'})
  const img = ceche[id]; //

  res.writeHead(200, {
    "Content-Type": "image/png",
    "Content-Length": img.length,
  });

  res.end(img);
});

app.get("/rimg", async (req, res) => {
  let flag = false;
  let src = null;
  let id
  while (!src) {
    id = generateRandomId();
    console.log(`trying ${id}...`);
    src = await parse(id);
    if (src) flag = true;
    else console.log(id, "error");
  }
  console.log(src);
  res.json({ url: src, id });
  // res.send(`<pre>${JSON.stringify(img)}</pre><img src="${src}" />`)
});

// app.get('/rimg', (req, res))

app.listen(3000, async () => {
  // Запускаем наш сервер на localhost:3000
  browser = await puppeteer.launch();
  console.log("browser launched");
  console.log("Андрей, Sasha");
});
//const url="https://prnt.sc/5365af"
