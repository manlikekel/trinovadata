import { beforeEach, describe, expect, it } from "vitest";
import { closeGuide, GUEST, maybeStartGuide, setGuideUser, useGuide } from "./onboarding";
import { renderHook } from "@testing-library/react";

const current = () => renderHook(() => useGuide()).result.current;

describe("first-use guide", () => {
  beforeEach(() => {
    localStorage.clear();
    setGuideUser(GUEST);
    closeGuide();
    localStorage.clear();
  });

  it("opens once for a new guest, then stays closed", () => {
    maybeStartGuide();
    expect(current().open).toBe(true);
    closeGuide();
    maybeStartGuide();
    expect(current().open).toBe(false);
  });

  it("shows the guide to each newly signed-in user once", () => {
    setGuideUser("user-a", "Ada");
    expect(current()).toMatchObject({ open: true, user: "user-a", name: "Ada" });
    closeGuide();
    setGuideUser("user-a", "Ada");
    expect(current().open).toBe(false);
    setGuideUser("user-b");
    expect(current().open).toBe(true);
  });
});
