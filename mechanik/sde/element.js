/**
 * Метод конечных элементов (МКЭ)
 */
import { Conditions } from "./cond.js";
import { TriagonalSolver } from "../run-through.js";

// --- Вспомогательные функции ---
const matScalar = (A, x) => A.map(row => row.map(el => el * x));
const vecScalar = (v, x) => v.map(el => el * x);

// 1. От y'' : K1 = (1/h) * [[1, -1], [-1, 1]]
const K1 = (h) => matScalar([[1, -1], [-1, 1]], 1 / h);

// 2. От p * y' : K2 = (p/2) * [[1, -1], [1, -1]]
// (Внимание: знаки проверены по слабой формулировке с интегрированием по частям)
const K2 = (p) => matScalar([[1, -1], [1, -1]], p / 2);

// 3. От q * y : Для линейной q(x) интеграл берется точно
const K3 = (h, xi_left, xi_right) => {
    const qL = Conditions.q(xi_left);
    const qR = Conditions.q(xi_right);
    
    const A = [
        [2 * qL + qR, qL + qR],
        [qL + qR, qL + 2 * qR]
    ];
    return matScalar(A, h / 6);
};

// 4. Вектор правой части от f
const F = (h, f) => vecScalar([1, 1], (f * h) / 2);


export function solveMKE(h) {
    const a = Conditions.start;
    const b = Conditions.end;

    // Защита от дробного количества шагов
    const n = Math.round((b - a) / h);
    const actualH = (b - a) / n;

    const X = [];
    for (let i = 0; i <= n; i++) {
        X.push(a + i * actualH);
    }

    // Инициализация глобальных диагоналей
    const A = new Array(n + 1).fill(0);
    const B = new Array(n + 1).fill(0);
    const C = new Array(n + 1).fill(0);
    const D = new Array(n + 1).fill(0);

    // --- СБОРКА ГЛОБАЛЬНОЙ МАТРИЦЫ (Ансамблирование) ---
    for (let i = 0; i < n; i++) {
        const xi_left = X[i];
        const xi_right = X[i + 1];
        
        const p = Conditions.p(xi_left);
        const f = Conditions.f(xi_left);

        const k1 = K1(actualH);
        const k2 = K2(p);
        const k3 = K3(actualH, xi_left, xi_right);
        
        // Локальная матрица жесткости K = K1 + K2 + K3
        const k11 = k1[0][0] + k2[0][0] + k3[0][0];
        const k12 = k1[0][1] + k2[0][1] + k3[0][1];
        const k21 = k1[1][0] + k2[1][0] + k3[1][0];
        const k22 = k1[1][1] + k2[1][1] + k3[1][1];
        
        const fLocal = F(actualH, f);

        // Складываем в глобальные массивы
        B[i]     += k11;
        C[i]     += k12;
        
        A[i + 1] += k21;
        B[i + 1] += k22;

        D[i]     += fLocal[0];
        D[i + 1] += fLocal[1];
    }

    // --- УЧЕТ ГРАНИЧНЫХ УСЛОВИЙ ---
    const left = Conditions.leftBound;
    const right = Conditions.rightBound;

    // 1. Левое условие (Робен): -y'(1.3) + 2y(1.3) = 1
    if (left.type === 'Robin') {
        // Из слабой формы добавка: B[0] += beta/alpha (у нас 2 / 1 = 2)
        B[0] += (left.beta / Math.abs(left.alpha)); 
        // Добавка в правую часть: D[0] += gamma/alpha (у нас 1 / 1 = 1)
        D[0] += (left.gamma / Math.abs(left.alpha));
    } else if (left.type === 'Dirichle' || left.type === 'Dirichlet') {
        B[0] = 1; D[0] = left.value; C[0] = 0;
    }

    // 2. Правое условие (Дирихле): y(1.6) = 3
    if (right.type === 'Dirichle' || right.type === 'Dirichlet') {
        // ПЕРЕНОС ВЛИЯНИЯ В ПРЕДЫДУЩЕЕ УРАВНЕНИЕ
        D[n - 1] -= C[n - 1] * right.value;
        C[n - 1] = 0; // Обнуляем связь, так как y_n уже известно
        
        // ЗАМЕНА ПОСЛЕДНЕГО УРАВНЕНИЯ НА y_n = 3
        B[n] = 1;
        D[n] = right.value;
        A[n] = 0;
        C[n] = 0;
    }

    // --- РЕШЕНИЕ ---
    const Y = TriagonalSolver.solve(A, B, C, D);

    return { X, Y };
}