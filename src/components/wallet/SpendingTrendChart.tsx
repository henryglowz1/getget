import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { WalletTransaction } from "@/hooks/useWalletTransactions";
import { formatNaira } from "@/hooks/useWallet";

interface SpendingTrendChartProps {
  transactions: WalletTransaction[];
  days?: number;
}

export function SpendingTrendChart({ transactions, days = 30 }: SpendingTrendChartProps) {
  const chartData = useMemo(() => {
    const endDate = startOfDay(new Date());
    const startDate = startOfDay(subDays(endDate, days - 1));
    
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    
    const dailyData = allDays.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.created_at);
        return txDate >= dayStart && txDate <= dayEnd;
      });
      
      const credits = dayTransactions
        .filter(tx => tx.type === "credit")
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const debits = dayTransactions
        .filter(tx => tx.type === "debit")
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      return {
        date: format(day, "MMM d"),
        fullDate: format(day, "MMM d, yyyy"),
        credits,
        debits,
        net: credits - debits,
      };
    });
    
    return dailyData;
  }, [transactions, days]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{payload[0]?.payload?.fullDate}</p>
          <div className="space-y-1">
            <p className="text-xs text-success">
              Credits: {formatNaira(payload[0]?.value || 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              Debits: {formatNaira(payload[1]?.value || 0)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorDebits" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis 
          dataKey="date" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickMargin={10}
          interval="preserveStartEnd"
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="credits"
          stroke="hsl(var(--success))"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorCredits)"
        />
        <Area
          type="monotone"
          dataKey="debits"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorDebits)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
