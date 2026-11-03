# Migração ProEduc: comparação funcional e primeira implementação

Revisão em 03/11/2026, sobre React `6ff4af2`, vanilla `d72aa2d` e API `d3c59fd`.

## Método e alcance

Comparação estática dos módulos do vanilla em `frontend/dashboard/js/src/pages`, das telas e services React, e dos controllers/rotas da API. A comparação cobre presença das funções e contratos observáveis; não equivale a certificar cada regra de negócio, todos os dados legados ou todos os perfis. Testes dinâmicos e limitações estão registrados separadamente abaixo.

O React em desenvolvimento utiliza a API de produção. A conta fornecida pelo Claude foi autenticada e seu perfil confirmou vínculo exclusivo com a escola **Teste Cora**. Credenciais e tokens não fazem parte deste documento ou dos testes versionados. Testes automatizados de gravação interceptam a API; testes com a sessão real são somente de leitura, com escola fixada e lista de rotas permitidas.

Auditoria complementar: a presença da aba Notas não cobria o boletim. A revisão por ações foi refeita e os resultados desta segunda etapa estão em `docs/paridade-e-validacao-academica.md`.

## Matriz de paridade

| Área e fluxo do vanilla | React antes desta revisão | Resultado / lacunas identificadas |
|---|---|---|
| Alunos: cadastro, edição, foto, dados pessoais, endereço e responsável | Telas e serviços presentes | Paridade estrutural; ainda exige cobertura completa dos casos de documento, responsável e importações |
| Alunos: matrícula e cancelamento de matrícula | Aba Turmas com SubscriptionService | Seleção sem corte de 100 turmas e atualização da ficha após matrícula/cancelamento; paginação com pesquisa continua oportunidade de escala |
| Alunos: entrega de material, desempenho e certificado | Aba Desempenho e geração de certificado presentes | Entrega de materiais implementada; entrega e certificado testados com gravação real exclusivamente na escola de teste; histórico preservado |
| Alunos: notas por matéria, período, tipo e peso | Aba Notas presente | Notas com validação da escala/passo, peso zero preservado, confirmação de exclusão, proteção contra respostas atrasadas e controles por papel |
| Alunos: boletim e visão geral | Ausentes; a primeira comparação não identificou a lacuna | Integrados PDF autenticado da API, médias por matéria/período, pesos, ausência versus zero e tratamento de falhas |
| Alunos: filtro de nascimento | Ausente no React | Intervalo implementado com o contrato `birthDate[ge]`/`birthDate[le]` |
| Professores: cadastro, foto, início, observações e cursos | Formulário e vínculo de cursos presentes | Paridade estrutural; dados e autorização de cada perfil permanecem testes separados |
| Cursos: nome, descrição e carga horária | Presente | Descrição agora identificada como obrigatória, em conformidade com a API |
| Cursos: professores e materiais | Exibição no detalhe, sem edição correspondente | Implementados seleção de professores e adição de materiais por linha. Materiais existentes e gerais da escola são preservados; remoção exige revisão da API |
| Cursos: módulos de conteúdo | Exibição existente | Editor de módulos não identificado no vanilla comparado; não foi criado um módulo artificial nesta etapa |
| Turmas: curso, datas, capacidade, idade e professores | Professores ausentes; curso opcional no formulário | Implementados professores e curso obrigatório; falha de carregamento bloqueia gravação de vínculos incompletos |
| Turmas: lista de alunos/vagas | Detalhe presente | Presente; número de alunos não substitui a situação da matrícula; dados de pagamento na turma requerem revisão da API |
| Aulas: professor, turma, data, horários, status e observações | Formulário presente | Paridade estrutural |
| Chamada: presença, ausência, justificativa e gravação em lote | Aba Chamada presente | Paridade estrutural; teste de presença por perfil/horário permanece pendente |
| Grade: matérias da escola e vínculo com cursos | Presente | Presente; falhas de carregamento e confirmação ao desvincular merecem evolução |
| Grade: criar, renomear e excluir grupos | Service existente, sem tela | Implementada aba Grupos de matérias usando as rotas existentes |
| Grade: associar matérias a grupos | Service existente, sem interface | Consulta e adição de matérias do curso ao grupo implementadas. Remoção individual não identificada na API e não foi simulada como disponível |
| Grade: períodos e edição de datas/peso | CRUD presente | Adicionadas validações de datas/peso e movimentação da ordem por botões acessíveis |
| Grade: criar quatro bimestres padrão | Presente no vanilla, ausente no React | Criação retomável implementada: consulta os períodos existentes, cria somente ausentes e rejeita correspondência ambígua |
| Grade: parâmetros de notas | Presente | Adicionada validação de faixa e passo; corrigida legenda que confundia limite inferior da escala com média de aprovação |
| Financeiro: consulta e resumo | Duplicidade já corrigida pelo Claude | Mantida deduplicação por ID; somas normalizam valores numéricos; falha de uma consulta não apresenta total parcial como saldo completo |
| Financeiro: criação manual e bancária | Campos divergem da API | Corrigidos `student`, `entryCategoryId`, `paymentType`, `status`, `discount` objeto e parcelas; incluídos situação/data de recebimento manual |
| Financeiro: PIX manual versus boleto emitido | React tratava PIX como geração bancária | Alinhado ao vanilla: boleto usa `/payments`; PIX e demais meios são registros manuais. Interface informa que não emite chave PIX |
| Financeiro: valor total versus por parcela | Vanilla oferece ambos | Implementados valor por parcela e valor total do carnê. Valores precisam ter precisão de centavos; divisão desigual e desconto maior que a parcela são bloqueados |
| Financeiro: carnê Cora assíncrono | Retorno 202 tratado como cobrança pronta | Aviso de processamento e acompanhamento na ficha; detecção de job ativo, consultas espaçadas e bloqueio de reenvio enquanto andamento é desconhecido |
| Financeiro: boleto individual e carnê completo | Ação individual podia usar ID do carnê | Separadas as ações; Sicredi individual usa o nosso número (`payment`), aceito pelo endpoint de PDF; carnê completo tem botão próprio no agrupamento |
| Financeiro: cancelar uma parcela | Podia cancelar todo o carnê | Ação individual usa somente ID do lançamento, com confirmação explícita de escopo |
| Financeiro: preservar pagamentos recebidos | Ações de exclusão ainda disponíveis na lista | Ocultada exclusão de pagos e bloqueada operação em massa com pagos selecionados; isso complementa, mas não substitui proteção no backend |
| Financeiro: confirmação manual | Rota/campos inadequados e exibição para gateway | Restrita a lançamentos manuais; usa `paymentDate` e `RECEIVED_IN_CASH` aceitos pelo controller |
| Financeiro: exportação e filtros | Presentes | Exportação bloqueada quando consulta falha; CSV e semântica de filtros ainda precisam auditoria específica |
| Painel da escola | Resumo e atalhos presentes | Falha de consulta agora informa indisponibilidade, permite tentar novamente e não mostra zeros; rótulo de recebidos explicita todos os períodos |
| Escola: cadastro, provedores, categorias e materiais | Configurações presentes | Paridade estrutural; alterações bancárias excluídas desta rodada |
| Escola: funcionários | Vanilla oferece criação; React lista funcionários e possui services de vínculo | Criar, vincular e remover acesso à escola implementados. Remover vínculo não exclui conta nem acessos a outras escolas; validação com API simulada |
| Administração: escolas, usuários e grupos | Telas React presentes, inclusive vínculos de administradores | Não fazer testes com uma conta super-admin sobre escolas reais; validação completa de permissões é etapa separada |
| Webhooks | Painel React presente | Configuração operacional de produção; apenas inventário nesta revisão |

## Gargalos e critérios de produto

Hipóteses derivadas da análise do código e das fontes abaixo, não de entrevistas com secretárias do ProEduc:

1. **Cobrança indevida e confiança nos números.** Uma consulta parcial, pagamento sem status ou exclusão com escopo ambíguo força a secretaria a conferir tudo manualmente. Mostrar indisponibilidade, preservar pagos e dizer exatamente qual parcela será afetada.
2. **Retrabalho no cadastro.** Ausência de professores/materiais no editor obriga alternar entre sistemas. Permitir completar o curso e a turma na mesma tela, preservando vínculos existentes.
3. **Demora do banco e duplicação.** Um botão disponível enquanto o banco processa incentiva reenvio. Diferenciar solicitado, em processamento e concluído; consultar andamento sem gerar outra cobrança.
4. **Grade trabalhosa.** Grupos ausentes e períodos sem ordem obrigam trabalho fora do sistema. Dar acesso direto aos grupos e ordenação por teclado/botões, sem depender de arrastar.
5. **Erros sem recuperação.** Mensagens devem explicar o que ocorreu e como continuar, sem perder formulário ou simular sucesso.

## Fontes primárias consultadas

- [Sponte — Gestão administrativa e secretaria](https://www.sponte.com.br/secretaria): integração de cadastro, documentos, comunicação e financeiro, redução de rotinas manuais. Fonte comercial; não se adotam suas promessas quantitativas como resultados do ProEduc.
- [Proesc — Alteração da situação da matrícula](https://suporte.proesc.com/hc/pt-br/articles/360001342833-Como-cancelar-alterar-a-situa%C3%A7%C3%A3o-da-matricula-do-aluno): distinção entre matrícula e financeiro, cancelamento de débitos em aberto e preservação do histórico pago.
- [W3C — Notificações em formulários](https://www.w3.org/WAI/tutorials/forms/notifications/): feedback de sucesso/erro claro e indicação de como corrigir problemas.
- [W3C — Mensagens de status](https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html): mensagens percebidas por tecnologias assistivas sem depender de mudança de foco.

## Continuidade e riscos separados

As proteções do front não garantem integridade bancária. A auditoria identificou exclusão local mesmo após erro Sicredi, roteamento de exclusões legadas pelo provedor atual em partes da API e arquivo de observabilidade necessário mas não versionado. Nenhum desses comportamentos foi provocado ou alterado nesta rodada. Devem receber mudanças independentes de backend com testes e revisão de concorrência.

Também permanecem: permissões por papel de ponta a ponta, falhas/races nas demais abas da Grade, paginação de seletores antigos, prevenção de perda de formulário ao navegar e consistência de datas/valores nas demais telas. O limite de 100/1000 itens em seletores não deve ser generalizado como solução de escala.

## Como validar

- `npm run test:ui`: suíte Playwright sem credenciais; intercepta chamadas de API antes de chegar à rede. Dados de teste fixos, sem escrita real.
- `npx tsc --noEmit --incremental false`: contratos TypeScript.
- `npm run lint -- --quiet`: erros de lint; não comprova ausência de warnings.
- Build em ambiente isolado, sem substituir `.next` do preview original nem `dist` da API.
- Evidências de execução desta rodada em `docs/validacao-secretaria.md`.

Materiais de curso: a API inclui materiais gerais da escola na resposta do curso. Eles não podem ser reenviados como materiais próprios com seus IDs, pois isso pode alterar um vínculo compartilhado. Esta implementação separa a adição de materiais, preserva os existentes e não oferece remoção enquanto o comportamento de órfãos/constraints no backend não for validado.

Contagens da lista de cursos: quando a API não informa o agregado, o React mostra “Não informado”, evitando apresentar um zero presumido.
