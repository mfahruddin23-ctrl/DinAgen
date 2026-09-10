import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { Transaction, CashIn, CashOut } from '../types';
import { formatRupiah } from '../utils/formatters';

// Register all Chart.js controllers, scales, elements, and plugins
Chart.register(...registerables);

interface DashboardChartsProps {
  transactions: Transaction[];
  cashIn: CashIn[];
  cashOut: CashOut[];
  filterType: 'today' | 'week' | 'month' | 'year' | 'all';
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  transactions,
  cashIn,
  cashOut
}) => {
  const chart1Ref = useRef<HTMLCanvasElement | null>(null);
  const chart2Ref = useRef<HTMLCanvasElement | null>(null);
  const chart3Ref = useRef<HTMLCanvasElement | null>(null);
  const chart4Ref = useRef<HTMLCanvasElement | null>(null);
  const chart5Ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const instances: Chart[] = [];

    const safeCreateChart = (canvas: HTMLCanvasElement | null, config: any): Chart | null => {
      if (!canvas) return null;
      // Safely destroy existing chart attached to this canvas to prevent "Canvas is already in use" error
      const existing = Chart.getChart(canvas);
      if (existing) {
        existing.destroy();
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const chartInstance = new Chart(ctx, config);
      instances.push(chartInstance);
      return chartInstance;
    };

    // Helper: generate last 7 days dates
    const last7Days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      last7Days.push(`${y}-${m}-${day}`);
    }

    const dayLabels = last7Days.map(dateStr => {
      const parts = dateStr.split('-');
      return `${parts[2]}/${parts[1]}`;
    });

    // 1. Grafik Transaksi Harian (Total Nominal Transaksi per Hari)
    if (chart1Ref.current) {
      const dailyNominals = last7Days.map(d => {
        return transactions
          .filter(t => t.tanggal === d && t.status === 'Berhasil')
          .reduce((sum, t) => sum + t.nominal, 0);
      });

      safeCreateChart(chart1Ref.current, {
        type: 'line',
        data: {
          labels: dayLabels,
          datasets: [
            {
              label: 'Volume Nominal Transaksi',
              data: dailyNominals,
              borderColor: '#0284c7',
              backgroundColor: 'rgba(2, 132, 199, 0.15)',
              tension: 0.35,
              fill: true,
              pointBackgroundColor: '#0284c7',
              pointRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx: any) => `Nominal: ${formatRupiah(ctx.raw as number)}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: any) => {
                  const num = Number(value);
                  return num >= 1000000 ? `${num / 1000000}Jt` : `${num / 1000}k`;
                }
              }
            }
          }
        }
      });
    }

    // 2. Grafik Pemasukan vs Pengeluaran
    if (chart2Ref.current) {
      const dailyIncome = last7Days.map(d => {
        const trxSum = transactions
          .filter(t => t.tanggal === d && t.status === 'Berhasil')
          .reduce((sum, t) => sum + t.totalBayar, 0);
        const cinSum = cashIn
          .filter(c => c.tanggal === d)
          .reduce((sum, c) => sum + c.nominal, 0);
        return trxSum + cinSum;
      });

      const dailyExpense = last7Days.map(d => {
        const trxOut = transactions
          .filter(t => t.tanggal === d && t.status === 'Berhasil')
          .reduce((sum, t) => sum + t.modalTransaksi, 0);
        const coutSum = cashOut
          .filter(c => c.tanggal === d)
          .reduce((sum, c) => sum + c.nominal, 0);
        return trxOut + coutSum;
      });

      safeCreateChart(chart2Ref.current, {
        type: 'bar',
        data: {
          labels: dayLabels,
          datasets: [
            {
              label: 'Pemasukan (Uang Masuk)',
              data: dailyIncome,
              backgroundColor: '#10b981',
              borderRadius: 6
            },
            {
              label: 'Pengeluaran (Modal Keluar)',
              data: dailyExpense,
              backgroundColor: '#f43f5e',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
            tooltip: {
              callbacks: {
                label: (ctx: any) => `${ctx.dataset.label}: ${formatRupiah(ctx.raw as number)}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: any) => {
                  const num = Number(value);
                  return num >= 1000000 ? `${num / 1000000}Jt` : `${num / 1000}k`;
                }
              }
            }
          }
        }
      });
    }

    // 3. Grafik Keuntungan Bulanan
    if (chart3Ref.current) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthlyProfits = new Array(12).fill(0);
      transactions
        .filter(t => t.status === 'Berhasil' && t.tanggal)
        .forEach(t => {
          const parts = t.tanggal.split('-');
          if (parts.length >= 2) {
            const m = parseInt(parts[1], 10) - 1;
            if (m >= 0 && m < 12) {
              monthlyProfits[m] += t.keuntungan;
            }
          }
        });

      safeCreateChart(chart3Ref.current, {
        type: 'bar',
        data: {
          labels: monthNames,
          datasets: [
            {
              label: 'Keuntungan Bersih (Rp)',
              data: monthlyProfits,
              backgroundColor: '#8b5cf6',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx: any) => `Keuntungan: ${formatRupiah(ctx.raw as number)}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: any) => {
                  const num = Number(value);
                  return num >= 1000 ? `${num / 1000}k` : `${num}`;
                }
              }
            }
          }
        }
      });
    }

    // 4. Grafik Jenis Transaksi (Doughnut)
    if (chart4Ref.current) {
      const typeCounts: Record<string, number> = {};
      transactions.forEach(t => {
        const type = t.jenisTransaksi || 'Lainnya';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      const labels = Object.keys(typeCounts);
      const data = Object.values(typeCounts);
      const colors = [
        '#0284c7', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6',
        '#06b6d4', '#f97316', '#64748b', '#14b8a6', '#6366f1'
      ];

      safeCreateChart(chart4Ref.current, {
        type: 'doughnut',
        data: {
          labels: labels.length > 0 ? labels : ['Belum Ada'],
          datasets: [
            {
              data: data.length > 0 ? data : [1],
              backgroundColor: colors.slice(0, labels.length || 1),
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { boxWidth: 10, font: { size: 10 } }
            }
          },
          cutout: '65%'
        }
      });
    }

    // 5. Grafik Jumlah Transaksi per Hari
    if (chart5Ref.current) {
      const dailyCounts = last7Days.map(d => {
        return transactions.filter(t => t.tanggal === d).length;
      });

      safeCreateChart(chart5Ref.current, {
        type: 'bar',
        data: {
          labels: dayLabels,
          datasets: [
            {
              label: 'Jumlah Transaksi',
              data: dailyCounts,
              backgroundColor: '#02539a',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx: any) => `${ctx.raw} transaksi`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 }
            }
          }
        }
      });
    }

    return () => {
      instances.forEach(chart => {
        try {
          chart.destroy();
        } catch {
          // Ignore if already destroyed
        }
      });
    };
  }, [transactions, cashIn, cashOut]);

  return (
    <div className="space-y-6">
      {/* Row 1: Line chart & Pemasukan vs Pengeluaran */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Grafik Transaksi Harian (7 Hari)</h3>
              <p className="text-xs text-slate-400">Tren akumulasi volume nominal transaksi</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold">
              Nominal
            </span>
          </div>
          <div className="h-64 w-full">
            <canvas id="chart-daily-trx-volume" ref={chart1Ref} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Pemasukan vs Pengeluaran</h3>
              <p className="text-xs text-slate-400">Komparasi uang masuk kas vs modal terdebit</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
              Cashflow
            </span>
          </div>
          <div className="h-64 w-full">
            <canvas id="chart-income-vs-expense" ref={chart2Ref} />
          </div>
        </div>
      </div>

      {/* Row 2: Keuntungan Bulanan, Jenis Transaksi, & Jumlah Transaksi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Grafik Keuntungan Bulanan</h3>
            <p className="text-xs text-slate-400">Total laba admin bersih per bulan</p>
          </div>
          <div className="h-56 w-full">
            <canvas id="chart-monthly-profit" ref={chart3Ref} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Distribusi Jenis Transaksi</h3>
            <p className="text-xs text-slate-400">Proporsi layanan terpopuler</p>
          </div>
          <div className="h-56 w-full">
            <canvas id="chart-trx-distribution" ref={chart4Ref} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Jumlah Transaksi per Hari</h3>
            <p className="text-xs text-slate-400">Frekuensi transaksi yang dilayani</p>
          </div>
          <div className="h-56 w-full">
            <canvas id="chart-daily-trx-count" ref={chart5Ref} />
          </div>
        </div>
      </div>
    </div>
  );
};
