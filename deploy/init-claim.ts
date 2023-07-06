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
  const desaAccount = new Contract(DESA_ACCOUNT, aaArtifact.abi, beneficiary);

  const oldDteStarted = await desaAccount.dateStarted();

  console.log(`Claim already started?: ${oldDteStarted}`);
  await desaAccount.initClaim();

  const beneficiaryAddress = await desaAccount.beneficiary();

  console.log(`Starting claim for beneficiary ${beneficiaryAddress}...`);

  const dateStarted = await desaAccount.dateStarted();
  console.log(`Claim started at ${dateStarted}.`);
}
