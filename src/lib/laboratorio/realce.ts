/**
 * Realce leve de Python para o editor do Laboratório (puro, sem dependência).
 * Tokeniza em comentário, string, número, palavra-chave, builtin/SymPy, nome e pontuação.
 */
export type TipoToken = "comentario" | "string" | "numero" | "palavra" | "builtin" | "nome" | "operador" | "texto";

export interface Token {
  tipo: TipoToken;
  texto: string;
}

const PALAVRAS = new Set([
  "False", "None", "True", "and", "as", "assert", "async", "await", "break", "class", "continue", "def", "del", "elif", "else", "except",
  "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try",
  "while", "with", "yield",
]);

/** Builtins e os nomes do SymPy mais usados nas resoluções do ENEM. */
const BUILTINS = new Set([
  "print", "len", "range", "float", "int", "str", "round", "abs", "sum", "max", "min", "sorted", "list", "dict", "set", "tuple",
  "symbols", "Symbol", "Eq", "solve", "solveset", "simplify", "expand", "factor", "Rational", "sqrt", "pi", "E", "nsimplify",
  "N", "diff", "integrate", "limit", "Matrix", "binomial", "factorial", "gcd", "lcm", "Abs", "floor", "ceiling", "log", "exp",
  "sin", "cos", "tan", "nsolve", "Piecewise", "oo", "S", "Interval", "FiniteSet", "mean", "median", "mode",
]);

const RE_TOKEN = /(#.*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b\d*\.\d+\b)|([A-Za-z_][A-Za-z0-9_]*)|([-+*/%=<>!&|^~:.,;()[\]{}@]+)|(\s+)/g;

/** Tokeniza o código; a concatenação dos `texto` reproduz a entrada exatamente. */
export function tokenizar(codigo: string): Token[] {
  const tokens: Token[] = [];
  let ultimo = 0;
  for (const m of codigo.matchAll(RE_TOKEN)) {
    const inicio = m.index;
    if (inicio > ultimo) tokens.push({ tipo: "texto", texto: codigo.slice(ultimo, inicio) });
    const [texto, comentario, string, numero, nome, operador] = m;
    if (comentario !== undefined) tokens.push({ tipo: "comentario", texto });
    else if (string !== undefined) tokens.push({ tipo: "string", texto });
    else if (numero !== undefined) tokens.push({ tipo: "numero", texto });
    else if (nome !== undefined) tokens.push({ tipo: PALAVRAS.has(nome) ? "palavra" : BUILTINS.has(nome) ? "builtin" : "nome", texto });
    else if (operador !== undefined) tokens.push({ tipo: "operador", texto });
    else tokens.push({ tipo: "texto", texto });
    ultimo = inicio + texto.length;
  }
  if (ultimo < codigo.length) tokens.push({ tipo: "texto", texto: codigo.slice(ultimo) });
  return tokens;
}

/** Exemplos prontos do Laboratório (SymPy). `from sympy import *` já vale no worker. */
export interface ExemploPython {
  id: string;
  rotulo: string;
  descricao: string;
  codigo: string;
}

export const EXEMPLOS_PYTHON: ExemploPython[] = [
  {
    id: "equacao",
    rotulo: "Resolver equação",
    descricao: "ENEM 2022, Q154: 28 900 vagas são 25% do valor de 2012.",
    codigo: "# 28 900 vagas são 25% do valor original V. Qual era V?\nV = symbols('V')\nsolve(Eq(Rational(25, 100) * V, 28900), V)",
  },
  {
    id: "simplificar",
    rotulo: "Simplificar",
    descricao: "Simplifica uma expressão algébrica.",
    codigo: "x = symbols('x')\nsimplify((x**2 - 1) / (x - 1))",
  },
  {
    id: "porcentagem",
    rotulo: "Porcentagem",
    descricao: "Desconto de 25% sobre R$ 480 e aumento sucessivo.",
    codigo: "preco = 480\ndesconto = Rational(25, 100)\ncom_desconto = preco * (1 - desconto)\nprint('com desconto:', com_desconto)\n# dois aumentos de 10% não dão 20%:\nprint('dois aumentos de 10%:', 100 * Rational(11, 10)**2)\nfloat(com_desconto)",
  },
  {
    id: "probabilidade",
    rotulo: "Probabilidade",
    descricao: "Casos favoráveis sobre possíveis: soma 7 em dois dados.",
    codigo: "from itertools import product\ncasos = list(product(range(1, 7), repeat=2))\nfavoraveis = [c for c in casos if sum(c) == 7]\nRational(len(favoraveis), len(casos))",
  },
  {
    id: "estatistica",
    rotulo: "Média e mediana",
    descricao: "Média, mediana (n par) e moda de uma lista.",
    codigo: "from statistics import mean, median, mode\ndados = [12, 15, 15, 18, 20, 22]\nprint('média:', mean(dados))\nprint('mediana:', median(dados))\nprint('moda:', mode(dados))\nRational(sum(dados), len(dados))",
  },
];
