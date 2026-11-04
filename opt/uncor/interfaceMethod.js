import { MathFunc, add, scalar, matVec, dot } from '../parseToEval.js'

/**
 * @typedef {{eps:number,step:number}} MethodOptions
 * @typedef {{f:number,x:number[]}} Answer
 */

/**
 * @abstract
 * интерфейс класса решателей
 */
export class Method {
    /**
     * Интерфейс для всех методов
     * @param {MathFunc} f 
     * @param {Number[]} start 
     * @param {MethodOptions} [options={}]
     */
    constructor(f,start=[],options = {}){
        /**@type {MathFunc}*/
        this.f = f
        /** @type {Number[]} */
        this.start = start.slice()
        /** @type {Number[]} */
        this.point = start.slice()
        /** @type {Number} */
        this.eps = options.eps ?? 1e-6
        /** @type {Number} */
        this.step = options.step ?? 1000
        
        /** @type {Number} */
        this.iterations = 0
        /** @type {Number[][]} */
        this.historyPoints = []
        /** @type {Number[]} */
        this.historyConv = []
        /** @type {Boolean} */
        this.converged = false

        /** @type {Answer} */
        this.answer = {}

        this.historyPoints.push(this.point.slice())
    }

    /**
     * Запустить оптимизацию. Переопределяется в наследниках.
     * @abstract
     */
    solve(){
        throw new Error('Method.solve() not implemented')
    }

    /**
     * Проверка сходимости по аргументу и запись в историю
     * @param {number[]} coords 
     * @returns {number}
     * @returns {number} delta
     */
    argConv(coords){
        const prev = this.historyPoints[this.historyPoints.length - 1]
        if(!prev){
            this.historyPoints.push(coords.slice())
            this.historyConv.push(Infinity)
            return Infinity
        }

        const diff = coords.map((v,i) => v-prev[i])
        const delta = Math.hypot(...diff)

        this.historyPoints.push(coords.slice())
        this.historyConv.push(delta)
        return delta
    }

    /**
     * Антиградиент
     * @param {number[]} coords 
     * @returns {number[]}
     */
    antiGrad(coords){
        return scalar(this.f.grad(coords), -1)
    }

    /**
     * Проверка сходимости по значению функции и запись в историю
     */
    funcConv(coords){

    }

    /**
     * Проверка сходимости по градиенту и запись в историю
     */
    gradConv(coords){

    }
    
    Setter(){
        this.iterations = 0
        this.historyConv = []
        this.historyPoints = []
        this.converged = false
        this.point = this.start.slice()
        this.historyPoints.push(this.point.slice())
        this.answer = {}
    }

    setAnswer(coords){
        this.answer = {
            f: this.f.call(coords),
            x: coords,
        }
    }
}







