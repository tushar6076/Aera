import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authService } from "../src/services/auth";
import Login from "../src/pages/auth/Login";
import Forgot from "../src/pages/auth/Forgot";
import Reset from "../src/pages/auth/Reset";
import Register from "../src/pages/auth/register/Layout";

const { mockLogin, mockRegister } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockRegister: vi.fn(),
}));

vi.mock("../src/hooks/useAuth", () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
  }),
}));

vi.mock("../src/services/auth", () => ({
  authService: {
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

function renderAt(path, element) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={element} />
        <Route path="/reset" element={<Reset />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<div>Dashboard ready</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Web authentication flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockResolvedValue({ id: 1 });
    mockRegister.mockResolvedValue({ id: 1 });
    authService.forgotPassword.mockResolvedValue({
      message: "If an account exists, a verification code has been sent.",
    });
    authService.resetPassword.mockResolvedValue({ message: "Password reset." });
  });

  it("registers and transitions to the authenticated dashboard", async () => {
    renderAt("/register", <Register />);

    fireEvent.change(screen.getByPlaceholderText("Alex Rivera"), {
      target: { value: "Alex Rivera" },
    });
    fireEvent.change(screen.getByPlaceholderText("name@domain.com"), {
      target: { value: "alex@example.com" },
    });
    fireEvent.click(screen.getByText("Continue to Security"));

    fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), {
      target: { value: "StrongPassword123!" },
    });
    fireEvent.change(screen.getByPlaceholderText("Re-enter password"), {
      target: { value: "StrongPassword123!" },
    });
    fireEvent.click(screen.getByText("Complete Setup"));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: "alex@example.com",
        password: "StrongPassword123!",
        full_name: "Alex Rivera",
      });
      expect(screen.getByText("Dashboard ready")).toBeInTheDocument();
    });
  });

  it("logs in and transitions to the authenticated dashboard", async () => {
    renderAt("/login", <Login />);

    fireEvent.change(screen.getByPlaceholderText("name@domain.com"), {
      target: { value: "alex@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "StrongPassword123!" },
    });
    fireEvent.click(screen.getByText("Enter Workspace"));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "alex@example.com",
        password: "StrongPassword123!",
      });
      expect(screen.getByText("Dashboard ready")).toBeInTheDocument();
    });
  });

  it("requests a code and resets the password using six digits", async () => {
    renderAt("/forgot", <Forgot />);

    fireEvent.change(screen.getByPlaceholderText("name@domain.com"), {
      target: { value: "alex@example.com" },
    });
    fireEvent.click(screen.getByText("Send Verification Code"));

    await waitFor(() => {
      expect(authService.forgotPassword).toHaveBeenCalledWith("alex@example.com");
      expect(screen.getByText("Set New Password")).toBeInTheDocument();
    });

    const codeInput = screen.getByPlaceholderText("6-digit code");
    expect(codeInput).toHaveAttribute("maxLength", "6");
    fireEvent.change(codeInput, { target: { value: "12345" } });
    fireEvent.change(screen.getByPlaceholderText("name@domain.com"), {
      target: { value: "alex@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), {
      target: { value: "AnotherPassword123!" },
    });
    fireEvent.change(screen.getByPlaceholderText("Re-enter password"), {
      target: { value: "AnotherPassword123!" },
    });
    fireEvent.click(screen.getByText("Reset Password"));

    expect(
      await screen.findByText("Enter the 6-digit verification code sent to your email."),
    ).toBeInTheDocument();
    expect(authService.resetPassword).not.toHaveBeenCalled();

    fireEvent.change(codeInput, { target: { value: "123456" } });
    fireEvent.click(screen.getByText("Reset Password"));

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith(
        "alex@example.com",
        "123456",
        "AnotherPassword123!",
      );
      expect(screen.getByText("Password Updated")).toBeInTheDocument();
    });
  });
});
