# Fontes dos resumos de caderno

Consultadas em 09/11/2026 só como referência. Nenhum texto, imagem ou mapa mental foi copiado: os resumos, exemplos, mapas e pegadinhas de `src/lib/resumos/conteudo.ts` foram escritos do zero, com números próprios.

## Matriz de Referência (competências C1 a C7, habilidades H1 a H30)
- INEP, Matriz de Referência do ENEM (cópia hospedada na FFLCH/USP): https://ensinosociologia.fflch.usp.br/sites/ensinosociologia.fflch.usp.br/files/matriz_referencia%20ENEM.pdf
- Texto das competências já espelhado no repo em `src/data/taxonomia.ts` (do PROVAS, `taxonomia/matriz-mt.json`) e nomes curtos das habilidades em `src/data/tipos.ts` (`NOME_HABILIDADE`).

## Incidência por assunto
- CNN Brasil, "Matemática no Enem: temas que mais caem" (levantamento SAS Educação, 2009 a 2024: proporcionalidade, estatística, geometria plana e espacial, probabilidade, funções): https://www.cnnbrasil.com.br/educacao/matematica-no-enem-temas-que-mais-caem-e-7-dicas-para-acertar-mais/
- Educa Mais Brasil (SAS 2009 a 2016: geometria 26,3%, aritmética 12,8%, escala/razão/proporção 12,1%): https://www.educamaisbrasil.com.br/educacao/enem/matematica-no-enem-confira-quais-sao-os-assuntos-mais-cobrados
- Aprova Total (2016 a 2025: matemática básica, estatística, geometria espacial, funções): https://aprovatotal.com.br/?p=5676
- Estratégia Vestibulares, "Assuntos de Matemática que mais caem no Enem": https://vestibulares.estrategia.com/portal/enem-e-vestibulares/vestibulares/assuntos-de-matematica-que-mais-caem-no-enem/
- REVEMAT/UFSC, "Mathematics in ENEM: a study of geometric knowledge from 2009 to 2024": https://periodicos.ufsc.br/index.php/revemat/article/view/104851

## Dados do próprio app (cruzamento)
Contagem de assuntos nas 636 questões de `src/data/provas` (2009 a 2023): grandezas/unidades/escalas 120, geometria plana 113, gráficos e tabelas 100, porcentagem 94, geometria espacial 82, equação do 1º grau 68, estatística 58, razão e proporção 54, probabilidade 52; depois combinatória 28, PA 26, números 23, função afim 21, regra de três 20. O selo "cai muito" vai para o que está no topo dos levantamentos e do banco; o resto é "cai às vezes".

## Limites
Os levantamentos usam períodos e métodos diferentes e nenhum cobre exatamente 2009 a 2025; não há um levantamento oficial do INEP por assunto. A Matriz citada é uma cópia de terceiros do documento do INEP, não o PDF do site gov.br.
