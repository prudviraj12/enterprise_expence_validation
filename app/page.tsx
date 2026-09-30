"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell, Building2, Check, ChevronDown, CircleDollarSign, FileCheck2,
  FileText, LayoutDashboard, LogOut, Menu, Plus, ReceiptText, Search,
  Settings, ShieldCheck, Sparkles, Users, WalletCards, X,
} from "lucide-react";
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
type User = { role: Role; name: string; email: string; password: string; label: string; initials: string };

const users: User[] = [
  { role: "employee", name: "Riya Sharma", email: "employee@ledgerly.in", password: "Employee@123", label: "Employee", initials: "RS" },
  { role: "manager", name: "Arjun Mehta", email: "manager@ledgerly.in", password: "Manager@123", label: "Manager", initials: "AM" },
  { role: "finance", name: "Ananya Kapoor", email: "finance@ledgerly.in", password: "Finance@123", label: "Finance", initials: "AK" },
  { role: "admin", name: "Dev Malhotra", email: "admin@ledgerly.in", password: "Admin@123", label: "Admin", initials: "DM" },
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

function Brand() {
  return <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-[#ff6746] text-white shadow-[0_8px_20px_rgba(255,103,70,.28)]"><ReceiptText className="size-5" /></div><div><p className="text-lg font-extrabold tracking-[-.04em]">Ledgerly</p><p className="text-xs text-[#7d8995]">Northstar Labs</p></div></div>;
}

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [selected, setSelected] = useState<User>(users[0]);
  const [email, setEmail] = useState(users[0].email);
  const [password, setPassword] = useState(users[0].password);
  const [error, setError] = useState("");

  function choose(user: User) { setSelected(user); setEmail(user.email); setPassword(user.password); setError(""); }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const match = users.find((user) => user.email === email.trim().toLowerCase() && user.password === password);
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
      <div className="mb-10 lg:hidden"><Brand /></div>
      <p className="text-sm font-bold text-[#ff6746]">WELCOME BACK</p><h2 className="mt-2 text-3xl font-bold tracking-[-.04em]">Sign in to your workspace</h2><p className="mt-2 text-[#71808d]">Choose a demo role to explore its complete experience.</p>
      <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">{users.map((user) => <button key={user.role} onClick={() => choose(user)} className={`rounded-xl border px-2 py-3 text-sm font-semibold transition ${selected.role === user.role ? "border-[#ff6746] bg-[#fff0eb] text-[#d95235]" : "border-[#dfe5e9] bg-white text-[#687582] hover:border-[#bac4cc]"}`}>{user.label}</button>)}</div>
      <form onSubmit={submit} className="mt-6 rounded-2xl border border-[#e0e6e9] bg-white p-6 shadow-[0_20px_55px_rgba(20,35,48,.08)] sm:p-8">
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-[#f5f7f8] p-3"><div className="grid size-10 place-items-center rounded-full bg-[#172532] text-xs font-bold text-white">{selected.initials}</div><div><p className="font-semibold">{selected.name}</p><p className="text-xs text-[#7d8995]">{selected.label} demo account</p></div></div>
        <label className="grid gap-2 text-sm font-semibold">Email address<Input value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 rounded-xl" /></label>
        <label className="mt-4 grid gap-2 text-sm font-semibold">Password<Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 rounded-xl" /></label>
        {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
        <Button type="submit" className="mt-6 h-11 w-full rounded-xl bg-[#172532] font-semibold text-white hover:bg-[#26394b]">Sign in as {selected.label}</Button>
        <p className="mt-4 text-center text-xs text-[#89949f]">Demo credentials are filled automatically.</p>
      </form>
    </div></section>
  </main>;
}

function ExpenseTable({ rows, action }: { rows: Expense[]; action?: "approve" | "verify" }) {
  const [records, setRecords] = useState(rows);
  useEffect(() => setRecords(rows), [rows]);
  function complete(id: string) { setRecords((items) => items.map((item) => item.id === id ? { ...item, status: "Approved" } : item)); }
  return <div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-[#fafbfb]"><TableHead className="pl-6">Expense</TableHead><TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead>{action && <TableHead className="pr-6 text-right">Action</TableHead>}</TableRow></TableHeader><TableBody>{records.map((expense) => <TableRow key={expense.id}><TableCell className="py-4 pl-6"><p className="font-semibold">{expense.merchant}</p><p className="text-xs text-[#89949f]">{expense.id} · {expense.category}</p></TableCell><TableCell>{expense.owner}</TableCell><TableCell>{expense.date}</TableCell><TableCell><Badge variant="outline" className={`rounded-full ${statusStyle[expense.status]}`}>{expense.status}</Badge></TableCell><TableCell className="text-right font-bold">{money(expense.amount)}</TableCell>{action && <TableCell className="pr-6 text-right"><Button size="sm" onClick={() => complete(expense.id)} disabled={expense.status === "Approved"} className="rounded-lg bg-[#172532] text-white"><Check className="size-4" /> {expense.status === "Approved" ? "Completed" : action === "approve" ? "Approve" : "Verify"}</Button></TableCell>}</TableRow>)}</TableBody></Table></div>;
}

function NewExpense({ onSubmitted }: { onSubmitted: (expense: Expense) => void }) {
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
    const stored = JSON.parse(localStorage.getItem("ledgerly:submitted-expenses") ?? "[]") as Expense[];
    localStorage.setItem("ledgerly:submitted-expenses", JSON.stringify([expense, ...stored]));
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

  if (view === "Pending approvals") return <>{reviewDialog}<div className="mb-7"><h1 className="text-3xl font-bold tracking-[-.045em]">Pending approvals</h1><p className="mt-2 text-[#71808d]">Review the business purpose for claims from your direct reports.</p></div><section className="space-y-3">{pending.length ? pending.map((item) => <article key={item.id} className="flex flex-col gap-4 rounded-2xl border bg-white p-5 sm:flex-row sm:items-center"><div className="flex-1"><div className="flex items-center gap-2"><h2 className="font-bold">{item.owner}</h2><Badge variant="outline">{item.category}</Badge></div><p className="mt-1 text-sm text-[#62707d]">{item.businessPurpose}</p><p className="mt-2 text-xs text-[#89949f]">{item.id} · {item.date} · {item.receiptName}</p></div><p className="text-xl font-bold">{money(item.amount)}</p><Button onClick={() => setSelected(item)} className="rounded-xl bg-[#172532] text-white">Review claim</Button></article>) : <div className="rounded-2xl border bg-white p-12 text-center text-[#71808d]">No claims are waiting for approval.</div>}</section></>;
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
  return <><div className="mb-7 flex items-end justify-between"><div><h1 className="text-3xl font-bold tracking-[-.045em]">{title}</h1><p className="mt-2 text-[#71808d]">Manage {title.toLowerCase()} across the company.</p></div><Button className="rounded-xl bg-[#172532] text-white"><Plus className="size-4" /> Add {title === "People" ? "user" : title.slice(0, -1).toLowerCase()}</Button></div><section className="rounded-2xl border bg-white p-2">{content[title].map(([name, detail, state]) => <div key={name} className="flex items-center gap-4 border-b p-4 last:border-0"><div className="grid size-10 place-items-center rounded-xl bg-[#f0f3f5] font-bold text-[#566573]">{name.slice(0, 2).toUpperCase()}</div><div className="flex-1"><p className="font-semibold">{name}</p><p className="text-sm text-[#7d8995]">{detail}</p></div><Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">{state}</Badge><Button variant="ghost" size="sm">Edit</Button></div>)}</section></>;
}

function App({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [view, setView] = useState(user.role === "manager" ? "Dashboard" : "Overview");
  const [submitted, setSubmitted] = useState<Expense[]>([]);
  const [sampleRows, setSampleRows] = useState(expenses);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("ledgerly:submitted-expenses") ?? "[]") as Partial<Expense>[];
      setSubmitted(stored.map((item) => ({ id: item.id ?? `EX-${Date.now()}`, merchant: item.merchant ?? "Unknown merchant", owner: item.owner ?? "Riya Sharma", employeeId: item.employeeId ?? "EMP-021", department: item.department ?? "Sales", category: item.category ?? "Other", businessPurpose: item.businessPurpose ?? "Business purpose not provided", date: item.date ?? "30 Sep 2026", amount: item.amount ?? 0, status: item.status ?? "In review", receiptName: item.receiptName ?? "receipt attached", riskScore: item.riskScore ?? 15, policyStatus: item.policyStatus ?? "Pending manager review" })));
    }
    catch { setSubmitted([]); }
  }, []);
  const allRows = useMemo(() => [...submitted, ...sampleRows], [submitted, sampleRows]);
  function updateClaim(id: string, status: Status) {
    setSubmitted((items) => {
      const updated = items.map((item) => item.id === id ? { ...item, status, policyStatus: status === "Finance review" ? "Manager approved" : item.policyStatus } : item);
      localStorage.setItem("ledgerly:submitted-expenses", JSON.stringify(updated));
      return updated;
    });
    setSampleRows((items) => items.map((item) => item.id === id ? { ...item, status } : item));
  }
  const titles: Record<string, string> = { "My expenses": "Your submitted claims and their current status.", "Team expenses": "All expenses submitted by your direct reports.", Approvals: "Review and decide on claims awaiting manager approval.", Verification: "Validate claims, AI findings, and policy exceptions.", Reimbursements: "Track approved claims through payment.", Reports: "Review monthly, quarterly, and yearly spending.", };
  return <SidebarProvider className="min-h-screen bg-[#f4f7f8] text-[#172532]"><Sidebar collapsible="icon" className="border-r-0 bg-white"><SidebarHeader className="border-b p-5"><Brand /></SidebarHeader><SidebarContent className="px-3 py-5"><SidebarGroup><SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-[.12em] text-[#9aa4af]">{user.label} workspace</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{nav[user.role].map((item) => <SidebarMenuItem key={item.label}><SidebarMenuButton isActive={view === item.label} onClick={() => setView(item.label)} tooltip={item.label} className="h-11 rounded-xl px-3 data-[active=true]:bg-[#fff0eb] data-[active=true]:text-[#d95235]"><item.icon /><span>{item.label}</span>{item.count && <span className="ml-auto rounded-full bg-[#eef1f3] px-2 text-xs">{item.count}</span>}</SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup></SidebarContent><SidebarFooter className="border-t p-3"><div className="mb-2 flex items-center gap-3 rounded-xl p-2"><div className="grid size-9 place-items-center rounded-full bg-[#172532] text-xs font-bold text-white">{user.initials}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user.name}</p><p className="text-xs text-[#89949f]">{user.label}</p></div><ChevronDown className="size-4" /></div><SidebarMenuButton onClick={onLogout} className="h-10 rounded-xl text-[#687582]"><LogOut /><span>Sign out</span></SidebarMenuButton></SidebarFooter></Sidebar>
    <SidebarInset className="bg-[#f4f7f8]"><header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b bg-white/90 px-4 backdrop-blur sm:px-8"><div className="flex items-center gap-3"><SidebarTrigger><Menu /></SidebarTrigger><div><p className="text-sm font-semibold">Wednesday, 30 September</p><p className="hidden text-xs text-[#89949f] sm:block">Northstar Labs · {user.label}</p></div></div><div className="flex items-center gap-2"><Button variant="ghost" size="icon" className="relative rounded-xl"><Bell className="size-5" /><span className="absolute right-2 top-2 size-2 rounded-full bg-[#ff6746]" /></Button>{user.role === "employee" && <NewExpense onSubmitted={(expense) => setSubmitted((items) => [expense, ...items])} />}</div></header>
      <main className="mx-auto w-full max-w-[1460px] p-4 sm:p-8 lg:p-9">{user.role === "manager" ? <ManagerWorkspace view={view} rows={allRows} onDecision={updateClaim} /> : view === "Overview" ? <Overview user={user} rows={allRows} /> : view === "Verification" ? <AIReviewPage submitted={allRows.filter((item) => item.status === "Finance review")} /> : user.role === "admin" ? <AdminPage title={view} /> : <ListPage title={view} subtitle={titles[view] ?? "Review records and activity."} user={user} allRows={allRows} />}</main>
    </SidebarInset></SidebarProvider>;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  return user ? <App user={user} onLogout={() => setUser(null)} /> : <Login onLogin={setUser} />;
}
