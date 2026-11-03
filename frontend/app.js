// Lista fixa dos alunos: se a turma mudar, altere esta lista.
const alunos = Array.from({ length: 19 }, (_, i) => `nome${i + 1}`);
const $ = id => document.getElementById(id);
const rpc = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
let config, contrato, carteira;
let conta = '', eleitor = '', admin = false, redeCorreta = false;
let ocupado = false, atualizando = false;

function mensagem(texto, tipo = '') {
  $('message').textContent = texto;
  $('message').dataset.kind = tipo;
}
function erro(error) {
  return error.reason || error.shortMessage || error.message || 'Falha na operacao.';
}

// Leitura: consulta o contrato pelo RPC local, sem solicitar assinatura.
async function atualizar() {
  if (!contrato || atualizando) return;
  atualizando = true;
  try {
    const [aberta, total, professora, nome] = await Promise.all([
      contrato.voting(), contrato.totalSupply(), contrato.users('roberta'),
      conta ? contrato.codinomes(conta) : '',
    ]);
    eleitor = nome;
    admin = Boolean(conta) && [config.owner, professora].some(a => a.toLowerCase() === conta.toLowerCase());
    $('status').textContent = aberta ? 'Aberta' : 'Pausada';
    $('supply').textContent = total.toString();
    $('balance').textContent = conta ? (await contrato.balanceOf(conta)).toString() : '—';
    $('count').textContent = eleitor ? (await contrato.voteCount(eleitor)).toString() : '—';
    $('identity').textContent = !conta ? 'Conecte uma carteira cadastrada para votar.'
      : !redeCorreta ? 'Selecione a rede local Hardhat na carteira.'
      : eleitor ? `Conectado como ${eleitor}.` : admin ? 'Conectado como owner. Cadastre sua conta para votar.' : 'Esta carteira nao esta cadastrada.';
    $('admin').hidden = !admin || !redeCorreta;
    $('vote-button').disabled = ocupado || !eleitor || !redeCorreta || !aberta;
    const selecionado = $('recipient').value;
    const linhas = await Promise.all(alunos.map(async nome => {
      const endereco = await contrato.users(nome);
      const saldo = await contrato.balanceOf(endereco);
      const jaVotou = eleitor ? await contrato.hasVote(eleitor, nome) : false;
      return { nome, saldo, indisponivel: endereco === ethers.ZeroAddress || endereco.toLowerCase() === conta.toLowerCase() || jaVotou };
    }));
    $('recipient').replaceChildren();
    for (const linha of linhas) {
      const option = new Option(linha.nome + (linha.indisponivel ? ' (indisponivel)' : ''), linha.nome);
      option.disabled = linha.indisponivel;
      $('recipient').add(option);
    }
    const anterior = [...$('recipient').options].find(o => o.value === selecionado && !o.disabled);
    $('recipient').value = anterior ? selecionado : linhas.find(l => !l.indisponivel)?.nome || '';
    linhas.sort((a, b) => a.saldo > b.saldo ? -1 : a.saldo < b.saldo ? 1 : alunos.indexOf(a.nome) - alunos.indexOf(b.nome));
    $('ranking').replaceChildren();
    linhas.forEach((linha, i) => {
      const item = document.createElement('li');
      for (const [classe, texto] of [['place', `${i + 1}`], ['name', linha.nome], ['tokens', `${linha.saldo} TUR`]]) {
        const span = document.createElement('span');
        span.className = classe;
        span.textContent = texto;
        item.append(span);
      }
      $('ranking').append(item);
    });
  } finally { atualizando = false; }
}

// Escrita: pede assinatura na MetaMask e espera a transacao ser confirmada.
async function enviar(acao) {
  if (ocupado || !carteira || !redeCorreta) return;
  ocupado = true;
  document.querySelectorAll('button').forEach(b => b.disabled = true);
  try {
    mensagem('Confirme a operacao na carteira.');
    const signer = await carteira.getSigner();
    const transacao = await acao(contrato.connect(signer));
    mensagem('Aguardando confirmacao na blockchain…');
    await transacao.wait();
    mensagem('Operacao confirmada!', 'success');
  } catch (error) { mensagem(erro(error), 'error'); }
  finally {
    ocupado = false;
    document.querySelectorAll('button').forEach(b => b.disabled = false);
    await atualizar().catch(e => mensagem(erro(e), 'error'));
  }
}

async function lerCarteira() {
  carteira = new ethers.BrowserProvider(window.ethereum);
  const contas = await window.ethereum.request({ method: 'eth_accounts' });
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  conta = contas[0] || '';
  redeCorreta = Number(chainId) === config.chainId;
  $('connect').textContent = conta ? `${conta.slice(0, 6)}…${conta.slice(-4)}` : 'Conectar carteira';
  await atualizar();
}

$('connect').onclick = async () => {
  if (!window.ethereum) { mensagem('Abra esta pagina em um navegador com MetaMask.', 'error'); return; }
  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const id = `0x${config.chainId.toString(16)}`;
    try { await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: id }] }); }
    catch (e) {
      if (e.code !== 4902) throw e;
      await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{ chainId: id, chainName: 'Hardhat Local', rpcUrls: ['http://127.0.0.1:8545'], nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } }] });
    }
    await lerCarteira();
  } catch (e) { mensagem(erro(e), 'error'); }
};
$('vote-form').onsubmit = e => { e.preventDefault(); if ($('recipient').value) enviar(c => c.vote($('recipient').value, BigInt($('amount').value))); };
$('issue-form').onsubmit = e => { e.preventDefault(); enviar(c => c.issueToken($('issue-recipient').value, BigInt($('issue-amount').value))); };
$('open').onclick = () => enviar(c => c.votingOn());
$('close').onclick = () => enviar(c => c.votingOff());
$('refresh').onclick = () => atualizar().catch(e => mensagem(erro(e), 'error'));

async function iniciar() {
  const response = await fetch('/deployment.json');
  if (!response.ok) throw Error('Execute npm run deploy:local antes de abrir a interface.');
  config = await response.json();
  if (await rpc.getCode(config.address) === '0x') throw Error('Contrato nao encontrado. Execute npm run deploy:local novamente.');
  contrato = new ethers.Contract(config.address, config.abi, rpc);
  $('contract-address').textContent = config.address;
  for (const aluno of alunos) $('issue-recipient').add(new Option(aluno, aluno));
  if (window.ethereum) {
    await lerCarteira();
    for (const evento of ['accountsChanged', 'chainChanged']) window.ethereum.on(evento, () => lerCarteira().catch(e => mensagem(erro(e), 'error')));
  } else await atualizar();
  mensagem('Contrato conectado. Ranking disponivel.');
  setInterval(() => atualizar().catch(e => mensagem(erro(e), 'error')), 8000);
}
iniciar().catch(e => { $('connect').disabled = true; mensagem(erro(e), 'error'); });
