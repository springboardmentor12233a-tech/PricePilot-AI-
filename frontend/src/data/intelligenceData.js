// Curated dataset insights derived from PricePilot AI model outputs and analytics
export const EXECUTIVE_KPIS = {
  total_revenue: 7386335.29,
  total_demand: 297694,
  average_revenue_per_unit: 24.81,
  highest_revenue_category: "Grocery",
  highest_revenue_region: "Central",
  highest_revenue_channel: "Website",
  pricing_strategy: {
    maintain_competitive_range: 27,
    review_price_competitiveness: 9,
    evaluate_price_increase: 4
  }
};

export const CATEGORY_REVENUE_DATA = [
  { category: "Grocery", totalRevenue: 1207151.15, totalDemand: 49943, avgPrice: 36.73, share: 16.34, color: "#10b981" },
  { category: "Electronics", totalRevenue: 1190705.48, totalDemand: 47634, avgPrice: 36.86, share: 16.12, color: "#6366f1" },
  { category: "Fashion", totalRevenue: 1078575.25, totalDemand: 41514, avgPrice: 39.54, share: 14.60, color: "#f59e0b" },
  { category: "Home & Kitchen", totalRevenue: 953877.84, totalDemand: 38387, avgPrice: 37.17, share: 12.91, color: "#ec4899" },
  { category: "Beauty", totalRevenue: 867345.48, totalDemand: 34879, avgPrice: 37.36, share: 11.74, color: "#8b5cf6" },
  { category: "Sports", totalRevenue: 799402.77, totalDemand: 32676, avgPrice: 36.71, share: 10.82, color: "#06b6d4" },
  { category: "Toys", totalRevenue: 684284.23, totalDemand: 28299, avgPrice: 36.37, share: 9.26, color: "#f97316" },
  { category: "Books", totalRevenue: 604993.09, totalDemand: 24362, avgPrice: 37.48, share: 8.19, color: "#14b8a6" },
];

export const REGIONAL_INTELLIGENCE_DATA = [
  { region: "Central", ourAvgPrice: 36.62, compAvgPrice: 37.23, diff: -0.61, ratio: 0.98, cheaperPct: 47.11, expensivePct: 48.39, alert: "Near Competitor Average", status: "Optimal", revenueShare: "26.4%" },
  { region: "East", ourAvgPrice: 37.36, compAvgPrice: 37.78, diff: -0.41, ratio: 0.99, cheaperPct: 47.65, expensivePct: 48.03, alert: "Near Competitor Average", status: "Optimal", revenueShare: "21.8%" },
  { region: "North", ourAvgPrice: 37.26, compAvgPrice: 37.62, diff: -0.36, ratio: 0.99, cheaperPct: 47.58, expensivePct: 48.65, alert: "Near Competitor Average", status: "Optimal", revenueShare: "19.5%" },
  { region: "South", ourAvgPrice: 37.12, compAvgPrice: 36.33, diff: 0.79, ratio: 1.02, cheaperPct: 47.34, expensivePct: 48.10, alert: "Slight Premium", status: "Monitor", revenueShare: "18.2%" },
  { region: "West", ourAvgPrice: 38.04, compAvgPrice: 35.83, diff: 2.21, ratio: 1.06, cheaperPct: 45.35, expensivePct: 50.43, alert: "Above Competitor Average", status: "Action Required", revenueShare: "14.1%" },
];

export const COMPETITOR_CATEGORY_BENCHMARKS = [
  { category: "Beauty", ourPrice: 37.36, compPrice: 37.50, diff: -0.14, cheaper: 45.80, moreExpensive: 49.95, similar: 4.26, recommendation: "Maintain price parity" },
  { category: "Books", ourPrice: 37.48, compPrice: 36.22, diff: 1.26, cheaper: 46.78, moreExpensive: 48.36, similar: 4.86, recommendation: "Review margin vs volume" },
  { category: "Electronics", ourPrice: 36.86, compPrice: 36.80, diff: 0.06, cheaper: 47.25, moreExpensive: 47.95, similar: 4.80, recommendation: "High elasticity - fine tune" },
  { category: "Fashion", ourPrice: 39.54, compPrice: 37.42, diff: 2.11, cheaper: 46.39, moreExpensive: 50.00, similar: 3.61, recommendation: "Test promotional pricing" },
  { category: "Grocery", ourPrice: 36.73, compPrice: 36.85, diff: -0.12, cheaper: 48.05, moreExpensive: 47.77, share: 4.18, recommendation: "Strong volume leader" },
  { category: "Home & Kitchen", ourPrice: 37.17, compPrice: 36.60, diff: 0.57, cheaper: 46.13, moreExpensive: 49.75, similar: 4.12, recommendation: "Evaluate bundle discounts" },
  { category: "Sports", ourPrice: 36.71, compPrice: 37.21, diff: -0.49, cheaper: 46.53, moreExpensive: 48.14, similar: 5.34, recommendation: "Opportunity to adjust upward" },
  { category: "Toys", ourPrice: 36.37, compPrice: 37.07, diff: -0.70, cheaper: 49.10, moreExpensive: 47.93, similar: 2.97, recommendation: "Capture seasonal demand surge" },
];

export const DEMAND_FORECAST_SERIES = [
  { month: "Jan 2025", demand: 5150, horizon: "Short-term", confidence: 85.7, trend: "Baseline", trendType: "Stable" },
  { month: "Feb 2025", demand: 5932, horizon: "Short-term", confidence: 99.6, trend: "+15.2%", trendType: "Increasing" },
  { month: "Mar 2025", demand: 6806, horizon: "Short-term", confidence: 89.4, trend: "+14.7%", trendType: "Increasing" },
  { month: "Apr 2025", demand: 5714, horizon: "Medium-term", confidence: 93.3, trend: "-16.0%", trendType: "Decreasing" },
  { month: "May 2025", demand: 5592, horizon: "Medium-term", confidence: 97.9, trend: "-2.1%", trendType: "Stable" },
  { month: "Jun 2025", demand: 6176, horizon: "Medium-term", confidence: 95.2, trend: "+10.4%", trendType: "Increasing" },
  { month: "Jul 2025", demand: 6425, horizon: "Long-term", confidence: 86.0, trend: "+4.0%", trendType: "Stable" },
  { month: "Aug 2025", demand: 5904, horizon: "Long-term", confidence: 96.7, trend: "-8.1%", trendType: "Decreasing" },
  { month: "Sep 2025", demand: 5960, horizon: "Long-term", confidence: 93.3, trend: "+0.9%", trendType: "Stable" },
  { month: "Oct 2025", demand: 6746, horizon: "Long-term", confidence: 98.8, trend: "+13.2%", trendType: "Increasing" },
  { month: "Nov 2025", demand: 6124, horizon: "Long-term", confidence: 96.1, trend: "-9.2%", trendType: "Decreasing" },
  { month: "Dec 2025", demand: 8357, horizon: "Long-term", confidence: 65.1, trend: "+36.5%", trendType: "Increasing" },
];

export const SALES_CHANNEL_DATA = [
  { channel: "Website", revenue: 3840894.35, share: 52.0, color: "#6366f1" },
  { channel: "Mobile App", revenue: 2215900.58, share: 30.0, color: "#10b981" },
  { channel: "Marketplace", revenue: 1329540.36, share: 18.0, color: "#f59e0b" },
];

export const INITIAL_SAMPLE_PRODUCTS = [
  { id: 101, product_name: "Ultra HD Smart TV 55\"", category: "Electronics", region: "Central", current_price: 499.99, competitor_price: 529.00, stock_availability: 120 },
  { id: 102, product_name: "Ergonomic Mesh Office Chair", category: "Home & Kitchen", region: "North", current_price: 189.50, competitor_price: 179.99, stock_availability: 45 },
  { id: 103, product_name: "Wireless Noise Cancelling Earbuds", category: "Electronics", region: "West", current_price: 89.99, competitor_price: 99.00, stock_availability: 310 },
  { id: 104, product_name: "Organic Arabica Coffee Blend (1kg)", category: "Grocery", region: "Central", current_price: 24.50, competitor_price: 26.00, stock_availability: 850 },
  { id: 105, product_name: "Breathable Running Shoes Pro", category: "Sports", region: "East", current_price: 74.99, competitor_price: 79.99, stock_availability: 95 },
  { id: 106, product_name: "Anti-Aging Hyaluronic Serum 50ml", category: "Beauty", region: "South", current_price: 34.00, competitor_price: 32.50, stock_availability: 215 },
  { id: 107, product_name: "Premium Cotton Oxford Shirt", category: "Fashion", region: "North", current_price: 45.00, competitor_price: 42.00, stock_availability: 140 },
  { id: 108, product_name: "STEM Robotic Coding Kit", category: "Toys", region: "East", current_price: 59.99, competitor_price: 64.99, stock_availability: 68 },
];
