import React from "react";
import { Database, Cpu, Activity, Award, Shield, CheckCircle2 } from "lucide-react";

function ArchitectureSection() {
  const pipeline = [
    {
      num: "01",
      title: "Data Pipeline & Ingestion",
      icon: <Database size={20} color="#10b981" />,
      items: [
        "Retail & E-commerce Sales Datasets",
        "Competitor Price Feeds & Market Scrapes",
        "Inventory Stock & Seasonality Flags",
        "Automated Preprocessing & Imputation"
      ]
    },
    {
      num: "02",
      title: "AI / ML Core Engine",
      icon: <Cpu size={20} color="#6366f1" />,
      items: [
        "XGBoost Regressor for Demand Prediction",
        "ARIMA / Prophet Time-Series Forecaster",
        "Dynamic Price Elasticity Estimator",
        "Model Confidence Scoring (0-100%)"
      ]
    },
    {
      num: "03",
      title: "Decision & Action Layer",
      icon: <Activity size={20} color="#38bdf8" />,
      items: [
        "Optimal Price Range Generator",
        "What-If Scenario Simulation Engine",
        "Role-Based Access Control (RBAC)",
        "Automated Audit Trail Logging"
      ]
    },
    {
      num: "04",
      title: "Business Value Outcomes",
      icon: <Award size={20} color="#f59e0b" />,
      items: [
        "+8.4% Average Revenue Improvement",
        "Dynamic Real-time Market Agility",
        "Stockout & Margin Risk Protection",
        "Executive Strategy Alignment"
      ]
    }
  ];

  return (
    <section className="section-wrapper" id="architecture" style={{ background: 'rgba(0,0,0,0.2)' }}>
      <div className="section-title-center">
        <div className="section-tagline">End-to-End System Architecture</div>
        <h2 className="section-title">Designed for Enterprise Scale & Speed</h2>
        <p className="section-description">
          A high-performance pipeline connecting data ingestion to real-time machine learning inference and business intelligence reporting.
        </p>
      </div>

      <div className="pipeline-flow">
        {pipeline.map((step, idx) => (
          <div key={idx} className="pipeline-step">
            <span className="step-num">{step.num}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)' }}>
                {step.icon}
              </div>
              <h4 className="step-title">{step.title}</h4>
            </div>
            <ul className="step-list">
              {step.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ArchitectureSection;
