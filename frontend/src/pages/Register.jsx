import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("User");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
  setError("Password must be at least 8 characters long");
  return;
}

if (!/[A-Z]/.test(password)) {
  setError("Password must contain at least one uppercase letter");
  return;
}

if (!/[a-z]/.test(password)) {
  setError("Password must contain at least one lowercase letter");
  return;
}

if (!/[0-9]/.test(password)) {
  setError("Password must contain at least one number");
  return;
}

if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
  setError("Password must contain at least one special character");
  return;
}

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          role: role,
        }),
      });

      const data = await response.json();

if (!response.ok) {
  let errorMessage = "Registration failed";

  if (typeof data.detail === "string") {
    errorMessage = data.detail;
  } else if (Array.isArray(data.detail)) {
    errorMessage = data.detail
      .map((error) => error.msg)
      .join(", ");
  } else if (data.detail) {
    errorMessage = JSON.stringify(data.detail);
  }

  throw new Error(errorMessage);
}

      setSuccess("Account created successfully!");

      setTimeout(() => {
        navigate("/login");
      }, 1200);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* BRANDING */}

      <div className="login-branding">

        <div className="login-logo">
          ✦
        </div>

        <h1>PricePilot AI</h1>

        <p>
          Revenue & Pricing Intelligence Platform
        </p>

      </div>


      {/* REGISTER CARD */}

      <div className="login-card">

        <div className="login-heading">

          <h2>Create your account</h2>

          <p>
            Create an account to access PricePilot AI
          </p>

        </div>


        <form onSubmit={handleSubmit}>

          {/* USERNAME */}

          <div className="login-field">

            <label>Username</label>

            <div className="input-wrapper">

              <span className="input-icon">
                👤
              </span>

              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                placeholder="Enter your username"
                required
              />

            </div>

          </div>


          {/* EMAIL */}

          <div className="login-field">

            <label>Email Address</label>

            <div className="input-wrapper">

              <span className="input-icon">
                ✉
              </span>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="name@organization.org"
                required
              />

            </div>

          </div>


          {/* ROLE */}

          <div className="login-field">

            <label>Account Role</label>

            <div className="role-options">

              <label className="role-option">

                <input
                  type="radio"
                  name="role"
                  value="User"
                  checked={role === "User"}
                  onChange={(e) =>
                    setRole(e.target.value)
                  }
                />

                <span>
                  User
                </span>

              </label>


              <label className="role-option">

                <input
                  type="radio"
                  name="role"
                  value="Business Analyst"
                  checked={role === "Business Analyst"}
                  onChange={(e) =>
                    setRole(e.target.value)
                  }
                />

                <span>
                  Business Analyst
                </span>

              </label>

            </div>

          </div>


          {/* PASSWORD */}

          <div className="login-field">

            <label>Password</label>

            <div className="input-wrapper">

              <span className="input-icon">
                🔒
              </span>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Create a password"
                minLength={8}
                required
              />

            </div>
            <p className="password-hint">
                Minimum 8 characters with uppercase, lowercase, number and special character.
            </p>

          </div>


          {/* CONFIRM PASSWORD */}

          <div className="login-field">

            <label>Confirm Password</label>

            <div className="input-wrapper">

              <span className="input-icon">
                🔒
              </span>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Confirm your password"
                required
              />

            </div>

          </div>


          {/* ERROR */}

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}


          {/* SUCCESS */}

          {success && (
            <div className="register-success">
              {success}
            </div>
          )}


          {/* REGISTER BUTTON */}

          <button
            type="submit"
            className="signin-button"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account →"}
          </button>

        </form>


        <div className="login-divider"></div>


        <div className="create-account">

          <span>
            Already have an account?
          </span>

          <button
            type="button"
            onClick={() => navigate("/login")}
          >
            Sign In
          </button>

        </div>

      </div>

    </div>
  );
}

export default Register;