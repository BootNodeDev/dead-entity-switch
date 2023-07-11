//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.17;

/// @author BootNode Team
/// @title Dead Entity Switch
/// @notice Proof of Concept for BUIDLEra hackathon
contract DeadEntitySwitch {
  /// @notice The shorter period of time that can be set for a recovery process 
  uint256 constant MIN_TIMEOUT = 5 minutes;

  /// @notice The current address that is able to sign txs on behalf of this abstract account
  address public owner;

  /// @notice Address set to be owner if no activity is present on this account after the recoveryPeriod.
  address public recoveryAddress;

  /// @notice Timestamp to record when the recovery was initiated. 0 if not recovery is on progress
  uint256 public recoveryStartDate;

  /// @notice The current period of time that must pass without activity on the account to complete the recovery.
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

  /// @notice Set the recovery address that could on the future initiate a recovery process
  /// @param _recoveryAddress Address designated for recovery and future ownership if the period is complete
  /// @dev Only the current owner is able to sign a tx on behalf of this account and decide which address can initiate
  ///      a process to own the account
  function setRecoveryAddress(address _recoveryAddress) external {
    if (msg.sender != address(this)) revert OwnerRequired();

    recoveryAddress = _recoveryAddress;

    emit RecoveryAddressUpdated(_recoveryAddress);
  }

  /// @notice Set the period for the next recovery process
  /// @param _recoveryPeriod Period of time required to pass for a recovery process
  /// @dev Only the current owner is able to sign a tx on behalf of this account and decide how much time
  ///      have to pass. Also this counts as account activity so if there is some recovery, it is cancelled
  function setRecoveryPeriod(uint256 _recoveryPeriod) external {
    if (msg.sender != address(this)) revert OwnerRequired();
    if (_recoveryPeriod < MIN_TIMEOUT) revert RecoveryPeriodTooShort();

    recoveryPeriod = _recoveryPeriod;

    emit RecoveryPeriodUpdated(_recoveryPeriod);
  }

  /// @notice Function to serve as void activity cancelling any ongoing recovery
  function heartBeat() external {
    if (recoveryStartDate == 0) revert RecoveryNotStarted();
    if (msg.sender != address(this)) revert OwnerRequired();

    _heartBeat();
  }

  /// @notice Initiate process of recovery. Only recoveryAddress can initiate.
  function initRecovery() external {
    if (msg.sender != recoveryAddress) revert RecoveryAddressRequired();
    if (recoveryStartDate != 0) revert RecoveryAlreadyStarted();

    recoveryStartDate = block.timestamp;

    emit RecoveryInitiated(recoveryStartDate, recoveryAddress);
  }

  /// @notice For a recovery already started, if the recovery period is complete
  ///         change the owner of this account to the recoveryAddress. 
  ///         Reset values for no-recovery
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
