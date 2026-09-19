"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type KPIData = {
  total_revenue: number;
  total_units_sold: number;
  average_selling_price: number;
  total_profit: number;
  monthly: {
    month: string;
    revenue: number;
    profit: number;
  }[];
  category: {
    category: string;
    revenue: number;
    units_sold: number;
  }[];
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);

export default function Home() {
  const [data, setData] = useState<KPIData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/pricing/kpis")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch KPIs");
        return res.json();
      })
      .then((result) => setData(result))
      .catch(() => setError("Could not connect to backend."));
  }, []);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading PricePilot AI...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">
            PricePilot AI
          </h1>
          <p className="text-slate-500 mt-2">
            Pricing & Revenue Intelligence Dashboard
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <p className="text-sm text-slate-500">Total Revenue</p>
            <h2 className="text-2xl font-bold mt-2">
              ₹{formatNumber(data.total_revenue)}
            </h2>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <p className="text-sm text-slate-500">Total Units Sold</p>
            <h2 className="text-2xl font-bold mt-2">
              {formatNumber(data.total_units_sold)}
            </h2>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <p className="text-sm text-slate-500">
              Average Selling Price
            </p>
            <h2 className="text-2xl font-bold mt-2">
              ₹{formatNumber(data.average_selling_price)}
            </h2>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <p className="text-sm text-slate-500">Total Profit</p>
            <h2 className="text-2xl font-bold mt-2">
              ₹{formatNumber(data.total_profit)}
            </h2>
          </div>

        </div>

        {/* Revenue & Profit */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-5">
              Revenue Over Time
            </h2>

            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-xl font-semibold mb-5">
              Profit Over Time
            </h2>

            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="profit"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* Category Revenue */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mt-6">
          <h2 className="text-xl font-semibold mb-5">
            Revenue by Category
          </h2>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.category}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </main>
  );
}