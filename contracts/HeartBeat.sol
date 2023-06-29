//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";


struct Claim {
    uint256 dateStarted
}

contract HeartBeat is Ownable {
    address private beneficiary;
    uint256 timeoutToFinalizeClaim = 1 year; // TODO Setter & constructor

    constructor(address memory _beneficiary) {
        beneficiary = _beneficiary;
        // TODO Change owner from factory to account created.
    }

    function heartBeat() public internal onlyOwner {
    }

    function initClaim() public external  {
        // setDateStarted
    }

    function finishClaim() public external  {
        // if(dateStarted + timeooutToFinalizeClaim > now)
        // giveAccess as `secondOwner`, meanwhile is a dummyAddress (0x00..00)?
    }

     function kick() public external onlyOwner  {
        // Remove claim
    }

}
