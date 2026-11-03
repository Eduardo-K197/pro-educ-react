# Exportação de tabelas em Excel

Disponível nas listas de alunos, financeiro, cursos, turmas, professores e aulas. O botão abre um modal com as colunas mais comuns marcadas, seleção por grupos, busca, situação quando aplicável e período. O modal recebe a configuração da API; o React não gera a planilha nem carrega biblioteca de Excel.

As escolhas não mudam a lista de origem. Busca e filtros atuais vêm preenchidos, e o cliente pode ajustar a exportação, escolher todo o histórico ou um período e restaurar as colunas padrão. A quantidade de registros e colunas permanece no rodapé. A prévia traz até cinco registros; o arquivo contém todos os resultados dos filtros, independentemente da página aberta. Alterar qualquer opção invalida a prévia anterior até a nova consulta terminar.

O período informa qual data será usada. Em alunos, há início da matrícula, nascimento e última atualização; no financeiro, vencimento, pagamento ou lançamento. Turmas, professores e aulas usam suas datas persistidas. Cursos não exibem um período fictício. Datas inicial/final são inclusivas. Sem a data escolhida, o registro só fica fora quando há um limite de período.

A API valida as colunas e permissões, isola os dados por escola e gera `.xlsx` com cabeçalho, filtros, linha fixa, moeda numérica e datas formatadas. CPF/telefone permanecem texto. Há opção de uma segunda aba com escola, filtros, período e quantidade. O limite é de 20 mil registros por arquivo; volume excedente, seleção vazia, erro de rede ou retorno inválido não viram um download parcial ou um arquivo com extensão enganosa.

## Validação

- Build, tipos e lint do React.
- 55 cenários de interface, sendo 11 específicos de exportação, incluindo colunas padrão, período, retorno inválido, limites, erro/retentativa, cancelamento, atualização da prévia e celular de 320 px.
- 14 testes da API, incluindo uma planilha de 20 mil linhas e bloqueio de geração concorrente; também executados com Node 18 e dependências isoladas.
- Validação real pela API local isolada e pelo navegador, restrita à Teste Cora, sem gravação nem chamadas bancárias. Os arquivos foram lidos novamente para conferir colunas, datas, quantidades e valores numéricos. Capturas de desktop, celular e tema escuro ficam fora do Git, assim como dados e credenciais reais.

## Ativação

Estas telas dependem das novas rotas `/exports/:resource/options`, `/preview` e `/download`. A ordem de ativação é API primeiro e React depois. A revisão visual já publicada na master independe dessas rotas. A API em produção não deve ser reiniciada pelos comandos de validação; o procedimento da API está em `docs/exportacao-excel.md` do repositório backend.
