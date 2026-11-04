import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { MethodManager } from './opt/uncor/manager.js'

/**
 * @typedef {{coords:number[], func:string, method:'grad' | 'fast' | 'gauss' | 'fletcher'}} UnConExtrBody
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 8000

const views = path.join(__dirname, 'views')

app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const ms = Date.now() - start
    console.log(`${res.statusCode} ${req.method} ${req.originalUrl} — ${ms}ms`)
  })
  next()
})

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())


app.get('/', (req, res) => {
  res.sendFile(path.join(views,'index.html'))
})

app.get('/opt/unextr',(req,res)=>{
  res.sendFile(path.join(views,'opt','num_one.html'))
})


app.get('/api/time', (req, res) => {
  res.json({ now: new Date().toISOString() })
})

app.post('/api/opt/unconextr', (req, res) => {
  const { func, coords, method } = req.body || {}

  if (typeof func !== 'string' || func.trim() === '') {
    return res.status(400).json({ error: 'Поле func должно быть непустой строкой' })
  }

  let start
  if (Array.isArray(coords)) {
    start = coords
  } else if (coords && typeof coords === 'object' && coords.x !== undefined && coords.y !== undefined && coords.z !== undefined
  ) {
    start = [coords.x, coords.y, coords.z]
  } else {
    return res.status(400).json({ 
      error: 'Поле coords должно быть массивом [x1, x2, x3] или объектом {x, y, z}' 
    })
  }

  if (start.length === 0 || start.some(v => typeof v !== 'number' || Number.isNaN(v))) {
    return res.status(400).json({ error: 'Все координаты в coords должны быть числами' })
  }

  const validMethods = ['grad', 'fast', 'gauss', 'fletcher']
  if (!validMethods.includes(method)) {
    return res.status(400).json({ 
      error: `Неизвестный метод. Допустимые: ${validMethods.join(', ')}` 
    })
  }

  try {
    const Solver = new MethodManager(func, start, method).Solver
    
    if (!Solver) {
      return res.status(500).json({ error: 'Не удалось инициализировать метод оптимизации' })
    }

    return res.json({
      answer: Solver.answer,
      historyIter: Solver.historyPoints,
      conv: Solver.historyConv,
    })
  } catch (e) {
    console.error('Ошибка при решении:', e)
    return res.status(500).json({ error: e.message || 'Внутренняя ошибка сервера' })
  }
})
app.get('/mechanick/mkrOrmke', (req, res) => {
  res.sendFile(path.join(views, 'mechanic', 'num_one.html'))
})

app.post('/api/mechanick/sde', (req, res) => {
  res.json(req.body)
})

app.listen(PORT, () => {
  console.log(`RUN SERVER http://localhost:${PORT}`)
})


