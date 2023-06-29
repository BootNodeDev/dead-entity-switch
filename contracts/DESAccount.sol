//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


import "@matterlabs/zksync-contracts/l2/system-contracts/DefaultAccount.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";

// Used for signature validation
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// Access zkSync system contracts for nonce validation via NONCE_HOLDER_SYSTEM_CONTRACT
import "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";
// to call non-view function of system contracts
import "@matterlabs/zksync-contracts/l2/system-contracts/libraries/SystemContractsCaller.sol";


contract DESAccount is DefaultAccount, HeartBeat, IERC1271 {
    // Hook into DefaultAccount execute/validate/etc.
}
