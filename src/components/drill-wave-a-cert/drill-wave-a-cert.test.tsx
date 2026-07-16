import { render, screen } from "@testing-library/react";
import { DrillWaveACert } from "./drill-wave-a-cert";

test("renders exact text content wave-a-certified [req:3.1]", () => {
  render(<DrillWaveACert />);
  expect(screen.getByText("wave-a-certified")).toHaveTextContent("wave-a-certified");
});

test("renders a div with the required Tailwind utility classes [req:3.2]", () => {
  render(<DrillWaveACert />);
  const el = screen.getByText("wave-a-certified");
  expect(el.tagName).toBe("DIV");
  expect(el).toHaveClass("py-2", "text-center", "text-xs", "text-muted-foreground");
});

test("renders no interactive elements or onClick handler [req:3.3]", () => {
  const { container } = render(<DrillWaveACert />);
  expect(container.querySelectorAll("a").length).toBe(0);
  expect(container.querySelectorAll("button").length).toBe(0);
  expect(container.querySelector("[onclick]")).toBeNull();
});
