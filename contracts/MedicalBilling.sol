// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MedicalBilling {
    // ─────────────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────────────

    error ProviderAlreadyRegistered();
    error ProviderNotRegistered();
    error UnauthorizedProvider();
    error InvalidPatient();
    error InvalidPatientReference();
    error InvalidServiceDescription();
    error InvalidAmount();
    error InvalidDueDate();
    error BillNotFound();
    error BillNotPending();
    error IncorrectPaymentAmount();
    error UnauthorizedPatient();
    error PaymentTransferFailed();

    // ─────────────────────────────────────────────────────────────────────
    // Enums
    // ─────────────────────────────────────────────────────────────────────

    enum BillStatus {
        Pending,
        Paid,
        Cancelled
    }

    // ─────────────────────────────────────────────────────────────────────
    // Structs
    // ─────────────────────────────────────────────────────────────────────

    struct Bill {
        uint256 billId;
        string patientReference;
        address patient;
        address provider;
        string serviceDescription;
        uint256 amount;
        uint256 dueDate;
        BillStatus status;
        uint256 createdAt;
        uint256 paidAt;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────

    event ProviderRegistered(address indexed provider);

    event BillCreated(
        uint256 indexed billId,
        address indexed provider,
        address indexed patient,
        string patientReference,
        uint256 amount,
        uint256 dueDate
    );

    event BillUpdated(uint256 indexed billId);

    event BillCancelled(uint256 indexed billId);

    event BillPaid(
        uint256 indexed billId,
        address indexed patient,
        address indexed provider,
        uint256 amount,
        uint256 paidAt
    );

    // ─────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────

    mapping(address => bool) private providers;
    mapping(uint256 => Bill) private bills;
    uint256 public totalBills;

    // Provider => bill IDs
    mapping(address => uint256[]) private providerBills;
    // Patient => bill IDs
    mapping(address => uint256[]) private patientBills;

    // ─────────────────────────────────────────────────────────────────────
    // Provider registration
    // ─────────────────────────────────────────────────────────────────────

    function registerProvider() external {
        if (providers[msg.sender]) revert ProviderAlreadyRegistered();
        providers[msg.sender] = true;
        emit ProviderRegistered(msg.sender);
    }

    function isProviderRegistered(address provider) external view returns (bool) {
        return providers[provider];
    }

    // ─────────────────────────────────────────────────────────────────────
    // Internal validation
    // ─────────────────────────────────────────────────────────────────────

    function _validateBillParams(
        address patient,
        string calldata patientReference,
        string calldata serviceDescription,
        uint256 amount,
        uint256 dueDate
    ) internal view {
        if (patient == address(0)) revert InvalidPatient();
        if (bytes(patientReference).length == 0) revert InvalidPatientReference();
        if (bytes(serviceDescription).length == 0) revert InvalidServiceDescription();
        if (amount == 0) revert InvalidAmount();
        if (dueDate <= block.timestamp) revert InvalidDueDate();
    }

    // ─────────────────────────────────────────────────────────────────────
    // Create bill
    // ─────────────────────────────────────────────────────────────────────

    function createBill(
        string calldata patientReference,
        address patient,
        string calldata serviceDescription,
        uint256 amount,
        uint256 dueDate
    ) external returns (uint256) {
        if (!providers[msg.sender]) revert ProviderNotRegistered();

        _validateBillParams(patient, patientReference, serviceDescription, amount, dueDate);

        totalBills += 1;
        uint256 billId = totalBills;

        bills[billId] = Bill({
            billId: billId,
            patientReference: patientReference,
            patient: patient,
            provider: msg.sender,
            serviceDescription: serviceDescription,
            amount: amount,
            dueDate: dueDate,
            status: BillStatus.Pending,
            createdAt: block.timestamp,
            paidAt: 0
        });

        providerBills[msg.sender].push(billId);
        patientBills[patient].push(billId);

        emit BillCreated(billId, msg.sender, patient, patientReference, amount, dueDate);

        return billId;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Update bill
    // ─────────────────────────────────────────────────────────────────────

    function updateBill(
        uint256 billId,
        string calldata patientReference,
        address patient,
        string calldata serviceDescription,
        uint256 amount,
        uint256 dueDate
    ) external {
        Bill storage bill = bills[billId];
        if (bill.billId == 0) revert BillNotFound();
        if (bill.provider != msg.sender) revert UnauthorizedProvider();
        if (bill.status != BillStatus.Pending) revert BillNotPending();

        _validateBillParams(patient, patientReference, serviceDescription, amount, dueDate);

        bill.patientReference = patientReference;
        bill.patient = patient;
        bill.serviceDescription = serviceDescription;
        bill.amount = amount;
        bill.dueDate = dueDate;

        emit BillUpdated(billId);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Cancel bill
    // ─────────────────────────────────────────────────────────────────────

    function cancelBill(uint256 billId) external {
        Bill storage bill = bills[billId];
        if (bill.billId == 0) revert BillNotFound();
        if (bill.provider != msg.sender) revert UnauthorizedProvider();
        if (bill.status != BillStatus.Pending) revert BillNotPending();

        bill.status = BillStatus.Cancelled;

        emit BillCancelled(billId);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Pay bill
    // ─────────────────────────────────────────────────────────────────────

    function payBill(uint256 billId) external payable {
        Bill storage bill = bills[billId];
        if (bill.billId == 0) revert BillNotFound();
        if (bill.status != BillStatus.Pending) revert BillNotPending();
        if (bill.patient != msg.sender) revert UnauthorizedPatient();
        if (msg.value != bill.amount) revert IncorrectPaymentAmount();

        // ── Effects ──────────────────────────────────────────────────────
        bill.status = BillStatus.Paid;
        bill.paidAt = block.timestamp;

        // ── Interactions ─────────────────────────────────────────────────
        (bool success, ) = payable(bill.provider).call{value: bill.amount}("");
        if (!success) revert PaymentTransferFailed();

        emit BillPaid(billId, msg.sender, bill.provider, bill.amount, bill.paidAt);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Read functions
    // ─────────────────────────────────────────────────────────────────────

    function getBill(uint256 billId) external view returns (Bill memory) {
        require(billId > 0 && billId <= totalBills, "Bill does not exist");
        return bills[billId];
    }

    function getProviderBills(address provider) external view returns (uint256[] memory) {
        return providerBills[provider];
    }

    function getPatientBills(address patient) external view returns (uint256[] memory) {
        return patientBills[patient];
    }

    function getTotalBills() external view returns (uint256) {
        return totalBills;
    }
}
