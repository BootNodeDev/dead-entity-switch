//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.17;

import "@matterlabs/zksync-contracts/l2/system-contracts/libraries/TransactionHelper.sol";
import { DEPLOYER_SYSTEM_CONTRACT } from "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";

import { DefaultAccount } from "./lib/DefaultAccount.sol";
import { DeadEntitySwitch } from "./DeadEntitySwitch.sol";

/// @author BootNode Team
/// @title Dead Entity Switch Account
/// @notice Proof of Concept for BUIDLEra hackathon
/// @dev _isValidSignature and _execute are overriden from DefaultAccount.
///      _isValidSignature is changed to compare erecover against the current owner
///      _execute is changed to signal for new activity using heartBeat functionality of DeadEntitySwitch
contract DESAccount is DefaultAccount, DeadEntitySwitch {
  using TransactionHelper for *;

  constructor(address _owner) DeadEntitySwitch(_owner) {}

  /// @notice Compare against owner instead of address(this). Validation that the ECDSA signature of the transaction is correct.
  /// @param _hash The hash of the transaction to be signed.
  /// @param _signature The signature of the transaction.
  /// @return EIP1271_SUCCESS_RETURN_VALUE if the signaure is correct. It reverts otherwise.
  function _isValidSignature(
    bytes32 _hash,
    bytes memory _signature
  ) internal view override returns (bool) {
    require(_signature.length == 65, "Signature length is incorrect");
    uint8 v;
    bytes32 r;
    bytes32 s;
    // Signature loading code
    // we jump 32 (0x20) as the first slot of bytes contains the length
    // we jump 65 (0x41) per signature
    // for v we load 32 bytes ending with v (the first 31 come from s) then apply a mask
    assembly {
      r := mload(add(_signature, 0x20))
      s := mload(add(_signature, 0x40))
      v := and(mload(add(_signature, 0x41)), 0xff)
    }
    require(v == 27 || v == 28, "v is neither 27 nor 28");

    // EIP-2 still allows signature malleability for ecrecover(). Remove this possibility and make the signature
    // unique. Appendix F in the Ethereum Yellow paper (https://ethereum.github.io/yellowpaper/paper.pdf), defines
    // the valid range for s in (301): 0 < s < secp256k1n ÷ 2 + 1, and for v in (302): v ∈ {27, 28}. Most
    // signatures from current libraries generate a unique signature with an s-value in the lower half order.
    //
    // If your library generates malleable signatures, such as s-values in the upper range, calculate a new s-value
    // with 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141 - s1 and flip v from 27 to 28 or
    // vice versa. If your library also generates signatures with 0/1 for v instead 27/28, add 27 to v to accept
    // these malleable signatures as well.
    require(
      uint256(s) <=
        0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0,
      "Invalid s"
    );

    address recoveredAddress = ecrecover(_hash, v, r, s);

    return recoveredAddress == owner && recoveredAddress != address(0);
  }

  /// @notice Inner method for executing a transaction.
  /// @param _transaction The transaction to execute.
  function _execute(Transaction calldata _transaction) internal override {
    address to = address(uint160(_transaction.to));
    uint128 value = Utils.safeCastToU128(_transaction.value);
    bytes calldata data = _transaction.data;
    uint32 gas = Utils.safeCastToU32(gasleft());

    // Note, that the deployment method from the deployer contract can only be called with a "systemCall" flag.
    bool isSystemCall;
    if (to == address(DEPLOYER_SYSTEM_CONTRACT) && data.length >= 4) {
      bytes4 selector = bytes4(data[:4]);
      // Check that called function is the deployment method,
      // the others deployer method is not supposed to be called from the default account.
      isSystemCall =
        selector == DEPLOYER_SYSTEM_CONTRACT.create.selector ||
        selector == DEPLOYER_SYSTEM_CONTRACT.create2.selector ||
        selector == DEPLOYER_SYSTEM_CONTRACT.createAccount.selector ||
        selector == DEPLOYER_SYSTEM_CONTRACT.create2Account.selector;
    }
    bool success = EfficientCall.rawCall(gas, to, value, data, isSystemCall);
    if (!success) {
      EfficientCall.propagateRevert();
    } else {
      _heartBeatIfRequired();
    }
  }
}
