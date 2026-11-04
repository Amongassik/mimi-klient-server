import { Method } from "./interfaceMethod.js";
import { add, scalar, matVec, dot } from "../parseToEval.js";

/**@typedef {{eps:number,step:number}} MethodOptions */

/** 
 * @extends Method
 * Класс оптимизации по градиенту
 */
export class MethodGrad extends Method{
    /**
     * Интерфейс для всех методов
     * @param {MathFunc} f 
     * @param {Number[]} start 
     * @param {MethodOptions} [options={}]
     * @param {'grad'| 'fast'} gradMethod 
     */
    constructor(f,start=[],options={},gradMethod){
        super(f,start,options)
        this.method = gradMethod
        this.solve()
    }

    /**
     * @override
     */
    solve(){
        this.Setter()
        if (this.method === 'fast'){
            if(!this.f.quadraticForm){
                throw new Error("Метод 'fast' требует квадратичную функцию")
            }
        }

        let aplha = 1

        for(this.iterations = 0; this.iterations < this.step; this.iterations++){
            const g =this.f.grad(this.point)
            const gNorm = Math.hypot(...g)

            if (gNorm < this.eps){
                this.converged = true
                break
            }

            if(this.method === 'fast'){
                aplha = this.stepOfOptim(this.point)
            }else{
                aplha = this.stepByArmijo(this.point, aplha)
            }

            const newPoint = add(this.point, scalar(g, aplha))
            this.point = newPoint

            this.argConv(this.point)
        }
        this.setAnswer(this.point)
    }

    /**
     * Проверка условия Армихо для поиска МАКСИМУМА
     * @param {number[]} coords Текущая точка
     * @param {number} currentStep Пробный шаг α
     * @param {number} [c1=1e-4] Константа Армихо (0 < c1 < 1)
     * @param {number} [shrink=0.5] Во сколько раз уменьшать шаг
     * @returns {number} Принятый шаг (currentStep, если условие выполнено,иначе уменьшенный)
     */
    stepByArmijo(coords, currentStep, c1 = 1e-4, shrink = 0.5) {
        const g = this.f.grad(coords)
        const gNormSq = dot(g, g)
        const fOld = this.f.call(coords)
        let aplha = currentStep

        while(true){
            const xNew = add(coords,scalar(g,aplha))
            const fNew = this.f.call(xNew)
            const threshold = fOld + c1 * aplha * gNormSq

            if (fNew >= threshold) return aplha

            aplha *= shrink
            if (aplha < 1e-4) return aplha
        }
    }

    /**
     * Оптимальный шаг для квадратичной формы при заданном направлении.
     * @param {number[]} coords
     * @returns {number}
     */
    stepOfOptim(coords){
        const g = this.f.grad(coords)
        const A = this.f.quadraticForm.A

        return dot(g,g)/Math.abs(dot(g,matVec(A,g)))
    }
}