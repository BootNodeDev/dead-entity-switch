import { Wallet, Provider, utils } from "zksync-web3";
import { expect } from "chai";
import * as hre from "hardhat";
import { ethers } from "ethers";

import { RICH_WALLETS_LOCAL_SETUP } from "../deploy/constants";
import { deployFactory } from "../deploy/deploy-factory";
import { deployAccount } from "../deploy/deploy-account";
import { setRecoveryPeriod } from "../deploy/set-recovery-period";
import { setRecoveryAddress } from "../deploy/set-recovery-address";
import initRecovery from "../deploy/init-recovery";

const [{ privateKey: PK_OWNER }, { privateKey: PK_BENEFICIARY }] =
  RICH_WALLETS_LOCAL_SETUP;

export async function deployFactoryAndAccount(withBalance = true) {
  const provider = Provider.getDefaultProvider();

  const walletOwner = new Wallet(PK_OWNER, provider);
  const walletBeneficiary = new Wallet(PK_BENEFICIARY, provider);

  const factory = await deployFactory(hre, walletOwner);
  const account = await deployAccount(hre, walletOwner, factory.address);

  if (withBalance) {
    const tx = await walletOwner.transfer({
      to: account,
      amount: ethers.utils.parseEther("100"),
    });

    await tx.wait();
  }
  return [factory.address, account, walletOwner, walletBeneficiary] as const;
}

describe("Dead Entity Switch", function () {
  it("Should deploy factory", async function () {
    const provider = Provider.getDefaultProvider();
    const [factory, account, walletOwner, walletBeneficiary] =
      await deployFactoryAndAccount(true);

    const aaArtifact = await hre.artifacts.readArtifact("DESAccount");
    const accountContract = new ethers.Contract(account, aaArtifact.abi);

    // FIXME zksync-chai-matchers not working?
    try {
      await setRecoveryPeriod(hre, walletOwner, provider, account, 3 * 60);
    } catch (e) {
      console.log("setRecoveryPeriod failed as expected", e);
    }

    await setRecoveryPeriod(hre, walletOwner, provider, account, 5 * 60);
    await setRecoveryAddress(
      hre,
      provider,
      accountContract,
      walletOwner,
      walletBeneficiary.address
    );

    console.log({ factory: factory, account });
  });

  it.only("Should init and finish recovery", async function () {
    const provider = Provider.getDefaultProvider();
    const [factory, account, walletOwner, walletBeneficiary] =
      await deployFactoryAndAccount(true);

    const aaArtifact = await hre.artifacts.readArtifact("DESAccount");
    const accountContract = new ethers.Contract(account, aaArtifact.abi);

    // FIXME zksync-chai-matchers not working?
    try {
      await accountContract.connect(walletOwner).initRecovery();
    } catch (e) {
      console.log("initRecovery failed as expected (no recovery address)");
    }

    await setRecoveryAddress(
      hre,
      provider,
      accountContract,
      walletOwner,
      walletBeneficiary.address
    );

    try {
      await accountContract.connect(walletOwner).initRecovery();
    } catch (e) {
      console.log(
        "initRecovery failed as expected (only beneficiary can init it)"
      );
    }

    await accountContract.connect(walletBeneficiary).initRecovery();

    try {
      await accountContract.connect(walletBeneficiary).finishRecovery();
    } catch (e) {
      console.log(
        "finishRecovery failed as expected (recovery period not complete)"
      );
    }

    const currentRecoveryPeriod = await accountContract
      .connect(walletOwner)
      .recoveryPeriod();

    expect(currentRecoveryPeriod).to.be.eq(365 * 24 * 60 * 60);

    await accountContract.connect(walletOwner).setRecoveryPeriod(5 * 60);
    const newCurrentRecoveryPeriod = await accountContract
      .connect(walletOwner)
      .recoveryPeriod();

    expect(currentRecoveryPeriod).to.be.eq(5 * 60);

    utils.sleep(6 * 60);

    await accountContract.connect(walletBeneficiary).finishRecovery();
  });
});
