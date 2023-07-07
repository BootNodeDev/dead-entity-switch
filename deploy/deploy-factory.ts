import { Wallet, utils } from "zksync-web3";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { getPrivateKeyOwner } from "./envValidate";

const { PK_OWNER } = getPrivateKeyOwner();
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
