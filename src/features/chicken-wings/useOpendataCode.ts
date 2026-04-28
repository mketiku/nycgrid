"use client";

import { useEffect, useRef } from "react";

const TARGET = "opendata";
const BUFFER_SIZE = TARGET.length;

export function useOpendataCode(onOpendata: () => void) {
  const bufferRef = useRef<string[]>([]);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key.length !== 1) return;
      bufferRef.current.push(e.key.toLowerCase());
      if (bufferRef.current.length > BUFFER_SIZE) {
        bufferRef.current.shift();
      }
      if (bufferRef.current.join("") === TARGET) {
        bufferRef.current = [];
        onOpendata();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [onOpendata]);
}
