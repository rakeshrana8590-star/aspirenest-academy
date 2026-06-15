import { useEffect, useState } from "react";

export function useMockTestActionMenu() {
  const [mockMenuPosition, setMockMenuPosition] = useState(null);
  const [mockMenuTest, setMockMenuTest] = useState(null);

  const openMockActionPortal = (event, test) => {
    const rect = event.currentTarget.getBoundingClientRect();

    setMockMenuPosition({
      top: rect.bottom + 8,
      left: rect.left,
    });

    setMockMenuTest(test);
  };

  const closeMockActionPortal = () => {
    setMockMenuPosition(null);
    setMockMenuTest(null);
  };

  useEffect(() => {
    if (!mockMenuPosition) return undefined;

    const handleCloseOnMove = () => {
      closeMockActionPortal();
    };

    window.addEventListener("scroll", handleCloseOnMove, true);
    window.addEventListener("resize", handleCloseOnMove);

    return () => {
      window.removeEventListener("scroll", handleCloseOnMove, true);
      window.removeEventListener("resize", handleCloseOnMove);
    };
  }, [mockMenuPosition]);

  return {
    mockMenuPosition,
    mockMenuTest,
    openMockActionPortal,
    closeMockActionPortal,
  };
}