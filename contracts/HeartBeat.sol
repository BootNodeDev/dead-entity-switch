//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";


contract HeartBeat is Ownable {
    address private beneficiary;
    bool isActive;
    uint256 dateStarted;

    constructor(address _beneficiary) {
        beneficiary = _beneficiary;
        // TODO Change owner from factory to account created.
    }

    function heartBeat() public onlyOwner {
        if(!isActive) {
            dateStarted = 0;
        }
    }

    function initClaim() public   {
        if(msg.sender == beneficiary) {
            dateStarted = block.timestamp;
        }
    }

    function finishClaim() public   {
        // TODO extract 1 year to var
        if((dateStarted + 365 days) > block.timestamp) {
            isActive = true;
        }
    }

     function kick() public onlyOwner  {
        // Remove claim
        isActive = false;
    }

}
