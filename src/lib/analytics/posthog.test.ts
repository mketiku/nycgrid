import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("posthog-js", () => ({
  default: {
    capture: vi.fn(),
  },
}));

import posthog from "posthog-js";
import {
  captureMapCameraClick,
  captureCameraFeedView,
  captureCameraFeedDwell,
  captureAmbientStarted,
  capturePhotoTaken,
  capturePostcardViewed,
  captureFrameDiffUsed,
} from "./posthog";

describe("posthog analytics wrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captureMapCameraClick calls posthog.capture with correct event and props", () => {
    captureMapCameraClick("cam-123", "Manhattan");
    expect(posthog.capture).toHaveBeenCalledWith("map_camera_clicked", {
      camera_id: "cam-123",
      area: "Manhattan",
    });
  });

  it("captureCameraFeedView calls posthog.capture with correct event and props", () => {
    captureCameraFeedView("cam-456", "Brooklyn");
    expect(posthog.capture).toHaveBeenCalledWith("camera_feed_viewed", {
      camera_id: "cam-456",
      area: "Brooklyn",
    });
  });

  it("captureAmbientStarted calls posthog.capture", () => {
    captureAmbientStarted();
    expect(posthog.capture).toHaveBeenCalledWith("ambient_started", {});
  });

  it("capturePhotoTaken calls posthog.capture with camera_id", () => {
    capturePhotoTaken("cam-789");
    expect(posthog.capture).toHaveBeenCalledWith("photo_taken", {
      camera_id: "cam-789",
    });
  });

  it("captureCameraFeedDwell calls posthog.capture with seconds", () => {
    captureCameraFeedDwell("cam-123", "Bronx", 30);
    expect(posthog.capture).toHaveBeenCalledWith("camera_feed_dwell", {
      camera_id: "cam-123",
      area: "Bronx",
      seconds: 30,
    });
  });

  it("capturePostcardViewed calls posthog.capture with camera_id and camera_name", () => {
    capturePostcardViewed("cam-123", "Atlantic Ave @ Barclays Center");
    expect(posthog.capture).toHaveBeenCalledWith("postcard_viewed", {
      camera_id: "cam-123",
      camera_name: "Atlantic Ave @ Barclays Center",
    });
  });

  it("captureFrameDiffUsed calls posthog.capture with camera_id", () => {
    captureFrameDiffUsed("cam-456");
    expect(posthog.capture).toHaveBeenCalledWith("frame_diff_used", {
      camera_id: "cam-456",
    });
  });

  it("no-ops gracefully when posthog.capture throws", () => {
    vi.mocked(posthog.capture).mockImplementation(() => {
      throw new Error("PostHog unavailable");
    });
    expect(() => captureMapCameraClick("cam-123", "Queens")).not.toThrow();
  });
});
