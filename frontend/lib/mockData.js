export const mockKpis = {
  revenue_30d: 450000,
  products_tracked: 250,
  avg_forecast_confidence: 85,
};

export const mockSalesTrend = [
  { day: "2026-01", revenue: 120000 },
  { day: "2026-02", revenue: 135000 },
  { day: "2026-03", revenue: 150000 },
  { day: "2026-04", revenue: 140000 },
  { day: "2026-05", revenue: 165000 },
  { day: "2026-06", revenue: 180000 },
];

export const mockProducts = [
  {
    id: 1,
    name: "Demo Product A",
    current_price: 99.99,
    optimal_price: 109.99,
    competitor_price: 95.0,
    trend: "Increasing",
    category: "Electronics",
  },
  {
    id: 2,
    name: "Demo Product B",
    current_price: 49.99,
    optimal_price: 45.0,
    competitor_price: 42.5,
    trend: "Stable",
    category: "Home",
  },
  {
    id: 3,
    name: "Demo Product C",
    current_price: 199.99,
    optimal_price: 215.0,
    competitor_price: 220.0,
    trend: "Decreasing",
    category: "Furniture",
  },
];
