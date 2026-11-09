/**
 * Registro global de atalhos de teclado (puro, testável).
 *
 * Um atalho é uma combinação ("k", "mod+k", "shift+/", "?") com id, descrição
 * e grupo, usados pelo overlay de ajuda e pela paleta de comandos.
 */

export interface Atalho {
  id: string;
  /** Combinação: teclas separadas por "+", ex. "mod+k", "shift+?", "a". `mod` = Ctrl (ou ⌘ no Mac). */
  combinacao: string;
  descricao: string;
  grupo: string;
  acao: () => void;
  /** Se true, dispara mesmo com o foco num campo de texto. */
  emCampos?: boolean;
  /** Se false, o atalho aparece na ajuda mas está inativo (ex.: fora da tela de estudo). */
  ativo?: boolean;
}

export interface TeclaNormalizada {
  tecla: string;
  mod: boolean;
  shift: boolean;
  alt: boolean;
}

/** Normaliza uma combinação textual. */
export function analisarCombinacao(combinacao: string): TeclaNormalizada {
  const partes = combinacao
    .toLowerCase()
    .split("+")
    .map((p) => p.trim())
    .filter(Boolean);
  let mod = false;
  let shift = false;
  let alt = false;
  let tecla = "";
  for (const p of partes) {
    if (p === "mod" || p === "ctrl" || p === "cmd" || p === "meta") mod = true;
    else if (p === "shift") shift = true;
    else if (p === "alt" || p === "option") alt = true;
    else tecla = p;
  }
  if (tecla === "?") shift = true;
  return { tecla, mod, shift, alt };
}

export interface EventoTeclado {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

/** Normaliza o evento do navegador para comparação. */
export function normalizarEvento(e: EventoTeclado): TeclaNormalizada {
  let tecla = e.key.toLowerCase();
  if (tecla === " ") tecla = "space";
  if (tecla === "escape") tecla = "esc";
  return {
    tecla,
    mod: e.ctrlKey || e.metaKey,
    shift: e.shiftKey,
    alt: e.altKey,
  };
}

export function combina(atalho: TeclaNormalizada, evento: TeclaNormalizada): boolean {
  if (atalho.tecla !== evento.tecla) return false;
  if (atalho.mod !== evento.mod) return false;
  if (atalho.alt !== evento.alt) return false;
  // "?" já exige shift no teclado físico; para letras simples ignoramos shift só quando o atalho não o pede.
  if (atalho.shift && !evento.shift) return false;
  if (!atalho.shift && evento.shift && atalho.tecla.length > 1) return false;
  return true;
}

/** Verdadeiro quando o alvo do evento é um campo editável. */
export function ehCampoEditavel(alvo: EventTarget | null): boolean {
  if (!alvo || typeof (alvo as HTMLElement).tagName !== "string") return false;
  const el = alvo as HTMLElement;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  return el.isContentEditable === true;
}

/** Texto bonito para mostrar a combinação em teclas. */
export function teclasParaExibir(combinacao: string, mac: boolean): string[] {
  const { tecla, mod, shift, alt } = analisarCombinacao(combinacao);
  const partes: string[] = [];
  if (mod) partes.push(mac ? "⌘" : "Ctrl");
  if (alt) partes.push(mac ? "⌥" : "Alt");
  if (shift && tecla !== "?") partes.push("Shift");
  const nomes: Record<string, string> = {
    enter: "Enter",
    esc: "Esc",
    space: "Espaço",
    arrowup: "↑",
    arrowdown: "↓",
    arrowleft: "←",
    arrowright: "→",
    "/": "/",
    "?": "?",
  };
  partes.push(nomes[tecla] ?? tecla.toUpperCase());
  return partes;
}

export class RegistroAtalhos {
  private atalhos = new Map<string, Atalho>();
  private ouvintes = new Set<() => void>();

  registrar(atalho: Atalho): () => void {
    this.atalhos.set(atalho.id, atalho);
    this.notificar();
    return () => {
      if (this.atalhos.get(atalho.id) === atalho) {
        this.atalhos.delete(atalho.id);
        this.notificar();
      }
    };
  }

  listar(): Atalho[] {
    return [...this.atalhos.values()];
  }

  /** Despacha um evento; devolve o atalho executado ou null. */
  despachar(e: EventoTeclado & { target?: EventTarget | null }): Atalho | null {
    const evento = normalizarEvento(e);
    const emCampo = ehCampoEditavel(e.target ?? null);
    for (const atalho of this.atalhos.values()) {
      if (atalho.ativo === false) continue;
      if (emCampo && !atalho.emCampos) continue;
      if (combina(analisarCombinacao(atalho.combinacao), evento)) {
        atalho.acao();
        return atalho;
      }
    }
    return null;
  }

  assinar(ouvinte: () => void): () => void {
    this.ouvintes.add(ouvinte);
    return () => this.ouvintes.delete(ouvinte);
  }

  private notificar() {
    for (const o of this.ouvintes) o();
  }
}
