// Gerado por scripts/sync-provas.ts. Não edite à mão: rode `pnpm sync-provas`.
// Imports de JSON precisam ser estáticos para o bundler; por isso este arquivo existe.

export const anos = [2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023] as const;

/** true quando não há anos sincronizados e o app deve usar fixture.json. */
export const usaFixture: boolean = false;

/** Conteúdo bruto (não validado) do arquivo do ano, ou undefined se o ano não foi sincronizado. */
export async function carregarAno(ano: number): Promise<unknown> {
  switch (ano) {
    case 2009:
      return (await import("./2009.json")).default;
    case 2010:
      return (await import("./2010.json")).default;
    case 2011:
      return (await import("./2011.json")).default;
    case 2012:
      return (await import("./2012.json")).default;
    case 2013:
      return (await import("./2013.json")).default;
    case 2014:
      return (await import("./2014.json")).default;
    case 2015:
      return (await import("./2015.json")).default;
    case 2016:
      return (await import("./2016.json")).default;
    case 2017:
      return (await import("./2017.json")).default;
    case 2018:
      return (await import("./2018.json")).default;
    case 2019:
      return (await import("./2019.json")).default;
    case 2020:
      return (await import("./2020.json")).default;
    case 2021:
      return (await import("./2021.json")).default;
    case 2022:
      return (await import("./2022.json")).default;
    case 2023:
      return (await import("./2023.json")).default;
    default:
      return undefined;
  }
}
