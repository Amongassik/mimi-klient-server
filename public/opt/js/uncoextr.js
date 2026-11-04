

const inputs = document.querySelectorAll('.input-coords input[type="number"]')
const generatebtn = document.querySelector('.generate-coords')
const generateCheckOut = generatebtn.querySelector('input[type="checkbox"]')
const inputFunc = document.getElementById('func-str')
const radioMethods = document.querySelectorAll('.radio')
const inputCoords = document.querySelector('.input-coords').querySelectorAll('input')
const solveButton = document.getElementById('solve-btn')
const labelWarn = document.querySelector('.warning')

inputs.forEach(input => {
  input.addEventListener('input', () => {
    let v = parseInt(input.value, 10)
    if (isNaN(v)) return

    if (v > 100) input.value = 100
    if (v < -100) input.value = -100
  })

  input.addEventListener('blur', () => {
    if (input.value === '') return
    let v = parseInt(input.value, 10)
    if (isNaN(v)) input.value = ''
  })
})

generatebtn.addEventListener('click',(e)=>{
  if(e.target === generateCheckOut)return

  generateCheckOut.checked = !generateCheckOut.checked
})

const createWarn = (stringAlarm) =>{
  if(labelWarn)labelWarn.innerHTML=stringAlarm
}

const deleteWarn = () => {
  if(labelWarn)labelWarn.innerHTML=''
}


const Method = {
  method:null,
  choiceMethods:['grad','fast','gauss','fletcher'],
  selectMethod(id){
    if (id === null || id === undefined) {
      this.method = null
      return
    }
    this.method = this.choiceMethods[id] ?? null
  },
  isMethodChosen(){
    return Boolean(this.method)
  },
  getMethod(){
    return this.method
  },
}
/**
 * Объект координат
 */
const Coord = {
  data:{
    x:null,
    y:null,
    z:null,
  },
  addData(value){
    for(const k of Object.keys(this.data)){
      if(this.data[k] === null){
        this.data[k] = value
        return
      }
    }
  },
  resetData(){
    for(const key in this.data){
      this.data[key] = null
    }
  },
  hasNull(){
    return Object.values(this.data).some(v => v === null)
  },
  inList(){
    return Object.values(this.data)
  },
  genRate(){
    this.resetData()
    Object.keys(this.data).forEach(key => {
      this.data[key] = +((Math.random()*200 - 100).toFixed(4))
    })
  }
}


function genCoords() {
  Coord.genRate()
  const currentCoords = Coord.inList()

  for (let i = 0; i < inputCoords.length; i++) {
    inputCoords[i].value = currentCoords[i]
  }
}

/**
 * Записывает информацию в глобальный объект
 * @returns true - если все координаты вписаны в ячейки, иначе false и активирует предупреждение
 */
function getCoords() {
  Coord.resetData()  

  for (const input of inputCoords) {
    const raw = input.value.trim()
    if (raw === '') continue

    const num = Number(raw)
    if (Number.isNaN(num)) continue

    Coord.addData(num)
  }

  if (Coord.hasNull()) {
    createWarn('Заполните все координаты')
    return false
  }
  deleteWarn()
  return true
}


function getMethod(){
  let idMethod = null
  for(const radio of radioMethods){
    if(radio.checked){
      idMethod = Number(radio.id)
      break
    }
  }

  Method.selectMethod(idMethod)

  if(!Method.isMethodChosen()){
    createWarn('Выберите метод')
    return false
  }
  deleteWarn()
  return true
}

function getFunc(){
  return inputFunc.value
}

function getInputs(){
  if(generateCheckOut.checked){
    genCoords()
  }else{
    if(!getCoords())return false
  }
  if(!getMethod())return false
  return true
}

function drawChart() {
    const canvas = document.getElementById('conv-chart')
    if (!canvas) return

    const raw = responce.conv
    if (!Array.isArray(raw) || raw.length === 0) {
        console.warn('Нет данных для графика')
        return
    }

    const convData = raw.filter(v => Number.isFinite(v) && v > 0)
    if (convData.length === 0) {
        console.warn('Нет валидных точек для графика')
        return
    }

    const labels = convData.map((_, i) => i + 1)

    // Уничтожаем предыдущий график, хранящийся прямо на canvas
    if (canvas._chartInstance) {
        canvas._chartInstance.destroy()
        canvas._chartInstance = null
    }

    const ctx = canvas.getContext('2d')
    canvas._chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: '‖xₖ - xₖ₋₁‖',
                data: convData,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                pointRadius: 3,
                tension: 0.2,
                fill: true,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Сходимость по аргументу' },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `Δx = ${ctx.parsed.y.toExponential(3)}`,
                    },
                },
            },
            scales: {
                x: { title: { display: true, text: 'Итерация' } },
                y: {
                    type: 'logarithmic',
                    title: { display: true, text: '‖xₖ - xₖ₋₁‖' },
                },
            },
        },
    })
}

function displayResults(){
  const funcContainer = document.getElementById('func-value')
  const fv = funcContainer.querySelector('#fv')
  if(fv) fv.remove()
  
  const vectorXContainer = document.getElementById('x-value')
  vectorXContainer.innerHTML = ''

  const iterCount = document.getElementById('iter-count')
  iterCount.innerHTML = ''

  const iterContainer = document.querySelector('.iterations')
  iterContainer.innerHTML = ''

  const valueFunc = document.createElement('span')
  valueFunc.id = 'fv'
  valueFunc.innerHTML = `${+(responce.answer.f).toFixed(4)}`
  funcContainer.appendChild(valueFunc)

  const x = responce.answer.x

  
  for(const i of x){
    const xElement = document.createElement('p')
    xElement.innerHTML = `${+(i.toFixed(4))}`
    vectorXContainer.appendChild(xElement)
  }

  const iterations = responce.historyIter
  let numOfIter = 0

  for(const iter of iterations){
    const Oneter = document.createElement('div')
    const labelIter = document.createElement('span')
    labelIter.innerHTML =`${++numOfIter}: `
    const vec = document.createElement('div')
    vec.classList.add('vector')
    for(const i of iter){
      const cord = document.createElement('p')
      cord.innerHTML = `${+(i.toFixed(2))}`
      vec.appendChild(cord)
    }
    Oneter.appendChild(labelIter)
    Oneter.appendChild(vec)
    iterContainer.appendChild(Oneter)
  }

  iterCount.innerHTML = `${numOfIter}`
}

const responce = {
  readAnswer(obj){
    for(const key in obj){
      this[key] = obj[key]
    }
  },
}
async function sendInputs(){
  if(!getInputs())return null

  const data = {
    method: Method.getMethod(),
    func:getFunc(),
    coords: Coord.data,
  }

  try{
    const res = await fetch('/api/opt/unconextr',{
      method: 'POST',
      headers:{
        'Content-Type':'application/json'
      },
      body:JSON.stringify(data),
    })

    if(!res.ok){
      const err = await res.json().catch(()=>{})
      createWarn(`Сервер вернул ${res.status}`)
    }

    const result = await res.json()
    console.log(result)
    responce.readAnswer(result)
    drawChart()
    displayResults()
    return result
  }catch(err){
    console.error(err)
    return null
  }
}

solveButton.addEventListener('click', sendInputs)



