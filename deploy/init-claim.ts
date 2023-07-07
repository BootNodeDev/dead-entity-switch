import { Contract, Provider, Wallet } from "zksync-web3";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getEnvs } from "./envValidate";

const { PK_BENEFICIARY, DESA_ACCOUNT } = getEnvs();
export default async function (hre: HardhatRuntimeEnvironment) {
  // TODO export form hre.config.networks
  const provider = new Provider("https://testnet.era.zksync.dev");

  const beneficiary = new Wallet(PK_BENEFICIARY, provider);

  const aaArtifact = await hre.artifacts.readArtifact("DESAccount");
  const desaAccount = new Contract(DESA_ACCOUNT, aaArtifact.abi, beneficiary);

  const oldDateStarted = await desaAccount.dateStarted();

  console.log(`Claim already started? (0 if not started): ${oldDateStarted}`);
  await desaAccount.initClaim();

  const beneficiaryAddress = await desaAccount.beneficiary();

  console.log(`Starting claim for beneficiary ${beneficiaryAddress}...`);

  const dateStarted = await desaAccount.dateStarted();
  console.log(`Claim started at ${dateStarted}.`);
}
