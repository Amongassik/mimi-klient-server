import { MathFunc } from "../parseToEval.js"
import { MethodGrad } from "./grad.js"
import { MethodGuass } from "./guass.js"
import { MethodFletcher } from "./fletcher.js"

/**
 * @typedef {MethodGrad | MethodGuass | MethodFletcher} Solver
 */

export class MethodManager{
    /**
     * 
     * @param {string} funcString 
     * @param {number[]} start 
     * @param {'grad' | 'fast' | 'gauss' | 'fletcher'} method 
     */
    constructor(funcString,start = [],method){
        this.options = {
            eps:1e-6,
            step:1000,
        }
        
        /**@type {MathFunc} */
        this.func = new MathFunc(funcString)

        /**@type {number[]} */
        this.start = start
        /**@type {'grad' | 'fast' | 'gauss' | 'fletcher'} */
        this.method = method

        /**@type {Solver} */
        this.Solver = this.solve()
    }

    solve(){
        let Solver = null
        if (this.method === 'grad' || this.method === 'fast'){
            Solver = new MethodGrad(this.func, this.start, this.options, this.method)
        }
        if (this.method === 'gauss'){
            Solver = new MethodGuass(this.func,this.start,this.options)
        }
        if (this.method === 'fletcher'){
            Solver = new MethodFletcher(this.func,this.start,this.options)
        }
        return Solver
    }
}

// const funcString = '-2x1^2-5x2^2-2x3^2+2x1x2-x2x3+8x3'
// const startPoint = [1, 1, 1]

// const methods = ['grad', 'fast', 'gauss', 'fletcher']

// for (const method of methods) {
//     console.log(`\n=== Метод: ${method.toUpperCase()} ===`)
    
//     // Создаем менеджер (он сам вызовет solve)
//     const manager = new MethodManager(funcString, startPoint, method)
//     const solver = manager.Solver

//     if (!solver) {
//         console.log('❌ Ошибка: solver не создан')
//         continue
//     }

//     // Выводим результаты
//     console.log('x* =', solver.point)
//     console.log('f(x*) =', solver.answer.f)
    
//     // Проверка градиента в найденной точке
//     const gradAtX = manager.func.grad(solver.point)
//     const gradNorm = Math.hypot(...gradAtX)
    
//     console.log('∇f(x*) =', gradAtX)
//     console.log('‖∇f(x*)‖ =', gradNorm)
//     console.log('iterations =', solver.iterations)
//     console.log('converged =', solver.converged)

//     // Проверка на успех
//     if (gradNorm < 1e-5) {
//         console.log('✅ Тест пройден: точка стационарна')
//     } else {
//         console.log('⚠️ Тест не пройден: градиент слишком большой')
//     }
// }


