import { Wallet, utils } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

// load env file
import dotenv from "dotenv";
dotenv.config();

// load wallet private key from env file
const PRIVATE_KEY = process.env.PK || "";

if (!PRIVATE_KEY)
  throw "⛔️ Private key not detected! Add it to the .env file!";

export default async function (hre: HardhatRuntimeEnvironment) {
  const wallet = new Wallet(PRIVATE_KEY);

  const deployer = new Deployer(hre, wallet);
  const factoryArtifact = await deployer.loadArtifact("DESAccountFactory");
  const aaArtifact = await deployer.loadArtifact("DESAccount");

  // Getting the bytecodeHash of the account
  const bytecodeHash = utils.hashBytecode(aaArtifact.bytecode);

  const factory = await deployer.deploy(
    factoryArtifact,
    [bytecodeHash],
    undefined,
    [aaArtifact.bytecode]
  );

  console.log(`DESAccount factory address: ${factory.address}`);
}
