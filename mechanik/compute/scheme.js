import { Conditions } from "./cond.js";
import { TriagonalSolver } from "../run-through.js";

/**
 * Решение начально-краевой задачи для уравнения теплопроводности
 *
 *   du/dt = a^2 * d2u/dx2,   0 < x < L,  0 < t <= t_кон
 *
 * с граничными условиями Робена:
 *
 *   alpha_1 * du/dx(0,t) + beta_1 * u(0,t) = phi_1(t)
 *   alpha_2 * du/dx(L,t) + beta_2 * u(L,t) = phi_2(t)
 *
 * и начальным условием:
 *
 *   u(x,0) = psi(x)
 *
 * НЕЯВНАЯ конечно-разностная схема (безусловно устойчивая).
 *
 * @param {number} n — число шагов по пространству (узлов n+1)
 * @param {number} m — число шагов по времени (слоёв m+1)
 * @returns {{x:number[], t:number[], u:number[][]}}
 */
export function solveScheme(n,m){
    const { a2, sX, eX, sT, eT, phi_1, phi_2, ksi, boundXLeft, rightXBound } = Conditions;

    // ---------- 1. Параметры сетки ----------
    const L = eX - sX;             // длина отрезка
    const h = L / n;               // шаг по x
    const tau = (eT - sT) / m;     // шаг по t
    const sigma = a2 * tau / (h * h);  // число Куранта

    // ---------- 2. Узлы сетки ----------
    const x = new Array(n + 1);
    for (let i = 0; i <= n; i++) {
        x[i] = sX + i * h;
    }

    const t = new Array(m + 1);
    for (let k = 0; k <= m; k++) {
        t[k] = sT + k * tau;
    }

    // ---------- 3. Начальное условие: u[i][0] = psi(x_i) ----------
    // u[k][i] — значение в узле x_i на временном слое t_k
    // Удобно хранить как массив по слоям: u[k] — это слой k.
    const u = new Array(m + 1);
    u[0] = new Array(n + 1);
    for (let i = 0; i <= n; i++) {
        u[0][i] = ksi(x[i]);
    }

    // ---------- 4. Коэффициенты системы (не зависят от k!) ----------
    // Система:  A[i]*u[i-1] + B[i]*u[i] + C[i]*u[i+1] = D[i]
    // где неизвестные — значения на новом слое (k+1).
    //
    // Внутренние узлы i = 1..n-1:
    //   -sigma * u[i-1] + (1 + 2*sigma) * u[i] - sigma * u[i+1] = u_old[i]
    //
    // Левая граница i = 0 (односторонняя разность 1-го порядка):
    //   alpha_1 * (u[1] - u[0]) / h + beta_1 * u[0] = phi_1
    //   => (beta_1*h - alpha_1) * u[0] + alpha_1 * u[1] = h * phi_1
    //
    // Правая граница i = n (односторонняя разность 1-го порядка):
    //   alpha_2 * (u[n] - u[n-1]) / h + beta_2 * u[n] = phi_2
    //   => -alpha_2 * u[n-1] + (beta_2*h + alpha_2) * u[n] = h * phi_2

    const A = new Array(n + 1).fill(0);
    const B = new Array(n + 1).fill(0);
    const C = new Array(n + 1).fill(0);
    const D = new Array(n + 1).fill(0);

    A[0] = 0;
    B[0] = boundXLeft.beta * h - boundXLeft.alpha;
    C[0] = boundXLeft.alpha;

    // Внутренние узлы
    for (let i = 1; i < n; i++) {
        A[i] = -sigma;
        B[i] = 1 + 2 * sigma;
        C[i] = -sigma;
    }

    // Правая граница
    A[n] = -rightXBound.alpha;
    B[n] = rightXBound.beta * h + rightXBound.alpha;
    C[n] = 0;

    // ---------- 5. Проверка диагонального преобладания (для отладки) ----------
    for (let i = 0; i <= n; i++) {
        const lhs = Math.abs(B[i]);
        const rhs = Math.abs(A[i]) + Math.abs(C[i]);
        if (lhs + 1e-12 < rhs) {
            console.warn(
                `Нет диагонального преобладания в строке i=${i}: ` +
                `|B|=${lhs.toFixed(6)} < |A|+|C|=${rhs.toFixed(6)}. ` +
                `Прогонка может быть неустойчивой.`
            );
        }
    }

    // ---------- 6. Цикл по времени ----------
    for (let k = 0; k < m; k++) {
        const tNew = t[k + 1];

        // 6.1. Правая часть для внутренних узлов — значения с прошлого слоя
        for (let i = 1; i < n; i++) {
            D[i] = u[k][i];
        }

        // 6.2. Правая часть для граничных строк
        D[0] = h * phi_1(tNew);
        D[n] = h * phi_2(tNew);

        // 6.3. Решаем трёхдиагональную систему методом прогонки
        const uNew = TriagonalSolver.solve(A, B, C, D);

        // 6.4. Сохраняем новый слой
        u[k + 1] = uNew;
    }

    // ---------- 7. Возврат результата ----------
    return { x, t, u };
}

