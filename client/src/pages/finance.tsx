import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Wallet } from "lucide-react";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface FinanceSummary {
  currentBalance: number;
  totalIncome: number;
  totalExpense: number;
  startingBalance: number;
}

interface FinanceSettings {
  userId: string;
  startingBalance: number;
  updatedAt: string;
}

interface IncomeLog {
  id: string;
  date: string;
  amount: number;
  source: string;
  note: string | null;
}

interface ExpenseLog {
  id: string;
  date: string;
  amount: number;
  category: string;
  note: string | null;
}

interface ChartData {
  month: string;
  income: number;
  expense: number;
}

function formatCurrency(amount: number) {
  return `৳${amount.toLocaleString("en-BD")}`;
}

export default function FinancePage() {
  const { toast } = useToast();

  const [incomeDate, setIncomeDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeSource, setIncomeSource] = useState("");
  const [incomeNote, setIncomeNote] = useState("");

  const [expenseDate, setExpenseDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseNote, setExpenseNote] = useState("");

  const [startingBalanceInput, setStartingBalanceInput] = useState("");

  const { data: summary, isLoading: summaryLoading } = useQuery<FinanceSummary>({
    queryKey: ["/api/finance/summary"],
  });

  const { data: settings } = useQuery<FinanceSettings>({
    queryKey: ["/api/finance/settings"],
  });

  const { data: incomeList, isLoading: incomeLoading } = useQuery<IncomeLog[]>({
    queryKey: ["/api/finance/income"],
  });

  const { data: expenseList, isLoading: expenseLoading } = useQuery<ExpenseLog[]>({
    queryKey: ["/api/finance/expense"],
  });

  const { data: chartData, isLoading: chartLoading } = useQuery<ChartData[]>({
    queryKey: ["/api/finance/chart"],
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/finance/summary"] });
    queryClient.invalidateQueries({ queryKey: ["/api/finance/income"] });
    queryClient.invalidateQueries({ queryKey: ["/api/finance/expense"] });
    queryClient.invalidateQueries({ queryKey: ["/api/finance/chart"] });
    queryClient.invalidateQueries({ queryKey: ["/api/finance/settings"] });
  };

  const addIncomeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/finance/income", {
        date: incomeDate,
        amount: parseFloat(incomeAmount),
        source: incomeSource,
        note: incomeNote || null,
      });
    },
    onSuccess: () => {
      invalidateAll();
      setIncomeAmount("");
      setIncomeSource("");
      setIncomeNote("");
      toast({ title: "Income added" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to add income", description: err.message, variant: "destructive" });
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/finance/expense", {
        date: expenseDate,
        amount: parseFloat(expenseAmount),
        category: expenseCategory,
        note: expenseNote || null,
      });
    },
    onSuccess: () => {
      invalidateAll();
      setExpenseAmount("");
      setExpenseCategory("");
      setExpenseNote("");
      toast({ title: "Expense added" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to add expense", description: err.message, variant: "destructive" });
    },
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/finance/income/${id}`);
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Income deleted" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/finance/expense/${id}`);
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Expense deleted" });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/finance/settings", {
        startingBalance: parseFloat(startingBalanceInput),
      });
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Starting balance updated" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to save settings", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="text-finance-title">Finance Tracker</h1>
        <p className="text-muted-foreground text-sm">Track your income and expenses</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="rounded-xl">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Current Balance</span>
                </div>
                <p className="text-lg font-bold" data-testid="text-current-balance">
                  {formatCurrency(summary?.currentBalance ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Starting Balance</span>
                </div>
                <p className="text-lg font-bold" data-testid="text-starting-balance">
                  {formatCurrency(summary?.startingBalance ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Total Income</span>
                </div>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-total-income">
                  {formatCurrency(summary?.totalIncome ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-muted-foreground">Total Expense</span>
                </div>
                <p className="text-lg font-bold text-red-600 dark:text-red-400" data-testid="text-total-expense">
                  {formatCurrency(summary?.totalExpense ?? 0)}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Add Income</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="income-date" className="text-xs">Date</Label>
                <Input
                  id="income-date"
                  type="date"
                  value={incomeDate}
                  onChange={(e) => setIncomeDate(e.target.value)}
                  data-testid="input-income-date"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="income-amount" className="text-xs">Amount (BDT)</Label>
                <Input
                  id="income-amount"
                  type="number"
                  placeholder="0"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  data-testid="input-income-amount"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="income-source" className="text-xs">Source</Label>
              <Input
                id="income-source"
                placeholder="e.g. Salary, Freelance"
                value={incomeSource}
                onChange={(e) => setIncomeSource(e.target.value)}
                data-testid="input-income-source"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="income-note" className="text-xs">Note (optional)</Label>
              <Input
                id="income-note"
                placeholder="Additional details"
                value={incomeNote}
                onChange={(e) => setIncomeNote(e.target.value)}
                data-testid="input-income-note"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => addIncomeMutation.mutate()}
              disabled={!incomeAmount || !incomeSource || addIncomeMutation.isPending}
              data-testid="button-add-income"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Income
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Add Expense</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="expense-date" className="text-xs">Date</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  data-testid="input-expense-date"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="expense-amount" className="text-xs">Amount (BDT)</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  placeholder="0"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  data-testid="input-expense-amount"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="expense-category" className="text-xs">Category</Label>
              <Input
                id="expense-category"
                placeholder="e.g. Food, Transport"
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                data-testid="input-expense-category"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="expense-note" className="text-xs">Note (optional)</Label>
              <Input
                id="expense-note"
                placeholder="Additional details"
                value={expenseNote}
                onChange={(e) => setExpenseNote(e.target.value)}
                data-testid="input-expense-note"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => addExpenseMutation.mutate()}
              disabled={!expenseAmount || !expenseCategory || addExpenseMutation.isPending}
              data-testid="button-add-expense"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="income" className="w-full">
        <TabsList className="w-full" data-testid="tabs-transactions">
          <TabsTrigger value="income" className="flex-1" data-testid="tab-income">Income</TabsTrigger>
          <TabsTrigger value="expense" className="flex-1" data-testid="tab-expense">Expense</TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="space-y-3 mt-4">
          {incomeLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)
          ) : incomeList && incomeList.length > 0 ? (
            incomeList.map((item) => (
              <Card key={item.id} className="rounded-xl" data-testid={`card-income-${item.id}`}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" data-testid={`text-income-source-${item.id}`}>{item.source}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.date), "MMM d, yyyy")}
                          {item.note ? ` · ${item.note}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400" data-testid={`text-income-amount-${item.id}`}>
                        +{formatCurrency(item.amount)}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteIncomeMutation.mutate(item.id)}
                        data-testid={`button-delete-income-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No income records yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="expense" className="space-y-3 mt-4">
          {expenseLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)
          ) : expenseList && expenseList.length > 0 ? (
            expenseList.map((item) => (
              <Card key={item.id} className="rounded-xl" data-testid={`card-expense-${item.id}`}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" data-testid={`text-expense-category-${item.id}`}>{item.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.date), "MMM d, yyyy")}
                          {item.note ? ` · ${item.note}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400" data-testid={`text-expense-amount-${item.id}`}>
                        -{formatCurrency(item.amount)}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteExpenseMutation.mutate(item.id)}
                        data-testid={`button-delete-expense-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No expense records yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Monthly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : chartData && chartData.length > 0 ? (
            <div className="h-64" data-testid="chart-monthly-overview">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                  <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No chart data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="starting-balance" className="text-xs">Starting Balance (BDT)</Label>
            <div className="flex gap-2 flex-wrap">
              <Input
                id="starting-balance"
                type="number"
                placeholder={settings?.startingBalance?.toString() ?? "0"}
                value={startingBalanceInput}
                onChange={(e) => setStartingBalanceInput(e.target.value)}
                className="flex-1 min-w-[200px]"
                data-testid="input-starting-balance"
              />
              <Button
                onClick={() => saveSettingsMutation.mutate()}
                disabled={!startingBalanceInput || saveSettingsMutation.isPending}
                data-testid="button-save-settings"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
            {settings?.updatedAt && (
              <p className="text-xs text-muted-foreground" data-testid="text-settings-updated">
                Last updated: {format(new Date(settings.updatedAt), "MMM d, yyyy h:mm a")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
