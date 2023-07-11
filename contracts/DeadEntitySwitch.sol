//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.17;

contract DeadEntitySwitch {
  uint256 constant MIN_TIMEOUT = 5 minutes;

  address public owner;
  address public recoveryAddress;
  uint256 public recoveryStartDate;
  uint256 public recoveryPeriod = 365 days;

  event RecoveryAddressUpdated(address recoveryAddress);
  event RecoveryPeriodUpdated(uint recoveryPeriod);
  event RecoveryStartDateReset();
  event RecoveryInitiated(uint256 date, address recoveryAddress);
  event RecoveryFinished(uint256 date, address recoveryAddress);

  error OwnerRequired();
  error RecoveryAddressRequired();
  error RecoveryAlreadyStarted();
  error RecoveryNotStarted();
  error RecoveryPeriodTooShort();
  error RecoveryPeriodNotFinished();

  constructor(address _owner) {
    owner = _owner;
  }

  function setRecoveryAddress(address _recoveryAddress) external {
    if (msg.sender != address(this)) revert OwnerRequired();

    recoveryAddress = _recoveryAddress;

    emit RecoveryAddressUpdated(_recoveryAddress);
  }

  function setRecoveryPeriod(uint256 _recoveryPeriod) external {
    if (msg.sender != address(this)) revert OwnerRequired();
    if (_recoveryPeriod < MIN_TIMEOUT) revert RecoveryPeriodTooShort();

    recoveryPeriod = _recoveryPeriod;

    emit RecoveryPeriodUpdated(_recoveryPeriod);
  }

  function heartBeat() external {
    if (recoveryStartDate == 0) revert RecoveryNotStarted();
    if (msg.sender != address(this)) revert OwnerRequired();

    _heartBeat();
  }

  function initRecovery() external {
    if (msg.sender != recoveryAddress) revert RecoveryAddressRequired();
    if (recoveryStartDate != 0) revert RecoveryAlreadyStarted();

    recoveryStartDate = block.timestamp;

    emit RecoveryInitiated(recoveryStartDate, recoveryAddress);
  }

  function finishRecovery() external {
    if (msg.sender != recoveryAddress) revert RecoveryAddressRequired();
    if (recoveryStartDate == 0) revert RecoveryNotStarted();
    if ((recoveryStartDate + recoveryPeriod) > block.timestamp)
      revert RecoveryPeriodNotFinished();

    owner = recoveryAddress;
    recoveryStartDate = 0;
    recoveryAddress = address(0);

    emit RecoveryFinished(block.timestamp, owner);
  }

  function _heartBeatIfRequired() internal {
    if (recoveryStartDate != 0) {
      _heartBeat();
    }
  }

  function _heartBeat() internal {
    recoveryStartDate = 0;

    emit RecoveryStartDateReset();
  }
}
