import { prisma } from "../db.js";

export type PolicyViolation = {
  policyId: string;
  policyName: string;
  reason: string;
  recommendation: string;
};

export async function evaluatePolicies(input: {
  departmentId?: string | null;
  employeeLevel?: string | null;
  items: Array<{ category: string; amount: number; currency: string }>;
}): Promise<PolicyViolation[]> {
  const policies = await prisma.policy.findMany({ where: { active: true } });
  const violations: PolicyViolation[] = [];

  for (const policy of policies) {
    if (policy.scope === "DEPARTMENT" && policy.departmentId !== input.departmentId) continue;
    if (policy.scope === "EMPLOYEE_LEVEL" && policy.employeeLevel !== input.employeeLevel) continue;
    const parameters = policy.parameters as Record<string, unknown>;
    const maxAmount = Number(parameters.maxAmount);
    if (!Number.isFinite(maxAmount)) continue;

    for (const item of input.items) {
      if (typeof parameters.category === "string" && parameters.category.toLowerCase() !== item.category.toLowerCase()) continue;
      if (typeof parameters.currency === "string" && parameters.currency !== item.currency) continue;
      if (item.amount > maxAmount) {
        violations.push({
          policyId: policy.id,
          policyName: policy.name,
          reason: `${item.category} expense of ${item.amount.toFixed(2)} ${item.currency} exceeds the ${maxAmount.toFixed(2)} limit.`,
          recommendation: `Reduce the claimed amount to ${maxAmount.toFixed(2)} ${item.currency} or attach documented pre-approval.`
        });
      }
    }
  }
  return violations;
}