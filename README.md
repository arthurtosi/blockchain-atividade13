# Turing dApp — atividade 13

Contrato usado: `contracts/Turing.sol`. O frontend utiliza uma lista fixa de `nome1` a `nome19` e consulta os saldos ERC-20; Roberta nao aparece como destinataria.

## Rodar localmente
Abra tres terminais nesta pasta:

1. `npm run chain` — inicia a blockchain Hardhat e mostra as contas locais.
2. `npm run deploy:local` — publica Turing e gera `frontend/deployment.json` com endereco, ABI e owner.
3. `npm run front` — serve a pagina em http://localhost:3000.

Ao reiniciar a blockchain, publique novamente. Saldos e votos da rede local sao temporarios.

## Carteira
Abra a pagina em um navegador com MetaMask. Clique em Conectar carteira e selecione a rede Hardhat (RPC http://127.0.0.1:8545, chain ID 31337). Importe uma conta local usando uma chave de teste exibida pelo Hardhat; essas chaves sao publicas e servem apenas para desenvolvimento local.

A primeira conta Hardhat e owner: pode abrir/pausar e emitir, mas nao esta cadastrada como aluno. A segunda conta corresponde a nome1, a terceira a nome2, e assim por diante. Roberta tem o endereco definido no construtor. Para demonstrar o papel da professora com uma conta local livre, o owner pode chamar updateUser("roberta", endereco) pelo console Hardhat.

## O que cada arquivo faz
- `frontend/index.html`: campos, botoes e ranking.
- `frontend/style.css`: aparencia e adaptacao para celular.
- `frontend/app.js`: lista fixa, consultas ao contrato e pedidos de assinatura na MetaMask.
- `scripts/deploy.js`: publica Turing e salva a configuracao para o navegador.
- `scripts/serve.js`: entrega os arquivos e o ethers ja instalado, sem framework.

Clique em Enviar voto → JavaScript chama vote no contrato → MetaMask pede confirmacao → contrato aplica suas regras → tela consulta novos saldos. A emissao funciona do mesmo modo chamando issueToken.

O ranking mostra saldo atual, incluindo recompensas e transferencias ERC-20. A lista fixa precisa ser editada se novos codinomes forem cadastrados. A interface nao usa TuringCompleto.sol.
