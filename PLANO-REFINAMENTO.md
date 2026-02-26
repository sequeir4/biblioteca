# Plano de refinamento da app "Biblioteca Aberta"

## 1) Objetivo
Transformar a app atual (estado aberto/fechado) numa ferramenta **realmente útil no dia a dia**, com foco em:
- **Uso rápido em telemóvel** (mobile-first).
- **Informação acionável** (não só “aberta/fechada”, mas também “quando abre”).
- **Manutenção simples** (regras de horário fora do código).
- **Escalabilidade** para suportar várias bibliotecas e futura API.

---

## 2) Resultado esperado (visão de produto)
Ao abrir a app, o utilizador deve ver imediatamente:
1. Estado atual: **Aberta** ou **Fechada**.
2. Motivo (ex.: domingo, feriado, fora de horário, exceção do dia).
3. Próxima mudança relevante:
   - “Fecha hoje às 18:00” quando aberta.
   - “Abre hoje às 14:00” ou “Próxima abertura: terça às 09:30” quando fechada.
4. Horário de hoje (resumo simples).

Em telemóvel, tudo isto deve caber no primeiro ecrã sem zoom.

---

## 3) Faseamento (MVP em 1 dia + evolução)

## Fase 0 — Diagnóstico e alinhamento (0,5 dia)
**Objetivo:** validar regras reais antes de codificar.

### Tarefas
- Confirmar o âmbito da app (uma biblioteca vs múltiplas).
- Validar regras reais de funcionamento:
  - horário regular por dia da semana;
  - feriados (fixos e móveis);
  - encerramentos sazonais/excecionais.
- Definir timezone oficial (`Europe/Lisbon`).

### Entregável
- Checklist de regras fechado para implementação.

---

## Fase 1 — MVP funcional e útil (1 dia)
**Objetivo:** melhorar valor prático sem complicar arquitetura.

### Tarefas técnicas
1. **Reestruturar HTML para UI semântica e mobile-first**
   - `main` com card principal.
   - Blocos para: estado, motivo, próxima abertura/fecho e horário de hoje.
   - `meta viewport` para telemóvel.

2. **Refatorar CSS para responsividade e acessibilidade**
   - Largura fluida (`min/max/clamp`), sem `%` fixo estreito.
   - Tipografia responsiva.
   - Melhor contraste e legibilidade do conteúdo.
   - Estado visual com badge + texto (não depender só de cor).

3. **Refatorar lógica JS em funções puras**
   - `isHoliday(date, config)`.
   - `isOpenNow(date, config)`.
   - `getNextChange(date, config)`.
   - `getStatusReason(date, config)`.

4. **Mover regras para configuração**
   - Criar ficheiro de dados (ex.: `schedule.json`) com:
     - timezone,
     - horários regulares por dia,
     - exceções por data,
     - intervalos de encerramento.
   - Carregar config dinamicamente no frontend.

5. **Melhorar mensagens**
   - Corrigir texto (“biblioteca”).
   - Formatação de data/hora em `pt-PT` via `Intl.DateTimeFormat`.

### Critérios de aceitação
- App responde corretamente para dia útil, fim de semana e feriado.
- Em largura móvel (~360px), conteúdo principal permanece legível e sem overflow.
- Utilizador percebe quando abre/fecha a seguir sem esforço.

---

## Fase 2 — Robustez e manutenção (1–2 dias)
**Objetivo:** reduzir risco de regressões e facilitar evolução.

### Tarefas técnicas
- Adicionar testes unitários para regras de data/hora:
  - casos de fronteira (abertura/fecho exactos);
  - domingos/feriados;
  - exceções de calendário.
- Isolar módulo de regras de negócio da camada de renderização.
- Criar documentação curta de manutenção:
  - como atualizar horários;
  - como adicionar exceções.

### Critérios de aceitação
- Regras críticas cobertas por testes automatizados.
- Atualizar horários exige mexer em dados, não em lógica de negócio.

---

## Fase 3 — Escalabilidade para múltiplas bibliotecas (2 dias)
**Objetivo:** preparar crescimento sem reescrever tudo.

### Tarefas técnicas
- Evoluir `schedule.json` para coleção `libraries[]` com `id`.
- Permitir seleção de biblioteca (query param + seletor UI).
- Persistir biblioteca escolhida em `localStorage`.
- Criar `scheduleProvider` (camada de acesso a dados) para facilitar migração para API no futuro.

### Critérios de aceitação
- App funciona com pelo menos 2 bibliotecas configuradas.
- Troca de biblioteca não exige deploy de lógica diferente.

---

## Fase 4 — Evolução opcional (roadmap)
- PWA (atalho no ecrã inicial, funcionamento offline básico).
- Alertas de alterações pontuais de horário.
- Integração com API/cms municipal.
- Modo “widget” embebível noutros sites.

---

## 4) Modelo de dados recomendado (mínimo)
```json
{
  "timezone": "Europe/Lisbon",
  "libraryId": "orlando-ribeiro",
  "name": "Biblioteca Orlando Ribeiro",
  "regularHours": {
    "1": [{ "open": "09:30", "close": "18:00" }],
    "2": [{ "open": "09:30", "close": "18:00" }],
    "3": [{ "open": "09:30", "close": "18:00" }],
    "4": [{ "open": "09:30", "close": "18:00" }],
    "5": [{ "open": "09:30", "close": "18:00" }],
    "6": [],
    "0": []
  },
  "exceptions": [
    { "date": "2026-12-24", "open": "09:30", "close": "13:00", "reason": "Véspera de Natal" }
  ],
  "closedRanges": [
    { "start": "2026-08-01", "end": "2026-08-31", "reason": "Encerramento de verão" }
  ]
}
```

---

## 5) Métricas de sucesso
- **Tempo para resposta visual útil:** < 2 segundos para perceber estado + próxima abertura.
- **Taxa de erro de calendário:** 0 casos críticos em testes definidos.
- **Esforço de manutenção:** atualização de horários feita só em dados.
- **Usabilidade móvel:** interface principal totalmente funcional em ecrã 360x800.

---

## 6) Riscos e mitigação
- **Risco:** regras reais mal levantadas.
  - **Mitigação:** validar com fonte oficial antes da implementação.
- **Risco:** bugs em feriados móveis.
  - **Mitigação:** testes unitários com datas conhecidas.
- **Risco:** UI bonita mas pouco legível ao sol/contraste baixo.
  - **Mitigação:** contraste alto, tipografia maior e badges explícitas.

---

## 7) Próximo passo recomendado
Executar a **Fase 1 (MVP)** primeiro e publicar uma versão já útil, antes de avançar para múltiplas bibliotecas e integração com API.
