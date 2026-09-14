"use client";

import { useState } from "react";

export default function Home() {
  const [store, setStore] = useState("");
const [dept, setDept] = useState("");
const [temperature, setTemperature] = useState("");
const [fuelPrice, setFuelPrice] = useState("");
const [cpi, setCpi] = useState("");
const [unemployment, setUnemployment] = useState("");
const [year, setYear] = useState("2012");
const [month, setMonth] = useState("1");
const [week, setWeek] = useState("1");

const [price, setPrice] = useState("");
const [target, setTarget] = useState("");
const [result, setResult] = useState<any>(null);

  const getRecommendation = async () => {
    const predictionResponse = await fetch("/api/predict", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    Store: Number(store),
    Dept: Number(dept),
    IsHoliday: false,
    Temperature: Number(temperature),
    Fuel_Price: Number(fuelPrice),
    MarkDown1: 0,
    MarkDown2: 0,
    MarkDown3: 0,
    MarkDown4: 0,
    MarkDown5: 0,
    CPI: Number(cpi),
    Unemployment: Number(unemployment),
    Type_B: 0,
    Type_C: 0,
    Size: 151315,
    Year: Number(year),
    Month: Number(month),
    Week: Number(week),
  }),
});

const predictionData = await predictionResponse.json();
const predictedSales = predictionData.predicted_weekly_sales;
    const basePrice = Number(price);
    const targetSales = Number(target);

    const pricingResponse = await fetch("/api/recommend-price", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base_price: basePrice,
        predicted_sales: predictedSales,
        target_sales: targetSales,
      }),
    });

    const pricingData = await pricingResponse.json();

    const llmResponse = await fetch("/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        predicted_sales: predictedSales,
        base_price: basePrice,
        target_sales: targetSales,
        recommended_price: pricingData.recommended_price,
        action: pricingData.action,
      }),
    });

    const llmData = await llmResponse.json();

    setResult({
  predictedSales: predictedSales,
  recommendedPrice: pricingData.recommended_price,
  action: pricingData.action,
  explanation: llmData.recommendation,
});
  };

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        PricePilot AI
      </h1>

      <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow">
        <input
  className="w-full border p-3 mb-3 rounded"
  placeholder="Store"
  value={store}
  onChange={(e) => setStore(e.target.value)}
/>

<input
  className="w-full border p-3 mb-3 rounded"
  placeholder="Department"
  value={dept}
  onChange={(e) => setDept(e.target.value)}
/>

<input
  className="w-full border p-3 mb-3 rounded"
  placeholder="Temperature"
  value={temperature}
  onChange={(e) => setTemperature(e.target.value)}
/>

<input
  className="w-full border p-3 mb-3 rounded"
  placeholder="Fuel Price"
  value={fuelPrice}
  onChange={(e) => setFuelPrice(e.target.value)}
/>

<input
  className="w-full border p-3 mb-3 rounded"
  placeholder="CPI"
  value={cpi}
  onChange={(e) => setCpi(e.target.value)}
/>

<input
  className="w-full border p-3 mb-3 rounded"
  placeholder="Unemployment"
  value={unemployment}
  onChange={(e) => setUnemployment(e.target.value)}
/>

<input
  className="w-full border p-3 mb-3 rounded"
  placeholder="Year"
  value={year}
  onChange={(e) => setYear(e.target.value)}
/>

<input
  className="w-full border p-3 mb-3 rounded"
  placeholder="Month"
  value={month}
  onChange={(e) => setMonth(e.target.value)}
/>

<input
  className="w-full border p-3 mb-4 rounded"
  placeholder="Week"
  value={week}
  onChange={(e) => setWeek(e.target.value)}
/>

        <input
          className="w-full border p-3 mb-3 rounded"
          placeholder="Current Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <input
          className="w-full border p-3 mb-4 rounded"
          placeholder="Target Sales"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />

        <button
          onClick={getRecommendation}
          className="w-full bg-blue-600 text-white p-3 rounded font-semibold"
        >
          Get AI Recommendation
        </button>

        {result && (
          <div className="mt-6 p-4 bg-slate-50 rounded">
            <h2 className="text-xl font-bold mb-2">Recommendation</h2>
<p>
  <b>Predicted Weekly Sales:</b>{" "}
  {Math.round(result.predictedSales).toLocaleString()} units
</p>
            <p>
              <b>Action:</b> {result.action}
            </p>

            <p>
              <b>Recommended Price:</b> ₹
              {result.recommendedPrice.toFixed(2)}
            </p>

            <p className="mt-3">
              <b>AI Explanation:</b>
            </p>

            <p className="mt-1">{result.explanation}</p>
          </div>
        )}
      </div>
    </main>
  );
}