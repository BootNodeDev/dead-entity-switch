import { Contract, Wallet, utils } from "zksync-web3";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { getPrivateKeyOwner } from "./envValidate";

export const deployFactory = async (
  hre: HardhatRuntimeEnvironment,
  wallet: Wallet
): Promise<Contract> => {
  const deployer = new Deployer(hre, wallet);
  const factoryArtifact = await deployer.loadArtifact("DESAccountFactory");
  const aaArtifact = await deployer.loadArtifact("DESAccount");

  return await deployer.deploy(
    factoryArtifact,
    [utils.hashBytecode(aaArtifact.bytecode)],
    undefined,
    [aaArtifact.bytecode]
  );
};

export default async function (hre: HardhatRuntimeEnvironment) {
  const { PK_OWNER } = getPrivateKeyOwner();
  const wallet = new Wallet(PK_OWNER);

  const factory = await deployFactory(hre, wallet);

  console.log(`DESAccount factory address: ${factory.address}`);
}
