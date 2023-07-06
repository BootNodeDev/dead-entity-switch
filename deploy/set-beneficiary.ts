import {
  Contract,
  EIP712Signer,
  Provider,
  Wallet,
  types,
  utils,
} from "zksync-web3";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import dotenv from "dotenv";
import { ethers } from "ethers";
import { ZKSYNC_TX_TYPE } from "./constants";
dotenv.config();

const PK_OWNER = process.env.PK_OWNER || "";
const PK_BENEFICIARY = process.env.PK_BENEFICIARY || "";
const FACTORY = process.env.FACTORY || "";
const DESA_ACCOUNT = process.env.DESA_ACCOUNT || "";

if (!PK_OWNER)
  throw "⛔️ Private key for owner not detected! Add it to the .env file!";
if (!PK_BENEFICIARY)
  throw "⛔️ Private key for beneficiary not detected! Add it to the .env file!";
if (!FACTORY)
  throw "⛔️ Factory address not detected! Add it to the .env file!";
if (!DESA_ACCOUNT)
  throw "⛔️ Account address not detected! Add it to the .env file!";

export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = new Provider("https://testnet.era.zksync.dev");

  const owner = new Wallet(PK_OWNER, provider);
  const beneficiary = new Wallet(PK_BENEFICIARY, provider);

  const aaArtifact = await hre.artifacts.readArtifact("DESAccount");
  const desaAccount = new Contract(DESA_ACCOUNT, aaArtifact.abi, owner);

  let setBeneficiaryTx = await desaAccount.populateTransaction.setBeneficiary(
    beneficiary.address
  );

  setBeneficiaryTx = {
    ...setBeneficiaryTx,
    from: DESA_ACCOUNT,
    chainId: (await provider.getNetwork()).chainId,
    nonce: await provider.getTransactionCount(DESA_ACCOUNT),
    type: ZKSYNC_TX_TYPE,
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
    } as types.Eip712Meta,
    value: ethers.BigNumber.from(0),
  };

  setBeneficiaryTx.gasPrice = await provider.getGasPrice();
  setBeneficiaryTx.gasLimit = await provider.estimateGas(setBeneficiaryTx);

  const signedTxHash = EIP712Signer.getSignedDigest(setBeneficiaryTx);

  const signature = ethers.utils.arrayify(
    ethers.utils.joinSignature(owner._signingKey().signDigest(signedTxHash))
  );

  setBeneficiaryTx.customData = {
    ...setBeneficiaryTx.customData,
    customSignature: signature,
  };

  const oldBeneficiary = await desaAccount.beneficiary();

  const sentTx = await provider.sendTransaction(
    utils.serialize(setBeneficiaryTx)
  );

  console.log(
    `Setting beneficiary for account as ${beneficiary.address} (was ${oldBeneficiary})...`
  );

  // Account should have enough gas
  await sentTx.wait();

  const newBeneficiary = await desaAccount.beneficiary();
  console.log(`Beneficiary set to ${beneficiary.address}.`);
}
