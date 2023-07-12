import { Contract, Provider, Wallet } from "zksync-web3";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { getEnvs } from "./envValidate";

const { PK_BENEFICIARY, DESA_ACCOUNT } = getEnvs();
export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = Provider.getDefaultProvider();

  const recoveryAddress = new Wallet(PK_BENEFICIARY, provider);

  const aaArtifact = await hre.artifacts.readArtifact("DESAccount");
  const desaAccount = new Contract(
    DESA_ACCOUNT,
    aaArtifact.abi,
    recoveryAddress
  );

  const oldRecoveryAddress = await desaAccount.recoveryAddress();
  const oldOwnerAddress = await desaAccount.owner();

  const tx = await desaAccount.finishRecovery();

  try {
    await tx.wait();
  } catch (e) {
    console.log("Error waiting for tx to be mined", e);
  }

  console.log(
    `Finishing recovery for recoveryAddress ${oldRecoveryAddress}...`
  );

  const recoveryAddressAddress = await desaAccount.recoveryAddress();
  const ownerAddress = await desaAccount.owner();
  console.log(
    `Recovery finished owner is ${ownerAddress} was ${oldOwnerAddress}.`
  );
  console.log(
    `Recovery finished recoveryAddress is ${recoveryAddressAddress} (reset) was ${oldRecoveryAddress}.`
  );
}
