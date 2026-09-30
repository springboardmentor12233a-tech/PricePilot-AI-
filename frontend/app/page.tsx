"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "recharts";

type Inputs = {
  productName: string;
  category: string;
  store: string;
  dept: string;
  isHoliday: string;
  temperature: string;
  fuelPrice: string;
  markdown1: string;
  markdown2: string;
  markdown3: string;
  markdown4: string;
  markdown5: string;
  cpi: string;
  unemployment: string;
  size: string;
  year: string;
  month: string;
  week: string;
  storeType: string;
  price: string;
  targetSales: string;
  cost: string;
  previousSales: string;
  unitsSold: string;
  competitorA: string;
  competitorB: string;
};

type Product = Inputs & { id: string; updatedAt: string };

type ForecastData = {
  short_term_forecast: number;
  medium_term_forecast: number;
  long_term_forecast: number;
  confidence: number;
  trend: string;
};

type ProfitabilityData = {
  revenue: number;
  total_cost?: number;
  cost?: number;
  profit: number;
  profit_margin: number;
};

type CompetitorData = {
  our_price: number;
  market_average: number;
  price_difference: number;
  difference_percent: number;
  competitors: { name: string; price: number }[];
};

type AnalysisResult = {
  predictedSales: number;
  recommendedPrice: number;
  action: string;
  explanation: string;
};

type StrategyData = {
  strategy: string;
  action: string;
  recommended_price: number;
  reason?: string;
  explanation?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

const emptyInputs: Inputs = {
  productName: "",
  category: "",
  store: "",
  dept: "",
  isHoliday: "",
  temperature: "",
  fuelPrice: "",
  markdown1: "",
  markdown2: "",
  markdown3: "",
  markdown4: "",
  markdown5: "",
  cpi: "",
  unemployment: "",
  size: "",
  year: "",
  month: "",
  week: "",
  storeType: "",
  price: "",
  targetSales: "",
  cost: "",
  previousSales: "",
  unitsSold: "",
  competitorA: "",
  competitorB: "",
};

const money = (value: number | undefined | null) =>
  typeof value === "number" && Number.isFinite(value)
    ? `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
    : "—";

const number = (value: number | undefined | null) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString("en-IN", { maximumFractionDigits: 2 })
    : "—";

const cleanAIText = (text: unknown) =>
  String(text ?? "")
    .replace(/\*\*/g, "")
    .replace(/#{1,6}\s*/g, "")
    .replace(/^\s*[-•]\s*/gm, "")
    .trim();

async function readApiResponse(response: Response): Promise<any> {
  const raw = await response.text();
  let data: any = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
  if (!response.ok) {
    const message = data?.error || data?.detail || raw?.trim() || `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return data ?? {};
}

function Field({
  label,
  value,
  onChange,
  type = "number",
  placeholder,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-[#5D5060]">
        {label} {required && <span className="text-[#E4776F]">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-[#E8D9D6] bg-white px-3.5 py-3 text-[#493B50] outline-none transition focus:border-[#E4776F] focus:ring-4 focus:ring-[#E4776F]/10"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-[#5D5060]">
        {label} {required && <span className="text-[#E4776F]">*</span>}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-xl border border-[#E8D9D6] bg-white px-3.5 py-3 text-[#493B50] outline-none transition focus:border-[#E4776F] focus:ring-4 focus:ring-[#E4776F]/10"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#B16A91]">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-2xl font-extrabold text-[#493B50]">{title}</h2>
      <p className="mt-1 text-sm text-[#817180]">{description}</p>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#E5D6D2] bg-[#FFFBFA] p-8 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#F9E6E3] text-xl">
        ✦
      </div>
      <h3 className="font-bold text-[#554554]">{title}</h3>
      <p className="mx-auto mt-1 max-w-lg text-sm text-[#8A7A88]">{text}</p>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: (storeId: string) => void }) {
  const [storeId, setStoreId] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const validStore = storeId.trim().toLowerCase() === "walmart";
    const validPassword = password === "walmart@5677";
    if (!validStore || !validPassword) {
      setLoginError("Invalid Store ID or password. Please check your credentials.");
      return;
    }
    localStorage.setItem("pricepilot-authenticated", "true");
    localStorage.setItem("pricepilot-store-id", "walmart");
    onLogin("walmart");
  };

  return (
    <main className="min-h-screen bg-[#FBF8F7] px-5 py-8 text-[#493B50]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-[#E8D9D6] bg-white shadow-[0_24px_80px_rgba(73,59,80,0.12)] lg:grid-cols-2">
          <div className="hidden bg-gradient-to-br from-[#F8E5E1] via-[#F2E6F3] to-[#E8F4ED] p-12 lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="text-2xl font-black tracking-tight">PricePilot<span className="text-[#E4776F]"> AI</span></div>
              <p className="mt-2 text-sm text-[#817180]">Pricing & revenue intelligence</p>
            </div>
            <div>
              <div className="mb-4 text-5xl">✦</div>
              <h1 className="max-w-md text-4xl font-black leading-tight text-[#493B50]">Smarter pricing starts with better decisions.</h1>
              <p className="mt-4 max-w-md text-base leading-7 text-[#756675]">Sign in to your store workspace to manage products, run pricing analysis, explore market intelligence and generate reports.</p>
            </div>
            <div className="text-xs font-semibold text-[#8A7A88]">Secure store workspace · PricePilot AI</div>
          </div>

          <div className="p-7 sm:p-10 lg:p-14">
            <div className="mx-auto max-w-md">
              <div className="mb-8 lg:hidden">
                <div className="text-2xl font-black tracking-tight">PricePilot<span className="text-[#E4776F]"> AI</span></div>
                <p className="mt-1 text-sm text-[#817180]">Pricing & revenue intelligence</p>
              </div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#B16A91]">Store access</p>
              <h2 className="mt-2 text-3xl font-black text-[#493B50]">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-[#817180]">Enter your store credentials to continue to PricePilot.</p>

              <form onSubmit={submit} className="mt-8 space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#5D5060]">Store ID</span>
                  <input value={storeId} onChange={(e) => { setStoreId(e.target.value); setLoginError(""); }} autoComplete="username" placeholder="Enter Store ID" className="w-full rounded-xl border border-[#E8D9D6] bg-[#FFFBFA] px-4 py-3.5 text-[#493B50] outline-none transition focus:border-[#E4776F] focus:ring-4 focus:ring-[#E4776F]/10" />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#5D5060]">Password</span>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setLoginError(""); }} autoComplete="current-password" placeholder="Enter password" className="w-full rounded-xl border border-[#E8D9D6] bg-[#FFFBFA] px-4 py-3.5 pr-20 text-[#493B50] outline-none transition focus:border-[#E4776F] focus:ring-4 focus:ring-[#E4776F]/10" />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-[#8A7A88] hover:bg-[#F7ECEA]">{showPassword ? "Hide" : "Show"}</button>
                  </div>
                </label>

                {loginError && <div className="rounded-xl border border-[#F0B8B2] bg-[#FFF0EE] px-4 py-3 text-sm font-semibold text-[#A34E48]">{loginError}</div>}

                <button type="submit" className="w-full rounded-xl bg-[#493B50] px-4 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#3F3345]">Sign in to PricePilot</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [storeId, setStoreId] = useState("");
  const [inputs, setInputs] = useState<Inputs>({ ...emptyInputs });
  const [products, setProducts] = useState<Product[]>([]);
  const [activeProductId, setActiveProductId] = useState("");
  const [section, setSection] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [profitability, setProfitability] = useState<ProfitabilityData | null>(null);
  const [competitor, setCompetitor] = useState<CompetitorData | null>(null);
  const [selectedChartItem, setSelectedChartItem] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loggedIn = localStorage.getItem("pricepilot-authenticated") === "true";
    const savedStore = localStorage.getItem("pricepilot-store-id") || "";
    setAuthenticated(loggedIn);
    setStoreId(savedStore);
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("pricepilot-products");
      if (saved) setProducts(JSON.parse(saved));
    } catch {
      // Keep the app usable if local storage contains invalid data.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("pricepilot-products", JSON.stringify(products));
    } catch {
      // Storage is an enhancement; analysis still works without it.
    }
  }, [products]);

  const logout = () => {
    localStorage.removeItem("pricepilot-authenticated");
    localStorage.removeItem("pricepilot-store-id");
    setAuthenticated(false);
    setStoreId("");
    setChatOpen(false);
  };

  const update = (key: keyof Inputs, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const numericFields: (keyof Inputs)[] = [
    "store",
    "dept",
    "temperature",
    "fuelPrice",
    "markdown1",
    "markdown2",
    "markdown3",
    "markdown4",
    "markdown5",
    "cpi",
    "unemployment",
    "size",
    "year",
    "month",
    "week",
    "price",
    "targetSales",
    "cost",
    "previousSales",
    "unitsSold",
    "competitorA",
    "competitorB",
  ];

  const validate = () => {
    const required: (keyof Inputs)[] = [
      "productName",
      "store",
      "dept",
      "isHoliday",
      "temperature",
      "fuelPrice",
      "markdown1",
      "markdown2",
      "markdown3",
      "markdown4",
      "markdown5",
      "cpi",
      "unemployment",
      "size",
      "year",
      "month",
      "week",
      "storeType",
      "price",
      "targetSales",
      "cost",
      "previousSales",
      "unitsSold",
      "competitorA",
      "competitorB",
    ];

    for (const key of required) {
      if (!String(inputs[key]).trim()) {
        setError("Please complete every required field before running the analysis.");
        return false;
      }
    }

    for (const key of numericFields) {
      if (!Number.isFinite(Number(inputs[key]))) {
        setError("Every numeric field must contain a valid number.");
        return false;
      }
    }

    if (Number(inputs.price) < 0 || Number(inputs.cost) < 0 || Number(inputs.unitsSold) < 0) {
      setError("Price, cost and units sold cannot be negative.");
      return false;
    }

    return true;
  };

  const saveProduct = () => {
    if (!validate()) return;
    const id = activeProductId || crypto.randomUUID();
    const product: Product = {
      ...inputs,
      id,
      updatedAt: new Date().toISOString(),
    };

    setProducts((prev) => {
      const exists = prev.some((item) => item.id === id);
      return exists ? prev.map((item) => (item.id === id ? product : item)) : [product, ...prev];
    });

    setActiveProductId(id);
    setSection("dashboard");
    setError("");
  };

  const loadProduct = (product: Product) => {
    const { id, updatedAt, ...data } = product;
    setInputs(data);
    setActiveProductId(id);
    setResult(null);
    setStrategy(null);
    setForecast(null);
    setProfitability(null);
    setCompetitor(null);
    setChatMessages([]);
    setError("");
    setSection("dashboard");
  };

  const newProduct = () => {
    setInputs({ ...emptyInputs });
    setActiveProductId("");
    setResult(null);
    setStrategy(null);
    setForecast(null);
    setProfitability(null);
    setCompetitor(null);
    setChatMessages([]);
    setError("");
    setSection("dashboard");
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
    if (activeProductId === id) newProduct();
  };

  const getRecommendation = async () => {
    if (!validate()) return;
    setLoading(true);
    setError("");
    setSelectedChartItem(null);

    try {
      const predictionPayload = {
        Store: Number(inputs.store),
        Dept: Number(inputs.dept),
        IsHoliday: inputs.isHoliday === "true",
        Temperature: Number(inputs.temperature),
        Fuel_Price: Number(inputs.fuelPrice),
        MarkDown1: Number(inputs.markdown1),
        MarkDown2: Number(inputs.markdown2),
        MarkDown3: Number(inputs.markdown3),
        MarkDown4: Number(inputs.markdown4),
        MarkDown5: Number(inputs.markdown5),
        CPI: Number(inputs.cpi),
        Unemployment: Number(inputs.unemployment),
        Size: Number(inputs.size),
        Year: Number(inputs.year),
        Month: Number(inputs.month),
        Week: Number(inputs.week),
        Type_B: inputs.storeType === "B" ? 1 : 0,
        Type_C: inputs.storeType === "C" ? 1 : 0,
      };

      const predictionResponse = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(predictionPayload),
      });
      const predictionData = await readApiResponse(predictionResponse);

      const predictedSales = Number(predictionData.predicted_weekly_sales);
      if (!Number.isFinite(predictedSales)) throw new Error("The model returned an invalid prediction.");

      const recommendationResponse = await fetch("/api/recommend-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_price: Number(inputs.price),
          predicted_sales: predictedSales,
          target_sales: Number(inputs.targetSales),
        }),
      });
      const recommendationData = await readApiResponse(recommendationResponse);

      const recommendedPrice = Number(recommendationData.recommended_price);
      const action = String(recommendationData.action || "Keep price");

      const strategyResponse = await fetch("/api/pricing-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          our_price: Number(inputs.price),
          market_average: (Number(inputs.competitorA) + Number(inputs.competitorB)) / 2,
          predicted_sales: predictedSales,
          target_sales: Number(inputs.targetSales),
        }),
      });
      const strategyData = strategyResponse.ok ? await readApiResponse(strategyResponse) : null;

      const forecastResponse = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_sales: predictedSales,
          previous_sales: Number(inputs.previousSales),
        }),
      });
      const forecastData = forecastResponse.ok ? await readApiResponse(forecastResponse) : null;

      const profitabilityResponse = await fetch("/api/profitability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: Number(inputs.price),
          cost: Number(inputs.cost),
          units_sold: Number(inputs.unitsSold),
        }),
      });
      const profitabilityData = profitabilityResponse.ok ? await readApiResponse(profitabilityResponse) : null;

      const competitorResponse = await fetch("/api/competitor-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          our_price: Number(inputs.price),
          competitors: [
            { name: "Competitor A", price: Number(inputs.competitorA) },
            { name: "Competitor B", price: Number(inputs.competitorB) },
          ],
        }),
      });
      const competitorData = competitorResponse.ok ? await readApiResponse(competitorResponse) : null;

      const aiResponse = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          predicted_sales: predictedSales,
          base_price: Number(inputs.price),
          target_sales: Number(inputs.targetSales),
          recommended_price: recommendedPrice,
          action,
        }),
      });
      const aiData = aiResponse.ok ? await readApiResponse(aiResponse) : null;

      setResult({
        predictedSales,
        recommendedPrice,
        action,
        explanation: cleanAIText(aiData?.recommendation || recommendationData?.explanation || ""),
      });

      if (strategyData) {
        setStrategy({
          strategy: String(strategyData.strategy || strategyData.action || action),
          action: String(strategyData.action || action),
          recommended_price: Number(strategyData.recommended_price ?? recommendedPrice),
          reason: cleanAIText(strategyData.reason),
          explanation: cleanAIText(strategyData.explanation),
        });
      } else {
        setStrategy({
          strategy: action,
          action,
          recommended_price: recommendedPrice,
          explanation: "This strategy is based on the model demand prediction, target sales and current price.",
        });
      }

      setForecast(forecastData);
      setProfitability(profitabilityData);
      setCompetitor(competitorData);

      // Persist the latest values with the product when a product is active.
      if (inputs.productName) {
        const id = activeProductId || crypto.randomUUID();
        const product: Product = { ...inputs, id, updatedAt: new Date().toISOString() };
        setProducts((prev) =>
          prev.some((item) => item.id === id)
            ? prev.map((item) => (item.id === id ? product : item))
            : [product, ...prev]
        );
        setActiveProductId(id);
      }

      setSection("dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async () => {
    const question = chatQuestion.trim();
    if (!question || chatLoading) return;
    setChatMessages((prev) => [...prev, { role: "user", text: question }]);
    setChatQuestion("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          predicted_sales: result?.predictedSales,
          base_price: Number(inputs.price),
          target_sales: Number(inputs.targetSales),
          recommended_price: result?.recommendedPrice,
          action: result?.action,
          product_name: inputs.productName,
          market_average: competitor?.market_average,
          profit: profitability?.profit,
          profit_margin: profitability?.profit_margin,
        }),
      });
      const data = await readApiResponse(response);

      const answer = cleanAIText(data?.answer || data?.response || data?.recommendation);
      setChatMessages((prev) => [...prev, { role: "assistant", text: answer || "The AI service returned no explanation." }]);
    } catch (e) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: e instanceof Error ? e.message : "Unable to reach the AI assistant.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const downloadReport = async () => {
    if (!result) {
      setError("Run an analysis before downloading the report.");
      return;
    }

    try {
      const response = await fetch("/api/download-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: inputs.productName,
          category: inputs.category,
          store: inputs.store,
          department: inputs.dept,
          predicted_sales: result.predictedSales,
          target_sales: Number(inputs.targetSales),
          current_price: Number(inputs.price),
          recommended_price: result.recommendedPrice,
          action: result.action,
          strategy,
          forecast,
          profitability,
          competitor,
          explanation: result.explanation,
        }),
      });

      if (!response.ok) {
        const raw = await response.text();
        let message = "Report generation failed.";
        try { const data = JSON.parse(raw); message = data?.error || data?.detail || message; } catch { if (raw.trim()) message = raw.trim(); }
        throw new Error(message);
      }
      const blob = await response.blob();
      if (!blob.size) throw new Error("The report service returned an empty PDF.");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${inputs.productName || "PricePilot"}_Business_Report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate the report.");
    }
  };

  const forecastChart = forecast
    ? [
        { period: "Previous", sales: Number(inputs.previousSales) },
        { period: "Short term", sales: forecast.short_term_forecast },
        { period: "Medium term", sales: forecast.medium_term_forecast },
        { period: "Long term", sales: forecast.long_term_forecast },
      ]
    : [];

  const competitorChart = competitor
    ? [
        { name: "Your price", price: competitor.our_price },
        ...competitor.competitors.map((item) => ({ name: item.name, price: item.price })),
        { name: "Market average", price: competitor.market_average },
      ]
    : [];

  const profitChart = profitability
    ? [
        { name: "Revenue", value: Math.max(0, profitability.revenue) },
        { name: "Cost", value: Math.max(0, profitability.total_cost ?? profitability.cost ?? 0) },
        { name: "Profit", value: Math.max(0, profitability.profit) },
      ]
    : [];

  const marketStatus = useMemo(() => {
    if (!competitor) return "—";
    if (competitor.difference_percent > 5) return "Above market";
    if (competitor.difference_percent < -5) return "Below market";
    return "Near market";
  }, [competitor]);

  const nav = [
    ["dashboard", "Overview", "⌂"],
    ["products", "Product Catalog", "▦"],
    ["analysis", "Run Analysis", "✦"],
    ["strategy", "Pricing Strategy", "↗"],
    ["analytics", "Visual Analytics", "◒"],
    ["competitors", "Competitors", "◎"],
    ["assistant", "AI Assistant", "✧"],
  ] as const;

  if (!authChecked) {
    return <main className="min-h-screen bg-[#FBF8F7]" />;
  }

  if (!authenticated) {
    return <LoginScreen onLogin={(id) => { setStoreId(id); setAuthenticated(true); }} />;
  }

  return (
    <main className="min-h-screen bg-[#FBF8F7] text-[#493B50]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-[#EDE1DE] bg-[#FFFDFC] lg:block">
          <div className="sticky top-0 flex h-screen flex-col p-5">
            <button onClick={() => setSection("dashboard")} className="text-left">
              <div className="text-xl font-black tracking-tight">PricePilot<span className="text-[#E4776F]"> AI</span></div>
              <div className="mt-1 text-xs text-[#8A7A88]">Pricing & revenue intelligence</div>
            </button>

            <div className="mt-7 rounded-2xl bg-[#F9ECE9] p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#A66A79]">Active product</div>
              <div className="mt-1 truncate font-bold">{inputs.productName || "No product selected"}</div>
              <div className="mt-1 text-xs text-[#8A7A88]">
                {result ? "Analysis available" : "Ready for analysis"}
              </div>
            </div>

            <nav className="mt-6 space-y-1">
              {nav.map(([id, label, icon]) => (
                <button
                  key={id}
                  onClick={() => setSection(id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                    section === id ? "bg-[#F4DDD9] text-[#9B5D68]" : "text-[#756675] hover:bg-[#FAF2F0]"
                  }`}
                >
                  <span className="w-5 text-center">{icon}</span>
                  {label}
                </button>
              ))}
            </nav>

            <div className="mt-auto space-y-2">
              <button onClick={newProduct} className="w-full rounded-xl border border-[#E8D9D6] bg-white px-4 py-3 text-sm font-bold">
                + New Product
              </button>
              <button onClick={downloadReport} disabled={!result} className="w-full rounded-xl bg-[#493B50] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
                Download Report
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-[#EDE1DE] bg-[#FBF8F7]/90 backdrop-blur-xl">
            <div className="flex items-center justify-between px-5 py-4 md:px-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B16A91]">PricePilot workspace</p>
                <h1 className="text-xl font-extrabold md:text-2xl">
                  {section === "products" ? "Product Catalog & Pricing Inventory" :
                   section === "analysis" ? "Pricing Analysis" :
                   section === "strategy" ? "Pricing Strategy" :
                   section === "analytics" ? "Visual Analytics" :
                   section === "competitors" ? "Competitor Benchmarking" :
                   section === "assistant" ? "AI Pricing Advisor" : "Executive Pricing Intelligence"}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden rounded-full bg-[#E8F4ED] px-3 py-2 text-xs font-bold text-[#4D8A72] sm:inline-flex">● Model connected</span>
                <span className="hidden rounded-xl border border-[#E6D8D5] bg-white px-3 py-2 text-xs font-bold text-[#6F6070] md:inline-flex">Store: {storeId}</span>
                {result && (
                  <button onClick={downloadReport} className="hidden rounded-xl bg-[#493B50] px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#5A4A62] md:inline-flex md:items-center md:gap-2">
                    ↓ Download Report
                  </button>
                )}
                <button onClick={() => setSection("products")} className="rounded-xl border border-[#E6D8D5] bg-white px-3 py-2 text-sm font-bold">Catalog</button>
                <button onClick={logout} className="rounded-xl border border-[#E6D8D5] bg-white px-3 py-2 text-sm font-bold text-[#8A5960]">Logout</button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl p-5 md:p-8">
            {error && (
              <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-[#F0B8B2] bg-[#FFF0EE] p-4 text-sm text-[#A34E48]">
                <span>{error}</span>
                <button onClick={() => setError("")} className="font-bold">×</button>
              </div>
            )}

            {section === "products" && (
              <section>
                <SectionTitle eyebrow="Inventory" title="Product Catalog & Pricing Inventory" description="Store real products and reopen their latest pricing inputs and analysis." />
                <div className="mb-6 grid gap-4 rounded-3xl border border-[#E9DDDA] bg-white p-5 shadow-sm md:grid-cols-[1fr_auto]">
                  <div>
                    <h3 className="font-extrabold">Product storage</h3>
                    <p className="mt-1 text-sm text-[#837483]">Products are persisted in this browser so you can return to them without re-entering everything.</p>
                  </div>
                  <button onClick={newProduct} className="rounded-xl bg-[#E4776F] px-5 py-3 text-sm font-bold text-white">+ Add Product</button>
                </div>

                {products.length === 0 ? (
                  <EmptyState title="No products stored yet" text="Add a product from Run Analysis. Nothing is pre-populated." />
                ) : (
                  <div className="overflow-hidden rounded-3xl border border-[#E9DDDA] bg-white shadow-sm">
                    <div className="hidden grid-cols-[1.4fr_.8fr_.8fr_.8fr_.8fr_auto] gap-4 border-b border-[#EEE3E0] bg-[#FFFAF9] px-5 py-4 text-xs font-extrabold uppercase tracking-wider text-[#897887] md:grid">
                      <span>Product</span><span>Category</span><span>Price</span><span>Target</span><span>Updated</span><span />
                    </div>
                    {products.map((product) => (
                      <div key={product.id} className="grid gap-3 border-b border-[#F0E6E3] p-5 last:border-0 md:grid-cols-[1.4fr_.8fr_.8fr_.8fr_.8fr_auto] md:items-center md:gap-4">
                        <button onClick={() => loadProduct(product)} className="text-left">
                          <div className="font-extrabold">{product.productName}</div>
                          <div className="text-xs text-[#8A7A88]">Store {product.store} · Dept {product.dept}</div>
                        </button>
                        <div className="text-sm">{product.category || "—"}</div>
                        <div className="font-bold">{money(Number(product.price))}</div>
                        <div className="text-sm">{number(Number(product.targetSales))}</div>
                        <div className="text-xs text-[#8A7A88]">{new Date(product.updatedAt).toLocaleDateString("en-IN")}</div>
                        <div className="flex gap-2">
                          <button onClick={() => loadProduct(product)} className="rounded-lg bg-[#F5E5E1] px-3 py-2 text-xs font-bold">Open</button>
                          <button onClick={() => deleteProduct(product.id)} className="rounded-lg border border-[#E8D9D6] px-3 py-2 text-xs font-bold text-[#A15E68]">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {section === "analysis" && (
              <section>
                <SectionTitle eyebrow="Model input" title="Run a fresh pricing analysis" description="Every model feature is entered explicitly. No hidden zeros or default business values are sent." />
                <form onSubmit={(e) => { e.preventDefault(); getRecommendation(); }} className="space-y-6">
                  <div className="rounded-3xl border border-[#E9DDDA] bg-white p-6 shadow-sm">
                    <SectionTitle eyebrow="Product" title="Product identity" description="These fields identify the saved product and do not replace ML features." />
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <Field label="Product name" type="text" value={inputs.productName} onChange={(v) => update("productName", v)} placeholder="e.g. Product A" />
                      <Field label="Category" type="text" value={inputs.category} onChange={(v) => update("category", v)} placeholder="e.g. Electronics" />
                      <Field label="Store ID" value={inputs.store} onChange={(v) => update("store", v)} placeholder="e.g. 1" />
                      <Field label="Department" value={inputs.dept} onChange={(v) => update("dept", v)} placeholder="e.g. 1" />
                      <SelectField label="Is Holiday" value={inputs.isHoliday} onChange={(v) => update("isHoliday", v)} options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} />
                      <SelectField label="Store Type" value={inputs.storeType} onChange={(v) => update("storeType", v)} options={[{ value: "A", label: "Type A" }, { value: "B", label: "Type B" }, { value: "C", label: "Type C" }]} />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-[#E9DDDA] bg-white p-6 shadow-sm">
                    <SectionTitle eyebrow="ML features" title="Demand model inputs" description="These match the 18 features in the trained PricePilot model." />
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Field label="Temperature" value={inputs.temperature} onChange={(v) => update("temperature", v)} placeholder="e.g. 65.2" />
                      <Field label="Fuel price" value={inputs.fuelPrice} onChange={(v) => update("fuelPrice", v)} placeholder="e.g. 3.45" />
                      <Field label="CPI" value={inputs.cpi} onChange={(v) => update("cpi", v)} placeholder="e.g. 211.096" />
                      <Field label="Unemployment" value={inputs.unemployment} onChange={(v) => update("unemployment", v)} placeholder="e.g. 7.8" />
                      <Field label="Size" value={inputs.size} onChange={(v) => update("size", v)} placeholder="e.g. 151315" />
                      <Field label="Year" value={inputs.year} onChange={(v) => update("year", v)} placeholder="e.g. 2012" />
                      <Field label="Month" value={inputs.month} onChange={(v) => update("month", v)} placeholder="e.g. 11" />
                      <Field label="Week" value={inputs.week} onChange={(v) => update("week", v)} placeholder="e.g. 45" />
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                      <Field label="MarkDown1" value={inputs.markdown1} onChange={(v) => update("markdown1", v)} placeholder="Enter value" />
                      <Field label="MarkDown2" value={inputs.markdown2} onChange={(v) => update("markdown2", v)} placeholder="Enter value" />
                      <Field label="MarkDown3" value={inputs.markdown3} onChange={(v) => update("markdown3", v)} placeholder="Enter value" />
                      <Field label="MarkDown4" value={inputs.markdown4} onChange={(v) => update("markdown4", v)} placeholder="Enter value" />
                      <Field label="MarkDown5" value={inputs.markdown5} onChange={(v) => update("markdown5", v)} placeholder="Enter value" />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-[#E9DDDA] bg-white p-6 shadow-sm">
                    <SectionTitle eyebrow="Business inputs" title="Pricing, demand & competitor context" description="These values drive pricing, profitability, forecast and market analysis." />
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <Field label="Current price" value={inputs.price} onChange={(v) => update("price", v)} placeholder="e.g. 1200" />
                      <Field label="Target sales" value={inputs.targetSales} onChange={(v) => update("targetSales", v)} placeholder="e.g. 800" />
                      <Field label="Cost per unit" value={inputs.cost} onChange={(v) => update("cost", v)} placeholder="e.g. 700" />
                      <Field label="Previous sales" value={inputs.previousSales} onChange={(v) => update("previousSales", v)} placeholder="e.g. 760" />
                      <Field label="Units sold" value={inputs.unitsSold} onChange={(v) => update("unitsSold", v)} placeholder="e.g. 790" />
                      <Field label="Competitor A price" value={inputs.competitorA} onChange={(v) => update("competitorA", v)} placeholder="e.g. 1250" />
                      <Field label="Competitor B price" value={inputs.competitorB} onChange={(v) => update("competitorB", v)} placeholder="e.g. 1180" />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button type="submit" disabled={loading} className="rounded-xl bg-[#E4776F] px-6 py-3.5 font-extrabold text-white shadow-sm transition hover:bg-[#D96D66] disabled:cursor-wait disabled:opacity-60">
                      {loading ? "Analyzing…" : "Run PricePilot Analysis"}
                    </button>
                    <button type="button" onClick={saveProduct} className="rounded-xl border border-[#E4D5D2] bg-white px-6 py-3.5 font-extrabold">
                      Save Product
                    </button>
                    <button type="button" onClick={newProduct} className="rounded-xl px-5 py-3.5 text-sm font-bold text-[#866F81]">
                      Clear
                    </button>
                  </div>
                </form>
              </section>
            )}

            {section === "dashboard" && (
              <section className="space-y-7">
                <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#E4776F] via-[#D994A0] to-[#B29AD6] p-7 text-white shadow-sm md:p-9">
                  <div className="max-w-3xl">
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/80">AI-powered pricing workspace</p>
                    <h2 className="mt-2 text-3xl font-black md:text-4xl">Turn real demand signals into pricing decisions.</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                      Add a product, run the trained demand model, then explore strategy, competitors, profitability and forecasts from the same analysis.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button onClick={() => setSection("analysis")} className="rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#704D63]">Run Analysis</button>
                      {result && (
                        <button onClick={downloadReport} className="rounded-xl bg-[#493B50] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#5A4A62]">↓ Download Business Report</button>
                      )}
                      <button onClick={() => setSection("products")} className="rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-extrabold text-white">View Catalog</button>
                    </div>
                  </div>
                </div>

                {!result ? (
                  <EmptyState title="No analysis yet" text="Your dashboard stays empty until you enter a real product and run the analysis." />
                ) : (
                  <>
                    <div className="flex flex-col gap-4 rounded-3xl border border-[#E9DDDA] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-wider text-[#B16A91]">Business report</p>
                        <h3 className="mt-1 text-lg font-black">Download this analysis as a professional PDF</h3>
                        <p className="mt-1 text-sm text-[#7E6E7C]">Includes pricing strategy, competitor analysis, forecast, profitability and AI insight.</p>
                      </div>
                      <button onClick={downloadReport} className="shrink-0 rounded-xl bg-[#E4776F] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#D96D66]">↓ Download Report</button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                      {[
                        ["Predicted sales", number(result.predictedSales), "ML demand prediction"],
                        ["Current price", money(Number(inputs.price)), "User input"],
                        ["Recommended price", money(result.recommendedPrice), "Backend recommendation"],
                        ["Market position", marketStatus, "Competitor analysis"],
                        ["Profit margin", profitability ? `${number(profitability.profit_margin)}%` : "—", "Profitability analysis"],
                      ].map(([label, value, sub]) => (
                        <div key={label} className="rounded-2xl border border-[#E9DDDA] bg-white p-5 shadow-sm">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#8C7A89]">{label}</p>
                          <div className="mt-2 break-words text-2xl font-black text-[#493B50]">{value}</div>
                          <p className="mt-1 text-xs text-[#9A8A97]">{sub}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
                      <div className="rounded-3xl border border-[#E9DDDA] bg-white p-6 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-extrabold uppercase tracking-wider text-[#B16A91]">Pricing decision</p>
                            <h3 className="mt-1 text-2xl font-black">{result.action}</h3>
                            <p className="mt-2 text-sm text-[#7E6E7C]">{result.explanation || "The recommendation is available from the pricing service."}</p>
                          </div>
                          <div className="rounded-2xl bg-[#F9ECE9] px-5 py-4 text-right">
                            <div className="text-xs font-bold text-[#9C6974]">Recommended</div>
                            <div className="text-2xl font-black text-[#8F5965]">{money(result.recommendedPrice)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-[#E9DDDA] bg-[#FFFDFC] p-6 shadow-sm">
                        <p className="text-xs font-extrabold uppercase tracking-wider text-[#B16A91]">Demand signal</p>
                        <div className="mt-2 text-3xl font-black">{forecast?.trend || "—"}</div>
                        <p className="mt-2 text-sm text-[#7E6E7C]">
                          {forecast ? `Forecast confidence: ${number(forecast.confidence)}%` : "Run an analysis to calculate the demand trend."}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="rounded-3xl border border-[#E9DDDA] bg-white p-6 shadow-sm">
                        <SectionTitle eyebrow="Market" title="Competitor positioning" description="Tap a bar to inspect the exact value and what it means." />
                        {competitor ? (
                          <>
                            <div className="h-72">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={competitorChart} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFE5E2" />
                                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                  <YAxis tick={{ fontSize: 11 }} />
                                  <Tooltip formatter={(value) => money(Number(value))} />
                                  <Bar dataKey="price" name="Price" radius={[8, 8, 0, 0]} onClick={(data) => setSelectedChartItem(String(data?.name || ""))}>
                                    {competitorChart.map((entry) => <Cell key={entry.name} fill={selectedChartItem === entry.name ? "#B16A91" : "#E6A39C"} />)}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                            {selectedChartItem && competitorChart.some((x) => x.name === selectedChartItem) && (
                              <div className="mt-3 rounded-xl bg-[#F9F0EE] p-4 text-sm">
                                <b>{selectedChartItem}</b>: {money(competitorChart.find((x) => x.name === selectedChartItem)?.price)}
                                <span className="ml-2 text-[#806F7D]">Click another bar to inspect it.</span>
                              </div>
                            )}
                          </>
                        ) : <EmptyState title="No competitor analysis" text="Competitor values appear here after a successful analysis." />}
                      </div>

                      <div className="rounded-3xl border border-[#E9DDDA] bg-white p-6 shadow-sm">
                        <SectionTitle eyebrow="Profitability" title="Where the money goes" description="Tap a slice to see the selected business metric." />
                        {profitability ? (
                          <>
                            <div className="h-72">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={profitChart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={96} paddingAngle={3} onClick={(entry) => setSelectedChartItem(String(entry?.name || ""))}>
                                    {profitChart.map((entry, index) => <Cell key={entry.name} fill={["#E6A39C", "#9AC8B4", "#B49BD8"][index % 3]} />)}
                                  </Pie>
                                  <Tooltip formatter={(value) => money(Number(value))} />
                                  <Legend />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div><div className="text-lg font-black">{money(profitability.revenue)}</div><div className="text-xs text-[#8B7A89]">Revenue</div></div>
                              <div><div className="text-lg font-black">{money(profitability.total_cost ?? profitability.cost)}</div><div className="text-xs text-[#8B7A89]">Cost</div></div>
                              <div><div className="text-lg font-black">{money(profitability.profit)}</div><div className="text-xs text-[#8B7A89]">Profit</div></div>
                            </div>
                            {selectedChartItem && ["Revenue", "Cost", "Profit"].includes(selectedChartItem) && (
                              <div className="mt-3 rounded-xl bg-[#F9F0EE] p-4 text-sm">
                                <b>{selectedChartItem}</b> is {money(profitChart.find((x) => x.name === selectedChartItem)?.value)}.
                                {selectedChartItem === "Profit" && " Profit is revenue after the calculated total cost."}
                                {selectedChartItem === "Cost" && " Cost is the calculated cost of the entered units sold."}
                                {selectedChartItem === "Revenue" && " Revenue is based on the entered price and units sold."}
                              </div>
                            )}
                          </>
                        ) : <EmptyState title="No profitability data" text="Enter cost and units sold, then run the analysis." />}
                      </div>
                    </div>
                  </>
                )}
              </section>
            )}

            {section === "strategy" && (
              <section>
                <SectionTitle eyebrow="Decision engine" title="Pricing Strategy" description="A clear business explanation of the strategy generated from your current analysis." />
                {!result || !strategy ? (
                  <EmptyState title="No pricing strategy yet" text="Run an analysis first so the strategy reflects actual model and market values." />
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-4">
                      {[
                        ["Current price", money(Number(inputs.price))],
                        ["Recommended price", money(strategy.recommended_price)],
                        ["Predicted sales", number(result.predictedSales)],
                        ["Target sales", number(Number(inputs.targetSales))],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-[#E9DDDA] bg-white p-5 shadow-sm">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#8B7A89]">{label}</p>
                          <div className="mt-2 text-2xl font-black">{value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-3xl border border-[#E9DDDA] bg-white p-7 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-extrabold uppercase tracking-wider text-[#B16A91]">Generated strategy</p>
                          <h3 className="mt-2 text-3xl font-black">{strategy.strategy}</h3>
                        </div>
                        <span className="rounded-full bg-[#F9ECE9] px-4 py-2 text-sm font-extrabold text-[#945F69]">{strategy.action}</span>
                      </div>
                      <div className="mt-7 grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl bg-[#FCF7F5] p-5"><div className="text-xs font-bold uppercase text-[#907F8D]">Demand</div><div className="mt-2 font-black">{number(result.predictedSales)} vs {number(Number(inputs.targetSales))} target</div></div>
                        <div className="rounded-2xl bg-[#FCF7F5] p-5"><div className="text-xs font-bold uppercase text-[#907F8D]">Market</div><div className="mt-2 font-black">{competitor ? money(competitor.market_average) : "—"}</div></div>
                        <div className="rounded-2xl bg-[#FCF7F5] p-5"><div className="text-xs font-bold uppercase text-[#907F8D]">Difference</div><div className="mt-2 font-black">{competitor ? `${number(competitor.difference_percent)}%` : "—"}</div></div>
                      </div>
                      <div className="mt-5 rounded-2xl border border-[#EADBD8] p-5">
                        <div className="font-bold">Why this strategy?</div>
                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#766676]">{strategy.reason || strategy.explanation || result.explanation || "The strategy is based on the pricing service response and the current analysis values."}</p>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {section === "analytics" && (
              <section>
                <SectionTitle eyebrow="Interactive analytics" title="Visual Analytics" description="Hover for exact values. Click a chart element to pin its explanation." />
                {!result ? <EmptyState title="Analytics will appear after analysis" text="Run a real product analysis first. No placeholder chart values are shown." /> : (
                  <div className="space-y-6">
                    <div className="rounded-3xl border border-[#E9DDDA] bg-white p-6 shadow-sm">
                      <SectionTitle eyebrow="Demand" title="Demand trend forecast" description="Previous sales compared with the backend forecast periods." />
                      {forecast ? (
                        <>
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={forecastChart} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFE5E2" />
                                <XAxis dataKey="period" />
                                <YAxis />
                                <Tooltip formatter={(value) => `${number(Number(value))} units`} />
                                <Line type="monotone" dataKey="sales" name="Sales" stroke="#B16A91" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8, onClick: (_e: any, payload: any) => setSelectedChartItem(String(payload?.payload?.period || "")) }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          {selectedChartItem && forecastChart.some((x) => x.period === selectedChartItem) && (
                            <div className="rounded-xl bg-[#F9F0EE] p-4 text-sm">
                              <b>{selectedChartItem}</b>: {number(forecastChart.find((x) => x.period === selectedChartItem)?.sales)} units. This point represents the sales value for that forecast period.
                            </div>
                          )}
                        </>
                      ) : <EmptyState title="Forecast unavailable" text="The forecast endpoint did not return data for this analysis." />}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="rounded-3xl border border-[#E9DDDA] bg-white p-6 shadow-sm">
                        <SectionTitle eyebrow="Market" title="Competitor price comparison" description="Click a bar to inspect that price." />
                        {competitor ? (
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={competitorChart} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFE5E2" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => money(Number(value))} />
                                <Bar dataKey="price" name="Price" radius={[8, 8, 0, 0]} onClick={(data) => setSelectedChartItem(String(data?.name || ""))}>
                                  {competitorChart.map((entry) => <Cell key={entry.name} fill={selectedChartItem === entry.name ? "#B16A91" : "#E6A39C"} />)}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        ) : <EmptyState title="No competitor data" text="Run the analysis with competitor prices." />}
                      </div>

                      <div className="rounded-3xl border border-[#E9DDDA] bg-white p-6 shadow-sm">
                        <SectionTitle eyebrow="Profitability" title="Profitability composition" description="Click a slice to understand the selected metric." />
                        {profitability ? (
                          <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={profitChart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} onClick={(entry) => setSelectedChartItem(String(entry?.name || ""))}>
                                  {profitChart.map((entry, index) => <Cell key={entry.name} fill={["#E6A39C", "#9AC8B4", "#B49BD8"][index % 3]} />)}
                                </Pie>
                                <Tooltip formatter={(value) => money(Number(value))} />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        ) : <EmptyState title="No profitability data" text="Run the analysis after entering cost and units sold." />}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {section === "competitors" && (
              <section>
                <SectionTitle eyebrow="Market intelligence" title="Competitor Benchmarking" description="Understand where your current price sits against the entered competitors and calculated market average." />
                {!competitor ? <EmptyState title="No competitor analysis yet" text="Run an analysis with competitor prices to populate this section." /> : (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-4">
                      {[
                        ["Your price", money(competitor.our_price)],
                        ["Market average", money(competitor.market_average)],
                        ["Difference", money(competitor.price_difference)],
                        ["Difference %", `${number(competitor.difference_percent)}%`],
                      ].map(([label, value]) => <div key={label} className="rounded-2xl border border-[#E9DDDA] bg-white p-5 shadow-sm"><div className="text-xs font-bold uppercase tracking-wider text-[#8B7A89]">{label}</div><div className="mt-2 text-2xl font-black">{value}</div></div>)}
                    </div>
                    <div className="rounded-3xl border border-[#E9DDDA] bg-white p-6 shadow-sm">
                      <h3 className="text-xl font-black">Market position: {marketStatus}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#766676]">
                        This classification is calculated from the actual difference between your entered price and the backend market average. It is descriptive, not a fabricated business result.
                      </p>
                      <div className="mt-5 overflow-hidden rounded-2xl border border-[#EEE3E0]">
                        {competitor.competitors.map((item) => (
                          <button key={item.name} onClick={() => setSelectedChartItem(item.name)} className="flex w-full items-center justify-between border-b border-[#F0E6E3] px-5 py-4 text-left last:border-0 hover:bg-[#FFFAF9]">
                            <span className="font-bold">{item.name}</span><span className="font-black">{money(item.price)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {section === "assistant" && (
              <section>
                <SectionTitle eyebrow="AI assistant" title="Your AI Pricing Advisor" description="Ask questions about the active product and current analysis." />
                <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
                  <div className="rounded-3xl bg-gradient-to-br from-[#F5E0DE] to-[#EEE5F6] p-7">
                    <div className="text-4xl">✦</div>
                    <h3 className="mt-4 text-2xl font-black">Ask about your numbers.</h3>
                    <p className="mt-2 text-sm leading-6 text-[#6F6070]">
                      The assistant receives the active product's pricing, demand, market and profitability context along with your question.
                    </p>
                    {!result && <div className="mt-5 rounded-xl bg-white/70 p-4 text-sm font-semibold">Run an analysis first for the richest product-specific context.</div>}
                  </div>
                  <div className="flex min-h-[520px] flex-col rounded-3xl border border-[#E9DDDA] bg-white shadow-sm">
                    <div className="border-b border-[#EEE3E0] p-5">
                      <div className="font-black">PricePilot Assistant</div>
                      <div className="text-xs text-[#8A7A88]">{inputs.productName || "No active product"}</div>
                    </div>
                    <div className="flex-1 space-y-4 overflow-y-auto p-5">
                      {chatMessages.length === 0 ? (
                        <div className="rounded-2xl bg-[#FBF4F2] p-5 text-sm text-[#786877]">
                          Try: “Why did the model recommend this price?” or “What does the profit margin mean?”
                        </div>
                      ) : chatMessages.map((message, index) => (
                        <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-[#493B50] text-white" : "bg-[#F8EFED] text-[#554655]"}`}>
                            {message.text}
                          </div>
                        </div>
                      ))}
                      {chatLoading && <div className="rounded-2xl bg-[#F8EFED] px-4 py-3 text-sm text-[#7A6978]">AI is thinking…</div>}
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); sendChat(); }} className="border-t border-[#EEE3E0] p-4">
                      <div className="flex gap-2">
                        <input value={chatQuestion} onChange={(e) => setChatQuestion(e.target.value)} placeholder="Ask about pricing, demand, competitors…" className="min-w-0 flex-1 rounded-xl border border-[#E7DAD7] px-4 py-3 text-sm outline-none focus:border-[#E4776F]" />
                        <button type="submit" disabled={chatLoading || !chatQuestion.trim()} className="rounded-xl bg-[#E4776F] px-5 py-3 text-sm font-bold text-white disabled:opacity-40">Ask</button>
                      </div>
                    </form>
                  </div>
                </div>
              </section>
            )}
          </div>
        </section>
      </div>

      {/* Mobile navigation */}
      <div className="fixed bottom-3 left-3 right-3 z-40 flex gap-1 overflow-x-auto rounded-2xl border border-[#E7DAD7] bg-white/95 p-2 shadow-lg backdrop-blur lg:hidden">
        {nav.slice(0, 5).map(([id, label, icon]) => (
          <button key={id} onClick={() => setSection(id)} className={`min-w-[82px] rounded-xl px-2 py-2 text-center text-[11px] font-bold ${section === id ? "bg-[#F4DDD9] text-[#945F69]" : "text-[#786878]"}`}>
            <div className="text-base">{icon}</div>{label}
          </button>
        ))}
      </div>

      <button onClick={() => { setChatOpen(true); setSection("assistant"); }} className="fixed bottom-24 right-5 z-30 rounded-full bg-[#493B50] px-5 py-3 text-sm font-extrabold text-white shadow-lg lg:bottom-6">
        ✦ AI Assistant
      </button>

      {chatOpen && (
        <div className="fixed bottom-24 right-5 z-50 w-[min(92vw,420px)] rounded-3xl border border-[#E6D8D5] bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#EEE3E0] p-4">
            <div><div className="font-black">PricePilot AI</div><div className="text-xs text-[#8A7A88]">Pricing advisor</div></div>
            <button onClick={() => setChatOpen(false)} className="rounded-lg px-2 py-1 text-lg">×</button>
          </div>
          <div className="max-h-72 overflow-y-auto p-4">
            {chatMessages.length === 0 ? <p className="text-sm text-[#7C6D7B]">Open the full Assistant section to ask questions about the active analysis.</p> : chatMessages.slice(-4).map((m, i) => <div key={i} className={`mb-2 rounded-xl p-3 text-sm ${m.role === "user" ? "bg-[#493B50] text-white" : "bg-[#F8EFED]"}`}>{m.text}</div>)}
          </div>
          <div className="border-t border-[#EEE3E0] p-3">
            <button onClick={() => { setChatOpen(false); setSection("assistant"); }} className="w-full rounded-xl bg-[#E4776F] px-4 py-3 text-sm font-bold text-white">Open full assistant</button>
          </div>
        </div>
      )}
    </main>
  );
}
