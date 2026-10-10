# Como contribuir

Obrigado pelo interesse em contribuir com o StudyLib Direct PDF Downloader. Ao participar, mantenha as contribuições pequenas, claras e fáceis de revisar.

## Antes de começar

- Para defeitos e sugestões, abra uma issue primeiro e descreva o cenário.
- Para mudanças maiores, confirme na issue se a proposta se encaixa no escopo do projeto.
- Não envie PDFs, conteúdo de documentos, URLs diretas, tokens, cookies, dados de conta ou capturas que revelem esses dados.
- Antes de compartilhar URLs assinadas ou que contenham parâmetros de acesso, remova esses valores ou substitua-os por `[REDACTED]`.

## Fluxo de contribuição

1. Faça um fork do repositório.
2. Crie uma branch com nome curto, por exemplo `fix/firefox-manifest` ou `docs/install-guide`.
3. Faça uma alteração focada e explique a motivação.
4. Revise o diff para remover dados privados e arquivos que não pertencem ao projeto.
5. Abra um pull request com resumo, comportamento esperado e navegadores afetados.

## Estilo de commits

Prefira mensagens curtas no formato `tipo: descrição`, por exemplo:

- `fix: aceitar links PDF em subdomínios`
- `docs: esclarecer instalação no Firefox`
- `feat: melhorar feedback do botão`

## Revisão

Inclua passos manuais para reproduzir a mudança e informe navegador e versão. Não afirme que uma alteração foi testada em um navegador se isso não foi feito. Mudanças na extensão devem manter explícito o clique do usuário antes de iniciar o download.

## Escopo e licença

Ao enviar uma contribuição, você declara que tem direito de submetê-la sob a licença MIT deste repositório. A licença cobre o código do projeto, não os documentos encontrados no StudyLib nem direitos de terceiros.
