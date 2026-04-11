// file: app/components/AlgorithmSelector.tsx
"use client";
import { useAlgorithm } from "./AlgorithmContext"; // Nhớ trỏ đúng đường dẫn

export default function AlgorithmSelector() {
  const { algorithms, selectedAlgoId, setSelectedAlgoId } = useAlgorithm();

  // Nếu chưa có dữ liệu hoặc không có thuật toán nào thì ẩn thanh này đi
  if (algorithms.length === 0) return null;

  return (
    <div style={{ 
      // background: "hsl(0, 0%, 100%)", 
      borderBottom: "1px solid #c7e0f4", 
      padding: "8px 20px", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      gap: "12px",
      fontSize: "0.9rem"
    }}>
      {/* <span style={{ fontWeight: 600, color: "var(--ms-blue)" }}>
      </span> */}
      <select 
        value={selectedAlgoId || ""}
        onChange={(e) => setSelectedAlgoId(Number(e.target.value))}
        style={{ 
          padding: "4px 12px", 
          borderRadius: "4px", 
          border: "1px solid var(--ms-blue)", 
          outline: "none",
          fontWeight: 600,
          cursor: "pointer"
        }}
      >
        {algorithms.map(algo => (
          <option key={algo.algo_id} value={algo.algo_id}>
            {algo.algo_name}
          </option>
        ))}
      </select>
    </div>
  );
}