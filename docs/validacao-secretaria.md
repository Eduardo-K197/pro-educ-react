# Validação da primeira etapa — 03/11/2026

## Resultado

- **13 testes Playwright passaram em 28,1 segundos**, executados sobre um build local do React, com as chamadas de API interceptadas. Nenhuma gravação da suíte chegou a banco ou provedor bancário.
- **Build Next.js passou** em cópia isolada; o código de aplicação dessa cópia foi comparado com a revisão, sem diferenças.
- **TypeScript sem emissão passou**; **lint sem erros passou**. O projeto ignora lint dentro do build, portanto o lint foi executado separadamente.
- **Quatro contratos financeiros validados** contra os schemas Joi dos controllers reais: manual, Asaas, Cora e Sicredi. O novo payload foi aceito nos quatro; o formato anterior, com `studentId`/`categoryId`, foi rejeitado. Essa validação não executou controllers, banco ou chamadas externas.
- **Sessão real da conta de teste validada**: o perfil possui vínculo exclusivo com a escola Teste Cora. Cinco telas abertas em leitura: Painel, novo Curso, nova Turma, Grade e Financeiro; nenhum erro de JavaScript. Curso verificado também em viewport 390×844, sem transbordamento horizontal do documento.

## Cenários de regressão versionados

1. Deduplicação financeira e soma de valores recebidos como texto numérico.
2. Consulta financeira indisponível, exportação bloqueada e opção de tentar novamente.
3. Painel não confunde consulta com falha com saldo zero.
4. Turma exige curso e envia professores selecionados.
5. Curso envia professores e novos materiais sem repetir linhas.
6. Criação de grupo de matérias pela rota existente.
7. Reordenação de períodos envia todos os IDs na nova sequência.
8. Formulário financeiro envia o contrato correto e bloqueia reenvio após sucesso.
9. Pagamento recebido permanece pago mesmo com rótulo traduzido desatualizado; exclusão/recebimento não são oferecidos.
10. Cancelamento individual na ficha não usa a rota de exclusão do carnê inteiro.
11. Job ativo informa processamento e bloqueia nova emissão.
12. Edição do curso preserva materiais próprios sem reenviar IDs dos materiais gerais da escola.
13. PDF individual Sicredi consulta o nosso número e não o ID do carnê.

Os testes vivem em `tests/e2e/secretaria.spec.ts`. `npm run test:ui` usa preview local; `PLAYWRIGHT_BASE_URL=http://127.0.0.1:8084 npm run test:ui` permite apontar para um build local já iniciado. A suíte não usa credenciais reais.

## Evidências locais desta execução

Artefatos temporários, não necessários para executar a suíte e não versionados:

- `/tmp/proeduc-playwright-verified.log`: execução final dos 13 testes.
- `/tmp/proeduc-build-verified.log`: build final.
- `/tmp/proeduc-tsc-release.log` e `/tmp/proeduc-lint-release.log`: checagens estáticas.
- `/tmp/proeduc-live-smoke-result.json`: resumo das cinco telas da escola de teste e da verificação mobile.
- `/tmp/proeduc-live-painel.png`, `/tmp/proeduc-live-cursos.png`, `/tmp/proeduc-live-turmas.png`, `/tmp/proeduc-live-grade.png`, `/tmp/proeduc-live-financeiro.png`, `/tmp/proeduc-live-mobile.png`: capturas da escola de teste; não copiar dados de tela para fixtures públicas.

## Limites e continuidade

Não foram emitidos boletos reais, criados/cancelados pagamentos, alterados materiais da escola nem gravados registros durante os testes com a conta real. Isso impede afirmar validação ponta a ponta dos provedores: os novos payloads foram validados estaticamente e por interface simulada. Conciliação, concorrência e comportamento bancário exigem ambiente de homologação adequado.

Os testes autenticados reais utilizaram perfil admin da escola de teste. Os perfis professor, funcionário e super-admin continuam exigindo uma matriz própria de autorização. A comparação de funcionalidades não significa que toda a migração ou padronização visual já esteja concluída; as lacunas restantes estão em `docs/comparacao-secretaria.md`.

O ambiente disponível usa Node 24.14.0, enquanto o package.json declara Node 20.x. Validar o runtime alvo antes de um deploy. O build também indica páginas com carga inicial de aproximadamente 700 kB, um ponto de otimização posterior à paridade funcional. Não foram instaladas/atualizadas dependências para esta implementação.

A API, o front vanilla, configurações do servidor e dados de produção não foram alterados. Não houve push ou deploy desta etapa.
