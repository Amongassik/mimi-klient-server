/**
 * Метод конечных разностей
 */

import { Conditions } from "./cond.js";
import { TriagonalSolver } from "./run-through.js";

export function solveMKR(h) {
    const a = Conditions.start
    const b = Conditions.end

    const n = (b - a) / h
    const X = []

    for (let i = 0; i <= n; i++){
        X.push(a + i * h)
    }

    const A = new Array(n + 1).fill(0)
    const B = new Array(n + 1).fill(0)
    const C = new Array(n + 1).fill(0)
    const D = new Array(n + 1).fill(0)

    for (let i = 1; i < n; i++){
        const xi = X[i]
        const p = Conditions.p(xi)
        const q = Conditions.q(xi)
        const f = Conditions.f(xi)

        A[i] = 1 - (p * h)/2
        B[i] = -(2-q * h * h)
        C[i] = 1 + (p * h)/2
        D[i] = f * h * h
    }

    const boundaryConditions = []
    /**
     * @param {Object} cond 
     * @param {Boolean} isLeft 
     */
    const appendConditions = (cond,isLeft = false) => {
        boundaryConditions.push({
            node: isLeft ? 0 : n,
            cond: cond,
            isLeft: isLeft,
        })
    }

    appendConditions(Conditions.leftBound,true)
    appendConditions(Conditions.rightBound)

    for (let { node, cond, isLeft } of boundaryConditions) {
        if (cond.type === 'Dirichlet') {
            B[node] = 1;
            D[node] = cond.value;
            A[node] = 0;
            C[node] = 0;
        } 
        else if (cond.type === 'Robin') {
            if (isLeft) {
                B[node] = cond.beta * h - cond.alpha;
                C[node] = cond.alpha;
                D[node] = cond.gamma * h;
                A[node] = 0;
            } else {
                A[node] = -cond.alpha;
                B[node] = cond.alpha + cond.beta * h;
                D[node] = cond.gamma * h;
                C[node] = 0;
            }
        }
        else if (cond.type === 'Neumann') {
            if (isLeft) {
                B[node] = 1;
                C[node] = -1;
                D[node] = -cond.value * h;
                A[node] = 0;
            } else {
                A[node] = -1;
                B[node] = 1;
                D[node] = cond.value * h;
                C[node] = 0;
            }
        }
        else {
            throw new Error(`Неизвестный тип граничного условия: ${cond.type}`);
        }
    }

    const Y = TriagonalSolver.solve(A, B, C, D)

    return {X, Y}
}