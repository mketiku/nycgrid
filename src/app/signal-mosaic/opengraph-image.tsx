import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderOgVariant,
} from "@/features/og-image/variants";

export const runtime = "nodejs";
export const alt = "nycgrid — Signal Mosaic";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function Image() {
  return renderOgVariant("signal-mosaic");
}
