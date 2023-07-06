import { Wallet, utils } from "zksync-web3";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

// load env file
import dotenv from "dotenv";
dotenv.config();

// load wallet private key from env file
const PK_OWNER = process.env.PK_OWNER || "";

if (!PK_OWNER) throw "⛔️ Private key not detected! Add it to the .env file!";

export default async function (hre: HardhatRuntimeEnvironment) {
  const wallet = new Wallet(PK_OWNER);

  const deployer = new Deployer(hre, wallet);
  const factoryArtifact = await deployer.loadArtifact("DESAccountFactory");
  const aaArtifact = await deployer.loadArtifact("DESAccount");

  const factory = await deployer.deploy(
    factoryArtifact,
    [utils.hashBytecode(aaArtifact.bytecode)],
    undefined,
    [aaArtifact.bytecode]
  );

  console.log(`DESAccount factory address: ${factory.address}`);
}
