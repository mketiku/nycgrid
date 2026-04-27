"use client";

import { useEffect, useRef } from "react";

const TARGET = "cheese";
const BUFFER_SIZE = TARGET.length;

export function useCheesecode(onCheese: () => void) {
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
        onCheese();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [onCheese]);
}
