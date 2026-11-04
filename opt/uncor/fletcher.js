import { Method } from "./interfaceMethod.js";
import { scalar, dot, add, matVec } from "../parseToEval.js";

/**
 * @typedef {{eps:number,step:number}} MethodOptions
 */

/**
 * @extends Method
 */
export class MethodFletcher extends Method{
    /**
     * Интерфейс для всех методов
     * @param {MathFunc} f 
     * @param {Number[]} start 
     * @param {MethodOptions} [options={}]
     */
    constructor(f,start=[],options={}){
        super(f,start,options)
        this.solve()
    }

    /**
     * @override
     */
    solve(){
        this.Setter()

        const A = this.f.quadraticForm.A
        const n =this.point.length

        let x = this.point.slice()
        let g = this.f.grad(x)
        let d = g.slice()

        for (this.iterations = 0; this.iterations < this.step; this.iterations++){
            
            const gNorm = dot(g,g)
            if (gNorm < this.eps){
                this.converged = true
                break
            }

            const alpha = this.stepOfOptim(g,d)

            x = add(x,scalar(d,alpha))


            const delta = this.argConv(x)
            if(delta < this.eps){
                this.converged = true
                break
            }
            
            const gNew = this.f.grad(x)

            const beta = this.beta(g,gNew)

            d = this.direction(gNew, d, beta)

            g = gNew

            if ((this.iterations + 1) % n === 0){
                d = g.slice()
            }
        }
        this.point = x.slice()
        this.setAnswer(this.point)
    }

    /**
     * Шаг
     * @param {number[]} g 
     * @param {number[]} d 
     * @returns {number}
     */
    stepOfOptim(g,d){
        const A = this.f.quadraticForm.A

        const num = dot(g,d)
        const den = dot(d,matVec(A,d))

        return den === 0 ? 0 : -num/den
    }

    /**
     * Коэффициент
     * @param {number[]} gOld 
     * @param {number[]} g 
     * @returns 
     */
    beta(gOld,gNew){
        const num = dot(gNew,gNew)
        const den = dot(gOld,gOld)
        return den === 0 ? 0 : num / den
    }

    /**
     * Направление
     * @param {number[]} gNew 
     * @param {number[]} dOld 
     * @param {number} beta 
     * @returns 
     */
    direction(gNew,dOld,beta){
        return add(gNew,scalar(dOld,beta))
    }
}
