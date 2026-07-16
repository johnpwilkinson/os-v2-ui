import { render, screen } from "@testing-library/react";
import { DrillRunwayCheck } from "./drill-runway-check";

test("renders exact text content os-v2-ui [req:3.1]", () => {
  render(<DrillRunwayCheck />);
  expect(screen.getByText("os-v2-ui")).toHaveTextContent("os-v2-ui");
});

test("renders a div with the required Tailwind utility classes [req:3.2]", () => {
  render(<DrillRunwayCheck />);
  const el = screen.getByText("os-v2-ui");
  expect(el.tagName).toBe("DIV");
  expect(el).toHaveClass("py-2", "text-center", "text-xs", "text-muted-foreground");
});

test("renders no interactive elements or onClick handler [req:3.3]", () => {
  const { container } = render(<DrillRunwayCheck />);
  expect(container.querySelectorAll("a").length).toBe(0);
  expect(container.querySelectorAll("button").length).toBe(0);
  expect(container.querySelector("[onclick]")).toBeNull();
});
