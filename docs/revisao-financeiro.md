# Revisão do painel financeiro — 2026-11-04

Escopo inicial: React. Ampliação posterior da API de exportação autorizada, sem alteração de entidades, banco, migrações ou integração bancária.

- Filtros de pagamento (de/até), tipo de pagamento, categoria e criação (de/até) aplicados aos lançamentos já carregados integralmente pelos serviços existentes, antes da paginação. Combinam com busca, situação, ano do vencimento e período de vencimento. Datas ausentes não atendem a períodos ativos. Intervalos invertidos exibem aviso e não retornam resultados.
- Botão de acesso direto ao cadastro do aluno na mesma aba, preservando a sessão e a escola selecionada. A autenticação atual usa sessionStorage por aba; abrir uma aba isolada perderia essa sessão.
- Nome e contato do contratante, quando retornados pela API. Na união dos dois serviços, os dados do responsável são preservados quando ambos identificam o mesmo aluno. Não há busca ou associação de responsáveis por nome.
- Limpar restaura busca, situação, períodos, tipo e categoria e retorna à primeira página. O ano padrão continua sendo o ano corrente de vencimento, identificado no rótulo.
- Popup Excel existente mantido. Padrões disponíveis ajustados para aluno, valor, valor original, vencimento, categoria e situação; descrição, pagamento, tipo e criação permanecem selecionáveis.

## Ampliação da API sem mudança de banco

O catálogo financeiro agora inclui contato do aluno, contratante, contato do contratante, valor pago registrado, desconto de pontualidade configurado e link do boleto. Aluno, contatos, contratante, valores, vencimento, categoria e situação vêm selecionados por padrão; os demais campos são opcionais.

A exportação combina os filtros de pagamento, criação, tipo e categoria com a busca, situação e o período de vencimento da lista. O popup informa que esses filtros são aplicados em conjunto. Se uma versão antiga da API não oferecer suporte, a exportação é bloqueada antes da prévia, sem ignorar filtros.

Valor pago registrado usa o valor do lançamento recebido; não faz uma nova conciliação bancária. O desconto exportado é a configuração em reais ou percentual, sem presumir sua aplicação no recebimento. O boleto usa os links existentes. Dados ausentes continuam vazios.

Permanecem pendentes **Pix copia e cola e código de barras**, que não estão armazenados no lançamento. A obtenção desses dados exige avaliar integração e eventual persistência e ficou fora desta alteração. Nenhuma chamada bancária adicional foi criada.

Os filtros de situação, vencimento e nome já existiam e continuam aplicados antes da paginação. Dados não fornecidos pela API, como contatos ausentes, não são inventados.
