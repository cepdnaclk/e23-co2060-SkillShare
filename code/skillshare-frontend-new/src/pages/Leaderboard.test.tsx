import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import Leaderboard from "./Leaderboard";

vi.mock("@/components/AppLayout", () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/api/dashboard.api", () => ({ trendingApi: { getTopActiveUsers: async () => [
  { id: "one", fullName: "Photo User", profilePictureUrl: "https://res.cloudinary.com/demo/image/upload/photo.jpg", xp: 300 },
  { id: "two", fullName: "Fallback User", profilePictureUrl: null, xp: 200 },
  { id: "three", fullName: "Broken Image", profilePictureUrl: "https://example.com/broken.jpg", xp: 100 },
] } }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("renders actual profile URLs and keeps initials for missing or failed pictures", async () => {
  vi.stubGlobal("Image", class extends EventTarget {
    private url = "";
    complete = false;
    naturalWidth = 0;
    get src() { return this.url; }
    set src(value: string) {
      this.url = value;
      queueMicrotask(() => {
        this.complete = true;
        this.naturalWidth = value.includes("broken") ? 0 : 250;
        this.dispatchEvent(new Event(this.naturalWidth ? "load" : "error"));
      });
    }
  });
  render(<Leaderboard />);
  expect(await screen.findByRole("img", { name: "Photo User" })).toHaveAttribute(
    "src", "https://res.cloudinary.com/demo/image/upload/photo.jpg"
  );
  expect(screen.getByText("FU")).toBeInTheDocument();
  expect(screen.getByText("BI")).toBeInTheDocument();
  expect(screen.getByText("300 XP")).toBeInTheDocument();
});
