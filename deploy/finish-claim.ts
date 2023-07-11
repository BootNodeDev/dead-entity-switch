import { Contract, Provider, Wallet } from "zksync-web3";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { getEnvs } from "./envValidate";

const { PK_BENEFICIARY, DESA_ACCOUNT } = getEnvs();
export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = new Provider("https://testnet.era.zksync.dev");

  const beneficiary = new Wallet(PK_BENEFICIARY, provider);

  const aaArtifact = await hre.artifacts.readArtifact("DESAccount");
  const desaAccount = new Contract(DESA_ACCOUNT, aaArtifact.abi, beneficiary);

  await desaAccount.finishClaim();

  const oldBeneficiaryAddress = await desaAccount.beneficiary();
  const oldOwnerAddress = await desaAccount.owner();

  console.log(`Finishing claim for beneficiary ${oldBeneficiaryAddress}...`);

  const beneficiaryAddress = await desaAccount.beneficiary();
  const ownerAddress = await desaAccount.owner();
  console.log(
    `Claim finished owner is ${ownerAddress} was ${oldOwnerAddress}.`
  );
  console.log(
    `Claim finished beneficiary is ${beneficiaryAddress} (reset) was ${oldBeneficiaryAddress}.`
  );
}
