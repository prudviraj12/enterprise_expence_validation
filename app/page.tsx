"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight, ArrowUpRight, Bell, ChevronDown, CircleDollarSign,
  FileCheck2, LayoutDashboard, Menu, Moon, MoreHorizontal, Plus,
  ReceiptText, Search, Settings, ShieldCheck, Sparkles, Sun, Users,
  WalletCards, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type ExpenseStatus = "Approved" | "In review" | "Needs info" | "Paid";
type Expense = {
  id: string; merchant: string; category: string; date: string;
  amount: number; status: ExpenseStatus; initials: string; color: string;
};

const initialExpenses: Expense[] = [
  { id: "EX-1048", merchant: "The Westin", category: "Lodging", date: "Sep 28, 2026", amount: 18450, status: "In review", initials: "TW", color: "bg-indigo-100 text-indigo-700" },
  { id: "EX-1047", merchant: "IndiGo", category: "Travel", date: "Sep 27, 2026", amount: 12890, status: "Approved", initials: "IN", color: "bg-sky-100 text-sky-700" },
  { id: "EX-1045", merchant: "Olive Bistro", category: "Meals", date: "Sep 25, 2026", amount: 4280, status: "Needs info", initials: "OB", color: "bg-amber-100 text-amber-700" },
  { id: "EX-1042", merchant: "Adobe", category: "Software", date: "Sep 21, 2026", amount: 1675, status: "Paid", initials: "AD", color: "bg-rose-100 text-rose-700" },
  { id: "EX-1039", merchant: "Uber", category: "Travel", date: "Sep 18, 2026", amount: 860, status: "Paid", initials: "UB", color: "bg-zinc-100 text-zinc-700" },
];

const statusClasses: Record<ExpenseStatus, string> = {
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "In review": "border-blue-200 bg-blue-50 text-blue-700",
  "Needs info": "border-amber-200 bg-amber-50 text-amber-800",
  Paid: "border-zinc-200 bg-zinc-100 text-zinc-700",
};

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "My expenses", icon: ReceiptText, count: 8 },
  { label: "Approvals", icon: FileCheck2, count: 3 },
  { label: "Reimbursements", icon: WalletCards },
];
const adminItems = [
  { label: "People", icon: Users }, { label: "Policies", icon: ShieldCheck },
  { label: "Settings", icon: Settings },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function Logo() {
  return <div className="flex items-center gap-3 px-2 py-1">
    <div className="grid size-9 place-items-center rounded-xl bg-[#ff6b4a] text-white shadow-[0_7px_18px_rgba(255,107,74,.28)]"><ReceiptText className="size-5" strokeWidth={2.4} /></div>
    <div><p className="text-[1.05rem] font-bold tracking-[-0.03em] text-[#18222d]">Ledgerly</p><p className="text-xs text-[#7b8794]">Northstar Labs</p></div>
  </div>;
}

function ExpenseDialog({ onAdd }: { onAdd: (expense: Expense) => void }) {
  const [open, setOpen] = useState(false);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Meals");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!merchant.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) return;
    const initials = merchant.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
    onAdd({ id: `EX-${1049 + Math.floor(Math.random() * 50)}`, merchant: merchant.trim(), category,
      date: "Sep 30, 2026", amount: numericAmount, status: "In review", initials,
      color: "bg-violet-100 text-violet-700" });
    setMerchant(""); setAmount(""); setOpen(false);
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button className="h-10 rounded-xl bg-[#ff6b4a] px-4 font-semibold text-white shadow-[0_8px_20px_rgba(255,107,74,.24)] hover:bg-[#ec5b3c]"><Plus className="size-4" /> New expense</Button></DialogTrigger>
    <DialogContent className="rounded-2xl border-[#dde3e8] sm:max-w-[480px]">
      <form onSubmit={submit}>
        <DialogHeader><DialogTitle className="text-xl tracking-tight">Add an expense</DialogTitle><DialogDescription>Enter the purchase details. You can attach the receipt after saving.</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-6">
          <label className="grid gap-2 text-sm font-semibold text-[#344150]">Merchant<Input value={merchant} onChange={(event) => setMerchant(event.target.value)} placeholder="e.g. Taj Hotels" className="h-11 rounded-xl" autoFocus /></label>
          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-2 text-sm font-semibold text-[#344150]">Amount (INR)<Input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="0.00" className="h-11 rounded-xl" /></label>
            <label className="grid gap-2 text-sm font-semibold text-[#344150]">Category<select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-xl border border-input bg-transparent px-3 font-normal outline-none focus:ring-2 focus:ring-ring/40"><option>Meals</option><option>Travel</option><option>Lodging</option><option>Software</option><option>Supplies</option></select></label>
          </div>
          <button type="button" className="grid min-h-24 place-items-center rounded-xl border border-dashed border-[#c7d0d9] bg-[#f8fafb] text-sm text-[#64717f] transition hover:border-[#ff8f76] hover:bg-[#fff8f5]"><span className="flex items-center gap-2"><ReceiptText className="size-4" /> Add receipt</span></button>
        </div>
        <DialogFooter><Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="rounded-xl bg-[#18222d] text-white hover:bg-[#273747]">Save expense</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

export default function Home() {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | ExpenseStatus>("All");
  const [active, setActive] = useState("Overview");
  const [dark, setDark] = useState(false);
  const filteredExpenses = useMemo(() => expenses.filter((expense) =>
    `${expense.merchant} ${expense.category} ${expense.id}`.toLowerCase().includes(query.toLowerCase()) &&
    (status === "All" || expense.status === status)), [expenses, query, status]);

  useEffect(() => {
    const context = (document as Document & {
      modelContext?: {
        registerTool: (tool: {
          name: string;
          title: string;
          description: string;
          inputSchema: object;
          annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
          execute: (input: unknown) => unknown;
        }, options: { signal: AbortSignal }) => void | Promise<void>;
      };
    }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: "create_expense",
      title: "Create expense",
      description: "Create a submitted expense and add it to the visible recent expense list.",
      inputSchema: {
        type: "object",
        properties: {
          merchant: { type: "string", minLength: 1 },
          amount: { type: "number", exclusiveMinimum: 0 },
          category: { type: "string", enum: ["Meals", "Travel", "Lodging", "Software", "Supplies"] },
        },
        required: ["merchant", "amount", "category"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const value = input as { merchant?: unknown; amount?: unknown; category?: unknown };
        if (typeof value.merchant !== "string" || !value.merchant.trim() ||
            typeof value.amount !== "number" || !Number.isFinite(value.amount) || value.amount <= 0 ||
            typeof value.category !== "string" || !["Meals", "Travel", "Lodging", "Software", "Supplies"].includes(value.category)) {
          throw new Error("Merchant, positive amount, and a supported category are required.");
        }
        const expense: Expense = {
          id: `EX-${1049 + Math.floor(Math.random() * 50)}`,
          merchant: value.merchant.trim(), category: value.category,
          date: "Sep 30, 2026", amount: value.amount, status: "In review",
          initials: value.merchant.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase(),
          color: "bg-violet-100 text-violet-700",
        };
        setExpenses((current) => [expense, ...current]);
        return { id: expense.id, status: expense.status };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  return <div className={dark ? "dark" : ""}>
    <SidebarProvider className="min-h-screen bg-[#f4f7f8] text-[#18222d]">
      <Sidebar collapsible="icon" className="border-r-0 bg-white">
        <SidebarHeader className="border-b border-[#edf0f2] px-3 py-5"><Logo /></SidebarHeader>
        <SidebarContent className="px-3 py-4">
          <SidebarGroup><SidebarGroupLabel className="px-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#9aa4af]">Workspace</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>
            {navItems.map((item) => <SidebarMenuItem key={item.label}><SidebarMenuButton isActive={active === item.label} onClick={() => setActive(item.label)} tooltip={item.label} className="h-11 rounded-xl px-3 text-[.92rem] font-medium data-[active=true]:bg-[#fff0eb] data-[active=true]:text-[#dc5132]"><item.icon className="size-[18px]" /><span>{item.label}</span>{item.count && <span className="ml-auto rounded-full bg-[#edf1f3] px-2 py-0.5 text-xs text-[#65717e]">{item.count}</span>}</SidebarMenuButton></SidebarMenuItem>)}
          </SidebarMenu></SidebarGroupContent></SidebarGroup>
          <SidebarGroup><SidebarGroupLabel className="px-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#9aa4af]">Manage</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>
            {adminItems.map((item) => <SidebarMenuItem key={item.label}><SidebarMenuButton isActive={active === item.label} onClick={() => setActive(item.label)} tooltip={item.label} className="h-11 rounded-xl px-3 text-[.92rem] font-medium data-[active=true]:bg-[#fff0eb] data-[active=true]:text-[#dc5132]"><item.icon className="size-[18px]" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}
          </SidebarMenu></SidebarGroupContent></SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-[#edf0f2] p-3"><div className="flex items-center gap-3 rounded-xl p-2"><div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#18222d] text-xs font-bold text-white">AK</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">Ananya Kapoor</p><p className="truncate text-xs text-[#89949f]">Finance admin</p></div><ChevronDown className="size-4 text-[#89949f]" /></div></SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0 bg-[#f4f7f8]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#e6ebee] bg-white/90 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
          <div className="flex items-center gap-3"><SidebarTrigger className="md:hidden" aria-label="Open navigation"><Menu className="size-5" /></SidebarTrigger><div><p className="text-sm font-semibold">Wednesday, 30 September</p><p className="hidden text-xs text-[#84909c] sm:block">Keep your expenses moving.</p></div></div>
          <div className="flex items-center gap-2"><Button variant="ghost" size="icon" className="rounded-xl text-[#64717f]" onClick={() => setDark((value) => !value)} aria-label="Toggle color theme">{dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}</Button><Button variant="ghost" size="icon" className="relative rounded-xl text-[#64717f]" aria-label="Notifications"><Bell className="size-[18px]" /><span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-[#ff6b4a]" /></Button><ExpenseDialog onAdd={(expense) => setExpenses((current) => [expense, ...current])} /></div>
        </header>

        <main className="mx-auto w-full max-w-[1480px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
          <section className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="mb-1 text-sm font-semibold text-[#ff6b4a]">Finance overview</p><h1 className="text-3xl font-bold tracking-[-.04em] sm:text-[2.15rem]">Good morning, Ananya</h1><p className="mt-2 text-[#6f7c89]">Here’s what needs your attention across company spending.</p></div>
            <div className="flex items-center gap-2 self-start rounded-xl border border-[#dfe5e9] bg-white p-1 text-sm shadow-sm"><button className="rounded-lg bg-[#18222d] px-3 py-1.5 font-semibold text-white">This month</button><button className="px-3 py-1.5 text-[#71808e]">Quarter</button><button className="px-3 py-1.5 text-[#71808e]">Year</button></div>
          </section>

          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total spend", value: "₹4,28,650", detail: "12.4% from August", icon: CircleDollarSign, trend: "up" },
              { label: "Awaiting approval", value: "₹86,420", detail: "14 expenses", icon: FileCheck2, trend: "down" },
              { label: "Reimbursed", value: "₹3,12,800", detail: "73% of monthly spend", icon: WalletCards, trend: "up" },
              { label: "Policy flags", value: "7", detail: "3 need attention", icon: ShieldCheck, trend: "down" },
            ].map((metric) => <article key={metric.label} className="rounded-2xl border border-[#e1e7ea] bg-white p-5 shadow-[0_1px_2px_rgba(27,39,51,.03)]"><div className="mb-5 flex items-start justify-between"><div className="grid size-10 place-items-center rounded-xl bg-[#f1f4f5] text-[#53616e]"><metric.icon className="size-[19px]" /></div>{metric.trend === "up" ? <ArrowUpRight className="size-4 text-emerald-600" /> : <ArrowDownRight className="size-4 text-[#ff6b4a]" />}</div><p className="text-sm font-medium text-[#74818e]">{metric.label}</p><p className="mt-1 text-2xl font-bold tracking-[-.04em]">{metric.value}</p><p className="mt-2 text-xs text-[#8a96a2]">{metric.detail}</p></article>)}
          </section>

          <section className="mb-6 grid gap-6 xl:grid-cols-[1.55fr_.85fr]">
            <article className="overflow-hidden rounded-2xl border border-[#e1e7ea] bg-white p-5 shadow-[0_1px_2px_rgba(27,39,51,.03)] sm:p-6">
              <div className="mb-7 flex items-start justify-between"><div><h2 className="font-bold tracking-[-.02em]">Spend trend</h2><p className="mt-1 text-sm text-[#7b8794]">Approved and submitted expenses</p></div><Badge variant="outline" className="rounded-lg border-[#dfe5e9] px-2.5 py-1 font-medium text-[#63717e]">Sep 2026</Badge></div>
              <div className="relative h-[220px]"><div className="absolute inset-0 flex flex-col justify-between pb-7"><span className="border-t border-dashed border-[#e8ecef]" /><span className="border-t border-dashed border-[#e8ecef]" /><span className="border-t border-dashed border-[#e8ecef]" /><span className="border-t border-dashed border-[#e8ecef]" /></div><div className="absolute inset-x-0 bottom-0 top-1 flex items-end justify-between gap-3 px-2">{[38, 55, 46, 72, 60, 85, 78].map((height, index) => <div key={index} className="group flex h-full flex-1 items-end justify-center"><div className="w-full max-w-11 rounded-t-lg bg-[#26394b] transition-all group-hover:bg-[#ff6b4a]" style={{ height: `${height}%` }} /></div>)}</div><div className="absolute inset-x-0 bottom-0 flex justify-between px-2 text-xs font-medium text-[#8c97a2]">{["1 Sep", "5", "10", "15", "20", "25", "30"].map((day) => <span key={day}>{day}</span>)}</div></div>
            </article>
            <article className="rounded-2xl bg-[#172532] p-6 text-white shadow-[0_18px_45px_rgba(20,35,48,.16)]">
              <div className="mb-6 flex items-start justify-between"><div><div className="mb-3 flex items-center gap-2 text-[#ff8b71]"><Sparkles className="size-4" /><span className="text-xs font-bold uppercase tracking-[.12em]">AI review</span></div><h2 className="text-xl font-bold tracking-[-.03em]">Spending looks healthy</h2></div><MoreHorizontal className="size-5 text-white/50" /></div>
              <p className="mb-6 text-sm leading-6 text-[#b7c2cb]">94% of expenses match company policy. Meal claims in Sales are trending slightly above their monthly average.</p>
              <div className="rounded-xl bg-white/[.07] p-4"><div className="mb-2 flex justify-between text-sm"><span className="text-[#c5ced5]">Policy compliance</span><strong>94%</strong></div><Progress value={94} className="h-2 bg-white/10 [&_[data-slot=progress-indicator]]:bg-[#ff795b]" /><button className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#ff9b84]">Review 7 flagged expenses <ArrowUpRight className="size-4" /></button></div>
            </article>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#e1e7ea] bg-white shadow-[0_1px_2px_rgba(27,39,51,.03)]">
            <div className="flex flex-col gap-4 border-b border-[#e9edef] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h2 className="font-bold tracking-[-.02em]">Recent expenses</h2><p className="mt-1 text-sm text-[#7b8794]">Track the latest submissions and reimbursements.</p></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#919ca7]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search expenses" className="h-10 w-full rounded-xl border-[#dfe5e9] bg-[#f9fafb] pl-9 sm:w-52" />{query && <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#919ca7]" aria-label="Clear search"><X className="size-3.5" /></button>}</div><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-10 rounded-xl border border-[#dfe5e9] bg-white px-3 text-sm font-medium text-[#556370] outline-none focus:ring-2 focus:ring-[#ff6b4a]/25"><option>All</option><option>Approved</option><option>In review</option><option>Needs info</option><option>Paid</option></select></div></div>
            <div className="overflow-x-auto"><Table><TableHeader><TableRow className="border-[#edf0f2] bg-[#fafbfb] hover:bg-[#fafbfb]"><TableHead className="pl-6 text-xs font-bold uppercase tracking-[.08em] text-[#8b96a1]">Merchant</TableHead><TableHead className="text-xs font-bold uppercase tracking-[.08em] text-[#8b96a1]">Category</TableHead><TableHead className="text-xs font-bold uppercase tracking-[.08em] text-[#8b96a1]">Date</TableHead><TableHead className="text-xs font-bold uppercase tracking-[.08em] text-[#8b96a1]">Status</TableHead><TableHead className="pr-6 text-right text-xs font-bold uppercase tracking-[.08em] text-[#8b96a1]">Amount</TableHead></TableRow></TableHeader><TableBody>
              {filteredExpenses.map((expense) => <TableRow key={expense.id} className="border-[#edf0f2]"><TableCell className="py-4 pl-6"><div className="flex items-center gap-3"><div className={`grid size-9 place-items-center rounded-xl text-[11px] font-bold ${expense.color}`}>{expense.initials}</div><div><p className="font-semibold">{expense.merchant}</p><p className="text-xs text-[#8a96a2]">{expense.id}</p></div></div></TableCell><TableCell className="text-sm text-[#5f6c79]">{expense.category}</TableCell><TableCell className="text-sm text-[#5f6c79]">{expense.date}</TableCell><TableCell><Badge variant="outline" className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[expense.status]}`}>{expense.status}</Badge></TableCell><TableCell className="pr-6 text-right font-bold">{formatCurrency(expense.amount)}</TableCell></TableRow>)}
              {filteredExpenses.length === 0 && <TableRow><TableCell colSpan={5} className="h-32 text-center text-[#7b8794]">No expenses match your search.</TableCell></TableRow>}
            </TableBody></Table></div>
            <div className="flex items-center justify-between border-t border-[#edf0f2] px-6 py-4 text-sm"><span className="text-[#7b8794]">Showing {filteredExpenses.length} of {expenses.length} expenses</span><button className="font-semibold text-[#e05b3d]">View all expenses</button></div>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  </div>;
}
