import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ComplaintModal } from "./ComplaintModal";

describe("ComplaintModal", () => {
  it("renders nothing when open is false", () => {
    const { container } = render(<ComplaintModal open={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the dialog when open is true", () => {
    render(<ComplaintModal open={true} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("SUBMIT A COMPLAINT")).toBeDefined();
  });

  it("shows complaint type and agency fields", () => {
    render(<ComplaintModal open={true} onClose={vi.fn()} />);
    expect(screen.getByText("Excessive Use of Public Surveillance Infrastructure")).toBeDefined();
    expect(screen.getAllByText(/B\.R\.A\.K\.E\./i).length).toBeGreaterThan(0);
  });

  it("shows the current date in the DATE FILED field", () => {
    render(<ComplaintModal open={true} onClose={vi.fn()} />);
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    expect(screen.getByText(today)).toBeDefined();
  });

  it("shows the pre-filled comment field", () => {
    render(<ComplaintModal open={true} onClose={vi.fn()} />);
    expect(screen.getByText("I was just looking at cameras.")).toBeDefined();
  });

  it("transitions to confirmation view on submit", () => {
    render(<ComplaintModal open={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Submit Complaint/i }));

    expect(screen.getByText("Complaint Received")).toBeDefined();
    expect(screen.getByText("PENDING REVIEW")).toBeDefined();
    expect(screen.getByText("6–8 business weeks")).toBeDefined();
    expect(screen.getByText("B.R.A.K.E.")).toBeDefined();
  });

  it("shows a 7-digit case number after submit", () => {
    render(<ComplaintModal open={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Submit Complaint/i }));

    const caseText = screen.getByText(/Case #/i);
    const match = caseText.parentElement?.textContent?.match(/\d{7}/);
    expect(match).toBeTruthy();
  });

  it("shows the acknowledgment instructions after submit", () => {
    render(<ComplaintModal open={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Submit Complaint/i }));

    expect(screen.getByText(/You will be contacted at the address on file/i)).toBeDefined();
  });

  it("calls onClose and resets state when Acknowledge is clicked after submit", () => {
    const onClose = vi.fn();
    render(<ComplaintModal open={true} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /Submit Complaint/i }));
    expect(screen.getByText("Complaint Received")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /Acknowledge/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the X (close) button is clicked", () => {
    const onClose = vi.fn();
    render(<ComplaintModal open={true} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /Close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when 'Never mind' is clicked", () => {
    const onClose = vi.fn();
    render(<ComplaintModal open={true} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /Never mind/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(<ComplaintModal open={true} onClose={onClose} />);
    // The first motion.div (backdrop) has an onClick that calls handleClose
    const backdrop = container.querySelector(".fixed.inset-0.z-\\[200\\]");
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
