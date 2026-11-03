# Auditoria complementar: notas, boletim e ações omitidas

Data: 03/11/2026. Continuação das alterações locais sobre `6ff4af2`; os arquivos da primeira etapa foram preservados. A etapa visual e de história do usuário continua separada.

## Correção do alcance da comparação

A primeira matriz confundiu a existência de uma aba com paridade de todos os seus fluxos. A revisão complementar seguiu ações concretas, campos, documentos e rotas dos arquivos vanilla, conferindo também o comportamento dos controllers reais.

Fontes principais: `FunctionPageNotas.js`, `PageTurmas.js`, `PageDesempenho.js`, `createNewPayment.js`, `searchBirthDate.js`, `createNewEmplooye.js`, `listenerPageGradeCurricular.js`; controllers `StudentReportController`, `StudentGradeController`, `SubscriptionController`, `CertificateController`, `EmployeeController`, `SubjectGroupController` e `CoursePeriodController`. O arquivo `alunoNotasView.js` contém trechos duplicados/inconsistentes; a referência da regra do documento é o controller efetivo do PDF.

## Entregas desta etapa

| Fluxo | Resultado |
|---|---|
| Boletim PDF | Download por `/students/:studentId/report?courseId=...`, com os headers de autenticação/escola existentes; sem credenciais na URL |
| Visão geral | Matérias × períodos, médias da matéria, do período e geral; conta de avaliações, período não informado e distinção entre zero e ausência |
| Notas | Escala/passo verificados antes de gravar, peso zero preservado, confirmação ao excluir, leitura para funcionários e escrita conforme os papéis autorizados na rota |
| Troca de contexto | Consultas canceladas/descartadas ao trocar curso/aluno; dados só aparecem quando correspondem ao contexto atual; uma falha não vira boletim vazio |
| Entrega de materiais | Histórico por matrícula, confirmação da entrega, preservação de materiais/datas anteriores, sem entrega em matrícula cancelada |
| Matrículas/histórico | Consulta explícita incluindo canceladas no desempenho; seletor de matrícula e histórico preservados; ficha atualizada ao matricular/cancelar |
| Certificados | Links relativos ao React substituídos por download autenticado da API nas abas Turmas e Desempenho; geração restrita aos papéis aceitos pela API |
| Matérias dos grupos | Consulta e adição somente de matérias já pertencentes ao curso, preservando vínculos existentes |
| Bimestres padrão | Criação dos B1–B4 ausentes, confirmação, consulta antes de criar e possibilidade de retomar depois de criação parcial |
| Funcionários | Criação vinculada à escola, associação de conta existente e remoção somente do acesso à escola, com confirmação e sem exibir senha |
| Nascimento | Filtro por intervalo de datas usando o contrato do vanilla; intervalo invertido não dispara consulta |
| Valor total do carnê | Escolha entre total e valor por parcela; divisão exata em centavos; rejeição de arredondamento silencioso e desconto inválido |
| Contagens ausentes | Curso sem agregado retornado não é apresentado como tendo zero alunos/professores |

## Regra das médias

A implementação mantém o modelo do PDF atual: escala 0–10; se todos os pesos das avaliações forem padrão, usa média simples; com peso positivo diferente de 1, soma pontos limitados ao peso e normaliza para 10. A média da matéria pondera os períodos com notas; peso de período inválido/ausente segue o padrão 1 do PDF. A média geral usa matérias com resultado, sem substituir ausências por zero.

Essa é a regra existente, não uma nova interpretação de média ponderada. O PDF continua sendo gerado pelo backend. A seleção de dados do endpoint e os limites do backend não foram alterados, inclusive os cenários legados com múltiplas matrículas no mesmo curso; estes merecem auditoria própria de dados.

## Teste real: interface → API → persistência → documento

Executado com a conta já criada pelo Claude, após confirmar que o perfil admin tem vínculo exclusivo com **Teste Cora** e que o aluno de teste pertence a essa escola.

Preparação: criados via API um curso e turma com prefixo `E2E React`, material próprio, matrícula de teste com conclusão, matéria, quatro períodos e parâmetros de notas. As requisições usam escola fixa; o script rejeita operações fora dos IDs de teste e qualquer chamada bancária.

Fluxos validados pela interface:

1. Criar nota e conferir retorno na tabela.
2. Recarregar a página e confirmar que a nota persistiu.
3. Editar para **8,50** e conferir a atualização.
4. Conferir a visão geral, baixar o boletim e abrir o arquivo com parser de PDF: uma página válida. A extração de texto confirmou **8,50** e períodos B1–B4.
5. Registrar entrega de material com confirmação e consultar a matrícula pela API para verificar persistência.
6. Gerar certificado e baixar o PDF autenticado: documento válido conferido por parser.
7. Excluir a nota com confirmação e consultar a API para confirmar sua remoção.

Resultado: sete verificações concluídas, nenhum erro de JavaScript/API registrado, nenhuma violação de escopo e **zero chamadas bancárias**. A preparação por API foi separada dos fluxos exercitados pela interface; não se apresenta a criação da fixture como teste de criação pela tela.

Somente registros da escola de teste foram gravados no banco de produção. Os registros de teste remanescentes foram preservados com identificação `E2E React`; a nota usada no teste de exclusão foi removida. Nenhuma escola de cliente foi alterada. Não houve restart, migration, push ou deploy.

## Regressão automatizada e evidências

**Resultado final: 33 testes passaram em 57,2 segundos sobre o build local. Build, TypeScript e lint passaram.** O código de aplicação testado foi comparado com a cópia de revisão, sem diferenças.

A suíte versionada cobre fluxos acadêmicos, financeiros e administrativos com a API interceptada. Inclui falhas de consulta/PDF, acesso somente para leitura, confirmação de exclusão, idempotência dos bimestres, preservação de materiais, isolamento do vínculo de funcionário e precisão monetária. Os testes de cálculo cobrem médias, zero/ausência, limite de pontos, período não informado e centavos.

- `tests/e2e/secretaria.spec.ts`: regressões da primeira etapa e valor total do carnê.
- `tests/e2e/paridade-academica.spec.ts`: fluxo acadêmico, materiais, documentos, grupos, funcionários e nascimento.
- `tests/e2e/regras-academicas.spec.ts`: casos de cálculo independentes da interface.
- `/tmp/proeduc-v2-live-result.json`: resultado resumido do teste real.
- `/tmp/proeduc-v2-live-state.json`: IDs da fixture para conferência; não contém senha/token e não deve ser publicado.
- `/tmp/proeduc-v2-live-boletim.pdf` e `/tmp/proeduc-v2-live-certificado.pdf`: documentos reais da escola de teste; não versionados.
- `/tmp/proeduc-v2-live-boletim.png`: captura da visão geral na escola de teste.
- Logs de build, TypeScript, lint e execução final: `/tmp/proeduc-v2-*`.

## Limites explícitos

As gravações de funcionários e os cenários bancários foram simulados; não foram criados usuários com acesso real durante esta etapa. O teste acadêmico real usou admin; permissões de funcionário foram verificadas com respostas simuladas, e o escopo específico de cada professor continua dependendo da API e de uma matriz própria de dados.

A remoção de material existente do curso e a remoção individual de associação de matéria a grupo não foram inventadas: a primeira exige revisão do comportamento de órfãos/constraints, e a segunda não tem rota dedicada identificada. Os riscos de cancelamento/conciliação bancária documentados anteriormente são de backend e continuam separados deste patch React.

O ambiente disponível usa Node 24, enquanto o projeto declara Node 20.x. O build local não substitui validação do runtime de deploy. Testes aprovados não representam garantia de ausência absoluta de bugs.
