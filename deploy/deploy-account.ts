import { utils, Wallet, Provider } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getPrivateKeyOwner, getFactoryAddress } from "./envValidate";

const { PK_OWNER } = getPrivateKeyOwner();
const { FACTORY } = getFactoryAddress();

export const deployAccount = async (
  hre: HardhatRuntimeEnvironment,
  wallet: Wallet,
  factoryAddress: string
): Promise<string> => {
  const factoryArtifact = await hre.artifacts.readArtifact("DESAccountFactory");
  const aaFactory = new ethers.Contract(
    factoryAddress,
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
    factoryAddress,
    await aaFactory.aaBytecodeHash(),
    salt,
    abiCoder.encode(["address"], [ownerAddress])
  );

  return desaAddress;
};

export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = Provider.getDefaultProvider();

  const wallet = new Wallet(PK_OWNER).connect(provider);
  const desaAddress = await deployAccount(hre, wallet, FACTORY);
  console.log(`Deploying new account with ${FACTORY} factory...`);

  console.log(`dead entity switch account deployed on address ${desaAddress}`);
}
