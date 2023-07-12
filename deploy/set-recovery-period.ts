import {
  Contract,
  EIP712Signer,
  Provider,
  Wallet,
  types,
  utils,
} from "zksync-web3";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { ethers } from "ethers";

import { getEnvs } from "./envValidate";
import { EIP712_TX_TYPE } from "zksync-web3/build/src/utils";

const { PK_OWNER, DESA_ACCOUNT } = getEnvs();

export const setRecoveryPeriod = async (
  hre: HardhatRuntimeEnvironment,
  signer: Wallet,
  provider: Provider,
  account: string,
  recoveryPeriod: number
) => {
  const aaArtifact = await hre.artifacts.readArtifact("DESAccount");
  const desaAccount = new Contract(account, aaArtifact.abi, signer);

  let setRecoveryPeriodTx =
    await desaAccount.populateTransaction.setRecoveryPeriod(recoveryPeriod);

  setRecoveryPeriodTx = {
    ...setRecoveryPeriodTx,
    from: account,
    chainId: (await provider.getNetwork()).chainId,
    nonce: await provider.getTransactionCount(account),
    type: EIP712_TX_TYPE,
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
    } as types.Eip712Meta,
    value: ethers.BigNumber.from(0),
  };

  setRecoveryPeriodTx.gasPrice = await provider.getGasPrice();
  setRecoveryPeriodTx.gasLimit = await provider.estimateGas(
    setRecoveryPeriodTx
  );

  const signedTxHash = EIP712Signer.getSignedDigest(setRecoveryPeriodTx);

  const signature = ethers.utils.arrayify(
    ethers.utils.joinSignature(signer._signingKey().signDigest(signedTxHash))
  );

  setRecoveryPeriodTx.customData = {
    ...setRecoveryPeriodTx.customData,
    customSignature: signature,
  };

  return await provider.sendTransaction(utils.serialize(setRecoveryPeriodTx));
};

export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = Provider.getDefaultProvider();

  const owner = new Wallet(PK_OWNER, provider);
  const aaArtifact = await hre.artifacts.readArtifact("DESAccount");
  const desaAccount = new Contract(DESA_ACCOUNT, aaArtifact.abi, owner);

  const NEW_TIMEOUT = 5 * 60; // 5 minutes

  const oldRecoveryPeriod = await desaAccount.recoveryPeriod();
  const sentTx = await setRecoveryPeriod(
    hre,
    owner,
    provider,
    DESA_ACCOUNT,
    NEW_TIMEOUT
  );
  console.log(
    `Setting recovery period as ${NEW_TIMEOUT} (was ${oldRecoveryPeriod})...`
  );

  // Account should have enough gas
  await sentTx.wait();

  const newRecoveryPeriod = await desaAccount.recoveryPeriod();
  const recoveryStartDate = await desaAccount.recoveryStartDate();
  console.log(`recoveryPeriod set to ${newRecoveryPeriod}.`);
  console.log(`recoveryStartDate was reset to ${recoveryStartDate}`);
}
