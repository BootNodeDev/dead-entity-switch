import { EIP712Signer, Provider, Wallet, types, utils } from "zksync-web3";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { ethers } from "ethers";
import { getEnvs } from "./envValidate";
import { EIP712_TX_TYPE } from "zksync-web3/build/src/utils";

const { PK_BENEFICIARY: PK_OWNER, DESA_ACCOUNT } = getEnvs();

const extractETH = async (
  hre: HardhatRuntimeEnvironment,
  provider: Provider,
  account: string,
  owner: Wallet,
  to: string,
  transferAmount: string
) => {
  const extractEth = {
    from: account,
    to,
    chainId: (await provider.getNetwork()).chainId,
    nonce: await provider.getTransactionCount(DESA_ACCOUNT),
    type: EIP712_TX_TYPE,
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
    } as types.Eip712Meta,
    value: ethers.utils.parseEther(transferAmount),
    gasPrice: await provider.getGasPrice(),
    gasLimit: ethers.BigNumber.from(20000000),
    data: "0x",
  };

  const signedTxHash = EIP712Signer.getSignedDigest(extractEth);

  const signature = ethers.utils.arrayify(
    ethers.utils.joinSignature(owner._signingKey().signDigest(signedTxHash))
  );

  extractEth.customData = {
    ...extractEth.customData,
    customSignature: signature,
  };

  return await provider.sendTransaction(utils.serialize(extractEth));
};
export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = Provider.getDefaultProvider();
  const owner = new Wallet(PK_OWNER, provider);

  const transferAmount = "0";
  const oldBalance = await provider.getBalance(DESA_ACCOUNT);

  console.log(
    `Sending balance ${oldBalance} of account ${DESA_ACCOUNT} to ${owner.address}...`
  );

  const sentTx = await extractETH(
    hre,
    provider,
    DESA_ACCOUNT,
    owner,
    owner.address,
    transferAmount
  );
  // Account should have enough gas
  await sentTx.wait();

  const balance = await provider.getBalance(DESA_ACCOUNT);

  console.log(`Balance is ${balance}.`);
}
