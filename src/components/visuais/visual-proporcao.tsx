"use client";

import * as React from "react";
import { pelaUnidade } from "@/lib/visuais/proporcao";
import { Deslizador, MolduraVisual, reais } from "./moldura";

const KG = 3;
const PRECO = 12;
const MAX_KG = 10;

/** Regra de três como duas barras que crescem juntas: kg e reais, sempre na mesma razão. */
export function VisualProporcao() {
  const [alvo, setAlvo] = React.useState(5);
  const { unitario, resultado } = pelaUnidade(KG, PRECO, alvo);

  return (
    <MolduraVisual
      id="proporcao"
      passos={[
        <>O dado do problema: <b>{KG} kg</b> de arroz custam <b>R$ {reais(PRECO)}</b>. As duas barras andam juntas.</>,
        <>Reduza a 1 unidade: R$ {reais(PRECO)} ÷ {KG} = <b>R$ {reais(unitario)} por kg</b>.</>,
        <>Agora multiplique: {alvo} kg × R$ {reais(unitario)} = <b>R$ {reais(resultado)}</b>. Mova o slider e veja as duas barras crescerem juntas.</>,
      ]}
      truque="Se uma grandeza dobra e a outra também dobra, é direta: ache quanto vale 1 e multiplique. Se uma dobra e a outra cai pela metade (mais pedreiros, menos dias), é inversa: multiplique cruzado ao contrário."
      exercicio={{
        pergunta: "4 pedreiros fazem um muro em 6 dias. Em quantos dias 3 pedreiros fazem o mesmo muro?",
        opcoes: ["4,5 dias", "8 dias", "6 dias", "9 dias"],
        certa: 1,
        explicacao: "Menos pedreiros, mais dias: é inversa. 4 × 6 = 24 dias-pedreiro; 24 ÷ 3 = 8.",
      }}
      controles={<Deslizador rotulo="Quilos" valor={alvo} min={1} max={MAX_KG} aoMudar={setAlvo} sufixo=" kg" />}
    >
      {(passo) => {
        const kg = passo === 0 ? KG : passo === 1 ? 1 : alvo;
        const valorReais = kg * unitario;
        return (
          <div className="flex flex-col gap-4" role="img" aria-label={`${kg} kg custam ${reais(valorReais)} reais`}>
            <Linha rotulo="kg" valor={`${kg} kg`} fracao={kg / MAX_KG} cor="bg-primary" blocos={MAX_KG} />
            <Linha rotulo="R$" valor={`R$ ${reais(valorReais)}`} fracao={kg / MAX_KG} cor="bg-sucesso-forte" blocos={MAX_KG} />
          </div>
        );
      }}
    </MolduraVisual>
  );
}

function Linha({ rotulo, valor, fracao, cor, blocos }: { rotulo: string; valor: string; fracao: number; cor: string; blocos: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-7 shrink-0 text-xs font-semibold text-muted-foreground">{rotulo}</span>
      <div className="relative h-8 flex-1 overflow-hidden rounded-[10px] bg-card">
        <div
          className={`absolute inset-y-0 left-0 w-full origin-left rounded-[10px] ${cor} transition-transform duration-[240ms] ease-(--curva)`}
          style={{ transform: `scaleX(${fracao})` }}
        />
        {/* Marcas de cada unidade, para contar. */}
        <div className="pointer-events-none absolute inset-0 flex">
          {Array.from({ length: blocos }, (_, i) => (
            <span key={i} className="flex-1 border-r border-card/70 last:border-r-0" />
          ))}
        </div>
      </div>
      <span className="num w-20 shrink-0 text-right text-sm font-semibold">{valor}</span>
    </div>
  );
}
