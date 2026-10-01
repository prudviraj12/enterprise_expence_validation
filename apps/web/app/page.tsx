"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight, Bell, BrainCircuit, Building2, Check, ChevronDown, CircleDollarSign, FileCheck2,
  FileText, LayoutDashboard, LogOut, Menu, Plus, ReceiptText, Search,
  ScanLine, Settings, ShieldCheck, Sparkles, TrendingUp, Users, WalletCards, X,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Role = "employee" | "manager" | "finance" | "admin";
type Status = "Approved" | "In review" | "Needs info" | "Finance review" | "Returned" | "Rejected" | "Paid";
type Expense = { id: string; merchant: string; owner: string; employeeId: string; department: string; category: string; businessPurpose: string; date: string; amount: number; status: Status; receiptName: string; riskScore: number; policyStatus: string };
type User = { role: Role; name: string; email: string; password: string; label: string; initials: string; workspaceId: string; workspaceName: string };
type Workspace = { id: string; name: string; admin: User };

const users: User[] = [
  { role: "employee", name: "Riya Sharma", email: "employee@ledgerly.in", password: "Employee@123", label: "Employee", initials: "RS", workspaceId: "northstar", workspaceName: "Northstar Labs" },
  { role: "manager", name: "Arjun Mehta", email: "manager@ledgerly.in", password: "Manager@123", label: "Manager", initials: "AM", workspaceId: "northstar", workspaceName: "Northstar Labs" },
  { role: "finance", name: "Ananya Kapoor", email: "finance@ledgerly.in", password: "Finance@123", label: "Finance", initials: "AK", workspaceId: "northstar", workspaceName: "Northstar Labs" },
  { role: "admin", name: "Dev Malhotra", email: "admin@ledgerly.in", password: "Admin@123", label: "Admin", initials: "DM", workspaceId: "northstar", workspaceName: "Northstar Labs" },
];

const expenses: Expense[] = [
  { id: "EX-1048", merchant: "The Westin", owner: "Riya Sharma", employeeId: "EMP-021", department: "Sales", category: "Lodging", businessPurpose: "Customer workshop in Bengaluru", date: "28 Sep 2026", amount: 18450, status: "In review", receiptName: "westin-invoice.jpg", riskScore: 18, policyStatus: "Within policy" },
  { id: "EX-1047", merchant: "IndiGo", owner: "Kabir Rao", employeeId: "EMP-034", department: "Sales", category: "Travel", businessPurpose: "Client implementation visit", date: "27 Sep 2026", amount: 12890, status: "Finance review", receiptName: "indigo-ticket.pdf", riskScore: 12, policyStatus: "Within policy" },
  { id: "EX-1045", merchant: "Olive Bistro", owner: "Riya Sharma", employeeId: "EMP-021", department: "Sales", category: "Meals", businessPurpose: "Dinner with Acme procurement team", date: "25 Sep 2026", amount: 4280, status: "In review", receiptName: "olive-bistro.jpg", riskScore: 34, policyStatus: "Manager review required" },
  { id: "EX-1042", merchant: "Adobe", owner: "Neha Iyer", employeeId: "EMP-052", department: "Product", category: "Software", businessPurpose: "Design software subscription", date: "21 Sep 2026", amount: 1675, status: "Paid", receiptName: "adobe-invoice.pdf", riskScore: 4, policyStatus: "Within policy" },
  { id: "EX-1039", merchant: "Uber", owner: "Riya Sharma", employeeId: "EMP-021", department: "Sales", category: "Travel", businessPurpose: "Taxi to customer office", date: "18 Sep 2026", amount: 860, status: "Paid", receiptName: "uber-receipt.pdf", riskScore: 6, policyStatus: "Within policy" },
];

const nav: Record<Role, Array<{ label: string; icon: typeof LayoutDashboard; count?: number }>> = {
  employee: [
    { label: "Overview", icon: LayoutDashboard }, { label: "My expenses", icon: ReceiptText, count: 3 },
    { label: "Reimbursements", icon: WalletCards },
  ],
  manager: [
    { label: "Dashboard", icon: LayoutDashboard }, { label: "Pending approvals", icon: FileCheck2, count: 2 },
    { label: "Team expenses", icon: Users }, { label: "Approval history", icon: FileText },
    { label: "Team analytics", icon: CircleDollarSign }, { label: "Notifications", icon: Bell, count: 2 },
  ],
  finance: [
    { label: "Overview", icon: LayoutDashboard }, { label: "Verification", icon: ShieldCheck, count: 7 },
    { label: "Reimbursements", icon: WalletCards }, { label: "Reports", icon: FileText },
  ],
  admin: [
    { label: "Overview", icon: LayoutDashboard }, { label: "People", icon: Users },
    { label: "Policies", icon: ShieldCheck }, { label: "Departments", icon: Building2 },
    { label: "Settings", icon: Settings },
  ],
};

const statusStyle: Record<Status, string> = {
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-700", "In review": "border-blue-200 bg-blue-50 text-blue-700",
  "Needs info": "border-amber-200 bg-amber-50 text-amber-800", "Finance review": "border-violet-200 bg-violet-50 text-violet-700",
  Returned: "border-orange-200 bg-orange-50 text-orange-700", Rejected: "border-red-200 bg-red-50 text-red-700",
  Paid: "border-zinc-200 bg-zinc-100 text-zinc-700",
};
const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

function Brand({ company = "Expense operations" }: { company?: string }) {
  return <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-[#ff6746] text-white shadow-[0_8px_20px_rgba(255,103,70,.28)]"><ReceiptText className="size-5" /></div><div><p className="text-lg font-extrabold tracking-[-.04em]">Ledgerly</p><p className="text-xs text-[#7d8995]">{company}</p></div></div>;
}

function Landing({ onStart, onCreate }: { onStart: () => void; onCreate: () => void }) {
  const reduceMotion = useReducedMotion();
  const enter = (delay = 0) => ({ initial: { opacity: 0, y: reduceMotion ? 0 : 22 }, animate: { opacity: 1, y: 0 }, transition: { duration: reduceMotion ? 0 : .55, delay } });
  const roles = [
    ["Employee", "Submit expenses and track every reimbursement.", ReceiptText, "01"],
    ["Manager", "Confirm the business purpose for your team.", FileCheck2, "02"],
    ["Finance", "Validate receipts, policy, fraud, and payment.", WalletCards, "03"],
    ["Admin", "Control people, departments, and company rules.", Settings, "04"],
  ] as const;
  return <main className="min-h-screen overflow-hidden bg-[#f5f7f8] text-[#172532]">
    <nav className="relative z-20 mx-auto flex h-20 max-w-[1420px] items-center justify-between px-5 sm:px-8"><Brand /><div className="hidden items-center gap-8 text-sm font-semibold text-[#5f6d79] md:flex"><a href="#workflow" className="hover:text-[#172532]">Workflow</a><a href="#intelligence" className="hover:text-[#172532]">AI verification</a><a href="#roles" className="hover:text-[#172532]">Roles</a></div><div className="flex gap-2"><Button onClick={onCreate} className="rounded-xl bg-[#172532] px-4 text-white">Create workspace</Button><Button onClick={onStart} variant="outline" className="rounded-xl border-[#cfd7dd] bg-white px-5">Sign in <ArrowRight className="size-4" /></Button></div></nav>

    <section className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-[1420px] items-center gap-14 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[.92fr_1.08fr] lg:py-20">
      <div className="pointer-events-none absolute -left-40 top-10 size-[500px] rounded-full bg-[#ff6746]/[.07] blur-3xl" />
      <div className="relative z-10">
        <motion.div {...enter(0)} className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#ffb3a2] bg-[#fff3ef] px-3 py-1.5 text-xs font-bold text-[#d94f31]"><Sparkles className="size-3.5" /> AI-POWERED EXPENSE OPERATIONS</motion.div>
        <motion.h1 {...enter(.08)} className="max-w-3xl text-[clamp(3rem,6vw,5.8rem)] font-bold leading-[.96] tracking-[-.065em]">Every expense.<br /><span className="text-[#ff6746]">Clearly handled.</span></motion.h1>
        <motion.p {...enter(.16)} className="mt-7 max-w-xl text-lg leading-8 text-[#61707d]">Ledgerly moves claims from receipt to reimbursement with business approval, explainable AI verification, policy controls, and a complete audit trail.</motion.p>
        <motion.div {...enter(.24)} className="mt-9 flex flex-wrap gap-3"><Button onClick={onCreate} className="h-12 rounded-xl bg-[#172532] px-6 text-white shadow-[0_14px_35px_rgba(23,37,50,.2)] hover:bg-[#26394b]">Create your workspace <ArrowRight className="size-4" /></Button><Button onClick={onStart} variant="outline" className="h-12 rounded-xl border-[#d5dde2] bg-white px-6">Explore demo</Button></motion.div>
        <motion.div {...enter(.32)} className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-[#677582]">{["Duplicate detection", "Policy checks", "Role-based approvals"].map((item) => <span key={item} className="flex items-center gap-2"><Check className="size-4 text-emerald-600" />{item}</span>)}</motion.div>
      </div>

      <motion.div initial={{ opacity: 0, scale: reduceMotion ? 1 : .95, x: reduceMotion ? 0 : 30 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: reduceMotion ? 0 : .7, delay: .18 }} className="relative">
        <motion.div animate={reduceMotion ? undefined : { y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="relative rounded-[28px] border border-white/80 bg-white p-3 shadow-[0_35px_90px_rgba(25,39,52,.16)]"><div className="rounded-[21px] bg-[#eef2f3] p-4 sm:p-6"><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[#ff6746]" /><span className="size-2.5 rounded-full bg-[#f6bf50]" /><span className="size-2.5 rounded-full bg-[#62bd89]" /></div><span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#687582]">FINANCE OVERVIEW</span></div><div className="grid gap-3 sm:grid-cols-3">{[["Spend", "₹4.28L"], ["In review", "14"], ["Compliance", "94%"]].map(([label, value]) => <div key={label} className="rounded-xl bg-white p-4"><p className="text-xs text-[#84909b]">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>)}</div><div className="mt-3 grid gap-3 sm:grid-cols-[1.25fr_.75fr]"><div className="rounded-2xl bg-white p-5"><div className="mb-8 flex justify-between"><div><p className="font-bold">Monthly spend</p><p className="text-xs text-[#89949f]">Across all departments</p></div><TrendingUp className="size-5 text-emerald-600" /></div><div className="flex h-32 items-end gap-3">{[34, 52, 46, 70, 58, 88, 76].map((height, index) => <motion.div key={index} initial={{ height: 0 }} animate={{ height: `${height}%` }} transition={{ duration: reduceMotion ? 0 : .6, delay: .5 + index * .06 }} className="flex-1 rounded-t-md bg-[#26394b] last:bg-[#ff6746]" />)}</div></div><div className="rounded-2xl bg-[#172532] p-5 text-white"><BrainCircuit className="mb-6 text-[#ff8064]" /><p className="text-lg font-bold">AI review complete</p><p className="mt-2 text-xs leading-5 text-[#b8c3cb]">3 claims need attention. Every flag includes evidence and a recommended action.</p><div className="mt-5 rounded-lg bg-white/10 p-3 text-xs"><span className="text-[#b8c3cb]">Risk prevented</span><p className="mt-1 text-lg font-bold">₹18,940</p></div></div></div></div></motion.div>
        <motion.div animate={reduceMotion ? undefined : { y: [0, 7, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-7 -left-5 rounded-2xl border bg-white p-4 shadow-xl sm:-left-10"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><Check className="size-5" /></div><div><p className="text-xs text-[#89949f]">Manager approved</p><p className="text-sm font-bold">Sent to Finance</p></div></div></motion.div>
      </motion.div>
    </section>

    <section id="workflow" className="bg-[#172532] px-5 py-24 text-white sm:px-8"><div className="mx-auto max-w-[1240px]"><motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .4 }} className="max-w-2xl"><p className="text-xs font-bold tracking-[.14em] text-[#ff8064]">ONE CONTROLLED WORKFLOW</p><h2 className="mt-3 text-4xl font-bold tracking-[-.045em] sm:text-5xl">The right decision at every stage.</h2></motion.div><div className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-white/10 md:grid-cols-4">{roles.map(([title, description, Icon, number], index) => <motion.article key={title} initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: reduceMotion ? 0 : index * .08 }} whileHover={reduceMotion ? undefined : { y: -6 }} className="relative bg-[#1d2d3a] p-7"><span className="absolute right-5 top-4 text-5xl font-bold text-white/[.04]">{number}</span><div className="grid size-11 place-items-center rounded-xl bg-white/10 text-[#ff8b71]"><Icon className="size-5" /></div><h3 className="mt-8 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#aebbc5]">{description}</p>{index < 3 && <ArrowRight className="mt-6 size-4 text-white/30" />}</motion.article>)}</div></div></section>

    <section id="intelligence" className="mx-auto grid max-w-[1240px] gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:items-center"><motion.div initial={{ opacity: 0, x: reduceMotion ? 0 : -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}><div className="grid size-12 place-items-center rounded-2xl bg-[#fff0eb] text-[#df5638]"><ScanLine /></div><h2 className="mt-6 text-4xl font-bold tracking-[-.045em]">AI that explains what it found.</h2><p className="mt-5 text-lg leading-8 text-[#64727f]">Ledgerly checks receipt integrity, duplicate hashes, image quality, OCR completeness, and policy rules. Suspicious evidence goes to Finance with a confidence score and a clear next action.</p><div className="mt-7 space-y-3">{["Human review stays in control", "No automatic fraud accusations", "Every override enters the audit trail"].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl border bg-white p-4 text-sm font-semibold"><Check className="size-4 text-emerald-600" />{item}</div>)}</div></motion.div><motion.div initial={{ opacity: 0, x: reduceMotion ? 0 : 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-[28px] bg-[#fff0eb] p-5 sm:p-8"><div className="rounded-2xl border border-[#ffd2c7] bg-white p-5"><div className="flex items-center justify-between"><div><p className="font-bold">The Westin</p><p className="text-xs text-[#89949f]">Receipt EX-1048</p></div><Badge className="bg-red-50 text-red-700">Possible edit</Badge></div><div className="mt-6"><div className="mb-2 flex justify-between text-sm"><span>Risk confidence</span><b>78%</b></div><Progress value={78} className="h-2 [&_[data-slot=progress-indicator]]:bg-[#ff6746]" /></div><div className="mt-5 rounded-xl bg-[#f7f9fa] p-4 text-sm leading-6 text-[#586672]"><b>Reason:</b> JPEG compression differs around the total amount.<br /><b>Recommendation:</b> Compare with the card transaction and request the original file.</div></div></motion.div></section>

    <section id="roles" className="px-5 pb-24 sm:px-8"><motion.div initial={{ opacity: 0, scale: reduceMotion ? 1 : .98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-8 overflow-hidden rounded-[30px] bg-[#ff6746] p-8 text-white sm:p-12 lg:flex-row lg:items-center"><div><p className="text-sm font-bold text-white/75">READY TO START?</p><h2 className="mt-2 max-w-2xl text-4xl font-bold tracking-[-.045em]">Create a workspace for your own organization.</h2></div><Button onClick={onCreate} className="h-12 shrink-0 rounded-xl bg-white px-6 font-bold text-[#172532] hover:bg-[#f4f6f7]">Create workspace <ArrowRight className="size-4" /></Button></motion.div></section>

    <footer className="border-t bg-white px-5 py-7 sm:px-8"><div className="mx-auto flex max-w-[1240px] flex-col gap-3 text-sm text-[#71808d] sm:flex-row sm:items-center sm:justify-between"><Brand /><p>Receipt intelligence · Approval controls · Reimbursement tracking</p></div></footer>
  </main>;
}

function CreateWorkspace({ onCreated, onBack }: { onCreated: (workspace: Workspace) => void; onBack: () => void }) {
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (company.trim().length < 2 || name.trim().length < 2) { setError("Enter your organization and administrator name."); return; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError("Enter a valid administrator email address."); return; }
    if (password.length < 8) { setError("Use at least 8 characters for the password."); return; }
    const workspaceId = `${company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now()}`;
    const cleanName = name.trim();
    const admin: User = { role: "admin", name: cleanName, email: email.trim().toLowerCase(), password, label: "Admin", initials: cleanName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(), workspaceId, workspaceName: company.trim() };
    onCreated({ id: workspaceId, name: company.trim(), admin });
  }

  return <main className="grid min-h-screen place-items-center bg-[#f4f7f8] p-5 sm:p-10"><div className="w-full max-w-xl">
    <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#65737f]"><ArrowRight className="size-4 rotate-180" /> Back to home</button>
    <div className="rounded-[28px] border bg-white p-6 shadow-[0_24px_70px_rgba(20,35,48,.1)] sm:p-9"><Brand /><div className="mt-8"><p className="text-sm font-bold text-[#ff6746]">NEW WORKSPACE</p><h1 className="mt-2 text-3xl font-bold tracking-[-.04em]">Set up your organization</h1><p className="mt-2 text-[#71808d]">You will become the first administrator and can configure people, policies, and departments.</p></div>
      <form onSubmit={submit} className="mt-7 grid gap-4"><label className="grid gap-2 text-sm font-semibold">Organization name<Input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Acme Technologies" className="h-11 rounded-xl" /></label><label className="grid gap-2 text-sm font-semibold">Administrator name<Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" className="h-11 rounded-xl" /></label><label className="grid gap-2 text-sm font-semibold">Work email<Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@company.com" className="h-11 rounded-xl" /></label><label className="grid gap-2 text-sm font-semibold">Password<Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="h-11 rounded-xl" /></label>{error && <p className="text-sm font-medium text-red-600">{error}</p>}<Button type="submit" className="mt-2 h-12 rounded-xl bg-[#172532] font-semibold text-white">Create workspace <ArrowRight className="size-4" /></Button></form>
      <p className="mt-5 text-center text-xs leading-5 text-[#89949f]">This prototype stores your workspace in this browser.</p>
    </div>
  </div></main>;
}

function Login({ onLogin, onBack, onCreate, workspaces }: { onLogin: (user: User) => void; onBack: () => void; onCreate: () => void; workspaces: Workspace[] }) {
  const [selected, setSelected] = useState<User>(users[0]);
  const [email, setEmail] = useState(users[0].email);
  const [password, setPassword] = useState(users[0].password);
  const [error, setError] = useState("");

  function choose(user: User) { setSelected(user); setEmail(user.email); setPassword(user.password); setError(""); }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const accounts = [...users, ...workspaces.map((workspace) => workspace.admin)];
    const match = accounts.find((user) => user.email === email.trim().toLowerCase() && user.password === password);
    if (!match) { setError("Email or password is incorrect."); return; }
    onLogin(match);
  }

  return <main className="grid min-h-screen bg-[#f4f7f8] lg:grid-cols-[1.08fr_.92fr]">
    <section className="relative hidden overflow-hidden bg-[#172532] p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-28 -top-28 size-[420px] rounded-full border-[80px] border-white/[.035]" />
      <Brand />
      <div className="relative max-w-xl"><div className="mb-6 grid size-12 place-items-center rounded-2xl bg-[#ff6746]"><Sparkles className="size-5" /></div><h1 className="text-5xl font-bold leading-[1.06] tracking-[-.055em]">Expenses move faster when every detail is clear.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-[#b8c3cb]">Submit receipts, review policy checks, approve claims, and track reimbursements from one secure workspace.</p></div>
      <div className="flex gap-8 text-sm text-[#aeb9c2]"><span>AI receipt review</span><span>Policy controls</span><span>Complete audit trail</span></div>
    </section>
    <section className="flex items-center justify-center p-5 sm:p-10"><div className="w-full max-w-[470px]">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#65737f]"><ArrowRight className="size-4 rotate-180" /> Back to home</button><div className="mb-10 lg:hidden"><Brand /></div>
      <p className="text-sm font-bold text-[#ff6746]">WELCOME BACK</p><h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">Sign in to your workspace</h2><p className="mt-2 text-[#71808d]">Use your workspace credentials or choose a demo role.</p>
      {workspaces.length > 0 && <div className="mt-6"><p className="mb-2 text-xs font-bold uppercase tracking-[.12em] text-[#89949f]">Your workspaces</p><div className="grid gap-2">{workspaces.map((workspace) => <button key={workspace.id} onClick={() => choose(workspace.admin)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${selected.workspaceId === workspace.id ? "border-[#ff6746] bg-[#fff0eb]" : "bg-white hover:border-[#bac4cc]"}`}><div className="grid size-9 place-items-center rounded-lg bg-[#172532] text-xs font-bold text-white">{workspace.name.slice(0, 2).toUpperCase()}</div><div className="flex-1"><p className="text-sm font-bold">{workspace.name}</p><p className="text-xs text-[#71808d]">{workspace.admin.email}</p></div><Badge variant="outline">Admin</Badge></button>)}</div></div>}
      <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">{users.map((user) => <button key={user.role} onClick={() => choose(user)} className={`rounded-xl border px-2 py-3 text-sm font-semibold transition ${selected.role === user.role ? "border-[#ff6746] bg-[#fff0eb] text-[#d95235]" : "border-[#dfe5e9] bg-white text-[#687582] hover:border-[#bac4cc]"}`}>{user.label}</button>)}</div>
      <form onSubmit={submit} className="mt-6 rounded-2xl border border-[#e0e6e9] bg-white p-6 shadow-[0_20px_55px_rgba(20,35,48,.08)] sm:p-8">
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-[#f5f7f8] p-3"><div className="grid size-10 place-items-center rounded-full bg-[#172532] text-xs font-bold text-white">{selected.initials}</div><div><p className="font-semibold">{selected.name}</p><p className="text-xs text-[#7d8995]">{selected.label} demo account</p></div></div>
        <label className="grid gap-2 text-sm font-semibold">Email address<Input value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 rounded-xl" /></label>
        <label className="mt-4 grid gap-2 text-sm font-semibold">Password<Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 rounded-xl" /></label>
        {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
        <Button type="submit" className="mt-6 h-11 w-full rounded-xl bg-[#172532] font-semibold text-white hover:bg-[#26394b]">Sign in as {selected.label}</Button>
        <p className="mt-4 text-center text-xs text-[#89949f]">{selected.workspaceId === "northstar" ? "Demo credentials are filled automatically." : `Signing in to ${selected.workspaceName}.`}</p>
      </form>
      <Button onClick={onCreate} variant="outline" className="mt-4 h-11 w-full rounded-xl border-[#cfd7dd] bg-white"><Plus className="size-4" /> Create another workspace</Button>
    </div></section>
  </main>;
}

function ExpenseTable({ rows, action }: { rows: Expense[]; action?: "approve" | "verify" }) {
  const [completed, setCompleted] = useState<string[]>([]);
  return <div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-[#fafbfb]"><TableHead className="pl-6">Expense</TableHead><TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead>{action && <TableHead className="pr-6 text-right">Action</TableHead>}</TableRow></TableHeader><TableBody>{rows.map((expense) => { const status: Status = completed.includes(expense.id) ? "Approved" : expense.status; return <TableRow key={expense.id}><TableCell className="py-4 pl-6"><p className="font-semibold">{expense.merchant}</p><p className="text-xs text-[#89949f]">{expense.id} · {expense.category}</p></TableCell><TableCell>{expense.owner}</TableCell><TableCell>{expense.date}</TableCell><TableCell><Badge variant="outline" className={`rounded-full ${statusStyle[status]}`}>{status}</Badge></TableCell><TableCell className="text-right font-bold">{money(expense.amount)}</TableCell>{action && <TableCell className="pr-6 text-right"><Button size="sm" onClick={() => setCompleted((items) => [...items, expense.id])} disabled={status === "Approved"} className="rounded-lg bg-[#172532] text-white"><Check className="size-4" /> {status === "Approved" ? "Completed" : action === "approve" ? "Approve" : "Verify"}</Button></TableCell>}</TableRow>; })}</TableBody></Table></div>;
}

function NewExpense({ onSubmitted, storageKey }: { onSubmitted: (expense: Expense) => void; storageKey: string }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Meals");
  const [purpose, setPurpose] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<{ decision: string; detail: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function inspectReceipt(receipt: File) {
    setFile(receipt); setAnalysis(null); setAnalyzing(true);
    try {
      const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await receipt.arrayBuffer()))).map((byte) => byte.toString(16).padStart(2, "0")).join("");
      const previous = localStorage.getItem(`receipt:${digest}`);
      localStorage.setItem(`receipt:${digest}`, "seen");
      let qualityIssue = false;
      if (receipt.type.startsWith("image/")) {
        const image = await createImageBitmap(receipt);
        qualityIssue = image.width < 700 || image.height < 700;
        image.close();
      }
      if (previous) setAnalysis({ decision: "Duplicate detected", detail: "This exact receipt file was uploaded previously." });
      else if (qualityIssue) setAnalysis({ decision: "Needs review", detail: "Image resolution is too low for reliable OCR and fraud checks." });
      else setAnalysis({ decision: "Ready for review", detail: "File integrity and basic image-quality checks passed." });
    } catch { setAnalysis({ decision: "Could not analyze", detail: "Choose a valid JPG, PNG, or PDF receipt." }); }
    finally { setAnalyzing(false); }
  }

  function submitExpense() {
    const numericAmount = Number(amount);
    if (!merchant.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0 || !file) return;
    const expense: Expense = { id: `EX-${Date.now().toString().slice(-6)}`, merchant: merchant.trim(), owner: "Riya Sharma", employeeId: "EMP-021", department: "Sales", category, businessPurpose: purpose.trim(), date: "30 Sep 2026", amount: numericAmount, status: "In review", receiptName: file.name, riskScore: analysis?.decision === "Ready for review" ? 8 : 42, policyStatus: "Pending manager review" };
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as Expense[];
    localStorage.setItem(storageKey, JSON.stringify([expense, ...stored]));
    onSubmitted(expense);
    setSaved(true);
  }

  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="rounded-xl bg-[#ff6746] text-white hover:bg-[#e95a3c]"><Plus className="size-4" /> New expense</Button></DialogTrigger><DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>Submit an expense</DialogTitle><DialogDescription>Add the purchase details and receipt.</DialogDescription></DialogHeader>{saved ? <div className="grid place-items-center gap-3 py-10 text-center"><div className="grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check /></div><h3 className="font-bold">Expense submitted</h3><p className="text-sm text-[#71808d]">Your manager can now verify the business purpose. Finance receives it after approval.</p></div> : <div className="grid gap-4 py-4"><Input value={merchant} onChange={(event) => setMerchant(event.target.value)} placeholder="Merchant" /><Input value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="Business purpose" /><div className="grid grid-cols-2 gap-3"><Input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="Amount (INR)" /><select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-md border px-3"><option>Meals</option><option>Travel</option><option>Lodging</option></select></div><label className="grid min-h-24 cursor-pointer place-items-center rounded-xl border border-dashed border-[#bdc7cf] bg-[#f8fafb] p-4 text-center text-sm text-[#63717e] hover:border-[#ff6746]"><input type="file" accept="image/jpeg,image/png,application/pdf" className="sr-only" onChange={(event) => { const selected = event.target.files?.[0]; if (selected) void inspectReceipt(selected); }} /><span><ReceiptText className="mx-auto mb-2 size-5" />{file ? file.name : "Choose a JPG, PNG, or PDF receipt"}</span></label>{analyzing && <p className="text-sm text-[#71808d]">Analyzing receipt integrity…</p>}{analysis && <div className={`rounded-xl border p-3 text-sm ${analysis.decision === "Ready for review" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}><b>{analysis.decision}</b><p className="mt-1">{analysis.detail}</p></div>}</div>}<DialogFooter>{saved ? <Button onClick={() => { setOpen(false); setSaved(false); setFile(null); setAnalysis(null); setMerchant(""); setAmount(""); setPurpose(""); }}>Done</Button> : <Button onClick={submitExpense} disabled={!file || analyzing || !merchant.trim() || !purpose.trim() || !amount} className="bg-[#172532] text-white">Submit expense</Button>}</DialogFooter></DialogContent></Dialog>;
}

function Overview({ user, rows }: { user: User; rows: Expense[] }) {
  const roleCopy: Record<Role, { eyebrow: string; title: string; subtitle: string }> = {
    employee: { eyebrow: "MY EXPENSES", title: `Good morning, ${user.name.split(" ")[0]}`, subtitle: "Track your claims and reimbursement progress." },
    manager: { eyebrow: "TEAM SPENDING", title: "Three approvals need you", subtitle: "Review your team’s latest expense submissions." },
    finance: { eyebrow: "FINANCE OVERVIEW", title: "Seven claims need verification", subtitle: "Resolve policy flags and keep reimbursements moving." },
    admin: { eyebrow: "COMPANY OVERVIEW", title: "Everything is running smoothly", subtitle: "Monitor people, policies, and company-wide spend." },
  };
  const copy = roleCopy[user.role];
  return <><div className="mb-7"><p className="text-xs font-bold tracking-[.12em] text-[#ff6746]">{copy.eyebrow}</p><h1 className="mt-2 text-3xl font-bold tracking-[-.045em]">{copy.title}</h1><p className="mt-2 text-[#71808d]">{copy.subtitle}</p></div>
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      [user.role === "employee" ? "Claimed this month" : "Total spend", user.role === "employee" ? "₹23,590" : "₹4,28,650", CircleDollarSign],
      [user.role === "manager" ? "Pending approvals" : "In review", user.role === "manager" ? "3" : "14", FileCheck2],
      ["Reimbursed", "₹3,12,800", WalletCards], [user.role === "admin" ? "Active employees" : "Policy flags", user.role === "admin" ? "248" : "7", ShieldCheck],
    ].map(([label, value, Icon]) => <article key={String(label)} className="rounded-2xl border bg-white p-5"><div className="mb-5 grid size-10 place-items-center rounded-xl bg-[#f1f4f5]"><Icon className="size-5" /></div><p className="text-sm text-[#74818e]">{String(label)}</p><p className="mt-1 text-2xl font-bold tracking-[-.04em]">{String(value)}</p></article>)}</div>
    <div className="grid gap-6 xl:grid-cols-[1.5fr_.8fr]"><section className="overflow-hidden rounded-2xl border bg-white"><div className="flex items-center justify-between border-b p-6"><div><h2 className="font-bold">Recent activity</h2><p className="text-sm text-[#7d8995]">Latest claims in your workspace</p></div></div><ExpenseTable rows={user.role === "employee" ? rows.filter((item) => item.owner === user.name) : rows.slice(0, 5)} action={user.role === "manager" ? "approve" : user.role === "finance" ? "verify" : undefined} /></section>
      <aside className="rounded-2xl bg-[#172532] p-6 text-white"><Sparkles className="mb-5 text-[#ff8267]" /><h2 className="text-xl font-bold">94% policy compliant</h2><p className="mt-3 text-sm leading-6 text-[#b7c2cb]">AI checks found that most recent claims follow company policy. Three meal claims need attention.</p><div className="mt-6 rounded-xl bg-white/[.07] p-4"><div className="mb-2 flex justify-between text-sm"><span>Compliance</span><b>94%</b></div><Progress value={94} className="h-2 bg-white/10 [&_[data-slot=progress-indicator]]:bg-[#ff795b]" /></div></aside></div>
  </>;
}

function ListPage({ title, subtitle, user, allRows }: { title: string; subtitle: string; user: User; allRows: Expense[] }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => allRows.filter((item) => `${item.merchant} ${item.owner} ${item.id}`.toLowerCase().includes(query.toLowerCase()) && (user.role !== "employee" || item.owner === user.name)), [allRows, query, user]);
  return <><div className="mb-7"><h1 className="text-3xl font-bold tracking-[-.045em]">{title}</h1><p className="mt-2 text-[#71808d]">{subtitle}</p></div><section className="overflow-hidden rounded-2xl border bg-white"><div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between"><h2 className="font-bold">{rows.length} records</h2><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#89949f]" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="w-full pl-9 sm:w-64" />{query && <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="size-4" /></button>}</div></div><ExpenseTable rows={rows} action={title === "Approvals" ? "approve" : title === "Verification" ? "verify" : undefined} /></section></>;
}

function AIReviewPage({ submitted }: { submitted: Expense[] }) {
  const [resolved, setResolved] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const reviews = [
    ...submitted.map((item) => ({ id: item.id, merchant: item.merchant, employee: item.owner, risk: "New submission", score: 35, tone: "text-violet-700 bg-violet-50 border-violet-200", reason: "Employee submission received. Automated file checks completed and Finance review is pending.", action: `Validate the ${item.category.toLowerCase()} receipt and ${money(item.amount)} claimed amount.` })),
    { id: "EX-1048", merchant: "The Westin", employee: "Riya Sharma", risk: "Possible edit", score: 78, tone: "text-red-700 bg-red-50 border-red-200", reason: "JPEG compression differs around the total amount. Editing metadata is present.", action: "Compare with card transaction and request the original image." },
    { id: "EX-1045", merchant: "Olive Bistro", employee: "Riya Sharma", risk: "Possible duplicate", score: 64, tone: "text-amber-800 bg-amber-50 border-amber-200", reason: "Merchant, date, and amount match an earlier claim from the same employee.", action: "Check invoice number and the earlier EX-0994 submission." },
    { id: "EX-1036", merchant: "City Cabs", employee: "Kabir Rao", risk: "Low quality", score: 42, tone: "text-blue-700 bg-blue-50 border-blue-200", reason: "The receipt is blurred and the invoice number could not be read reliably.", action: "Request a clearer photo before reimbursement." },
  ];
  return <><div className="mb-7"><div className="mb-2 flex items-center gap-2 text-[#ff6746]"><Sparkles className="size-4" /><span className="text-xs font-bold tracking-[.12em]">AI RECEIPT VERIFICATION</span></div><h1 className="text-3xl font-bold tracking-[-.045em]">Review risk signals, not black boxes</h1><p className="mt-2 max-w-3xl text-[#71808d]">Every flag includes the evidence, confidence, and next best action. AI recommends; Finance makes the final decision.</p></div>
    <div className="mb-6 grid gap-4 sm:grid-cols-3">{[["Receipts scanned", "126", "This month"], ["Needs review", "7", "5.6% of receipts"], ["Duplicates blocked", "3", "₹18,940 protected"]].map(([label, value, detail]) => <article key={label} className="rounded-2xl border bg-white p-5"><p className="text-sm text-[#71808d]">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p><p className="mt-2 text-xs text-[#8b97a2]">{detail}</p></article>)}</div>
    <div className="space-y-4">{reviews.map((review) => <article key={review.id} className={`rounded-2xl border bg-white p-5 transition ${resolved.includes(review.id) ? "opacity-60" : ""}`}><div className="flex flex-col gap-5 lg:flex-row lg:items-center"><div className="flex min-w-0 flex-1 items-start gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#172532] text-white"><ReceiptText className="size-5" /></div><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{review.merchant}</h2><span className="text-xs text-[#8b97a2]">{review.id} · {review.employee}</span></div><Badge variant="outline" className={`mt-2 rounded-full ${review.tone}`}>{review.risk}</Badge><p className="mt-3 max-w-2xl text-sm leading-6 text-[#53616e]">{review.reason}</p><p className="mt-2 text-sm"><b>Recommended:</b> <span className="text-[#62707d]">{review.action}</span></p>{expanded === review.id && <div className="mt-3 rounded-lg border bg-[#f8fafb] p-3 text-xs leading-5 text-[#5d6b78]"><b>Signals checked:</b> file hash, image dimensions, OCR completeness, editing metadata, and JPEG compression consistency. The original receipt remains unchanged.</div>}</div></div><div className="w-full rounded-xl bg-[#f6f8f9] p-4 lg:w-52"><div className="mb-2 flex items-center justify-between text-sm"><span className="text-[#71808d]">Risk confidence</span><b>{review.score}%</b></div><Progress value={review.score} className="h-2 [&_[data-slot=progress-indicator]]:bg-[#ff6746]" /><div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => setExpanded(expanded === review.id ? null : review.id)} className="flex-1 rounded-lg">{expanded === review.id ? "Hide" : "Details"}</Button><Button size="sm" onClick={() => setResolved((items) => [...items, review.id])} disabled={resolved.includes(review.id)} className="flex-1 rounded-lg bg-[#172532] text-white">{resolved.includes(review.id) ? "Done" : "Resolve"}</Button></div></div></div></article>)}</div>
    <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900"><b>How fake-receipt detection works:</b> Ledgerly checks exact file hashes for duplicates, image sharpness and dimensions, editing-software metadata, inconsistent JPEG recompression, and missing OCR fields. These are risk signals for human review, not proof of fraud.</div>
  </>;
}

function ManagerWorkspace({ view, rows, onDecision }: { view: string; rows: Expense[]; onDecision: (id: string, status: Status) => void }) {
  const team = rows.filter((item) => ["Riya Sharma", "Kabir Rao"].includes(item.owner));
  const pending = team.filter((item) => ["In review", "Needs info", "Returned"].includes(item.status));
  const history = team.filter((item) => !["In review", "Needs info"].includes(item.status));
  const [selected, setSelected] = useState<Expense | null>(null);
  const [reason, setReason] = useState("Not business related");
  const [comment, setComment] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const teamSpend = team.reduce((sum, item) => sum + item.amount, 0);
  const budget = 175000;

  function decide(status: Status) {
    if (!selected || ((status === "Rejected" || status === "Returned") && !comment.trim())) return;
    onDecision(selected.id, status); setSelected(null); setComment(""); setShowReceipt(false);
  }

  const reviewDialog = <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) { setSelected(null); setShowReceipt(false); } }}><DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl"><DialogHeader><DialogTitle>Business approval</DialogTitle><DialogDescription>Confirm that this expense was necessary for the employee’s work.</DialogDescription></DialogHeader>{selected && <div className="space-y-5 py-2"><div className="grid gap-3 rounded-xl bg-[#f5f7f8] p-4 sm:grid-cols-2">{[["Employee", `${selected.owner} (${selected.employeeId})`], ["Department", selected.department], ["Category", selected.category], ["Amount", money(selected.amount)], ["Expense date", selected.date], ["Business purpose", selected.businessPurpose]].map(([label, value]) => <div key={label}><p className="text-xs font-semibold uppercase tracking-wide text-[#89949f]">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>)}</div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border p-4"><p className="text-xs text-[#89949f]">Policy status</p><p className="mt-1 text-sm font-bold">{selected.policyStatus}</p></div><div className="rounded-xl border p-4"><p className="text-xs text-[#89949f]">AI summary</p><p className="mt-1 text-sm font-bold">No blocking signal</p></div><div className="rounded-xl border p-4"><p className="text-xs text-[#89949f]">AI risk score</p><p className="mt-1 text-sm font-bold">{selected.riskScore}% · {selected.riskScore < 30 ? "Low" : "Review"}</p></div></div><div className="rounded-xl border p-4"><div className="flex items-center justify-between"><div><p className="font-semibold">Receipt</p><p className="text-sm text-[#71808d]">{selected.receiptName}</p></div><Button variant="outline" size="sm" onClick={() => setShowReceipt((value) => !value)}>{showReceipt ? "Hide receipt" : "View receipt"}</Button></div>{showReceipt && <div className="mt-4 grid h-36 place-items-center rounded-lg bg-[#f3f5f6] text-center text-sm text-[#71808d]"><span><ReceiptText className="mx-auto mb-2" />Receipt preview<br />{selected.receiptName}</span></div>}</div><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Reject reason<select value={reason} onChange={(event) => setReason(event.target.value)} className="h-10 rounded-lg border bg-white px-3 font-normal"><option>Not business related</option><option>Incorrect expense</option><option>Unauthorized travel</option><option>Budget exceeded</option><option>Other</option></select></label><label className="grid gap-2 text-sm font-semibold">Comment<textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Required for reject or return" className="min-h-20 rounded-lg border p-3 font-normal" /></label></div><p className="text-xs text-[#7d8995]">Finance validates receipt authenticity, duplicates, policy compliance, and reimbursement after your approval.</p></div>}<DialogFooter className="flex-wrap"><Button variant="outline" onClick={() => decide("Returned")} disabled={!comment.trim()} className="border-amber-300 text-amber-800">Request changes</Button><Button variant="outline" onClick={() => decide("Rejected")} disabled={!comment.trim()} className="border-red-300 text-red-700">Reject</Button><Button onClick={() => decide("Finance review")} className="bg-emerald-700 text-white hover:bg-emerald-800"><Check className="size-4" /> Approve business purpose</Button></DialogFooter></DialogContent></Dialog>;

  if (view === "Dashboard") return <>{reviewDialog}<div className="mb-7"><p className="text-xs font-bold tracking-[.12em] text-[#ff6746]">MANAGER DASHBOARD</p><h1 className="mt-2 text-3xl font-bold tracking-[-.045em]">Team approval workspace</h1><p className="mt-2 text-[#71808d]">Confirm business necessity and monitor Sales department spending.</p></div><div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Pending approvals", String(pending.length)], ["Approved today", "4"], ["Rejected today", "1"], ["Team spend", money(teamSpend)]].map(([label, value]) => <article key={label} className="rounded-2xl border bg-white p-5"><p className="text-sm text-[#71808d]">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></article>)}</div><div className="grid gap-6 xl:grid-cols-[1.35fr_.75fr]"><section className="rounded-2xl border bg-white p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold">Pending business approvals</h2><p className="text-sm text-[#7d8995]">Only employees who report to you</p></div></div><div className="space-y-2">{pending.map((item) => <button key={item.id} onClick={() => setSelected(item)} className="flex w-full items-center gap-3 rounded-xl border p-4 text-left hover:border-[#ff8c73] hover:bg-[#fffaf8]"><div className="grid size-10 place-items-center rounded-full bg-[#172532] text-xs font-bold text-white">{item.owner.split(" ").map((part) => part[0]).join("")}</div><div className="flex-1"><p className="font-semibold">{item.owner} · {item.merchant}</p><p className="text-sm text-[#71808d]">{item.businessPurpose}</p></div><b>{money(item.amount)}</b></button>)}</div></section><aside className="rounded-2xl bg-[#172532] p-6 text-white"><p className="text-sm text-[#b7c2cb]">Sales monthly budget</p><p className="mt-2 text-3xl font-bold">{money(teamSpend)}</p><p className="text-sm text-[#b7c2cb]">of {money(budget)}</p><Progress value={Math.min(100, teamSpend / budget * 100)} className="mt-5 h-2 bg-white/10 [&_[data-slot=progress-indicator]]:bg-[#ff795b]" /><p className="mt-3 text-xs text-[#b7c2cb]">{Math.round(teamSpend / budget * 100)}% used this month</p></aside></div></>;

  if (view === "Pending approvals") return <>{reviewDialog}<div className="mb-7"><h1 className="text-3xl font-bold tracking-[-.045em]">Pending approvals</h1><p className="mt-2 text-[#71808d]">Review the business purpose for claims from your direct reports.</p></div><section className="space-y-3">{pending.length ? pending.map((item) => <article key={item.id} className="flex flex-col gap-4 rounded-2xl border bg-white p-5 sm:flex-row sm:items-center"><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{item.merchant}</h2><Badge variant="outline">{item.category}</Badge></div><p className="mt-1 text-sm font-medium text-[#43515e]">{item.owner}</p><p className="mt-1 text-sm text-[#62707d]">{item.businessPurpose}</p><p className="mt-2 text-xs text-[#89949f]">{item.id} · {item.date} · {item.receiptName}</p></div><p className="text-xl font-bold">{money(item.amount)}</p><Button onClick={() => setSelected(item)} className="rounded-xl bg-[#172532] text-white">Review claim</Button></article>) : <div className="rounded-2xl border bg-white p-12 text-center text-[#71808d]">No claims are waiting for approval.</div>}</section></>;
  if (view === "Team expenses") return <><div className="mb-7"><h1 className="text-3xl font-bold tracking-[-.045em]">Team expenses</h1><p className="mt-2 text-[#71808d]">Expense history for Riya Sharma and Kabir Rao in Sales.</p></div><section className="overflow-hidden rounded-2xl border bg-white"><ExpenseTable rows={team} /></section></>;
  if (view === "Approval history") return <><div className="mb-7"><h1 className="text-3xl font-bold tracking-[-.045em]">Approval history</h1><p className="mt-2 text-[#71808d]">Approved, rejected, and returned claims from your team.</p></div><section className="overflow-hidden rounded-2xl border bg-white"><ExpenseTable rows={history} /></section></>;
  if (view === "Team analytics") return <><div className="mb-7"><h1 className="text-3xl font-bold tracking-[-.045em]">Team analytics</h1><p className="mt-2 text-[#71808d]">Sales spending trends and approval performance.</p></div><div className="grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border bg-white p-6"><h2 className="font-bold">Spend by category</h2><div className="mt-6 space-y-5">{["Travel", "Lodging", "Meals"].map((category) => { const value = team.filter((item) => item.category === category).reduce((sum, item) => sum + item.amount, 0); return <div key={category}><div className="mb-2 flex justify-between text-sm"><span>{category}</span><b>{money(value)}</b></div><Progress value={Math.min(100, value / Math.max(teamSpend, 1) * 100)} className="h-2 [&_[data-slot=progress-indicator]]:bg-[#ff6746]" /></div>; })}</div></section><section className="rounded-2xl border bg-white p-6"><h2 className="font-bold">Approval performance</h2><div className="mt-6 grid grid-cols-2 gap-4"><div className="rounded-xl bg-emerald-50 p-4"><p className="text-sm text-emerald-700">Approval rate</p><p className="mt-1 text-3xl font-bold text-emerald-900">82%</p></div><div className="rounded-xl bg-blue-50 p-4"><p className="text-sm text-blue-700">Average response</p><p className="mt-1 text-3xl font-bold text-blue-900">1.4d</p></div><div className="col-span-2 rounded-xl bg-[#f5f7f8] p-4"><p className="text-sm text-[#71808d]">Monthly team spend</p><p className="mt-1 text-2xl font-bold">{money(teamSpend)}</p></div></div></section></div></>;
  return <><div className="mb-7"><h1 className="text-3xl font-bold tracking-[-.045em]">Notifications</h1><p className="mt-2 text-[#71808d]">New claims, corrected submissions, and high-value alerts.</p></div><section className="space-y-3">{pending.slice(0, 3).map((item, index) => <article key={item.id} className="flex items-start gap-4 rounded-2xl border bg-white p-5"><div className="grid size-10 place-items-center rounded-full bg-[#fff0eb] text-[#d95235]"><Bell className="size-4" /></div><div><p className="font-semibold">{index === 0 ? "New expense submitted" : "Claim awaiting your approval"}</p><p className="mt-1 text-sm text-[#62707d]">{item.owner} submitted {money(item.amount)} for {item.businessPurpose.toLowerCase()}.</p><p className="mt-2 text-xs text-[#89949f]">{item.date}</p></div></article>)}</section></>;
}

function AdminPage({ title }: { title: string }) {
  const content: Record<string, Array<[string, string, string]>> = {
    People: [["Riya Sharma", "Employee · Sales", "Active"], ["Arjun Mehta", "Manager · Sales", "Active"], ["Ananya Kapoor", "Finance", "Active"], ["Neha Iyer", "Employee · Product", "Active"]],
    Policies: [["Meals limit", "₹1,500 per day", "Active"], ["Hotel limit", "₹12,000 per night", "Active"], ["Weekend spending", "Manager approval required", "Active"], ["Travel class", "Economy for domestic travel", "Active"]],
    Departments: [["Sales", "48 employees", "CC-101"], ["Product", "76 employees", "CC-202"], ["Operations", "54 employees", "CC-303"], ["Finance", "18 employees", "CC-404"]],
    Settings: [["Company profile", "Northstar Labs Pvt Ltd", "Configured"], ["Base currency", "Indian Rupee (INR)", "Configured"], ["Approval workflow", "Manager → Finance", "Active"], ["Email notifications", "SMTP delivery", "Enabled"]],
  };
  const [records, setRecords] = useState(content);
  const [editor, setEditor] = useState<{ index: number | null; name: string; detail: string; state: string; category?: string; ruleType?: string; limit?: string; currency?: string; scope?: string; email?: string; employeeId?: string; role?: string; department?: string; manager?: string; costCenter?: string; budget?: string; lead?: string; parentDepartment?: string; settingCategory?: string; effectiveDate?: string } | null>(null);
  const labels: Record<string, string> = { People: "user", Policies: "policy", Departments: "department", Settings: "setting" };
  const statusOptions: Record<string, string[]> = { People: ["Active", "Disabled", "Invited"], Policies: ["Active", "Draft", "Inactive"], Departments: ["Active", "Archived"], Settings: ["Configured", "Enabled", "Disabled"] };
  function emptyEditor() {
    return { index: null, name: "", detail: "", state: statusOptions[title][0], category: "Meals", ruleType: "Spending limit", limit: "", currency: "INR", scope: "Company-wide", email: "", employeeId: "", role: "Employee", department: "Sales", manager: "Arjun Mehta", costCenter: "", budget: "", lead: "", parentDepartment: "None", settingCategory: "Organization", effectiveDate: "" };
  }
  function saveRecord() {
    if (!editor?.name.trim() || !editor.detail.trim() || !editor.state.trim()) return;
    setRecords((current) => {
      const page = [...current[title]];
      const summaries: Record<string, string> = {
        People: `${editor.role} · ${editor.department}${editor.email ? ` · ${editor.email}` : ""}${editor.employeeId ? ` · ${editor.employeeId}` : ""}${editor.manager ? ` · Reports to ${editor.manager}` : ""} · ${editor.detail.trim()}`,
        Policies: `${editor.ruleType} · ${editor.category}${editor.limit ? ` · ${editor.currency} ${Number(editor.limit).toLocaleString("en-IN")}` : ""} · ${editor.scope} · ${editor.detail.trim()}`,
        Departments: `${editor.costCenter || "No cost centre"}${editor.budget ? ` · Monthly budget INR ${Number(editor.budget).toLocaleString("en-IN")}` : ""}${editor.lead ? ` · Lead: ${editor.lead}` : ""}${editor.parentDepartment !== "None" ? ` · Parent: ${editor.parentDepartment}` : ""} · ${editor.detail.trim()}`,
        Settings: `${editor.settingCategory}${editor.effectiveDate ? ` · Effective ${editor.effectiveDate}` : ""} · ${editor.detail.trim()}`,
      };
      const record: [string, string, string] = [editor.name.trim(), summaries[title], editor.state.trim()];
      if (editor.index === null) page.push(record); else page[editor.index] = record;
      return { ...current, [title]: page };
    });
    setEditor(null);
  }
  if (["People", "Policies", "Departments", "Settings"].includes(title)) return <>
    <Dialog open={Boolean(editor)} onOpenChange={(open) => { if (!open) setEditor(null); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editor?.index === null ? "Add" : "Edit"} {labels[title]}</DialogTitle>
          <DialogDescription>{title === "People" ? "Add identity, reporting, and access information for this person." : title === "Policies" ? "Define when this rule applies and how Finance should enforce it." : title === "Departments" ? "Define ownership, budget responsibility, and reporting structure." : "Explain what this setting controls and when it takes effect."}</DialogDescription>
        </DialogHeader>
        {editor && <div className="grid gap-4 py-3">
          <label className="grid gap-2 text-sm font-semibold">Name<Input aria-label="Record name" value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })} placeholder={title === "People" ? "Employee full name" : title === "Policies" ? "Domestic meals limit" : title === "Departments" ? "Department name" : "Setting name"} /></label>

          {title === "People" && <>
            <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Work email<Input aria-label="User email" type="email" value={editor.email ?? ""} onChange={(event) => setEditor({ ...editor, email: event.target.value })} placeholder="name@company.com" /></label><label className="grid gap-2 text-sm font-semibold">Employee ID<Input aria-label="Employee ID" value={editor.employeeId ?? ""} onChange={(event) => setEditor({ ...editor, employeeId: event.target.value })} placeholder="EMP-001" /></label></div>
            <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Access role<select aria-label="User role" value={editor.role} onChange={(event) => setEditor({ ...editor, role: event.target.value })} className="h-10 rounded-lg border bg-white px-3 font-normal"><option>Employee</option><option>Manager</option><option>Finance</option><option>Admin</option></select><span className="text-xs font-normal text-[#7d8995]">Controls which portal and actions this person can access.</span></label><label className="grid gap-2 text-sm font-semibold">Department<select aria-label="User department" value={editor.department} onChange={(event) => setEditor({ ...editor, department: event.target.value })} className="h-10 rounded-lg border bg-white px-3 font-normal"><option>Sales</option><option>Product</option><option>Operations</option><option>Finance</option></select><span className="text-xs font-normal text-[#7d8995]">Sets the employee’s budget and policy scope.</span></label></div>
            <label className="grid gap-2 text-sm font-semibold">Reporting manager<select aria-label="User manager" value={editor.manager} onChange={(event) => setEditor({ ...editor, manager: event.target.value })} className="h-10 rounded-lg border bg-white px-3 font-normal"><option>Arjun Mehta</option><option>Ananya Kapoor</option><option>Dev Malhotra</option><option>None</option></select></label>
          </>}

          {title === "Policies" && <>
            <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Category<select aria-label="Policy category" value={editor.category} onChange={(event) => setEditor({ ...editor, category: event.target.value })} className="h-10 rounded-lg border bg-white px-3 font-normal"><option>Meals</option><option>Travel</option><option>Lodging</option><option>Software</option><option>Supplies</option><option>Other</option></select></label><label className="grid gap-2 text-sm font-semibold">Rule type<select aria-label="Policy rule type" value={editor.ruleType} onChange={(event) => setEditor({ ...editor, ruleType: event.target.value })} className="h-10 rounded-lg border bg-white px-3 font-normal"><option>Spending limit</option><option>Receipt required</option><option>Pre-approval required</option><option>Weekend restriction</option></select></label></div>
            <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Limit amount<Input aria-label="Policy limit" type="number" min="0" value={editor.limit ?? ""} onChange={(event) => setEditor({ ...editor, limit: event.target.value })} placeholder="1500" /></label><label className="grid gap-2 text-sm font-semibold">Currency<select aria-label="Policy currency" value={editor.currency} onChange={(event) => setEditor({ ...editor, currency: event.target.value })} className="h-10 rounded-lg border bg-white px-3 font-normal"><option>INR</option><option>USD</option><option>EUR</option><option>GBP</option></select></label></div>
            <label className="grid gap-2 text-sm font-semibold">Applies to<select aria-label="Policy scope" value={editor.scope} onChange={(event) => setEditor({ ...editor, scope: event.target.value })} className="h-10 rounded-lg border bg-white px-3 font-normal"><option>Company-wide</option><option>Department</option><option>Employee level</option><option>Project</option></select></label>
          </>}

          {title === "Departments" && <>
            <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Cost centre<Input aria-label="Department cost center" value={editor.costCenter ?? ""} onChange={(event) => setEditor({ ...editor, costCenter: event.target.value })} placeholder="CC-500" /></label><label className="grid gap-2 text-sm font-semibold">Monthly budget (INR)<Input aria-label="Department budget" type="number" min="0" value={editor.budget ?? ""} onChange={(event) => setEditor({ ...editor, budget: event.target.value })} placeholder="500000" /></label></div>
            <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Department lead<Input aria-label="Department lead" value={editor.lead ?? ""} onChange={(event) => setEditor({ ...editor, lead: event.target.value })} placeholder="Lead’s full name" /></label><label className="grid gap-2 text-sm font-semibold">Parent department<select aria-label="Parent department" value={editor.parentDepartment} onChange={(event) => setEditor({ ...editor, parentDepartment: event.target.value })} className="h-10 rounded-lg border bg-white px-3 font-normal"><option>None</option><option>Sales</option><option>Product</option><option>Operations</option><option>Finance</option></select></label></div>
          </>}

          {title === "Settings" && <>
            <label className="grid gap-2 text-sm font-semibold">Setting category<select aria-label="Setting category" value={editor.settingCategory} onChange={(event) => setEditor({ ...editor, settingCategory: event.target.value })} className="h-10 rounded-lg border bg-white px-3 font-normal"><option>Organization</option><option>Currency</option><option>Approval workflow</option><option>Notifications</option><option>Security</option><option>Integrations</option></select><span className="text-xs font-normal text-[#7d8995]">Groups this option so administrators understand its impact.</span></label>
            <label className="grid gap-2 text-sm font-semibold">Effective date<Input aria-label="Setting effective date" type="date" value={editor.effectiveDate ?? ""} onChange={(event) => setEditor({ ...editor, effectiveDate: event.target.value })} /></label>
          </>}

          <label className="grid gap-2 text-sm font-semibold">{title === "People" ? "Responsibilities and notes" : title === "Policies" ? "Description and required evidence" : title === "Departments" ? "Purpose and responsibilities" : "Configuration value and explanation"}<textarea aria-label="Record details" value={editor.detail} onChange={(event) => setEditor({ ...editor, detail: event.target.value })} placeholder={title === "People" ? "Describe responsibilities, approval limits, or onboarding notes." : title === "Policies" ? "Explain the rule, exceptions, and documents employees must attach." : title === "Departments" ? "Explain what this department owns and which expenses it manages." : "Enter the configured value and explain how it affects the workspace."} className="min-h-24 rounded-lg border bg-white p-3 font-normal" /></label>
          <label className="grid gap-2 text-sm font-semibold">Status<select aria-label="Record status" value={editor.state} onChange={(event) => setEditor({ ...editor, state: event.target.value })} className="h-10 rounded-lg border bg-white px-3 font-normal">{statusOptions[title].map((status) => <option key={status}>{status}</option>)}</select><span className="text-xs font-normal text-[#7d8995]">{title === "People" ? "Disabled users cannot access the workspace." : title === "Policies" ? "Draft policies are visible to Admin but are not enforced." : title === "Departments" ? "Archived departments remain in historical reports." : "Disabled settings remain saved but do not apply."}</span></label>
        </div>}
        <DialogFooter><Button variant="outline" onClick={() => setEditor(null)}>Cancel</Button><Button onClick={saveRecord} disabled={!editor?.name.trim() || !editor.detail.trim() || !editor.state.trim()} className="bg-[#172532] text-white">Save changes</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <div className="mb-7 flex items-end justify-between"><div><h1 className="text-3xl font-bold tracking-[-.045em]">{title}</h1><p className="mt-2 text-[#71808d]">Manage {title.toLowerCase()} across the company.</p></div><Button onClick={() => setEditor(emptyEditor())} className="rounded-xl bg-[#172532] text-white"><Plus className="size-4" /> Add {labels[title]}</Button></div>
    <section className="rounded-2xl border bg-white p-2">{records[title].map(([name, detail, state], index) => <div key={`${name}-${index}`} className="flex items-center gap-4 border-b p-4 last:border-0"><div className="grid size-10 place-items-center rounded-xl bg-[#f0f3f5] font-bold text-[#566573]">{name.slice(0, 2).toUpperCase()}</div><div className="flex-1"><p className="font-semibold">{name}</p><p className="text-sm text-[#7d8995]">{detail}</p></div><Badge variant="outline" className={`rounded-full ${state === "Inactive" || state === "Disabled" || state === "Archived" ? "border-zinc-200 bg-zinc-100 text-zinc-700" : state === "Draft" || state === "Invited" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{state}</Badge><Button variant="ghost" size="sm" aria-label={`Edit ${name}`} onClick={() => setEditor({ ...emptyEditor(), index, name, detail, state })}>Edit</Button></div>)}</section>
  </>;
  return <><Dialog open={Boolean(editor)} onOpenChange={(open) => { if (!open) setEditor(null); }}><DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl"><DialogHeader><DialogTitle>{editor?.index === null ? "Add" : "Edit"} {labels[title]}</DialogTitle><DialogDescription>{title === "Policies" ? "Define when this rule applies and how Finance should enforce it." : "Update this workspace configuration."}</DialogDescription></DialogHeader>{editor && <div className="grid gap-4 py-3"><label className="grid gap-2 text-sm font-semibold">Name<Input aria-label="Record name" value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })} placeholder={title === "Policies" ? "Example: Domestic meals limit" : "Name"} /></label>{title === "Policies" && <><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Category<select aria-label="Policy category" value={editor.category} onChange={(event) => setEditor({ ...editor, category: event.target.value })} className="h-10 rounded-lg border bg-white px-3 font-normal"><option>Meals</option><option>Travel</option><option>Lodging</option><option>Software</option><option>Supplies</option><option>Other</option></select></label><label className="grid gap-2 text-sm font-semibold">Rule type<select aria-label="Policy rule type" value={editor.ruleType} onChange={(event) => setEditor({ ...editor, ruleType: event.target.value })} className="h-10 rounded-lg border bg-white px-3 font-normal"><option>Spending limit</option><option>Receipt required</option><option>Pre-approval required</option><option>Weekend restriction</option></select></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Limit amount<Input aria-label="Policy limit" type="number" min="0" value={editor.limit} onChange={(event) => setEditor({ ...editor, limit: event.target.value })} placeholder="1500" /></label><label className="grid gap-2 text-sm font-semibold">Currency<select aria-label="Policy currency" value={editor.currency} onChange={(event) => setEditor({ ...editor, currency: event.target.value })} className="h-10 rounded-lg border bg-white px-3 font-normal"><option>INR</option><option>USD</option><option>EUR</option><option>GBP</option></select></label></div><label className="grid gap-2 text-sm font-semibold">Applies to<select aria-label="Policy scope" value={editor.scope} onChange={(event) => setEditor({ ...editor, scope: event.target.value })} className="h-10 rounded-lg border bg-white px-3 font-normal"><option>Company-wide</option><option>Department</option><option>Employee level</option><option>Project</option></select></label></>}<label className="grid gap-2 text-sm font-semibold">{title === "Policies" ? "Description and required evidence" : "Details"}<textarea aria-label="Record details" value={editor.detail} onChange={(event) => setEditor({ ...editor, detail: event.target.value })} placeholder={title === "Policies" ? "Explain the rule, exceptions, and documents employees must attach." : "Details"} className="min-h-24 rounded-lg border bg-white p-3 font-normal" /></label><label className="grid gap-2 text-sm font-semibold">Status<select aria-label="Record status" value={editor.state} onChange={(event) => setEditor({ ...editor, state: event.target.value })} className="h-10 rounded-lg border bg-white px-3 font-normal">{statusOptions[title].map((status) => <option key={status}>{status}</option>)}</select></label></div>}<DialogFooter><Button variant="outline" onClick={() => setEditor(null)}>Cancel</Button><Button onClick={saveRecord} disabled={!editor?.name.trim() || !editor.detail.trim() || !editor.state.trim()} className="bg-[#172532] text-white">Save changes</Button></DialogFooter></DialogContent></Dialog>
    <div className="mb-7 flex items-end justify-between"><div><h1 className="text-3xl font-bold tracking-[-.045em]">{title}</h1><p className="mt-2 text-[#71808d]">Manage {title.toLowerCase()} across the company.</p></div><Button onClick={() => setEditor(emptyEditor())} className="rounded-xl bg-[#172532] text-white"><Plus className="size-4" /> Add {labels[title]}</Button></div><section className="rounded-2xl border bg-white p-2">{records[title].map(([name, detail, state], index) => <div key={`${name}-${index}`} className="flex items-center gap-4 border-b p-4 last:border-0"><div className="grid size-10 place-items-center rounded-xl bg-[#f0f3f5] font-bold text-[#566573]">{name.slice(0, 2).toUpperCase()}</div><div className="flex-1"><p className="font-semibold">{name}</p><p className="text-sm text-[#7d8995]">{detail}</p></div><Badge variant="outline" className={`rounded-full ${state === "Inactive" || state === "Disabled" || state === "Archived" ? "border-zinc-200 bg-zinc-100 text-zinc-700" : state === "Draft" || state === "Invited" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{state}</Badge><Button variant="ghost" size="sm" aria-label={`Edit ${name}`} onClick={() => setEditor({ index, name, detail, state, category: "Meals", ruleType: "Spending limit", limit: "", currency: "INR", scope: "Company-wide" })}>Edit</Button></div>)}</section></>;
}

function App({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [view, setView] = useState(user.role === "manager" ? "Dashboard" : "Overview");
  const storageKey = user.workspaceId === "northstar" ? "ledgerly:submitted-expenses" : `ledgerly:submitted-expenses:${user.workspaceId}`;
  const [submitted, setSubmitted] = useState<Expense[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as Partial<Expense>[];
      return stored.map((item) => ({ id: item.id ?? `EX-${Date.now()}`, merchant: item.merchant ?? "Unknown merchant", owner: item.owner ?? "Riya Sharma", employeeId: item.employeeId ?? "EMP-021", department: item.department ?? "Sales", category: item.category ?? "Other", businessPurpose: item.businessPurpose ?? "Business purpose not provided", date: item.date ?? "30 Sep 2026", amount: item.amount ?? 0, status: item.status ?? "In review", receiptName: item.receiptName ?? "receipt attached", riskScore: item.riskScore ?? 15, policyStatus: item.policyStatus ?? "Pending manager review" }));
    } catch {
      return [];
    }
  });
  const [sampleRows, setSampleRows] = useState(user.workspaceId === "northstar" ? expenses : []);
  const allRows = useMemo(() => [...submitted, ...sampleRows], [submitted, sampleRows]);
  function updateClaim(id: string, status: Status) {
    setSubmitted((items) => {
      const updated = items.map((item) => item.id === id ? { ...item, status, policyStatus: status === "Finance review" ? "Manager approved" : item.policyStatus } : item);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
    setSampleRows((items) => items.map((item) => item.id === id ? { ...item, status } : item));
  }
  const titles: Record<string, string> = { "My expenses": "Your submitted claims and their current status.", "Team expenses": "All expenses submitted by your direct reports.", Approvals: "Review and decide on claims awaiting manager approval.", Verification: "Validate claims, AI findings, and policy exceptions.", Reimbursements: "Track approved claims through payment.", Reports: "Review monthly, quarterly, and yearly spending.", };
  return <SidebarProvider className="min-h-screen bg-[#f4f7f8] text-[#172532]"><Sidebar collapsible="icon" className="border-r-0 bg-white"><SidebarHeader className="border-b p-5"><Brand company={user.workspaceName} /></SidebarHeader><SidebarContent className="px-3 py-5"><SidebarGroup><SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-[.12em] text-[#9aa4af]">{user.label} workspace</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{nav[user.role].map((item) => <SidebarMenuItem key={item.label}><SidebarMenuButton isActive={view === item.label} onClick={() => setView(item.label)} tooltip={item.label} className="h-11 rounded-xl px-3 data-[active=true]:bg-[#fff0eb] data-[active=true]:text-[#d95235]"><item.icon /><span>{item.label}</span>{item.count && <span className="ml-auto rounded-full bg-[#eef1f3] px-2 text-xs">{item.count}</span>}</SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup></SidebarContent><SidebarFooter className="border-t p-3"><div className="mb-2 flex items-center gap-3 rounded-xl p-2"><div className="grid size-9 place-items-center rounded-full bg-[#172532] text-xs font-bold text-white">{user.initials}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user.name}</p><p className="text-xs text-[#89949f]">{user.label}</p></div><ChevronDown className="size-4" /></div><SidebarMenuButton onClick={onLogout} className="h-10 rounded-xl text-[#687582]"><LogOut /><span>Sign out</span></SidebarMenuButton></SidebarFooter></Sidebar>
    <SidebarInset className="bg-[#f4f7f8]"><header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b bg-white/90 px-4 backdrop-blur sm:px-8"><div className="flex items-center gap-3"><SidebarTrigger><Menu /></SidebarTrigger><div><p className="text-sm font-semibold">Wednesday, 30 September</p><p className="hidden text-xs text-[#89949f] sm:block">{user.workspaceName} · {user.label}</p></div></div><div className="flex items-center gap-2"><Button variant="ghost" size="icon" className="relative rounded-xl"><Bell className="size-5" /><span className="absolute right-2 top-2 size-2 rounded-full bg-[#ff6746]" /></Button>{user.role === "employee" && <NewExpense storageKey={storageKey} onSubmitted={(expense) => setSubmitted((items) => [expense, ...items])} />}</div></header>
      <main className="mx-auto w-full max-w-[1460px] p-4 sm:p-8 lg:p-9">{user.role === "manager" ? <ManagerWorkspace view={view} rows={allRows} onDecision={updateClaim} /> : view === "Overview" ? <Overview user={user} rows={allRows} /> : view === "Verification" ? <AIReviewPage submitted={allRows.filter((item) => item.status === "Finance review")} /> : user.role === "admin" ? <AdminPage title={view} /> : <ListPage title={view} subtitle={titles[view] ?? "Review records and activity."} user={user} allRows={allRows} />}</main>
    </SidebarInset></SidebarProvider>;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<"landing" | "login" | "create">("landing");
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("ledgerly:workspaces") ?? "[]") as Workspace[]; }
    catch { return []; }
  });
  function createWorkspace(workspace: Workspace) {
    const updated = [...workspaces.filter((item) => item.admin.email !== workspace.admin.email), workspace];
    localStorage.setItem("ledgerly:workspaces", JSON.stringify(updated));
    setWorkspaces(updated);
    setUser(workspace.admin);
  }
  if (user) return <App user={user} onLogout={() => { setUser(null); setScreen("login"); }} />;
  if (screen === "landing") return <Landing onStart={() => setScreen("login")} onCreate={() => setScreen("create")} />;
  if (screen === "create") return <CreateWorkspace onCreated={createWorkspace} onBack={() => setScreen("landing")} />;
  return <Login onLogin={setUser} onBack={() => setScreen("landing")} onCreate={() => setScreen("create")} workspaces={workspaces} />;
}
