const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("MedicalBilling", function () {
  async function deployFixture() {
    const [owner, provider, patient, other] = await ethers.getSigners();

    const MedicalBillingFactory = await ethers.getContractFactory("MedicalBilling");
    const contract = await MedicalBillingFactory.deploy();

    const FUTURE_DUE_DATE = (await time.latest()) + 30 * 24 * 60 * 60; // 30 days from now

    return { contract, owner, provider, patient, other, FUTURE_DUE_DATE };
  }

  // ─────────────────────────────────────────────────────────────────────
  // Provider registration
  // ─────────────────────────────────────────────────────────────────────

  describe("Provider registration", function () {
    it("should allow a wallet to register as a provider", async function () {
      const { contract, provider } = await loadFixture(deployFixture);

      await expect(contract.connect(provider).registerProvider())
        .to.emit(contract, "ProviderRegistered")
        .withArgs(provider.address);

      expect(await contract.isProviderRegistered(provider.address)).to.be.true;
    });

    it("should not allow a provider to register twice", async function () {
      const { contract, provider } = await loadFixture(deployFixture);

      await contract.connect(provider).registerProvider();

      await expect(
        contract.connect(provider).registerProvider()
      ).to.be.revertedWithCustomError(contract, "ProviderAlreadyRegistered");
    });

    it("should return false for an unregistered provider", async function () {
      const { contract, other } = await loadFixture(deployFixture);

      expect(await contract.isProviderRegistered(other.address)).to.be.false;
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // Bill creation
  // ─────────────────────────────────────────────────────────────────────

  describe("Bill creation", function () {
    it("should not allow an unregistered wallet to create bills", async function () {
      const { contract, patient, FUTURE_DUE_DATE } = await loadFixture(deployFixture);

      await expect(
        contract.createBill("PAT-001", patient.address, "General Consultation", ethers.parseEther("25"), FUTURE_DUE_DATE)
      ).to.be.revertedWithCustomError(contract, "ProviderNotRegistered");
    });

    it("should allow a registered provider to create a bill", async function () {
      const { contract, provider, patient, FUTURE_DUE_DATE } = await loadFixture(deployFixture);

      await contract.connect(provider).registerProvider();

      await expect(
        contract.connect(provider).createBill("PAT-001", patient.address, "General Consultation", ethers.parseEther("25"), FUTURE_DUE_DATE)
      ).to.emit(contract, "BillCreated")
        .withArgs(1, provider.address, patient.address, "PAT-001", ethers.parseEther("25"), FUTURE_DUE_DATE);
    });

    it("should increment bill IDs sequentially starting from 1", async function () {
      const { contract, provider, patient, FUTURE_DUE_DATE } = await loadFixture(deployFixture);

      await contract.connect(provider).registerProvider();

      await contract.connect(provider).createBill("PAT-001", patient.address, "Consultation", ethers.parseEther("10"), FUTURE_DUE_DATE);
      await contract.connect(provider).createBill("PAT-002", patient.address, "Lab Test", ethers.parseEther("20"), FUTURE_DUE_DATE);

      expect(await contract.getTotalBills()).to.equal(2);

      const bill1 = await contract.getBill(1);
      expect(bill1.billId).to.equal(1);

      const bill2 = await contract.getBill(2);
      expect(bill2.billId).to.equal(2);
    });

    it("should store bill data correctly", async function () {
      const { contract, provider, patient, FUTURE_DUE_DATE } = await loadFixture(deployFixture);

      await contract.connect(provider).registerProvider();

      await contract.connect(provider).createBill(
        "PAT-001",
        patient.address,
        "Radiology — Chest X-Ray",
        ethers.parseEther("60"),
        FUTURE_DUE_DATE
      );

      const bill = await contract.getBill(1);

      expect(bill.billId).to.equal(1);
      expect(bill.patientReference).to.equal("PAT-001");
      expect(bill.patient).to.equal(patient.address);
      expect(bill.provider).to.equal(provider.address);
      expect(bill.serviceDescription).to.equal("Radiology — Chest X-Ray");
      expect(bill.amount).to.equal(ethers.parseEther("60"));
      expect(bill.dueDate).to.equal(FUTURE_DUE_DATE);
      expect(bill.status).to.equal(0); // BillStatus.Pending
      expect(bill.createdAt).to.be.gt(0);
      expect(bill.paidAt).to.equal(0);
    });

    it("should revert if patient is the zero address", async function () {
      const { contract, provider, FUTURE_DUE_DATE } = await loadFixture(deployFixture);

      await contract.connect(provider).registerProvider();

      await expect(
        contract.connect(provider).createBill("PAT-001", ethers.ZeroAddress, "Consultation", ethers.parseEther("25"), FUTURE_DUE_DATE)
      ).to.be.revertedWithCustomError(contract, "InvalidPatient");
    });

    it("should revert if patient reference is empty", async function () {
      const { contract, provider, patient, FUTURE_DUE_DATE } = await loadFixture(deployFixture);

      await contract.connect(provider).registerProvider();

      await expect(
        contract.connect(provider).createBill("", patient.address, "Consultation", ethers.parseEther("25"), FUTURE_DUE_DATE)
      ).to.be.revertedWithCustomError(contract, "InvalidPatientReference");
    });

    it("should revert if service description is empty", async function () {
      const { contract, provider, patient, FUTURE_DUE_DATE } = await loadFixture(deployFixture);

      await contract.connect(provider).registerProvider();

      await expect(
        contract.connect(provider).createBill("PAT-001", patient.address, "", ethers.parseEther("25"), FUTURE_DUE_DATE)
      ).to.be.revertedWithCustomError(contract, "InvalidServiceDescription");
    });

    it("should revert if amount is zero", async function () {
      const { contract, provider, patient, FUTURE_DUE_DATE } = await loadFixture(deployFixture);

      await contract.connect(provider).registerProvider();

      await expect(
        contract.connect(provider).createBill("PAT-001", patient.address, "Consultation", 0, FUTURE_DUE_DATE)
      ).to.be.revertedWithCustomError(contract, "InvalidAmount");
    });

    it("should revert if due date is not in the future", async function () {
      const { contract, provider, patient } = await loadFixture(deployFixture);

      await contract.connect(provider).registerProvider();

      const pastDate = (await time.latest()) - 100;

      await expect(
        contract.connect(provider).createBill("PAT-001", patient.address, "Consultation", ethers.parseEther("25"), pastDate)
      ).to.be.revertedWithCustomError(contract, "InvalidDueDate");
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // Bill update
  // ─────────────────────────────────────────────────────────────────────

  describe("Bill update", function () {
    async function createBillFixture() {
      const base = await loadFixture(deployFixture);
      await base.contract.connect(base.provider).registerProvider();
      await base.contract.connect(base.provider).createBill(
        "PAT-001",
        base.patient.address,
        "General Consultation",
        ethers.parseEther("25"),
        base.FUTURE_DUE_DATE
      );
      return base;
    }

    it("should allow the original provider to update a pending bill", async function () {
      const { contract, provider, patient, FUTURE_DUE_DATE } = await loadFixture(createBillFixture);

      const newDueDate = FUTURE_DUE_DATE + 7 * 24 * 60 * 60;

      await expect(
        contract.connect(provider).updateBill(1, "PAT-002", patient.address, "Specialist Consultation", ethers.parseEther("35"), newDueDate)
      ).to.emit(contract, "BillUpdated").withArgs(1);

      const bill = await contract.getBill(1);
      expect(bill.patientReference).to.equal("PAT-002");
      expect(bill.serviceDescription).to.equal("Specialist Consultation");
      expect(bill.amount).to.equal(ethers.parseEther("35"));
      expect(bill.dueDate).to.equal(newDueDate);
      expect(bill.provider).to.equal(provider.address);
      expect(bill.billId).to.equal(1);
    });

    it("should not allow an unauthorized wallet to update a bill", async function () {
      const { contract, patient, other, FUTURE_DUE_DATE } = await loadFixture(createBillFixture);

      await expect(
        contract.connect(other).updateBill(1, "PAT-002", patient.address, "Updated", ethers.parseEther("30"), FUTURE_DUE_DATE)
      ).to.be.revertedWithCustomError(contract, "UnauthorizedProvider");
    });

    it("should not allow updating a paid bill", async function () {
      const { contract, provider, patient, FUTURE_DUE_DATE } = await loadFixture(createBillFixture);

      await contract.connect(patient).payBill(1, { value: ethers.parseEther("25") });

      await expect(
        contract.connect(provider).updateBill(1, "PAT-002", patient.address, "Updated", ethers.parseEther("30"), FUTURE_DUE_DATE)
      ).to.be.revertedWithCustomError(contract, "BillNotPending");
    });

    it("should not allow updating a cancelled bill", async function () {
      const { contract, provider, patient, FUTURE_DUE_DATE } = await loadFixture(createBillFixture);

      await contract.connect(provider).cancelBill(1);

      await expect(
        contract.connect(provider).updateBill(1, "PAT-002", patient.address, "Updated", ethers.parseEther("30"), FUTURE_DUE_DATE)
      ).to.be.revertedWithCustomError(contract, "BillNotPending");
    });

    it("should revert when updating a non-existent bill", async function () {
      const { contract, provider, patient, FUTURE_DUE_DATE } = await loadFixture(createBillFixture);

      await expect(
        contract.connect(provider).updateBill(999, "PAT-002", patient.address, "Updated", ethers.parseEther("30"), FUTURE_DUE_DATE)
      ).to.be.revertedWithCustomError(contract, "BillNotFound");
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // Bill cancellation
  // ─────────────────────────────────────────────────────────────────────

  describe("Bill cancellation", function () {
    async function createBillFixture() {
      const base = await loadFixture(deployFixture);
      await base.contract.connect(base.provider).registerProvider();
      await base.contract.connect(base.provider).createBill(
        "PAT-001",
        base.patient.address,
        "General Consultation",
        ethers.parseEther("25"),
        base.FUTURE_DUE_DATE
      );
      return base;
    }

    it("should allow the original provider to cancel a pending bill", async function () {
      const { contract, provider } = await loadFixture(createBillFixture);

      await expect(
        contract.connect(provider).cancelBill(1)
      ).to.emit(contract, "BillCancelled").withArgs(1);

      const bill = await contract.getBill(1);
      expect(bill.status).to.equal(2); // BillStatus.Cancelled
    });

    it("should not allow an unauthorized wallet to cancel a bill", async function () {
      const { contract, other } = await loadFixture(createBillFixture);

      await expect(
        contract.connect(other).cancelBill(1)
      ).to.be.revertedWithCustomError(contract, "UnauthorizedProvider");
    });

    it("should not allow cancelling a paid bill", async function () {
      const { contract, provider, patient } = await loadFixture(createBillFixture);

      await contract.connect(patient).payBill(1, { value: ethers.parseEther("25") });

      await expect(
        contract.connect(provider).cancelBill(1)
      ).to.be.revertedWithCustomError(contract, "BillNotPending");
    });

    it("should not allow cancelling an already-cancelled bill", async function () {
      const { contract, provider } = await loadFixture(createBillFixture);

      await contract.connect(provider).cancelBill(1);

      await expect(
        contract.connect(provider).cancelBill(1)
      ).to.be.revertedWithCustomError(contract, "BillNotPending");
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // Bill payment
  // ─────────────────────────────────────────────────────────────────────

  describe("Bill payment", function () {
    async function createBillFixture() {
      const base = await loadFixture(deployFixture);
      await base.contract.connect(base.provider).registerProvider();
      await base.contract.connect(base.provider).createBill(
        "PAT-001",
        base.patient.address,
        "General Consultation",
        ethers.parseEther("25"),
        base.FUTURE_DUE_DATE
      );
      return base;
    }

    it("should allow the assigned patient to pay the exact bill amount", async function () {
      const { contract, provider, patient } = await loadFixture(createBillFixture);

      await expect(
        contract.connect(patient).payBill(1, { value: ethers.parseEther("25") })
      ).to.emit(contract, "BillPaid");

      const bill = await contract.getBill(1);
      expect(bill.status).to.equal(1); // BillStatus.Paid
    });

    it("should transfer the payment to the provider", async function () {
      const { contract, provider, patient } = await loadFixture(createBillFixture);

      const providerBalanceBefore = await ethers.provider.getBalance(provider.address);

      await contract.connect(patient).payBill(1, { value: ethers.parseEther("25") });

      const providerBalanceAfter = await ethers.provider.getBalance(provider.address);
      expect(providerBalanceAfter - providerBalanceBefore).to.equal(ethers.parseEther("25"));
    });

    it("should record the payment timestamp", async function () {
      const { contract, patient } = await loadFixture(createBillFixture);

      const tx = await contract.connect(patient).payBill(1, { value: ethers.parseEther("25") });
      const receipt = await tx.getBlock();

      const bill = await contract.getBill(1);
      expect(bill.paidAt).to.equal(receipt.timestamp);
    });

    it("should not allow the wrong patient to pay", async function () {
      const { contract, other } = await loadFixture(createBillFixture);

      await expect(
        contract.connect(other).payBill(1, { value: ethers.parseEther("25") })
      ).to.be.revertedWithCustomError(contract, "UnauthorizedPatient");
    });

    it("should revert if the payment amount is incorrect", async function () {
      const { contract, patient } = await loadFixture(createBillFixture);

      await expect(
        contract.connect(patient).payBill(1, { value: ethers.parseEther("20") })
      ).to.be.revertedWithCustomError(contract, "IncorrectPaymentAmount");

      await expect(
        contract.connect(patient).payBill(1, { value: ethers.parseEther("30") })
      ).to.be.revertedWithCustomError(contract, "IncorrectPaymentAmount");
    });

    it("should not allow paying a bill twice", async function () {
      const { contract, patient } = await loadFixture(createBillFixture);

      await contract.connect(patient).payBill(1, { value: ethers.parseEther("25") });

      await expect(
        contract.connect(patient).payBill(1, { value: ethers.parseEther("25") })
      ).to.be.revertedWithCustomError(contract, "BillNotPending");
    });

    it("should not allow paying a cancelled bill", async function () {
      const { contract, provider, patient } = await loadFixture(createBillFixture);

      await contract.connect(provider).cancelBill(1);

      await expect(
        contract.connect(patient).payBill(1, { value: ethers.parseEther("25") })
      ).to.be.revertedWithCustomError(contract, "BillNotPending");
    });

    it("should revert when paying a non-existent bill", async function () {
      const { contract, patient } = await loadFixture(createBillFixture);

      await expect(
        contract.connect(patient).payBill(999, { value: ethers.parseEther("25") })
      ).to.be.revertedWithCustomError(contract, "BillNotFound");
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // Bill lists
  // ─────────────────────────────────────────────────────────────────────

  describe("Bill lists", function () {
    it("should return all bill IDs for a provider", async function () {
      const { contract, provider, patient, FUTURE_DUE_DATE } = await loadFixture(deployFixture);

      await contract.connect(provider).registerProvider();

      await contract.connect(provider).createBill("PAT-001", patient.address, "Consultation", ethers.parseEther("10"), FUTURE_DUE_DATE);
      await contract.connect(provider).createBill("PAT-002", patient.address, "Lab Test", ethers.parseEther("20"), FUTURE_DUE_DATE);
      await contract.connect(provider).createBill("PAT-003", patient.address, "X-Ray", ethers.parseEther("30"), FUTURE_DUE_DATE);

      const providerBillIds = await contract.getProviderBills(provider.address);
      expect(providerBillIds.length).to.equal(3);
      expect(providerBillIds[0]).to.equal(1);
      expect(providerBillIds[1]).to.equal(2);
      expect(providerBillIds[2]).to.equal(3);
    });

    it("should return all bill IDs for a patient", async function () {
      const { contract, provider, patient, other, FUTURE_DUE_DATE } = await loadFixture(deployFixture);

      await contract.connect(provider).registerProvider();

      await contract.connect(provider).createBill("PAT-001", patient.address, "Consultation", ethers.parseEther("10"), FUTURE_DUE_DATE);
      await contract.connect(provider).createBill("PAT-002", other.address, "Lab Test", ethers.parseEther("20"), FUTURE_DUE_DATE);
      await contract.connect(provider).createBill("PAT-003", patient.address, "X-Ray", ethers.parseEther("30"), FUTURE_DUE_DATE);

      const patientBillIds = await contract.getPatientBills(patient.address);
      expect(patientBillIds.length).to.equal(2);
      expect(patientBillIds[0]).to.equal(1);
      expect(patientBillIds[1]).to.equal(3);

      const otherBillIds = await contract.getPatientBills(other.address);
      expect(otherBillIds.length).to.equal(1);
      expect(otherBillIds[0]).to.equal(2);
    });

    it("should return an empty array for a provider/patient with no bills", async function () {
      const { contract, other } = await loadFixture(deployFixture);

      const providerBillIds = await contract.getProviderBills(other.address);
      expect(providerBillIds.length).to.equal(0);

      const patientBillIds = await contract.getPatientBills(other.address);
      expect(patientBillIds.length).to.equal(0);
    });
  });
});
