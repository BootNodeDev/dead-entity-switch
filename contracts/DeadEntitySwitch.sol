//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract DeadEntitySwitch {
  uint256 constant MIN_TIMEOUT = 5 minutes;

  address public owner;
  address public beneficiary;
  uint256 public dateStarted;
  uint256 public claimTimeout = 365 days;

  event BeneficiaryChanged(address beneficiary);
  event TimeoutChanged(uint timeout);
  event TimeoutReset();
  event ClaimInitiated(uint256 date, address beneficiary);
  event ClaimFinished(uint256 date, address beneficiary);

  error OwnerRequired();
  error BeneficiaryRequired();
  error ClaimNotStarted();
  error TimeoutTooShort();
  error TimeoutNotFinished();

  constructor(address _owner) {
    owner = _owner;
  }

  function setBeneficiary(address _beneficiary) public {
    if (owner != msg.sender) {
      revert OwnerRequired();
    }
    beneficiary = _beneficiary;

    emit BeneficiaryChanged(_beneficiary);
  }

  function setClaimTimeout(uint256 _timeout) public {
    if (owner != msg.sender) {
      revert OwnerRequired();
    }
    if (_timeout < MIN_TIMEOUT) {
      revert TimeoutTooShort();
    }

    claimTimeout = _timeout;

    emit TimeoutChanged(_timeout);
  }

  function _heartBeat() internal {
    dateStarted = 0;

    emit TimeoutReset();
  }

  function heartBeat() public {
    if (dateStarted == 0) {
      revert ClaimNotStarted();
    }
    if (owner != msg.sender) {
      revert OwnerRequired();
    }

    _heartBeat();
  }

  function initClaim() public {
    if (msg.sender != beneficiary) {
      revert BeneficiaryRequired();
    }

    dateStarted = block.timestamp;

    emit ClaimInitiated(dateStarted, beneficiary);
  }

  function finishClaim() public {
    if ((dateStarted + claimTimeout) >= block.timestamp) {
      revert TimeoutNotFinished();
    }

    owner = beneficiary;
    dateStarted = 0;
    beneficiary = address(0);

    emit ClaimFinished(block.timestamp, owner);
  }
}
