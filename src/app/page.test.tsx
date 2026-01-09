import { describe, expect, it } from "vitest";

import { render, screen } from "@/test/test-utils";

import Home from "./page";

describe("Home", () => {
  it("renders the heading", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "営業日報システム" })).toBeInTheDocument();
  });
});
