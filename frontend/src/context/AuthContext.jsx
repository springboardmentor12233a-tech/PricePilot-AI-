import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

const API_BASE_URL = "http://127.0.0.1:8000";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        setLoading(false);
    }, []);

    const login = async (email, password) => {

    const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email,
                password: password,
            }),
        }
    );

    const data = await response.json();

if (!response.ok) {
  let errorMessage = "Login failed";

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

        // Store JWT
        localStorage.setItem(
            "access_token",
            data.access_token
        );

        // Store user information
        const userData = {
            user_id: data.user_id,
            username: data.username,
            role: data.role,
        };

        localStorage.setItem(
            "user",
            JSON.stringify(userData)
        );

        setUser(userData);

        return data;
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");

        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}