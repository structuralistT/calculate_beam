import re
import numpy as np

# Каждая формула $...$ рендерится MathJax-ом как atomic inline-block.
# По спецификации CSS на границе inline-block элемента всегда есть
# точка возможного переноса строки — даже если рядом нет пробела.
# Поэтому "(", ";", "." и т.п., вплотную приклеенные к формуле без
# пробела, могут оторваться и остаться одни на строке.
# Решение: находим каждую формулу вместе с "приклеенной" к ней (без
# пробела) пунктуацией и оборачиваем их вместе в не разрывающийся span.
_INLINE_MATH_GLUE_RE = re.compile(r'([^\s$<>]*)(\$[^$]+\$)([^\s$<>]*)')


def _no_orphan_breaks(html: str) -> str:
    def repl(m):
        before, math, after = m.groups()
        if not before and not after:
            return math
        return f"<span style='white-space:nowrap'>{before}{math}{after}</span>"
    return _INLINE_MATH_GLUE_RE.sub(repl, html)


def calculate_cantilever_beam(L: float, F: float, EI: float):
    """
    Расчет консольной балки методом сечений по характерным точкам.
    Максимально компактный вариант вывода в одну строку для каждого пункта.
    """
    x = np.linspace(0, L, 50).tolist()
    Q = np.full_like(x, F).tolist()
    M = (F * (L - np.array(x))).tolist()
    Y = ((F * np.array(x)**2) / (6 * EI) * (3 * L - np.array(x))).tolist()

    # Расчет численных значений для точек
    M_A = F * L
    M_B = 0.0
    Y_B = (F * L**3) / (3 * EI)

    # Строгое решение в компактном виде для широкого экрана
    solution = [
        "<div class='font-bold text-gray-300 text-sm mb-1'>Характерные точки: А — жесткая заделка (x=0), Б — свободный конец (x=L).</div>",
        
        f"<div class='text-gray-400'><b class='text-gray-300'>1. Поперечные силы Q:</b> Нагрузка $F = {F}\\text{{ кН}} \\rightarrow$ На всем протяжении балки $Q_A = Q_B = {F}\\text{{ кН}}$.</div>",
        
        f"<div class='text-gray-400'><b class='text-gray-300'>2. Изгибающие моменты M:</b> Уравнение $M(x) = F \\cdot (L - x) \\rightarrow$ "
        f"Сечение $A$ ($x = 0$): $M_A = {F} \\cdot ({L} - 0) = {M_A}\\text{{ кН}}\\cdot\\text{{м}}$; "
        f"Сечение $B$ ($x = {L}$): $M_B = {F} \\cdot ({L} - {L}) = 0\\text{{ кН}}\\cdot\\text{{м}}$.</div>",
        
        f"<div class='text-gray-400'><b class='text-gray-300'>3. Определение прогибов Y:</b> Формула $Y_{{max}} = \\frac{{F \\cdot L^3}}{{3EI}} \\rightarrow$ "
        f"Точка $B$ ($x = {L}$): $Y_B = \\frac{{{F} \\cdot {L}^3}}{{3 \\cdot {EI}}} = {round(Y_B, 5)}\\text{{ м}}$.</div>"
    ]

    solution = [_no_orphan_breaks(item) for item in solution]

    return {
        "x": x,
        "Q": Q,
        "M": M,
        "Y": Y,
        "solution": solution
    }