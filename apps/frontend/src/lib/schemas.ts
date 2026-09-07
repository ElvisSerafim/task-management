import { z } from "zod";

const required = z.string().trim().min(1, "Required");

export const credentialsSchema = z.object({
  username: required,
  password: required,
});

export const projectSchema = z.object({
  title: required,
});

export function todayIso(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function taskSchema(today = todayIso(), existingDue?: string) {
  return z.object({
    description: required,
    dueDate: z
      .string()
      .refine(
        (v) => !v || v >= today || v === existingDue,
        "Due date cannot be before today",
      ),
  });
}
