export const Conditions = {
    a2: 0.1,          // a^2

    sX: 0,            // левая граница по x
    eX: 0.5,          // правая граница по x (L)

    sT: 0,            // начальное время
    eT: 10,           // конечное время t_кон

    // phi_1(t) = 10 * T_bar, где T_bar = t / t_кон = t / 10
    // => phi_1(t) = 10 * (t / 10) = t
    phi_1: (t) => 10 * (t / 10),

    // phi_2(t) = 10 * T_bar^2 = 10 * (t/10)^2 = t^2 / 10
    phi_2: (t) => 10 * Math.pow(t / 10, 2),

    // psi(x) = (x/L) * exp(-x/L), L = 0.5
    ksi: (x) => {
        const a = x / 0.5;
        return a * Math.exp(-a);
    },

    // Левое граничное условие Робена:
    //   alpha_1 * du/dx(0,t) + beta_1 * u(0,t) = phi_1(t)
    boundXLeft: {
        alpha: -0.1,
        beta: 0.3
    },

    // Правое граничное условие Робена:
    //   alpha_2 * du/dx(L,t) + beta_2 * u(L,t) = phi_2(t)
    rightXBound: {
        alpha: 1.0,
        beta: 0.2
    },
};