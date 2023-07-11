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

export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = new Provider("https://testnet.era.zksync.dev");

  const owner = new Wallet(PK_OWNER, provider);

  const aaArtifact = await hre.artifacts.readArtifact("DESAccount");
  const desaAccount = new Contract(DESA_ACCOUNT, aaArtifact.abi, owner);

  const NEW_TIMEOUT = 5 * 60; // 5 minutes
  let setTimeoutTx = await desaAccount.populateTransaction.setClaimTimeout(
    NEW_TIMEOUT
  );

  setTimeoutTx = {
    ...setTimeoutTx,
    from: DESA_ACCOUNT,
    chainId: (await provider.getNetwork()).chainId,
    nonce: await provider.getTransactionCount(DESA_ACCOUNT),
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
    ethers.utils.joinSignature(owner._signingKey().signDigest(signedTxHash))
  );

  setTimeoutTx.customData = {
    ...setTimeoutTx.customData,
    customSignature: signature,
  };

  const oldTimeout = await desaAccount.claimTimeout();

  const sentTx = await provider.sendTransaction(utils.serialize(setTimeoutTx));

  console.log(`Setting timeout as ${NEW_TIMEOUT} (was ${oldTimeout})...`);

  // Account should have enough gas
  await sentTx.wait();

  const newTimeout = await desaAccount.claimTimeout();
  const dateStarted = await desaAccount.dateStarted();
  console.log(`ClaimTimeout set to ${newTimeout}.`); // TODO humanize?
  console.log(`dateStarted was reset to ${dateStarted}`);
}
