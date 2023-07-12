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

export const heartBeat = async (
  hre: HardhatRuntimeEnvironment,
  provider: Provider,
  desaAccount: Contract,
  owner: Wallet
) => {
  let heartBeatTx = await desaAccount.populateTransaction.heartBeat();

  heartBeatTx = {
    ...heartBeatTx,
    from: desaAccount.address,
    chainId: (await provider.getNetwork()).chainId,
    nonce: await provider.getTransactionCount(desaAccount.address),
    type: EIP712_TX_TYPE,
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
    } as types.Eip712Meta,
    value: ethers.BigNumber.from(0),
  };

  heartBeatTx.gasPrice = await provider.getGasPrice();
  heartBeatTx.gasLimit = await provider.estimateGas(heartBeatTx);

  const signedTxHash = EIP712Signer.getSignedDigest(heartBeatTx);

  const signature = ethers.utils.arrayify(
    ethers.utils.joinSignature(owner._signingKey().signDigest(signedTxHash))
  );

  heartBeatTx.customData = {
    ...heartBeatTx.customData,
    customSignature: signature,
  };

  return await provider.sendTransaction(utils.serialize(heartBeatTx));
};
export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = Provider.getDefaultProvider();

  const owner = new Wallet(PK_OWNER, provider);

  const aaArtifact = await hre.artifacts.readArtifact("DESAccount");
  const desaAccount = new Contract(DESA_ACCOUNT, aaArtifact.abi, owner);

  const oldRecoveryStartDate = await desaAccount.recoveryStartDate();
  const heartBeatTx = await heartBeat(hre, provider, desaAccount, owner);

  // Account should have enough gas
  await heartBeatTx.wait();

  const newRecoveryStartDate = await desaAccount.recoveryStartDate();
  console.log(
    `HeartBeat called. RecoveryStartDate was ${oldRecoveryStartDate} now is ${newRecoveryStartDate}...`
  );
}
