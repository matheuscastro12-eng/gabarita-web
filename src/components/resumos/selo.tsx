import { Badge } from "@/components/ui/badge";
import type { Incidencia } from "@/lib/resumos/conteudo";

/** "cai muito" em azul cheio; "cai às vezes" neutro. */
export function SeloIncidencia({ incidencia }: { incidencia: Incidencia }) {
  return incidencia === "cai-muito" ? (
    <Badge variant="solid" data-testid="selo-incidencia">
      cai muito
    </Badge>
  ) : (
    <Badge variant="neutral" data-testid="selo-incidencia">
      cai às vezes
    </Badge>
  );
}
