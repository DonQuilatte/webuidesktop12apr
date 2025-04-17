import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

// A simple component with no hooks
function SimpleComponent() {
  return <div>Simple Test Component</div>;
}

describe("SimpleComponent", () => {
  it("renders without crashing", () => {
    render(<SimpleComponent />);
    expect(screen.getByText("Simple Test Component")).toBeInTheDocument();
  });
});
