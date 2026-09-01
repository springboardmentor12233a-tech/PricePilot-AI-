import React from "react";

import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  ChevronRight,
  Menu,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "AI Price Intelligence",
    description:
      "Turn product, market, and demand data into intelligent pricing recommendations.",
  },
  {
    icon: TrendingUp,
    title: "Demand Forecasting",
    description:
      "Forecast demand, identify trends, and understand how pricing affects future sales.",
  },
  {
    icon: Target,
    title: "Competitor Analysis",
    description:
      "Track competitive pricing and understand where your products stand in the market.",
  },
];

const metrics = [
  {
    label: "Recommended Price",
    value: "₹1,899",
    change: "+12.4%",
    description: "optimization opportunity",
  },
  {
    label: "Predicted Demand",
    value: "1,248",
    change: "+8.7%",
    description: "next 30 days",
  },
  {
    label: "Revenue Potential",
    value: "₹23.7L",
    change: "+18.2%",
    description: "estimated opportunity",
  },
];

const steps = [
  {
    number: "01",
    title: "Connect your data",
    description:
      "Add product details, historical prices, competitor data, and sales information.",
  },
  {
    number: "02",
    title: "AI finds patterns",
    description:
      "Our models analyze demand, pricing behavior, market conditions, and historical trends.",
  },
  {
    number: "03",
    title: "Act with confidence",
    description:
      "Receive pricing recommendations and insights designed to improve revenue and margins.",
  },
];

const benefits = [
  "AI-powered recommendations",
  "Demand forecasting",
  "Competitor intelligence",
  "Revenue optimization",
];

function LandingPage() {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="landing-wrapper">
      {/* ================= NAVBAR ================= */}
      <header className="navbar">
        <div className="nav-container">
          <a href="#" className="brand" onClick={closeMenu}>
            <div className="brand-mark">
              <TrendingUp size={19} strokeWidth={2.5} />
            </div>

            <span>
              PricePilot <strong>AI</strong>
            </span>
          </a>

          <nav className={`nav-links ${menuOpen ? "mobile-open" : ""}`}>
            <a href="#features" onClick={closeMenu}>
              Features
            </a>

            <a href="#how-it-works" onClick={closeMenu}>
              How it works
            </a>

            <a href="#analytics" onClick={closeMenu}>
              Analytics
            </a>

            <div className="mobile-nav-actions">
              <button className="login-btn">Log in</button>
              <button className="primary-btn">
                Get Started
                <ArrowRight size={16} />
              </button>
            </div>
          </nav>

          <div className="nav-actions desktop-actions">
            <button className="login-btn">Log in</button>

            <button className="primary-btn">
              Get Started
              <ArrowRight size={16} />
            </button>
          </div>

          <button
            className="menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <main>
        {/* ================= HERO ================= */}
        <section className="hero">
          <div className="hero-background">
            <div className="hero-grid"></div>
            <div className="hero-glow glow-one"></div>
            <div className="hero-glow glow-two"></div>
          </div>

          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              <Zap size={14} />
              AI-powered pricing intelligence
            </div>

            <h1>
              Price smarter.
              <br />
              <span>Grow faster.</span>
            </h1>

            <p className="hero-description">
              PricePilot AI transforms product, market, competitor, and
              demand data into actionable pricing intelligence.
            </p>

            <div className="hero-actions">
              <button className="primary-btn hero-btn">
                Start optimizing
                <ArrowRight size={17} />
              </button>

              <a href="#features" className="secondary-btn hero-btn">
                Explore platform
              </a>
            </div>

            <div className="hero-trust">
              <div className="trust-item">
                <Check size={15} />
                No credit card required
              </div>

              <div className="trust-item">
                <Check size={15} />
                AI-powered insights
              </div>

              <div className="trust-item">
                <Check size={15} />
                Built for modern teams
              </div>
            </div>
          </div>

          {/* ================= DASHBOARD PREVIEW ================= */}
          <div className="dashboard-preview" id="analytics">
            <div className="browser-bar">
              <div className="browser-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>

              <div className="browser-address">
                app.pricepilot.ai/dashboard
              </div>

              <div className="browser-status">
                <span></span>
                Live
              </div>
            </div>

            <div className="dashboard-content">
              <div className="dashboard-heading">
                <div>
                  <span className="eyebrow">PRICE INTELLIGENCE</span>
                  <h3>Performance overview</h3>
                </div>

                <div className="analysis-status">
                  <span></span>
                  Live analysis
                </div>
              </div>

              <div className="metrics-grid">
                {metrics.map((metric) => (
                  <div className="metric-card" key={metric.label}>
                    <span className="metric-label">{metric.label}</span>

                    <strong className="metric-value">
                      {metric.value}
                    </strong>

                    <div className="metric-footer">
                      <span className="metric-change">
                        <TrendingUp size={13} />
                        {metric.change}
                      </span>

                      <span className="metric-description">
                        {metric.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <span className="chart-label">REVENUE TREND</span>
                    <strong>Pricing performance</strong>
                  </div>

                  <div className="chart-period">Last 30 days</div>
                </div>

                <div className="chart">
                  <div className="chart-grid-lines">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                  <div className="bars">
                    {[38, 48, 43, 62, 57, 70, 64, 82, 75, 91, 86, 100].map(
                      (height, index) => (
                        <div
                          key={index}
                          className="bar"
                          style={{ height: `${height}%` }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FEATURES ================= */}
        <section id="features" className="section features-section">
          <div className="section-heading">
            <div className="section-eyebrow">
              <BarChart3 size={14} />
              Powerful intelligence
            </div>

            <h2>
              Everything you need to make
              <span> better pricing decisions.</span>
            </h2>

            <p>
              A unified intelligence layer for understanding your products,
              customers, competitors, and market.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article className="feature-card" key={feature.title}>
                  <div className="feature-icon">
                    <Icon size={22} />
                  </div>

                  <h3>{feature.title}</h3>

                  <p>{feature.description}</p>

                  <button className="feature-link">
                    Learn more
                    <ChevronRight size={15} />
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section id="how-it-works" className="section workflow-section">
          <div className="section-heading">
            <div className="section-eyebrow">
              <Zap size={14} />
              Simple by design
            </div>

            <h2>
              From raw data to
              <span> better decisions.</span>
            </h2>

            <p>
              PricePilot turns complex pricing data into clear,
              understandable actions.
            </p>
          </div>

          <div className="steps-grid">
            {steps.map((step) => (
              <article className="step-card" key={step.number}>
                <div className="step-top">
                  <span className="step-number">{step.number}</span>
                  <div className="step-line"></div>
                </div>

                <h3>{step.title}</h3>

                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ================= CTA ================= */}
        <section className="cta-section">
          <div className="cta-background"></div>

          <div className="cta-content">
            <div className="section-eyebrow">
              <BrainCircuit size={14} />
              Built for smarter decisions
            </div>

            <h2>
              Let AI guide your
              <span> next pricing decision.</span>
            </h2>

            <p>
              Turn your business data into actionable pricing intelligence
              and make every pricing decision with greater confidence.
            </p>

            <button className="primary-btn hero-btn">
              Get started for free
              <ArrowRight size={17} />
            </button>
          </div>

          <div className="cta-benefits">
            {benefits.map((benefit) => (
              <div className="benefit" key={benefit}>
                <div className="benefit-icon">
                  <Check size={14} />
                </div>

                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="footer">
        <div className="footer-container">
          <a href="#" className="brand">
            <div className="brand-mark">
              <TrendingUp size={17} strokeWidth={2.5} />
            </div>

            <span>
              PricePilot <strong>AI</strong>
            </span>
          </a>

          <p>
            AI-powered pricing intelligence for smarter business decisions.
          </p>

          <span className="copyright">
            © {new Date().getFullYear()} PricePilot AI
          </span>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;