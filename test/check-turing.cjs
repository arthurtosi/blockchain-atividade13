// Execucao isolada: node test/check-turing.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const solc = require('solc');
const { ethers } = require('hardhat');

async function main() {
  const source = fs.readFileSync(path.join(__dirname, '../contracts/TuringCompleto.sol'), 'utf8');
  const output = JSON.parse(solc.compile(JSON.stringify({
    language: 'Solidity',
    sources: { 'TuringCompleto.sol': { content: source } },
    settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } },
  })));
  assert.deepEqual((output.errors || []).filter(e => e.severity === 'error'), []);
  const compiled = output.contracts['TuringCompleto.sol'].TuringCompleto;
  const accounts = await ethers.getSigners();
  const names = accounts.slice(0, 13).map((_, i) => i === 1 ? 'professora' : `aluno${i}`);
  const addresses = accounts.slice(0, 13).map(a => a.address);
  const factory = new ethers.ContractFactory(compiled.abi, compiled.evm.bytecode.object, accounts[0]);
  const t = await factory.deploy(names, addresses, accounts[1].address);
  await t.waitForDeployment();
  const rejected = async action => assert.rejects(async () => { const tx = await action(); await tx.wait(); });
  const tx = async action => (await action).wait();
  assert.equal(await t.totalSupply(), 0n);
  assert.equal(await t.voting(), false);
  await rejected(() => t.connect(accounts[2]).vote('aluno3', 1));
  for (const action of [
    () => t.connect(accounts[2]).votingOn(),
    () => t.connect(accounts[2]).votingOff(),
    () => t.connect(accounts[2]).issueToken('aluno3', 1),
    () => t.connect(accounts[2]).updateUser('novo', accounts[15].address),
  ]) await rejected(action);
  await tx(t.connect(accounts[1]).votingOn());
  for (const [name, amount] of [['aluno2', 1], ['professora', 1], ['ausente', 1], ['aluno3', 0], ['aluno3', 3]]) {
    await rejected(() => t.connect(accounts[2]).vote(name, amount));
  }
  await rejected(() => t.connect(accounts[19]).vote('aluno3', 1));
  assert.equal(await t.totalSupply(), 0n);
  for (const i of [0, 3, 4, 5, 6, 7, 8, 9, 10]) {
    await tx(t.connect(accounts[2]).vote(names[i], 2));
  }
  assert.equal(await t.balanceOf(accounts[2].address), 0n);
  await tx(t.connect(accounts[2]).vote('aluno11', 1));
  assert.equal(await t.voteCount('aluno2'), 10n);
  assert.equal(await t.balanceOf(accounts[2].address), 1n);
  assert.equal(await t.totalSupply(), 20n);
  await rejected(() => t.connect(accounts[2]).vote('aluno11', 1));
  await tx(t.votingOff());
  await tx(t.updateUser('aluno2', accounts[14].address));
  assert.equal(await t.voting(), true);
  assert.equal(await t.authorized(accounts[2].address), false);
  await rejected(() => t.connect(accounts[2]).vote('aluno12', 1));
  await rejected(() => t.connect(accounts[14]).vote('aluno11', 1));
  await rejected(() => t.updateUser('', accounts[15].address));
  await rejected(() => t.updateUser('novo', ethers.ZeroAddress));
  await rejected(() => t.updateUser('novo', accounts[3].address));
  await rejected(() => t.issueToken('ausente', 1));
  await tx(t.connect(accounts[1]).issueToken('aluno3', 5));
  assert.equal(await t.balanceOf(accounts[3].address), 7n);
  // Acrescentar alunos permite chegar ao vigesimo voto sem depender da tabela externa.
  await tx(t.connect(accounts[14]).vote('aluno12', 1));
  for (let i = 13; i <= 21; i++) {
    const address = ethers.getAddress(ethers.zeroPadValue(ethers.toBeHex(i + 1000), 20));
    await tx(t.updateUser(`extra${i}`, address));
    await tx(t.connect(accounts[14]).vote(`extra${i}`, 1));
  }
  assert.equal(await t.voteCount('aluno2'), 20n);
  assert.equal(await t.balanceOf(accounts[14].address), 1n);
  assert.equal(await t.balanceOf(accounts[2].address), 1n);
  await tx(t.updateUser('professora', accounts[15].address));
  await rejected(() => t.connect(accounts[1]).votingOff());
  await tx(t.connect(accounts[15]).votingOff());
  assert.equal(await t.voting(), false);
  console.log('OK: compilacao, supply zero, permissoes, votos invalidos, recompensa nos votos 10/20, emissao e atualizacao de identidades.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
