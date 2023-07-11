//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.17;

import "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";
import "@matterlabs/zksync-contracts/l2/system-contracts/libraries/SystemContractsCaller.sol";

/// @author BootNode Team
/// @title Dead Entity Switch Account Factory
/// @notice Proof of Concept for BUIDLEra hackathon
contract DESAccountFactory {
  bytes32 public aaBytecodeHash;

  event DESAccountDeployed(address indexed _newAccount, address _owner);

  constructor(bytes32 _aaBytecodeHash) {
    aaBytecodeHash = _aaBytecodeHash;
  }

  /// @notice Deploy a new dead entity switch account 
  /// @param salt to be passed on create2Account
  /// @param owner owner of the new account 
  /// @return accountAddress address of the new account
  function deployAccount(
    bytes32 salt,
    address owner
  ) external returns (address accountAddress) {
    (bool success, bytes memory returnData) = SystemContractsCaller
      .systemCallWithReturndata(
        uint32(gasleft()),
        address(DEPLOYER_SYSTEM_CONTRACT),
        uint128(0),
        abi.encodeCall(
          DEPLOYER_SYSTEM_CONTRACT.create2Account,
          (
            salt,
            aaBytecodeHash,
            abi.encode(owner),
            IContractDeployer.AccountAbstractionVersion.Version1
          )
        )
      );
    require(success, "Deployment failed");

    (accountAddress) = abi.decode(returnData, (address));

    emit DESAccountDeployed(accountAddress, owner);
  }
}
