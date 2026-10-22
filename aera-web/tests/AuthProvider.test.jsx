import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "../src/hooks/useAuth";
import { authService } from "../src/services/auth";
import { userService } from "../src/services/user";

vi.mock("../src/services/auth", () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
  },
}));

vi.mock("../src/services/user", () => ({
  userService: {
    getProfile: vi.fn(),
  },
}));

function AuthState() {
  const { user, register, login } = useAuth();

  return (
    <div>
      <span>{user?.email || "Signed out"}</span>
      <button
        onClick={() =>
          register({
            email: "new@example.com",
            password: "StrongPassword123!",
          })
        }
      >
        Register through provider
      </button>
      <button
        onClick={() =>
          login({
            email: "new@example.com",
            password: "StrongPassword123!",
          })
        }
      >
        Login through provider
      </button>
    </div>
  );
}

describe("AuthProvider registration and login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    authService.register.mockResolvedValue({ access_token: "registered-token" });
    authService.login.mockResolvedValue({ access_token: "login-token" });
    userService.getProfile.mockResolvedValue({ email: "new@example.com" });
  });

  it("stores the registration token and loads the new account profile", async () => {
    render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByText("Register through provider"));

    await waitFor(() => {
      expect(localStorage.getItem("aera_token")).toBe("registered-token");
      expect(userService.getProfile).toHaveBeenCalled();
      expect(screen.getByText("new@example.com")).toBeInTheDocument();
    });
  });

  it("stores the login token and loads the signed-in profile", async () => {
    render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByText("Login through provider"));

    await waitFor(() => {
      expect(localStorage.getItem("aera_token")).toBe("login-token");
      expect(userService.getProfile).toHaveBeenCalled();
      expect(screen.getByText("new@example.com")).toBeInTheDocument();
    });
  });
});
