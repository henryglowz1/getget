import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { usePlatformFees } from "@/hooks/usePlatformFees";
import { DollarSign, TrendingUp, Users, PieChart, CalendarIcon, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

function formatCurrency(amountInKobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amountInKobo / 100);
}

export function PlatformFeesSection() {
  const {
    fees,
    isLoadingFees,
    totalFeesCollected,
    totalGrossAmount,
    totalPayouts,
    feesByGroup,
    feesByDate,
    dateRange,
    setDateRange,
    clearDateRange,
  } = usePlatformFees();

  const chartConfig = {
    total_fees: {
      label: "Fees Collected",
      color: "hsl(var(--primary))",
    },
  };

  // Transform data for chart (convert kobo to naira for display)
  const chartData = feesByDate.map((item) => ({
    ...item,
    displayDate: format(new Date(item.date), "MMM dd"),
    total_fees_naira: item.total_fees / 100,
  }));

  const hasDateFilter = dateRange.from || dateRange.to;

  if (isLoadingFees) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-80" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? format(dateRange.from, "MMM dd, yyyy") : "From date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.from}
              onSelect={(date) => setDateRange({ ...dateRange, from: date })}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground">to</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !dateRange.to && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.to ? format(dateRange.to, "MMM dd, yyyy") : "To date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.to}
              onSelect={(date) => setDateRange({ ...dateRange, to: date })}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {hasDateFilter && (
          <Button variant="ghost" size="sm" onClick={clearDateRange}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}

        {hasDateFilter && (
          <span className="text-sm text-muted-foreground ml-2">
            Showing filtered results
          </span>
        )}
      </div>

      {/* Fee Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Fees Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{formatCurrency(totalFeesCollected)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Gross Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{formatCurrency(totalGrossAmount)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Payouts Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{totalPayouts}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee History Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Fee Collection History
          </CardTitle>
          <CardDescription>Platform fees collected over time</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="displayDate" tickLine={false} axisLine={false} />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `₦${value.toLocaleString()}`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value) * 100)}
                    />
                  }
                />
                <Bar
                  dataKey="total_fees_naira"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  name="Fees Collected"
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No fee data available yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fees by Group Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fees by Group</CardTitle>
          <CardDescription>Breakdown of platform fees collected per Ajo group</CardDescription>
        </CardHeader>
        <CardContent>
          {feesByGroup.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead className="text-right">Payouts</TableHead>
                  <TableHead className="text-right">Total Distributed</TableHead>
                  <TableHead className="text-right">Fees Collected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feesByGroup
                  .sort((a, b) => b.total_fees - a.total_fees)
                  .map((group) => (
                    <TableRow key={group.ajo_id}>
                      <TableCell className="font-medium">{group.ajo_name}</TableCell>
                      <TableCell className="text-right">{group.count}</TableCell>
                      <TableCell className="text-right">{formatCurrency(group.total_payouts)}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        {formatCurrency(group.total_fees)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No fees collected yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Fees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Fee Transactions</CardTitle>
          <CardDescription>Latest platform fee deductions from payouts</CardDescription>
        </CardHeader>
        <CardContent>
          {fees && fees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Fee %</TableHead>
                  <TableHead className="text-right">Fee Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.slice(0, 10).map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell>{format(new Date(fee.created_at), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="font-medium">{fee.ajos?.name || "Unknown"}</TableCell>
                    <TableCell>{fee.cycle}</TableCell>
                    <TableCell className="text-right">{formatCurrency(fee.gross_amount)}</TableCell>
                    <TableCell className="text-right">{fee.fee_percentage}%</TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatCurrency(fee.fee_amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No fee transactions yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
