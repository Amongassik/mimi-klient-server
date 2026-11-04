/**
 * Условие к задаче
 * 
 * y''+1.5y'-xy=0,5
 * 
 * 
 * y''+p(x)y'+q(x)y=f(x)
 * 
 * Условия 
 * @typedef {Dirichle | Neuman | Robin} startConditions
 */

/**
 *   условие Дирихле y(a) = A
 * @typedef {{type:'Dirichle',value:number}} Dirichle
 */

/**
 *  Условие Неймана y'(a) = B
 * @typedef {{type:'Neuman',value:number}} Neuman
 */

/**
 *  Условие Робена αy′(a)+βy(a)=γ
 * @typedef {{type:'Robin',alpha:number,beta:number,gamma:number}} Robin
 */


import { TriagonalSolver } from "./run-through.js"

export const Conditions = {
    start: 1.3,
    end: 1.6,

    p: (x) => 1.5,
    q: (x) => -x,
    f: (x) => 0.5,

    /**
     * @type {Robin}
     */
    leftBound: {
        type:'Robin',
        alpha: -1,
        beta: 2,
        gamma: 1
    },

    /**
     * @type {Dirichle}
     */
    rightBound: {
        type: 'Dirichle',
        value: 3
    }
}

