# Revisão do painel financeiro — 2026-11-04

Escopo: somente React. Nenhuma alteração de API, banco ou integração bancária.

- Filtros de pagamento (de/até), tipo de pagamento, categoria e criação (de/até) aplicados aos lançamentos já carregados integralmente pelos serviços existentes, antes da paginação. Combinam com busca, situação, ano do vencimento e período de vencimento. Datas ausentes não atendem a períodos ativos. Intervalos invertidos exibem aviso e não retornam resultados.
- Botão de acesso direto ao cadastro do aluno na mesma aba, preservando a sessão e a escola selecionada. A autenticação atual usa sessionStorage por aba; abrir uma aba isolada perderia essa sessão.
- Nome e contato do contratante, quando retornados pela API. Na união dos dois serviços, os dados do responsável são preservados quando ambos identificam o mesmo aluno. Não há busca ou associação de responsáveis por nome.
- Limpar restaura busca, situação, períodos, tipo e categoria e retorna à primeira página. O ano padrão continua sendo o ano corrente de vencimento, identificado no rótulo.
- Popup Excel existente mantido. Padrões disponíveis ajustados para aluno, valor, valor original, vencimento, categoria e situação; descrição, pagamento, tipo e criação permanecem selecionáveis.

## Dependências pendentes da API

O catálogo atual de exportação não contém contato do aluno, nome/contato do contratante, desconto, link do boleto, Pix copia e cola ou código de barras. Também não oferece um valor pago separado e inequívoco do valor registrado do lançamento. Esses campos não foram inventados nem enviados com identificadores não suportados.

A API de exportação suporta um período escolhido (vencimento, pagamento ou criação), busca e situação; não aceita combinar os novos períodos nem filtros de categoria/tipo. Enquanto esses filtros locais estão ativos, o botão Excel fica indisponível com explicação visível, evitando exportar um conjunto diferente do exibido. A ampliação do catálogo e do contrato de filtros precisa de uma mudança posterior de API, sem necessidade de presumir migração de banco.

Os filtros de situação, vencimento e nome já existiam. A revisão preserva sua aplicação antes da paginação. Dados não fornecidos pela API, como contatos ausentes, não podem ser recuperados apenas no React.
