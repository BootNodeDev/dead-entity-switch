import { utils, Wallet, Provider } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// load env file
import dotenv from "dotenv";
dotenv.config();

// load wallet private key from env file
const PK_OWNER = process.env.PK_OWNER || "";
if (!PK_OWNER) throw "⛔️ Private key not detected! Add it to the .env file!";

const FACTORY_ADDRESS = process.env.FACTORY || "";
if (!FACTORY_ADDRESS)
  throw "⛔️ Factory address not detected! Add it to the .env file!";

export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = new Provider("https://testnet.era.zksync.dev");

  const wallet = new Wallet(PK_OWNER).connect(provider);
  const factoryArtifact = await hre.artifacts.readArtifact("DESAccountFactory");

  const aaFactory = new ethers.Contract(
    FACTORY_ADDRESS,
    factoryArtifact.abi,
    wallet
  );

  const salt = ethers.constants.HashZero;

  const ownerAddress = wallet.address;
  // deploy account
  const tx = await aaFactory.deployAccount(salt, ownerAddress);
  await tx.wait();

  const abiCoder = new ethers.utils.AbiCoder();

  const desaAddress = utils.create2Address(
    FACTORY_ADDRESS,
    await aaFactory.aaBytecodeHash(),
    salt,
    abiCoder.encode(["address"], [ownerAddress])
  );
  console.log(`dead entity switch account deployed on address ${desaAddress}`);
}
