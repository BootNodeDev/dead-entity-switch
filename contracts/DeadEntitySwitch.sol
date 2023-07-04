//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

// 1. Move 365 days to var & setter
// 2. Events

contract DeadEntitySwitch {
    address public owner;
    address public beneficiary;
    uint256 public dateStarted;
    uint256 public claimTimeout = 365 days;

    constructor(address _owner) {
        owner = _owner;
    }

    function setBeneficiary(address _beneficiary) public {
        require(owner == msg.sender, "");
        beneficiary = _beneficiary;
        // emit event
    }

    function setClaimTimeout(uint256 _timeout) public {
        require(owner == msg.sender, "");
        require(_timeout >= 7 days, "");

        claimTimeout = _timeout;
    }

    function heartBeat() public {
        require(dateStarted != 0, "");
        require(owner == msg.sender, "");

        dateStarted = 0;
        // emit event
    }

    function initClaim() public   {
        require(msg.sender == beneficiary, "");

        dateStarted = block.timestamp;
        // notify user with event emit
    }

    function finishClaim() public   {
        // TODO extract 1 year to var
        require((dateStarted + claimTimeout) < block.timestamp, "");

        owner = beneficiary;
        dateStarted = 0;
        beneficiary = address(0);
        // emit event

    }

}
