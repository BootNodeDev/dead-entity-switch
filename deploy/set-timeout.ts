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
import { TX_TYPE_ZKSYNC } from "./constants";

import { getEnvs } from "./envValidate";

const { PK_OWNER, DESA_ACCOUNT } = getEnvs();

export const setTimeout = async (
  hre: HardhatRuntimeEnvironment,
  signer: Wallet,
  provider: Provider,
  account: string,
  claimTimeout: number
) => {
  const aaArtifact = await hre.artifacts.readArtifact("DESAccount");
  const desaAccount = new Contract(account, aaArtifact.abi, signer);

  let setTimeoutTx = await desaAccount.populateTransaction.setClaimTimeout(
    claimTimeout
  );

  setTimeoutTx = {
    ...setTimeoutTx,
    from: account,
    chainId: (await provider.getNetwork()).chainId,
    nonce: await provider.getTransactionCount(account),
    type: TX_TYPE_ZKSYNC,
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
    } as types.Eip712Meta,
    value: ethers.BigNumber.from(0),
  };

  setTimeoutTx.gasPrice = await provider.getGasPrice();
  setTimeoutTx.gasLimit = await provider.estimateGas(setTimeoutTx);

  const signedTxHash = EIP712Signer.getSignedDigest(setTimeoutTx);

  const signature = ethers.utils.arrayify(
    ethers.utils.joinSignature(signer._signingKey().signDigest(signedTxHash))
  );

  setTimeoutTx.customData = {
    ...setTimeoutTx.customData,
    customSignature: signature,
  };

  return await provider.sendTransaction(utils.serialize(setTimeoutTx));
};

export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = new Provider("https://testnet.era.zksync.dev");

  const owner = new Wallet(PK_OWNER, provider);
  const aaArtifact = await hre.artifacts.readArtifact("DESAccount");
  const desaAccount = new Contract(DESA_ACCOUNT, aaArtifact.abi, owner);

  const NEW_TIMEOUT = 5 * 60; // 5 minutes

  const oldTimeout = await desaAccount.claimTimeout();
  const sentTx = await setTimeout(
    hre,
    owner,
    provider,
    DESA_ACCOUNT,
    NEW_TIMEOUT
  );
  console.log(`Setting timeout as ${NEW_TIMEOUT} (was ${oldTimeout})...`);

  // Account should have enough gas
  await sentTx.wait();

  const newTimeout = await desaAccount.claimTimeout();
  const dateStarted = await desaAccount.dateStarted();
  console.log(`ClaimTimeout set to ${newTimeout}.`); // TODO humanize?
  console.log(`dateStarted was reset to ${dateStarted}`);
}
