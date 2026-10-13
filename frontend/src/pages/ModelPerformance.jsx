import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ChartCard, KPICard, LoadingSpinner, ErrorState } from "../components/Common";

export default function ModelPerformance() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [training, setTraining] = useState("");

  const load = () => {
    setLoading(true);
    api.get("/api/models/performance")
      .then((r) => setData(r.data))
      .catch(() => setError("Could not load model performance."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const train = async (model) => {
    setTraining(model);
    try {
      await api.post(`/api/models/train/${model}`);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Training failed.");
    } finally {
      setTraining("");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;

  const price = data.price_model;
  const demand = data.demand_model;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-display font-semibold">Model Performance</h1>

      <ChartCard title="Price Prediction Model" action={user?.role === "ADMIN" && (
        <button className="btn-secondary text-xs" onClick={() => train("price")} disabled={training === "price"}>
          {training === "price" ? "Training..." : "Train Price Model"}
        </button>
      )}>
        {price.trained ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <KPICard label="Selected Model" value={price.model_name} />
              <KPICard label="Test MAE" value={price.test_metrics.test_mae.toFixed(3)} />
              <KPICard label="Test RMSE" value={price.test_metrics.test_rmse.toFixed(3)} />
              <KPICard label="Test R²" value={price.test_metrics.test_r2.toFixed(3)} />
            </div>
            <p className="text-xs text-slate-400">Trained {new Date(price.trained_at).toLocaleString()} on {price.training_rows} rows. Selected because: {price.selected_because}</p>
          </>
        ) : <p className="text-sm text-slate-400">{price.message}</p>}
      </ChartCard>

      <ChartCard title="Demand Forecasting Model" action={user?.role === "ADMIN" && (
        <button className="btn-secondary text-xs" onClick={() => train("demand")} disabled={training === "demand"}>
          {training === "demand" ? "Evaluating..." : "Evaluate Demand Model"}
        </button>
      )}>
        {demand.trained ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <KPICard label="Products Evaluated" value={demand.products_evaluated} />
              <KPICard label="Avg Val MAE" value={demand.avg_val_mae?.toFixed(3) ?? "n/a"} />
              <KPICard label="Avg Confidence" value={`${demand.avg_confidence_score?.toFixed(1)}%`} />
              <KPICard label="Model Wins" value={Object.entries(demand.model_selection_counts).map(([k, v]) => `${k}:${v}`).join(", ")} />
            </div>
            <p className="text-xs text-slate-400">{demand.validation_methodology}</p>
          </>
        ) : <p className="text-sm text-slate-400">{demand.message}</p>}
      </ChartCard>
    </div>
  );
}
