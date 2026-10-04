import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { api } = vi.hoisted(() => ({ api: { restoreSession: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn(), claims: vi.fn(), createClaim: vi.fn(), uploadReceipt: vi.fn(), managerDecision: vi.fn(), financeDecision: vi.fn(), recordPayment: vi.fn() } }));
vi.mock("@/lib/api", () => ({ api }));
import Home from "@/app/page";

const employee = { id: "user-1", name: "Riya Sharma", email: "riya@example.test", roles: ["EMPLOYEE"] as const };
const manager = { id: "user-2", name: "Arjun Mehta", email: "arjun@example.test", roles: ["MANAGER"] as const };
const claim = { id: "claim-1", title: "Client dinner", businessPurpose: "Customer meeting", currency: "INR", totalAmount: 900, status: "MANAGER_REVIEW", createdAt: "2026-10-01T00:00:00.000Z", employee: { id: "user-1", name: "Riya Sharma", email: "riya@example.test" }, items: [{ id: "item-1", category: "Meals", merchant: "Cafe", amount: 900, expenseDate: "2026-10-01T00:00:00.000Z", receipts: [] }] };

describe("Ledgerly API workspace", () => {
  beforeEach(() => { vi.resetAllMocks(); api.restoreSession.mockResolvedValue(null); api.claims.mockResolvedValue([]); api.logout.mockResolvedValue(undefined); });

  it("signs in through the API and loads claims", async () => {
    const user = userEvent.setup(); api.login.mockResolvedValue(employee);
    render(<Home />); await screen.findByRole("heading", { name: "Sign in" });
    await user.type(screen.getByLabelText("Email"), employee.email); await user.type(screen.getByLabelText("Password"), "Employee@123"); await user.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByText("Claims and reimbursements"); expect(api.login).toHaveBeenCalledWith(employee.email, "Employee@123"); expect(api.claims).toHaveBeenCalled();
  });

  it("submits a claim and optional receipt through the API", async () => {
    const user = userEvent.setup(); api.restoreSession.mockResolvedValue(employee); api.createClaim.mockResolvedValue({ ...claim, items: [{ ...claim.items[0] }] }); api.uploadReceipt.mockResolvedValue({ id: "receipt-1", fileName: "receipt.png" });
    render(<Home />); await screen.findByText("Claims and reimbursements"); await user.click(screen.getByRole("button", { name: /new expense/i }));
    await user.type(screen.getByPlaceholderText("Merchant"), "Cafe"); await user.type(screen.getByPlaceholderText("Business purpose"), "Customer meeting"); await user.type(screen.getByPlaceholderText("Amount (INR)"), "900");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement; await user.upload(input, new File(["receipt"], "receipt.png", { type: "image/png" })); await user.click(screen.getByRole("button", { name: "Submit expense" }));
    await waitFor(() => expect(api.createClaim).toHaveBeenCalled()); expect(api.uploadReceipt).toHaveBeenCalledWith("item-1", expect.any(File));
  });

  it("shows manager approvals only for manager-review claims", async () => {
    const user = userEvent.setup(); api.restoreSession.mockResolvedValue(manager); api.claims.mockResolvedValue([claim]); api.managerDecision.mockResolvedValue({ ...claim, status: "FINANCE_REVIEW" });
    render(<Home />); await screen.findByText("Client dinner"); await user.click(screen.getByRole("button", { name: "Approve" })); await waitFor(() => expect(api.managerDecision).toHaveBeenCalledWith("claim-1", "approve"));
  });
});
