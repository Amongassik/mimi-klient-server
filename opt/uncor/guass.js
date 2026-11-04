import { Method } from "./interfaceMethod.js";


/**
 * @typedef {{
 * row:number,
 * start:number,
 * end:number
 * }} Confines
 * @typedef {{eps:number,step:number}} MethodOptions
 */

export class MethodGuass extends Method{
    /**
     * Интерфейс для всех методов
     * @param {MathFunc} f 
     * @param {Number[]} start 
     * @param {MethodOptions} [options={}]
     */
    constructor(f, start=[], options={}){
        super(f,start,options)
        this.solve()
    }

    /**
     * @override
     */
    solve(){
        this.Setter()

        const A = this.f.quadraticForm.A
        const b = this.f.quadraticForm.b

        const n = this.point.length

        let xOld = this.point.slice()
        let xNew = this.point.slice()

        for(this.iterations = 0; this.iterations <this.step; this.iterations++){
            for(let i = 0; i < n; i++){

                let sumLeft = 0
                for(let j = 0; j < i; j++){
                    sumLeft += A[i][j] * xNew[j]
                }

                let sumRight = 0
                for(let j = i+1; j < n; j++){
                    sumRight += A[i][j] *xOld[j]
                }

                xNew[i] = (b[i] - sumLeft - sumRight)/A[i][i]
            }
            const delta = this.argConv(xNew.slice())

            if (delta < this.eps) {
                this.converged = true
                this.point = xNew.slice()
                break
            }

            ;[xOld, xNew] = [xNew, xOld]
        }

        this.point = xOld.slice()
        this.setAnswer(this.point)
    }

}

