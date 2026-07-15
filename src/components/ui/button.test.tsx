import { render, screen } from "@testing-library/react";
import { Button } from "./button";

// Scaffold smoke test: proves the vitest+jsdom+testing-library battery is
// wired before any feature lands. [req:scaffold]
test("shadcn Button renders its children", () => {
  render(<Button>launch</Button>);
  expect(screen.getByRole("button", { name: "launch" })).toBeInTheDocument();
});
