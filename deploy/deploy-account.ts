import { utils, Wallet, Provider } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getPrivateKeyOwner, getFactoryAddress } from "./envValidate";

const { PK_OWNER } = getPrivateKeyOwner();
const { FACTORY } = getFactoryAddress();
export default async function (hre: HardhatRuntimeEnvironment) {
  const provider = new Provider("https://testnet.era.zksync.dev");

  const wallet = new Wallet(PK_OWNER).connect(provider);
  const factoryArtifact = await hre.artifacts.readArtifact("DESAccountFactory");

  console.log(`Deploying new account with ${FACTORY} factory...`);
  const aaFactory = new ethers.Contract(FACTORY, factoryArtifact.abi, wallet);

  const salt = ethers.constants.HashZero;

  const ownerAddress = wallet.address;
  // deploy account
  const tx = await aaFactory.deployAccount(salt, ownerAddress);
  await tx.wait();

  const abiCoder = new ethers.utils.AbiCoder();

  const desaAddress = utils.create2Address(
    FACTORY,
    await aaFactory.aaBytecodeHash(),
    salt,
    abiCoder.encode(["address"], [ownerAddress])
  );
  console.log(`dead entity switch account deployed on address ${desaAddress}`);
}
