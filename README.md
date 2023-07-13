# Dead Entity Switch

The Dead Entity Switch aims to enhance the functionality of an account by introducing a recovery mechanism that enables a designated beneficiary to assume complete control over the account under specific conditions. This functionality is designed to address situations where an account becomes inactive or dormant due to prolonged inactivity, thereby ensuring its resources can be efficiently managed and utilized.

## Project structure

- `/contracts`: smart contracts.
- `/deploy`: deployment and contract interaction scripts.
- `hardhat.config.ts`: configuration file.

## Commands

Commands are configured in the `package.json` file and use `hardat.config.ts`.

- `yarn hardhat compile` will compile the contracts.
- `yarn deploy-factory` deploy factory using `PK_OWNER` account and prints its resulting address.
- `yarn deploy-account` deploy account using `FACTORY` env variable and prints its address to be replaced in `DESA_ACCOUNT` env variable. The owner will be set to the public key of `PK_OWNER`.
- `yarn set-recovery-address` interact with `DESA_ACCOUNT` as `PK_OWNER` to set `PK_BENEFICIARY` as recovery address.
- `yarn set-recovery-period` interect with `DESA_ACCOUNT` as `PK_OWNER` to change current recovery period (by default 365 days) to 5 minutes.
- `yarn extract-eth-account` interact with `DESA_ACCOUNT` as `PK_BENEFICIARY` (Should be owner first) to extract ETH minus fees from account.
- `yarn heartBeat` interact with `DESA_ACCOUNT` as `PK_OWNER` to stop any recovery ongoing.
- `yarn init-recovery` interact with `DESA_ACCOUNT` as `PK_BENEFICIARY` to start the process of recovery.
- `yarn finish-recovery` interact with `DESA_ACCOUNT` as `PK_BENEFICIARY` to change owner to `PK_BENEFIARY` public key if the recovery period is complete.

## Environment variables

In order to prevent users to leak private keys, this project includes the `dotenv` package which is used to load environment variables. It's used to load the wallet private key, required to run the `deploy-factory` script, and other variables for further interaction with the deployed account.

To use it, rename `.env.example` to `.env` and enter values.

```
ZKSYNC_WEB3_API_URL=https://zksync2-testnet.zksync.dev
PK_OWNER=123cde574ccff...
PK_BENEFICIARY=123cde574ccff...
FACTORY=0x123cd...
DESA_ACCOUNT=0x123cd...
```

## Official Links

- [Website](https://bootnode.dev/)
- [GitHub](https://github.com/BootNodeDev/dead-entity-switch)
