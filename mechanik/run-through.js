/**
 * Метод прогонки
 */


/**
 * Метод прогонки (Thomas algorithm) для решения трехдиагональной СЛАУ.
 * 
 * Решает систему вида:
 * A[i] * y[i-1] + B[i] * y[i] + C[i] * y[i+1] = D[i]
 * 
 * где A, B, C, D - массивы коэффициентов длины N.
 * Для крайних уравнений A[0] и C[N-1] обычно равны 0 (или игнорируются).
 */
export class TriagonalSolver {
    /**
     * @param {number[]} A 
     * @param {number[]} B 
     * @param {number[]} C 
     * @param {number[]} D 
     * @returns {number[]}
     */
    static solve(A, B, C, D){
        const N = B.length

        if (A.length !== N || C.length !== N || D.length !== N) {
            throw new Error("Размеры массивов A, B, C, D должны совпадать.");
        }

        const alpha = new Array(N)
        const beta = new Array(N)
        
        if(Math.abs(B[0]) < 1e-12){
            throw new Error("Деление на ноль в методе прогонки: B[0] слишком мало.");
        }

        alpha[0] = -C[0] / B[0]
        beta[0] = D[0] / B[0]

        for (let i = 1; i < N; i++){
            const denom = B[i] + A[i] * alpha[i-1];

            if (Math.abs(denom) < 1e-12) {
                throw new Error(`Деление на ноль в методе прогонки на шаге i=${i}. Проверьте диагональное преобладание.`);
            }

            alpha[i] = -C[i] / denom
            beta[i] = (D[i] - A[i] * beta[i-1]) / denom
        }

        const Y = new Array(N)

        Y[N-1] = beta[N-1]

        for (let i = N-2; i >= 0; i--) {
            Y[i] = alpha[i] *Y[i + 1] +  beta[i]
        }

        return Y
    }
}
