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

  const oldRecoveryStartDate = await desaAccount.recoveryStartDate();

  console.log(
    `recovery already started? (0 if not started): ${oldRecoveryStartDate}`
  );
  await desaAccount.initRecovery();

  const recoveryAddressAddress = await desaAccount.recoveryAddress();

  console.log(
    `Starting recovery for recoveryAddress ${recoveryAddressAddress}...`
  );

  const recoveryStartDate = await desaAccount.recoveryStartDate();
  console.log(`recovery started at ${recoveryStartDate}.`);
}
