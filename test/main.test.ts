import { expect } from "chai";
import { Wallet, Provider, Contract } from "zksync-web3";
import * as hre from "hardhat";
import { RICH_WALLETS_LOCAL_SETUP } from "../deploy/constants";
import { deployFactory } from "../deploy/deploy-factory";
import { deployAccount } from "../deploy/deploy-account";
import { ethers } from "ethers";
import { setTimeout } from "../deploy/set-timeout";
import { setBeneficiary } from "../deploy/set-beneficiary";

const [{ privateKey: PK_OWNER }, { privateKey: PK_BENEFICIARY }] =
  RICH_WALLETS_LOCAL_SETUP;

async function deployFactoryAndAccount() {
  const provider = Provider.getDefaultProvider();

  const walletOwner = new Wallet(PK_OWNER, provider);
  const walletBeneficiary = new Wallet(PK_BENEFICIARY, provider);

  const factory = await deployFactory(hre, walletOwner);
  const account = await deployAccount(hre, walletOwner, factory.address);

  return [factory.address, account, walletOwner, walletBeneficiary] as const;
}

describe("DESAccountFactory", function () {
  it("Should deploy factory", async function () {
    const provider = Provider.getDefaultProvider();
    const [factory, account, walletOwner, walletBeneficiary] =
      await deployFactoryAndAccount();

    const tx = await walletOwner.transfer({
      to: account,
      amount: ethers.utils.parseEther("100"),
    });

    await tx.wait();
    // const balanceAccount = await provider.getBalance(account);
    // const balanceFactory = await provider.getBalance(factory);
    // const balanceOwner = await provider.getBalance(walletOwner.address);

    // console.log({
    //   balanceAccount: ethers.utils.formatEther(balanceAccount),
    //   balanceFactory: ethers.utils.formatEther(balanceFactory),
    //   balanceOwner: ethers.utils.formatEther(balanceOwner),
    // });

    const aaArtifact = await hre.artifacts.readArtifact("DESAccount");
    const accountContract = new ethers.Contract(account, aaArtifact.abi);

    // FIXME Is using hardhat-chai instead of zksync-chai?
    // await expect(
    //   setTimeout(hre, walletOwner, provider, account, 1 * 60)
    // ).to.be.revertedWithCustomError(aa, "TimeoutTooShort");

    await setTimeout(hre, walletOwner, provider, account, 5 * 60);
    await setBeneficiary(
      hre,
      provider,
      accountContract,
      walletOwner,
      walletBeneficiary.address
    );

    console.log({ factory: factory, account });
  });
});
