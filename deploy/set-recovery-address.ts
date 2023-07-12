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

const { PK_OWNER, PK_BENEFICIARY, DESA_ACCOUNT } = getEnvs();

export const setRecoveryAddress = async (
  hre: HardhatRuntimeEnvironment,
  provider: Provider,
  desaAccount: Contract,
  owner: Wallet,
  recoveryAddress: string
) => {
  let setRecoveryAddressTx =
    await desaAccount.populateTransaction.setRecoveryAddress(recoveryAddress);

  setRecoveryAddressTx = {
    ...setRecoveryAddressTx,
    from: desaAccount.address,
    chainId: (await provider.getNetwork()).chainId,
    nonce: await provider.getTransactionCount(desaAccount.address),
    type: EIP712_TX_TYPE,
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
    } as types.Eip712Meta,
    value: ethers.BigNumber.from(0),
  };

  setRecoveryAddressTx.gasPrice = await provider.getGasPrice();
  setRecoveryAddressTx.gasLimit = await provider.estimateGas(
    setRecoveryAddressTx
  );

  const signedTxHash = EIP712Signer.getSignedDigest(setRecoveryAddressTx);

  const signature = ethers.utils.arrayify(
    ethers.utils.joinSignature(owner._signingKey().signDigest(signedTxHash))
  );

  setRecoveryAddressTx.customData = {
    ...setRecoveryAddressTx.customData,
    customSignature: signature,
  };

  return await provider.sendTransaction(utils.serialize(setRecoveryAddressTx));
};
export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = Provider.getDefaultProvider();

  const owner = new Wallet(PK_OWNER, provider);
  const recoveryAddress = new Wallet(PK_BENEFICIARY, provider);

  const aaArtifact = await hre.artifacts.readArtifact("DESAccount");
  const desaAccount = new Contract(DESA_ACCOUNT, aaArtifact.abi, owner);

  const oldRecoveryAddress = await desaAccount.recoveryAddress();
  const setRecoveryAddressTx = await setRecoveryAddress(
    hre,
    provider,
    desaAccount,
    owner,
    recoveryAddress.address
  );

  console.log(
    `Setting recoveryAddress for account as ${recoveryAddress.address} (was ${oldRecoveryAddress})...`
  );

  // Account should have enough gas
  await setRecoveryAddressTx.wait();

  const newBeneficiary = await desaAccount.recoveryAddress();
  console.log(`Beneficiary set to ${newBeneficiary}.`);
}
