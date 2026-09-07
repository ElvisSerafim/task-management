"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginAction } from "@/actions/auth";
import { api } from "@/lib/api";
import { errMessage } from "@/lib/errors";
import { credentialsSchema } from "@/lib/schemas";
import { toast } from "@/components/toast";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { username: "", password: "" },
  });

  async function login({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) {
    setError("");
    try {
      const result = await loginAction({ username, password });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.replace("/projects");
      router.refresh();
    } catch (e) {
      setError(errMessage(e));
    }
  }

  async function registerUser({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) {
    setError("");
    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      toast.success("Account created. Log in with those credentials.");
    } catch (e) {
      toast.error(errMessage(e));
    }
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center p-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-500">Task management</p>
        <h1 className="mb-6 mt-1 text-2xl font-semibold tracking-tight">
          Log in
        </h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(login)}>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Username
            <input
              className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm font-normal outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700"
              autoComplete="username"
              {...register("username")}
            />
            {errors.username ? (
              <p className="text-sm font-normal text-red-600">
                {errors.username.message}
              </p>
            ) : null}
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Password
            <input
              className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm font-normal outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-sm font-normal text-red-600">
                {errors.password.message}
              </p>
            ) : null}
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Log in
            </button>
            <button
              type="button"
              className="rounded-lg border border-zinc-200 px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              onClick={handleSubmit(registerUser)}
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
