import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

async function openLogin(user: ReturnType<typeof userEvent.setup>) {
  render(<Home />);
  expect(screen.getByRole("heading", { name: /Every expense/i })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Explore the workspace/i }));
  expect(screen.getByRole("heading", { name: /Sign in to your workspace/i })).toBeInTheDocument();
}

async function signIn(user: ReturnType<typeof userEvent.setup>, role: "Employee" | "Manager" | "Finance" | "Admin") {
  await user.click(screen.getByRole("button", { name: role, exact: true }));
  await user.click(screen.getByRole("button", { name: `Sign in as ${role}` }));
}

describe("Ledgerly modules", () => {
  beforeEach(() => localStorage.clear());

  it("opens the landing page and all role logins", async () => {
    const user = userEvent.setup();
    await openLogin(user);
    for (const role of ["Employee", "Manager", "Finance", "Admin"] as const) {
      await user.click(screen.getByRole("button", { name: role, exact: true }));
      expect(screen.getByRole("button", { name: `Sign in as ${role}` })).toBeEnabled();
    }
  });

  it("exposes every manager module", async () => {
    const user = userEvent.setup();
    await openLogin(user);
    await signIn(user, "Manager");
    const modules = ["Dashboard", "Pending approvals", "Team expenses", "Approval history", "Team analytics", "Notifications"];
    for (const moduleName of modules) {
      await user.click(screen.getByRole("button", { name: new RegExp(moduleName, "i") }));
      expect(screen.getByRole("heading", { name: new RegExp(moduleName === "Dashboard" ? "Team approval workspace" : moduleName, "i") })).toBeInTheDocument();
    }
  });

  it("persists an employee claim through manager approval into Finance", async () => {
    const user = userEvent.setup();
    await openLogin(user);
    await signIn(user, "Employee");
    await user.click(screen.getByRole("button", { name: /New expense/i }));
    await user.type(screen.getByPlaceholderText("Merchant"), "Test Taxi");
    await user.type(screen.getByPlaceholderText("Business purpose"), "Customer meeting");
    await user.type(screen.getByPlaceholderText("Amount (INR)"), "900");
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, new File(["receipt"], "taxi.png", { type: "image/png" }));
    await waitFor(() => expect(screen.getByText("Ready for review")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Submit expense" }));
    expect(screen.getByText("Expense submitted")).toBeInTheDocument();
    expect(localStorage.getItem("ledgerly:submitted-expenses")).toContain("Test Taxi");
    await user.click(screen.getByRole("button", { name: "Done" }));
    await user.click(screen.getByRole("button", { name: /Sign out/i }));

    await signIn(user, "Manager");
    await user.click(screen.getByRole("button", { name: /Pending approvals/i }));
    const submittedClaim = await screen.findByText(/Test Taxi/, {}, { timeout: 5000 });
    const claim = submittedClaim.closest("article");
    expect(claim).not.toBeNull();
    await user.click(within(claim!).getByRole("button", { name: "Review claim" }));
    await user.click(screen.getByRole("button", { name: /Approve business purpose/i }));
    await user.click(screen.getByRole("button", { name: /Sign out/i }));

    await signIn(user, "Finance");
    await user.click(screen.getByRole("button", { name: /Verification/i }));
    const financeClaim = screen.getByText("Test Taxi").closest("article");
    expect(financeClaim).not.toBeNull();
    expect(within(financeClaim!).getByText("New submission")).toBeInTheDocument();
  });

  it("opens every Finance and Admin module", async () => {
    const user = userEvent.setup();
    await openLogin(user);
    await signIn(user, "Finance");
    for (const moduleName of ["Overview", "Verification", "Reimbursements", "Reports"]) {
      await user.click(screen.getByRole("button", { name: new RegExp(moduleName, "i") }));
    }
    await user.click(screen.getByRole("button", { name: /Sign out/i }));
    await signIn(user, "Admin");
    for (const moduleName of ["Overview", "People", "Policies", "Departments", "Settings"]) {
      await user.click(screen.getByRole("button", { name: new RegExp(moduleName, "i") }));
      expect(screen.getByRole("heading", { name: new RegExp(moduleName === "Overview" ? "Everything is running smoothly" : moduleName, "i") })).toBeInTheDocument();
    }
  });
});
