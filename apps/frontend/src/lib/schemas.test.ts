import { describe, expect, it } from "vitest";
import { credentialsSchema, projectSchema, taskSchema } from "./schemas";

describe("credentialsSchema", () => {
  it("rejects empty and whitespace", () => {
    expect(credentialsSchema.safeParse({ username: "", password: "x" }).success).toBe(false);
    expect(credentialsSchema.safeParse({ username: "  ", password: "x" }).success).toBe(false);
    expect(credentialsSchema.safeParse({ username: "u", password: "" }).success).toBe(false);
    expect(credentialsSchema.safeParse({ username: "u", password: "  " }).success).toBe(false);
  });
});

describe("projectSchema", () => {
  it("rejects empty and whitespace title", () => {
    expect(projectSchema.safeParse({ title: "" }).success).toBe(false);
    expect(projectSchema.safeParse({ title: "   " }).success).toBe(false);
  });
});

describe("taskSchema", () => {
  const schema = taskSchema("2026-09-07");

  it("rejects empty description", () => {
    expect(schema.safeParse({ description: "", dueDate: "" }).success).toBe(false);
    expect(schema.safeParse({ description: "  ", dueDate: "" }).success).toBe(false);
  });

  it("accepts empty due date", () => {
    expect(schema.safeParse({ description: "Write tests", dueDate: "" }).success).toBe(true);
  });

  it("rejects a due date before today", () => {
    expect(schema.safeParse({ description: "Write tests", dueDate: "2026-09-06" }).success).toBe(false);
  });

  it("allows keeping an existing past due date on edit", () => {
    const edit = taskSchema("2026-09-07", "2026-09-06");
    expect(edit.safeParse({ description: "Write tests", dueDate: "2026-09-06" }).success).toBe(true);
    expect(edit.safeParse({ description: "Write tests", dueDate: "2026-09-05" }).success).toBe(false);
  });
});
