# Jornada da secretaria — primeira etapa

Esta etapa mantém a identidade azul e os componentes MUI do ProEduc. O foco é reduzir a procura por ações durante o atendimento, preservar contexto e explicar falhas sem sugerir dados inexistentes. As necessidades abaixo são hipóteses extraídas dos fluxos do produto; precisam ser validadas com secretárias de escolas. Não foram realizadas entrevistas nem medidas de ganho de tempo.

## Histórias implementadas

| História | Comportamento e critério de aceite |
| --- | --- |
| Como secretária, quero escolher o motivo do atendimento antes de localizar o aluno. | O painel oferece consulta, matrícula, pagamentos, boletim e materiais/certificados. Nome ou CPF leva à lista e a ação principal abre a aba correspondente. A busca inclui inativos para não induzir novo cadastro. |
| Como secretária, quero voltar à lista sem perder meu trabalho. | Tarefa, busca, status e datas ficam na URL. Voltar do navegador recupera o contexto; atualizar a ficha mantém aba e visualização do boletim. |
| Como secretária, quero diferenciar cadastro ausente de falha de conexão. | Erro oferece nova tentativa; lista vazia explica como limpar filtros. Falha financeira não apresenta saldo zero e não impede buscar alunos. |
| Como secretária, quero conferir o resumo antes de cobrar. | Os cartões financeiros indicam todos os períodos; abrem os lançamentos com o mesmo status e sem limitar o ano. |
| Como docente, quero consultar meus alunos sem carregar o financeiro. | O painel não solicita os endpoints financeiros e a busca filtra a lista já restrita ao docente. |
| Como atendente no celular, quero abrir a ficha sem arrastar a tabela inteira. | A lista prioriza identificação, status e ação da tarefa em telas pequenas. A ficha conserva os dados completos. |

## Decisões de interface

Busca explícita por botão ou Enter, sem uma requisição por tecla. Rótulos visíveis e cabeçalho principal semântico. Ações frequentes permanecem visíveis na ficha; menus guardam as demais operações. Indicadores não competem com a tarefa principal e estados de carregamento não bloqueiam o atendimento inteiro.

Referências de pesquisa: [Sponte — secretaria](https://www.sponte.com.br/secretaria), [NN/g — reconhecimento e recordação](https://www.nngroup.com/articles/recognition-and-recall/), [W3C — rótulos de formulários](https://www.w3.org/WAI/tutorials/forms/labels/) e [NN/g — avaliação de ferramentas de trabalho](https://www.nngroup.com/articles/castle-framework/). São referências para hipóteses e padrões, não evidência de resultados medidos neste produto.

## Continuidade e limites

Próximas rodadas: observar atendimentos reais com autorização, medir conclusão/erros e passos de matrícula, rever formulários extensos e recuperação de preenchimento, testar teclado/leitor de tela e toda a matriz de telas e permissões. Esta entrega não corresponde a uma revisão visual de todos os módulos.

A API e o frontend legado não são alterados nesta etapa. Testes automatizados de jornada usam respostas isoladas; validações reais ficam restritas à escola Teste Cora. Falhas e limitações acadêmicas/backend continuam registradas em `paridade-e-validacao-academica.md`.

## Validação desta etapa

- Build Next otimizado concluído, tipos verificados e lint sem erros.
- 44 testes automatizados aprovados no build local: 33 regressões acadêmicas/financeiras e 11 cenários de jornada. Os cenários de interface usam API simulada; não representam uma certificação de ausência de bugs em todos os ambientes.
- Inspeção autenticada de leitura na Teste Cora: painel, ficha/notas, lista e painel no celular, além de tema escuro. Nenhuma gravação nem erro de página nessa inspeção. Documentos reais e persistência de notas foram validados na etapa funcional anterior, descrita no relatório acadêmico.
- Corrigidos durante a validação: largura mínima da tabela no celular, paginação fora da área visível e perda do primeiro filtro ao preencher rapidamente o intervalo de nascimento.
