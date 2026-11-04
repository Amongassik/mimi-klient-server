/**
 * Узел AST (абстрактного синтаксического дерева).
 * @typedef {NumberNode | VarNode | UnaryNode | BinaryNode} ASTNode
 */

/** @typedef {{ type: 'Number', value: number }} NumberNode */
/** @typedef {{ type: 'Var', name: string }} VarNode */
/** @typedef {{ type: 'Unary', op: '-', operand: ASTNode }} UnaryNode */
/** @typedef {{ type: 'Binary', op: '+'|'-'|'*'|'/'|'^', left: ASTNode, right: ASTNode }} BinaryNode */

/**
 * Токен после токенизации.
 * @typedef {Object} Token
 * @property {'NUM'|'VAR'|'OP'} type
 * @property {string|number} value
 */

/**
 * Скомпилированная функция от массива координат.
 * @typedef {(args: number[]) => number} CompiledFunc
 */

/**
 * Частная производная как функция от координат.
 * Может принимать массив (порядок = порядок this.vars) или объект {x1: ..., x2: ...}.
 * @typedef {(coords: number[] | Record<string, number>) => number} PartialFunc
 */

/** 
 * Квадратичная форма в виде матрицы и свободного вектора
 * @typedef {{A:number[][],b:number[]}} QuadraticForm
*/

/**
 * Класс для парсинга, компиляции и дифференцирования математических функций.
 */
export class MathFunc {
    constructor(funcStr) {
        /** @type {String} */
        this.funcStr = funcStr.replace(/\s+/g, '')
        
        /** @type {String[]} */
        this.vars = []
        /**@type {Token[]} */
        this.tokens = []
        /** @type {Number} */
        this.pos = 0

        this.#tokenize(this.funcStr)

        /** @type {ASTNode} */
        this.ast = this.#parse()

        /** @type {CompiledFunc} */
        this.func = this.#compile(this.ast)
        /** @type {PartialFunc} */
        this.partials = this.vars.map(name => this.partial(name))

        /** @type {QuadraticForm | null}*/
        this.quadraticForm = this.extractQuadraticForm()
    }

    /**
     * Добавить токен в список.
     * @param {'NUM'|'VAR'|'OP'} type
     * @param {string|number} value
     */
    #addToken(type, value) {
        this.tokens.push({ type, value })
    }

    /**
     * Разбить строку на токены.
     * @param {string} str
     */
    #tokenize(str) {
        let i = 0
        while (i < str.length) {
            const ch = str[i]

            if (ch === ' ') { i++; continue }

            if (/[0-9.]/.test(ch)) {
                let numStr = ''
                while (i < str.length && /[0-9.]/.test(str[i])) {
                    numStr += str[i++]
                }
                this.#addToken('NUM', Number(numStr))
                continue
            }

            if (ch === 'x') {
                let varStr = 'x'
                i++
                while (i < str.length && /[0-9]/.test(str[i])) {
                    varStr += str[i++]
                }
                if (!this.vars.includes(varStr)) this.vars.push(varStr)
                this.#addToken('VAR', varStr)
                continue
            }

            if ('+-*/^()'.includes(ch)) {
                this.#addToken('OP', ch)
                i++
                continue
            }

            throw new Error('Неизвестный символ: ' + ch)
        }
    }

    /**
     * Разобрать токены в AST.
     * @returns {ASTNode}
     */
    #parse() {
        this.pos = 0
        const ast = this.#parseExpr()
        if (this.pos < this.tokens.length) {
            throw new Error('Лишние токены: ' + this.tokens[this.pos].value)
        }
        return ast
    }

    /**
     * Посмотреть текущий токен без сдвига.
     * @returns {Token|null}
     */
    #peek() { return this.tokens[this.pos] || null }

    /**
     * Взять текущий токен и сдвинуть позицию.
     * @returns {Token|undefined}
     */
    #next() { return this.tokens[this.pos++] }

    /**
     * Проверить, что текущий токен — оператор с заданным значением.
     * @param {string} value
     * @returns {boolean}
     */
    #isOp(value) {
        const t = this.#peek()
        return t && t.type === 'OP' && t.value === value
    }

    #parseExpr() {
        let left = this.#parseTerm()
        while (this.#isOp('+') || this.#isOp('-')) {
            const op = this.#next().value
            const right = this.#parseTerm()
            left = { type: 'Binary', op, left, right }
        }
        return left
    }

    /** @returns {ASTNode} */
    #parseTerm() {
        let left = this.#parseFactor()
        while (true) {
            if (this.#isOp('*') || this.#isOp('/')) {
                const op = this.#next().value
                const right = this.#parseFactor()
                left = { type: 'Binary', op, left, right }
                continue
            }
            const t = this.#peek()
            if (t && (t.type === 'VAR' || (t.type === 'OP' && t.value === '('))) {
                const right = this.#parseFactor()
                left = { type: 'Binary', op: '*', left, right }
                continue
            }
            break
        }
        return left
    }

    /** @returns {ASTNode} */
    #parseFactor() {
        const left = this.#parseUnary()
        if (this.#isOp('^')) {
            this.#next()
            const right = this.#parseFactor()
            return { type: 'Binary', op: '^', left, right }
        }
        return left
    }

    /** @returns {ASTNode} */
    #parseUnary() {
        if (this.#isOp('+') || this.#isOp('-')) {
            const op = this.#next().value
            const operand = this.#parseUnary()
            if (op === '+') return operand
            return { type: 'Unary', op: '-', operand }
        }
        return this.#parsePrimary()
    }

    /** @returns {ASTNode} */
    #parsePrimary() {
        const t = this.#peek()
        if (!t) throw new Error('Неожиданный конец выражения')

        if (t.type === 'NUM') {
            this.#next()
            return { type: 'Number', value: t.value }
        }
        if (t.type === 'VAR') {
            this.#next()
            return { type: 'Var', name: t.value }
        }
        if (t.type === 'OP' && t.value === '(') {
            this.#next()
            const inner = this.#parseExpr()
            if (!this.#isOp(')')) throw new Error('Ожидалась )')
            this.#next()
            return inner
        }
        throw new Error('Неожиданный токен: ' + t.value)
    }

    /**
     * Скомпилировать AST в функцию от массива аргументов.
     * @param {ASTNode} node
     * @returns {CompiledFunc}
     */
    #compile(node) {
        if (node.type === 'Number') {
            const v = node.value
            return () => v
        }
        if (node.type === 'Var') {
            const idx = this.vars.indexOf(node.name)
            return (args) => args[idx]
        }
        if (node.type === 'Unary') {
            const operand = this.#compile(node.operand)
            return (args) => -operand(args)
        }
        if (node.type === 'Binary') {
            const l = this.#compile(node.left)
            const r = this.#compile(node.right)
            switch (node.op) {
                case '+': return (args) => l(args) + r(args)
                case '-': return (args) => l(args) - r(args)
                case '*': return (args) => l(args) * r(args)
                case '/': return (args) => l(args) / r(args)
                case '^': return (args) => Math.pow(l(args), r(args))
            }
        }
        throw new Error('Неизвестный узел: ' + node.type)
    }

    /**
     * Символьное дифференцирование AST по переменной.
     * @param {ASTNode} node
     * @param {string} varName
     * @returns {ASTNode}
     */
    #derivative(node, varName) {
        if (node.type === 'Number') {
            return { type: 'Number', value: 0 }
        }

        if (node.type === 'Var') {
            return { type: 'Number', value: node.name === varName ? 1 : 0 }
        }

        if (node.type === 'Unary') {
            return {
                type: 'Unary',
                op: '-',
                operand: this.#derivative(node.operand, varName),
            }
        }

        if (node.type === 'Binary') {
            const u = node.left
            const v = node.right
            const du = this.#derivative(u, varName)
            const dv = this.#derivative(v, varName)

            if (node.op === '+') {
                return { type: 'Binary', op: '+', left: du, right: dv }
            }

            if (node.op === '-') {
                return { type: 'Binary', op: '-', left: du, right: dv }
            }

            if (node.op === '*') {
                return {
                    type: 'Binary',
                    op: '+',
                    left: { type: 'Binary', op: '*', left: du, right: v },
                    right: { type: 'Binary', op: '*', left: u, right: dv },
                }
            }

            if (node.op === '/') {
                return {
                    type: 'Binary',
                    op: '/',
                    left: {
                        type: 'Binary',
                        op: '-',
                        left: { type: 'Binary', op: '*', left: du, right: v },
                        right: { type: 'Binary', op: '*', left: u, right: dv },
                    },
                    right: {
                        type: 'Binary',
                        op: '^',
                        left: v,
                        right: { type: 'Number', value: 2 },
                    },
                }
            }

            if (node.op === '^') {
                if (v.type !== 'Number') {
                    throw new Error('Производная от u^v с переменным показателем не поддерживается')
                }
                const n = v.value
                return {
                    type: 'Binary',
                    op: '*',
                    left: {
                        type: 'Binary',
                        op: '*',
                        left: { type: 'Number', value: n },
                        right: {
                            type: 'Binary',
                            op: '^',
                            left: u,
                            right: { type: 'Number', value: n - 1 },
                        },
                    },
                    right: du,
                }
            }
        }

        throw new Error('Неизвестный узел: ' + node.type)
    }


    /**
     * Упростить AST (свёртка констант, нейтральные элементы).
     * @param {ASTNode} node
     * @returns {ASTNode}
     */
    #simplify(node) {
        if (node.type === 'Number' || node.type === 'Var') {
            return node
        }

        if (node.type === 'Unary') {
            const operand = this.#simplify(node.operand)
            if (operand.type === 'Number') {
                return { type: 'Number', value: -operand.value }
            }
            if (operand.type === 'Unary' && operand.op === '-') {
                return operand.operand
            }
            return { type: 'Unary', op: '-', operand }
        }

        if (node.type === 'Binary') {
            const l = this.#simplify(node.left)
            const r = this.#simplify(node.right)

            if (l.type === 'Number' && r.type === 'Number') {
                const a = l.value, b = r.value
                switch (node.op) {
                    case '+': return { type: 'Number', value: a + b }
                    case '-': return { type: 'Number', value: a - b }
                    case '*': return { type: 'Number', value: a * b }
                    case '/': return { type: 'Number', value: a / b }
                    case '^': return { type: 'Number', value: Math.pow(a, b) }
                }
            }

            switch (node.op) {
                case '+':
                    if (l.type === 'Number' && l.value === 0) return r
                    if (r.type === 'Number' && r.value === 0) return l
                    break
                case '-':
                    if (r.type === 'Number' && r.value === 0) return l
                    break
                case '*':
                    if (l.type === 'Number' && l.value === 0) return { type: 'Number', value: 0 }
                    if (r.type === 'Number' && r.value === 0) return { type: 'Number', value: 0 }
                    if (l.type === 'Number' && l.value === 1) return r
                    if (r.type === 'Number' && r.value === 1) return l
                    break
                case '/':
                    if (r.type === 'Number' && r.value === 1) return l
                    break
                case '^':
                    if (r.type === 'Number' && r.value === 1) return l
                    if (r.type === 'Number' && r.value === 0) return { type: 'Number', value: 1 }
                    break
            }

            return { type: 'Binary', op: node.op, left: l, right: r }
        }

        throw new Error('Неизвестный узел: ' + node.type)
    }

    /**
     * Получить частную производную по переменной.
     * @param {string} varName
     * @returns {PartialFunc}
     */
    partial(varName) {
        if (!this.vars.includes(varName)) {
            throw new Error('Переменной нет в функции: ' + varName)
        }

        const derivativeAst = this.#derivative(this.ast, varName)
        const simplified = this.#simplify(derivativeAst)
        const fn = this.#compile(simplified)

        return (coords) => {
            const args = Array.isArray(coords)
                ? coords
                : this.vars.map(name => coords[name])
            return fn(args)
        }
    }

    /**
     * Вычислить значение функции в точке.
     * @param {number[] | Record<string, number>} coords Массив (порядок = vars) или объект
     * @returns {number}
     */
    call(coords) {
        const args = Array.isArray(coords)
            ? coords
            : this.vars.map(name => coords[name])
        return this.func(args)
    }

    /**
     * Вычислить градиент (все частные производные) в точке.
     * @param {number[] | Record<string, number>} coords
     * @returns {number[]}
     */
    grad(coords) {
        return this.partials.map(f => f(coords))
    }

    /**
     * Получить матрицу квадратичной формы A и вектор b,
     * если функция квадратичная. Иначе — null.
     * @returns {QuadraticForm | null}
     */
    extractQuadraticForm(){
        const n = this.vars.length

        const A = []

        for (let i = 0; i < n; i++) {
            A.push([])

            const dAsti_i = this.#simplify(this.#derivative(this.ast,this.vars[i]))

            for (let j = 0; j < n; j++){
                const d2Ast = this.#simplify(this.#derivative(dAsti_i,this.vars[j]))

                if(d2Ast.type !== 'Number') return null

                A[i].push(d2Ast.value)
            }
        }

        const zero = new Array(n).fill(0)
        const gradZero = this.grad(zero)
        const b = gradZero.map(v => -v+0)

        return {A,b}
    }
}


/**
 * Покомпонентное сложение векторов.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number[]}
 */
export function add(a,b){
    if (a.length !== b.length) throw new Error('Размерности не совпадают')
    return a.map((v, i) => v + b[i])
}

/**
 * Умножение вектора на скаляр.
 * @param {number[]} a
 * @param {number} k
 * @returns {number[]}
 */
export function scalar(a,k){
    return a.map(v => v*k)
}

/**
 * Скалярное произведение.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
export function dot(a, b) {
  if (a.length !== b.length) throw new Error('Размерности не совпадают')
  return a.reduce((s, v, i) => s + v * b[i], 0)
}

/**
 * Норма вектора.
 * @param {number[]} a
 * @returns {number}
 */
export function norm(a) {
  return Math.hypot(...a)
}

/**
 * Умножение матрицы на вектор-столбец: y = A·x.
 *
 * @param {number[][]} A  Матрица m×n (массив строк)
 * @param {number[]}   x  Вектор-столбец длины n
 * @returns {number[]}    Вектор длины m
 * @throws {Error} Если размерности не совпадают
 */
export function matVec(A,x){
    const m = A.length

    if (m === 0) return []
    if (A[0].length !== x.length) {
        throw new Error(
            `Размерности не совпадают: A имеет ${A[0].length} столбцов, x имеет длину ${x.length}`
        )
    }

    return A.map(row => row.reduce((sum, aij, j) => sum + aij * x[j], 0))
}
