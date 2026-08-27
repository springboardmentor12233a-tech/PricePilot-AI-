import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  TrendingUp,
  Target,
  Zap,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "AI Price Intelligence",
    description:
      "Transform raw business data into intelligent pricing recommendations using machine learning.",
  },
  {
    icon: TrendingUp,
    title: "Demand Forecasting",
    description:
      "Predict future product demand and identify trends before they impact your business.",
  },
  {
    icon: Target,
    title: "Competitor Analysis",
    description:
      "Compare market prices and understand your competitive position in real time.",
  },
];

function LandingPage() {
  return (
    <div className="landing-page">
      {/* ================= NAVBAR ================= */}

      <nav className="navbar">
        <div className="logo">
          <div className="logo-icon">
            <TrendingUp size={22} />
          </div>

          <span>
            PricePilot <strong>AI</strong>
          </span>
        </div>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#analytics">Analytics</a>
        </div>

        <div className="nav-actions">
          <button className="login-btn">Log in</button>

          <button className="primary-btn">
            Get Started
            <ArrowRight size={18} />
          </button>
        </div>
      </nav>

      {/* ================= HERO ================= */}

      <main>
        <section className="hero">
          <div className="hero-badge">
            <Zap size={16} />
            AI-Powered Pricing Intelligence
          </div>

          <h1>
            Price Smarter.
            <span> Grow Faster.</span>
          </h1>

          <p>
            PricePilot AI analyzes your product, market, competitor, and demand
            data to generate intelligent pricing recommendations that help you
            maximize revenue.
          </p>

          <div className="hero-actions">
            <button className="primary-btn hero-btn">
              Start Optimizing
              <ArrowRight size={19} />
            </button>

            <button className="secondary-btn">
              Explore Platform
            </button>
          </div>

          {/* Dashboard Preview */}

          <div className="dashboard-preview">
            <div className="preview-header">
              <div>
                <p className="preview-label">PRICE INTELLIGENCE</p>
                <h3>Performance Overview</h3>
              </div>

              <div className="live-status">
                <span></span>
                Live Analysis
              </div>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <span>Recommended Price</span>
                <h2>₹1,899</h2>
                <small>+12.4% optimized</small>
              </div>

              <div className="metric-card">
                <span>Predicted Demand</span>
                <h2>1,248</h2>
                <small>Next 30 days</small>
              </div>

              <div className="metric-card">
                <span>Revenue Potential</span>
                <h2>₹23.7L</h2>
                <small>+18.2% opportunity</small>
              </div>
            </div>

            <div className="chart-placeholder">
              <BarChart3 size={28} />
              <div className="chart-lines">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FEATURES ================= */}

        <section id="features" className="features-section">
          <div className="section-heading">
            <p>POWERFUL INTELLIGENCE</p>

            <h2>
              Everything you need to make
              <span> smarter pricing decisions.</span>
            </h2>
          </div>

          <div className="features-grid">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article className="feature-card" key={feature.title}>
                  <div className="feature-icon">
                    <Icon size={28} />
                  </div>

                  <h3>{feature.title}</h3>

                  <p>{feature.description}</p>

                  <button>
                    Learn more
                    <ArrowRight size={17} />
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {/* ================= HOW IT WORKS ================= */}

        <section id="how-it-works" className="how-it-works">
          <div className="section-heading">
            <p>HOW PRICEPILOT WORKS</p>

            <h2>
              From data to decision
              <span> in three simple steps.</span>
            </h2>
          </div>

          <div className="steps">
            <div className="step">
              <div className="step-number">01</div>

              <h3>Provide Your Data</h3>

              <p>
                Add product information, pricing data, competitor prices, and
                historical sales data.
              </p>
            </div>

            <div className="step">
              <div className="step-number">02</div>

              <h3>AI Analyzes Patterns</h3>

              <p>
                Our machine learning models evaluate demand, pricing patterns,
                and market conditions.
              </p>
            </div>

            <div className="step">
              <div className="step-number">03</div>

              <h3>Get Recommendations</h3>

              <p>
                Receive intelligent pricing recommendations and insights to
                improve business performance.
              </p>
            </div>
          </div>
        </section>

        {/* ================= CTA ================= */}

        <section className="cta-section">
          <div>
            <p className="cta-label">READY TO OPTIMIZE?</p>

            <h2>
              Let AI guide your
              <span> next pricing decision.</span>
            </h2>

            <p>
              Turn your business data into actionable pricing intelligence.
            </p>

            <button className="primary-btn hero-btn">
              Get Started
              <ArrowRight size={19} />
            </button>
          </div>

          <div className="cta-checks">
            <div>
              <CheckCircle2 size={20} />
              AI-powered recommendations
            </div>

            <div>
              <CheckCircle2 size={20} />
              Demand forecasting
            </div>

            <div>
              <CheckCircle2 size={20} />
              Revenue optimization
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}

      <footer>
        <div className="logo">
          <div className="logo-icon">
            <TrendingUp size={20} />
          </div>

          <span>
            PricePilot <strong>AI</strong>
          </span>
        </div>

        <p>AI-powered pricing intelligence for smarter business decisions.</p>

        <span>© 2026 PricePilot AI</span>
      </footer>
    </div>
  );
}

export default LandingPage;