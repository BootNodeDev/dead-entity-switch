import { EIP712Signer, Provider, Wallet, types, utils } from "zksync-web3";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { ethers } from "ethers";
import { TX_TYPE_ZKSYNC } from "./constants";
import { getEnvs } from "./envValidate";

const { PK_BENEFICIARY: PK_OWNER, DESA_ACCOUNT } = getEnvs();
export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = new Provider("https://testnet.era.zksync.dev");
  const owner = new Wallet(PK_OWNER, provider);

  const transferAmount = "0";
  const extractEth = {
    from: DESA_ACCOUNT,
    to: owner.address,
    chainId: (await provider.getNetwork()).chainId,
    nonce: await provider.getTransactionCount(DESA_ACCOUNT),
    type: TX_TYPE_ZKSYNC,
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

  const oldBalance = await provider.getBalance(DESA_ACCOUNT);

  const sentTx = await provider.sendTransaction(utils.serialize(extractEth));

  console.log(
    `Sending balance ${oldBalance} of account ${DESA_ACCOUNT} to ${owner.address}...`
  );

  // Account should have enough gas
  await sentTx.wait();

  const balance = await provider.getBalance(DESA_ACCOUNT);

  console.log(`Balance is ${balance}.`);
}
