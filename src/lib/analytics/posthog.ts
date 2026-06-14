import posthog from "posthog-js";

function capture(event: string, props: Record<string, string | number | boolean>): void {
  try {
    posthog.capture(event, props);
  } catch {
    // PostHog failures must never affect product behaviour
  }
}

export function captureMapCameraClick(cameraId: string, area: string): void {
  capture("map_camera_clicked", { camera_id: cameraId, area });
}

export function captureCameraFeedView(cameraId: string, area: string): void {
  capture("camera_feed_viewed", { camera_id: cameraId, area });
}

export function captureAmbientStarted(): void {
  capture("ambient_started", {});
}

export function captureCameraFeedDwell(cameraId: string, area: string, seconds: number): void {
  capture("camera_feed_dwell", { camera_id: cameraId, area, seconds });
}

export function capturePhotoTaken(cameraId: string): void {
  capture("photo_taken", { camera_id: cameraId });
}

export function capturePostcardViewed(cameraId: string, cameraName: string): void {
  capture("postcard_viewed", { camera_id: cameraId, camera_name: cameraName });
}

export function captureFrameDiffUsed(cameraId: string): void {
  capture("frame_diff_used", { camera_id: cameraId });
}
