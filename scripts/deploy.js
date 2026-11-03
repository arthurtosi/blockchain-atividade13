const { ethers, artifacts } = require('hardhat');
const fs = require('node:fs/promises');
const path = require('node:path');

async function main() {
  const [owner] = await ethers.getSigners();
  const contract = await ethers.deployContract('Turing');
  await contract.waitForDeployment();
  const { abi } = await artifacts.readArtifact('Turing');
  const network = await ethers.provider.getNetwork();
  const config = { address: await contract.getAddress(), owner: owner.address, chainId: Number(network.chainId), abi };
  await fs.writeFile(path.join(__dirname, '../frontend/deployment.json'), JSON.stringify(config, null, 2));
  console.log(`Turing publicado: ${config.address}\nConfiguracao da interface salva. Abra http://localhost:3000`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
