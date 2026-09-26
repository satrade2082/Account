import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Calendar,
  DollarSign,
  Download,
  FileSpreadsheet,
  Package,
  PieChart as PieIcon,
  ShoppingBag,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportToCSV, formatCurrency } from '../../utils/formatters';

export const ReportsView: React.FC = () => {
  const { products, salesOrders, purchaseOrders, categories, metrics, businessProfile } = useApp();

  // 1. Sales vs Purchase Monthly Comparison
  const monthlyComparison = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    const data = months.map((m) => ({
      name: m,
      Sales: 0,
      Purchases: 0,
      Profit: 0,
    }));

    salesOrders.forEach((so) => {
      if (so.status !== 'cancelled') {
        const d = new Date(so.orderDate);
        if (d.getFullYear() === currentYear) {
          const mIdx = d.getMonth();
          data[mIdx].Sales += so.grandTotal;
          data[mIdx].Profit += so.grossProfit || 0;
        }
      }
    });

    purchaseOrders.forEach((po) => {
      if (po.status !== 'cancelled') {
        const d = new Date(po.orderDate);
        if (d.getFullYear() === currentYear) {
          const mIdx = d.getMonth();
          data[mIdx].Purchases += po.grandTotal;
        }
      }
    });

    // Provide sample distribution if sparse
    if (data.every((d) => d.Sales === 0 && d.Purchases === 0)) {
      return [
        { name: 'Jan', Sales: 4200, Purchases: 3100, Profit: 1100 },
        { name: 'Feb', Sales: 5800, Purchases: 4200, Profit: 1600 },
        { name: 'Mar', Sales: 7100, Purchases: 4900, Profit: 2200 },
        { name: 'Apr', Sales: 8900, Purchases: 6200, Profit: 2700 },
        { name: 'May', Sales: 9400, Purchases: 5800, Profit: 3600 },
        { name: 'Jun', Sales: 12200, Purchases: 7400, Profit: 4800 },
        { name: 'Jul', Sales: 11500, Purchases: 8100, Profit: 3400 },
        { name: 'Aug', Sales: 14800, Purchases: 9200, Profit: 5600 },
      ];
    }

    return data;
  }, [salesOrders, purchaseOrders]);

  // 2. Category Share Data
  const categoryShare = useMemo(() => {
    return categories.map((cat) => {
      const catProducts = products.filter((p) => p.categoryId === cat.id);
      const stockValuation = catProducts.reduce(
        (sum, p) => sum + p.currentStock * p.purchasePrice,
        0
      );
      return {
        name: cat.name,
        value: stockValuation,
        color: cat.color,
      };
    }).filter((c) => c.value > 0);
  }, [categories, products]);

  // 3. Top Products by Sold Volume & Revenue
  const topProducts = useMemo(() => {
    const productMap: Record<string, { name: string; sku: string; unitsSold: number; revenue: number }> =
      {};

    salesOrders.forEach((so) => {
      if (so.status !== 'cancelled') {
        so.items.forEach((item) => {
          if (!productMap[item.productId]) {
            productMap[item.productId] = {
              name: item.productName,
              sku: item.sku,
              unitsSold: 0,
              revenue: 0,
            };
          }
          productMap[item.productId].unitsSold += item.quantity;
          productMap[item.productId].revenue += item.total;
        });
      }
    });

    return Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [salesOrders]);

  // 4. Low stock restock urgency
  const urgentRestockItems = useMemo(() => {
    return products
      .filter((p) => p.currentStock <= p.minReorderLevel)
      .sort((a, b) => a.currentStock - b.currentStock);
  }, [products]);

  const handleExportExecutiveSummary = () => {
    const summary = [
      { Metric: 'Total Revenue Invoiced', Value: metrics.totalSalesRevenue },
      { Metric: 'Total Purchase Spend', Value: metrics.totalPurchasesSpend },
      { Metric: 'Gross Profit Generated', Value: metrics.grossProfit },
      { Metric: 'Inventory Cost Valuation', Value: metrics.inventoryCostValuation },
      { Metric: 'Inventory Retail Valuation', Value: metrics.inventoryRetailValuation },
      { Metric: 'Accounts Receivable Due', Value: metrics.accountsReceivable },
      { Metric: 'Accounts Payable Due', Value: metrics.accountsPayable },
      { Metric: 'Total Active SKUs', Value: products.length },
      { Metric: 'Low Stock Alerts', Value: urgentRestockItems.length },
    ];
    exportToCSV(`executive_financial_report_${new Date().toISOString().split('T')[0]}`, summary);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif italic text-[#3E4A3D]">Executive Intelligence & Business Analytics</h2>
          <p className="text-xs sm:text-sm text-[#8A8882] mt-0.5">
            Holistic insights into sales velocity, procurement expense ratios, category profitability, and working capital.
          </p>
        </div>

        <button
          onClick={handleExportExecutiveSummary}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#3E4A3D] hover:bg-[#2D362C] text-white text-xs font-semibold rounded-full shadow-xs transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Executive Report CSV
        </button>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#8A8882] uppercase">Gross Profit Rate</span>
            <span className="px-2 py-0.5 rounded-full bg-[#A7C4BC]/20 text-[#3E4A3D] font-semibold text-xs border border-[#A7C4BC]/30">
              {metrics.grossProfitMargin.toFixed(1)}%
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-[#3E4A3D] mt-2">
            {formatCurrency(metrics.grossProfit, businessProfile.currencySymbol)}
          </div>
          <span className="text-[11px] text-[#8A8882] mt-0.5 block">Net sales margin</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#8A8882] uppercase">Sales to Purchase Ratio</span>
            <span className="px-2 py-0.5 rounded-full bg-[#3E4A3D]/10 text-[#3E4A3D] font-semibold text-xs border border-[#3E4A3D]/20">
              {(
                metrics.totalSalesRevenue / (metrics.totalPurchasesSpend > 0 ? metrics.totalPurchasesSpend : 1)
              ).toFixed(2)}x
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-[#3E4A3D] mt-2">
            {formatCurrency(metrics.totalSalesRevenue, businessProfile.currencySymbol)}
          </div>
          <span className="text-[11px] text-[#8A8882] mt-0.5 block">Total turnover generated</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#8A8882] uppercase">Working Capital in Stock</span>
            <span className="px-2 py-0.5 rounded-full bg-[#A7C4BC]/20 text-[#3E4A3D] font-semibold text-xs border border-[#A7C4BC]/30">
              {products.length} SKUs
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-[#3E4A3D] mt-2">
            {formatCurrency(metrics.inventoryCostValuation, businessProfile.currencySymbol)}
          </div>
          <span className="text-[11px] text-[#8A8882] mt-0.5 block font-medium">
            At purchase cost value
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#8A8882] uppercase">Net Working Dues</span>
            <span className="px-2 py-0.5 rounded-full bg-[#C97B5A]/15 text-[#C97B5A] font-semibold text-xs border border-[#C97B5A]/25">
              Receivables - Payables
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-[#3E4A3D] mt-2">
            {formatCurrency(
              metrics.accountsReceivable - metrics.accountsPayable,
              businessProfile.currencySymbol
            )}
          </div>
          <span className="text-[11px] text-[#8A8882] mt-0.5 block">
            AR: {formatCurrency(metrics.accountsReceivable, businessProfile.currencySymbol)} | AP:{' '}
            {formatCurrency(metrics.accountsPayable, businessProfile.currencySymbol)}
          </span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Comparison */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#2D2D2A] text-sm">Revenue vs Procurement vs Margin</h3>
              <p className="text-xs text-[#8A8882]">Monthly breakdown for active fiscal cycle</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-[#8A8882] font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3E4A3D]"></span> Sales
              </span>
              <span className="flex items-center gap-1.5 text-[#8A8882] font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A7C4BC]"></span> Purchases
              </span>
              <span className="flex items-center gap-1.5 text-[#8A8882] font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C97B5A]"></span> Profit
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparison}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F1ED" />
                <XAxis dataKey="name" tickLine={false} stroke="#8A8882" fontSize={11} />
                <YAxis
                  tickLine={false}
                  stroke="#8A8882"
                  fontSize={11}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  formatter={(val: any) =>
                    formatCurrency(Number(val), businessProfile.currencySymbol)
                  }
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid #E6E4DF',
                    backgroundColor: '#FAF9F6',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="Sales" fill="#3E4A3D" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Purchases" fill="#A7C4BC" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Profit" fill="#C97B5A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Donut */}
        <div className="bg-white p-6 rounded-3xl border border-[#E6E4DF] shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-[#2D2D2A] text-sm">Inventory Asset Distribution</h3>
            <p className="text-xs text-[#8A8882]">Stock capital allocation by category</p>
          </div>

          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryShare}
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryShare.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) =>
                    formatCurrency(Number(val), businessProfile.currencySymbol)
                  }
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid #E6E4DF',
                    backgroundColor: '#FAF9F6',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 text-xs">
            {categoryShare.map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-[#8A8882] text-[11px]">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                  <span className="truncate">{cat.name}</span>
                </div>
                <span className="font-bold font-mono text-[#2D2D2A] shrink-0">
                  {formatCurrency(cat.value, businessProfile.currencySymbol)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products & Low Stock Urgency Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white p-6 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#2D2D2A] text-sm">Top Revenue Driving Products</h3>
              <p className="text-xs text-[#8A8882]">Highest sales gross volume</p>
            </div>
            <ShoppingBag className="w-4 h-4 text-[#8A8882]" />
          </div>

          <div className="divide-y divide-[#F3F1ED]">
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-[#8A8882] text-xs">No sales recorded yet.</div>
            ) : (
              topProducts.map((p, idx) => (
                <div key={idx} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#F3F1ED] text-[#3E4A3D] flex items-center justify-center font-bold text-[11px]">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-[#2D2D2A]">{p.name}</div>
                      <div className="text-[11px] text-[#8A8882] font-mono">{p.sku}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-[#3E4A3D]">
                      {formatCurrency(p.revenue, businessProfile.currencySymbol)}
                    </div>
                    <div className="text-[11px] text-[#8A8882]">{p.unitsSold} units sold</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Restock Table */}
        <div className="bg-white p-6 rounded-3xl border border-[#E6E4DF] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#2D2D2A] text-sm">Stock Replenishment Urgency</h3>
              <p className="text-xs text-[#8A8882]">Items below minimum reorder threshold</p>
            </div>
            <AlertTriangle className="w-4 h-4 text-[#C97B5A]" />
          </div>

          <div className="divide-y divide-[#F3F1ED]">
            {urgentRestockItems.length === 0 ? (
              <div className="py-8 text-center text-[#3E4A3D] font-semibold text-xs">
                All catalog inventory levels are healthy!
              </div>
            ) : (
              urgentRestockItems.map((p) => {
                const isZero = p.currentStock <= 0;
                return (
                  <div key={p.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-[#2D2D2A]">{p.name}</div>
                      <div className="text-[11px] text-[#8A8882] font-mono">
                        {p.sku} • Location: {p.location || 'Warehouse'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-bold font-mono ${
                          isZero ? 'text-[#C97B5A]' : 'text-[#8A8882]'
                        }`}
                      >
                        {p.currentStock} {p.unit} remaining
                      </div>
                      <div className="text-[11px] text-[#8A8882]">Min Alert: {p.minReorderLevel}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
