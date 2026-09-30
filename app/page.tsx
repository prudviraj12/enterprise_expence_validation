"use client";

import { useMemo, useState } from "react";
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
type Status = "Approved" | "In review" | "Needs info" | "Paid";
type Expense = { id: string; merchant: string; owner: string; category: string; date: string; amount: number; status: Status };
type User = { role: Role; name: string; email: string; password: string; label: string; initials: string };

const users: User[] = [
  { role: "employee", name: "Riya Sharma", email: "employee@ledgerly.in", password: "Employee@123", label: "Employee", initials: "RS" },
  { role: "manager", name: "Arjun Mehta", email: "manager@ledgerly.in", password: "Manager@123", label: "Manager", initials: "AM" },
  { role: "finance", name: "Ananya Kapoor", email: "finance@ledgerly.in", password: "Finance@123", label: "Finance", initials: "AK" },
  { role: "admin", name: "Dev Malhotra", email: "admin@ledgerly.in", password: "Admin@123", label: "Admin", initials: "DM" },
];

const expenses: Expense[] = [
  { id: "EX-1048", merchant: "The Westin", owner: "Riya Sharma", category: "Lodging", date: "28 Sep 2026", amount: 18450, status: "In review" },
  { id: "EX-1047", merchant: "IndiGo", owner: "Kabir Rao", category: "Travel", date: "27 Sep 2026", amount: 12890, status: "Approved" },
  { id: "EX-1045", merchant: "Olive Bistro", owner: "Riya Sharma", category: "Meals", date: "25 Sep 2026", amount: 4280, status: "Needs info" },
  { id: "EX-1042", merchant: "Adobe", owner: "Neha Iyer", category: "Software", date: "21 Sep 2026", amount: 1675, status: "Paid" },
  { id: "EX-1039", merchant: "Uber", owner: "Riya Sharma", category: "Travel", date: "18 Sep 2026", amount: 860, status: "Paid" },
];

const nav: Record<Role, Array<{ label: string; icon: typeof LayoutDashboard; count?: number }>> = {
  employee: [
    { label: "Overview", icon: LayoutDashboard }, { label: "My expenses", icon: ReceiptText, count: 3 },
    { label: "Reimbursements", icon: WalletCards },
  ],
  manager: [
    { label: "Overview", icon: LayoutDashboard }, { label: "Team expenses", icon: Users },
    { label: "Approvals", icon: FileCheck2, count: 3 }, { label: "Reports", icon: FileText },
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
  "Needs info": "border-amber-200 bg-amber-50 text-amber-800", Paid: "border-zinc-200 bg-zinc-100 text-zinc-700",
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
  return <div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-[#fafbfb]"><TableHead className="pl-6">Expense</TableHead><TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead>{action && <TableHead className="pr-6 text-right">Action</TableHead>}</TableRow></TableHeader><TableBody>{rows.map((expense) => <TableRow key={expense.id}><TableCell className="py-4 pl-6"><p className="font-semibold">{expense.merchant}</p><p className="text-xs text-[#89949f]">{expense.id} · {expense.category}</p></TableCell><TableCell>{expense.owner}</TableCell><TableCell>{expense.date}</TableCell><TableCell><Badge variant="outline" className={`rounded-full ${statusStyle[expense.status]}`}>{expense.status}</Badge></TableCell><TableCell className="text-right font-bold">{money(expense.amount)}</TableCell>{action && <TableCell className="pr-6 text-right"><Button size="sm" className="rounded-lg bg-[#172532] text-white"><Check className="size-4" /> {action === "approve" ? "Approve" : "Verify"}</Button></TableCell>}</TableRow>)}</TableBody></Table></div>;
}

function NewExpense() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="rounded-xl bg-[#ff6746] text-white hover:bg-[#e95a3c]"><Plus className="size-4" /> New expense</Button></DialogTrigger><DialogContent className="rounded-2xl"><DialogHeader><DialogTitle>Submit an expense</DialogTitle><DialogDescription>Add the purchase details and receipt.</DialogDescription></DialogHeader>{saved ? <div className="grid place-items-center gap-3 py-10 text-center"><div className="grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check /></div><h3 className="font-bold">Expense submitted</h3><p className="text-sm text-[#71808d]">Your manager has been notified.</p></div> : <div className="grid gap-4 py-4"><Input placeholder="Merchant" /><div className="grid grid-cols-2 gap-3"><Input placeholder="Amount (INR)" /><select className="rounded-md border px-3"><option>Meals</option><option>Travel</option><option>Lodging</option></select></div><button className="h-24 rounded-xl border border-dashed text-sm text-[#71808d]">Upload receipt</button></div>}<DialogFooter>{saved ? <Button onClick={() => { setOpen(false); setSaved(false); }}>Done</Button> : <Button onClick={() => setSaved(true)} className="bg-[#172532] text-white">Submit expense</Button>}</DialogFooter></DialogContent></Dialog>;
}

function Overview({ user }: { user: User }) {
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
    <div className="grid gap-6 xl:grid-cols-[1.5fr_.8fr]"><section className="overflow-hidden rounded-2xl border bg-white"><div className="flex items-center justify-between border-b p-6"><div><h2 className="font-bold">Recent activity</h2><p className="text-sm text-[#7d8995]">Latest claims in your workspace</p></div></div><ExpenseTable rows={user.role === "employee" ? expenses.filter((item) => item.owner === user.name) : expenses.slice(0, 4)} action={user.role === "manager" ? "approve" : user.role === "finance" ? "verify" : undefined} /></section>
      <aside className="rounded-2xl bg-[#172532] p-6 text-white"><Sparkles className="mb-5 text-[#ff8267]" /><h2 className="text-xl font-bold">94% policy compliant</h2><p className="mt-3 text-sm leading-6 text-[#b7c2cb]">AI checks found that most recent claims follow company policy. Three meal claims need attention.</p><div className="mt-6 rounded-xl bg-white/[.07] p-4"><div className="mb-2 flex justify-between text-sm"><span>Compliance</span><b>94%</b></div><Progress value={94} className="h-2 bg-white/10 [&_[data-slot=progress-indicator]]:bg-[#ff795b]" /></div></aside></div>
  </>;
}

function ListPage({ title, subtitle, user }: { title: string; subtitle: string; user: User }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => expenses.filter((item) => `${item.merchant} ${item.owner} ${item.id}`.toLowerCase().includes(query.toLowerCase()) && (user.role !== "employee" || item.owner === user.name)), [query, user]);
  return <><div className="mb-7"><h1 className="text-3xl font-bold tracking-[-.045em]">{title}</h1><p className="mt-2 text-[#71808d]">{subtitle}</p></div><section className="overflow-hidden rounded-2xl border bg-white"><div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between"><h2 className="font-bold">{rows.length} records</h2><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#89949f]" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="w-full pl-9 sm:w-64" />{query && <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="size-4" /></button>}</div></div><ExpenseTable rows={rows} action={title === "Approvals" ? "approve" : title === "Verification" ? "verify" : undefined} /></section></>;
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
  const [view, setView] = useState("Overview");
  const titles: Record<string, string> = { "My expenses": "Your submitted claims and their current status.", "Team expenses": "All expenses submitted by your direct reports.", Approvals: "Review and decide on claims awaiting manager approval.", Verification: "Validate claims, AI findings, and policy exceptions.", Reimbursements: "Track approved claims through payment.", Reports: "Review monthly, quarterly, and yearly spending.", };
  return <SidebarProvider className="min-h-screen bg-[#f4f7f8] text-[#172532]"><Sidebar collapsible="icon" className="border-r-0 bg-white"><SidebarHeader className="border-b p-5"><Brand /></SidebarHeader><SidebarContent className="px-3 py-5"><SidebarGroup><SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-[.12em] text-[#9aa4af]">{user.label} workspace</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{nav[user.role].map((item) => <SidebarMenuItem key={item.label}><SidebarMenuButton isActive={view === item.label} onClick={() => setView(item.label)} tooltip={item.label} className="h-11 rounded-xl px-3 data-[active=true]:bg-[#fff0eb] data-[active=true]:text-[#d95235]"><item.icon /><span>{item.label}</span>{item.count && <span className="ml-auto rounded-full bg-[#eef1f3] px-2 text-xs">{item.count}</span>}</SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup></SidebarContent><SidebarFooter className="border-t p-3"><div className="mb-2 flex items-center gap-3 rounded-xl p-2"><div className="grid size-9 place-items-center rounded-full bg-[#172532] text-xs font-bold text-white">{user.initials}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user.name}</p><p className="text-xs text-[#89949f]">{user.label}</p></div><ChevronDown className="size-4" /></div><SidebarMenuButton onClick={onLogout} className="h-10 rounded-xl text-[#687582]"><LogOut /><span>Sign out</span></SidebarMenuButton></SidebarFooter></Sidebar>
    <SidebarInset className="bg-[#f4f7f8]"><header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b bg-white/90 px-4 backdrop-blur sm:px-8"><div className="flex items-center gap-3"><SidebarTrigger><Menu /></SidebarTrigger><div><p className="text-sm font-semibold">Wednesday, 30 September</p><p className="hidden text-xs text-[#89949f] sm:block">Northstar Labs · {user.label}</p></div></div><div className="flex items-center gap-2"><Button variant="ghost" size="icon" className="relative rounded-xl"><Bell className="size-5" /><span className="absolute right-2 top-2 size-2 rounded-full bg-[#ff6746]" /></Button>{user.role === "employee" && <NewExpense />}</div></header>
      <main className="mx-auto w-full max-w-[1460px] p-4 sm:p-8 lg:p-9">{view === "Overview" ? <Overview user={user} /> : user.role === "admin" ? <AdminPage title={view} /> : <ListPage title={view} subtitle={titles[view] ?? "Review records and activity."} user={user} />}</main>
    </SidebarInset></SidebarProvider>;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  return user ? <App user={user} onLogout={() => setUser(null)} /> : <Login onLogin={setUser} />;
}
