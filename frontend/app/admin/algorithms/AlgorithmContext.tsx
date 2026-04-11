// file: app/AlgorithmContext.tsx
"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Định nghĩa kiểu dữ liệu
interface Algorithm {
  algo_id: number;
  algo_name: string;
  is_active: boolean;
}

interface ContextType {
  algorithms: Algorithm[];
  selectedAlgoId: number | null;
  setSelectedAlgoId: (id: number) => void;
}

// Khởi tạo Context
const AlgorithmContext = createContext<ContextType>({
  algorithms: [],
  selectedAlgoId: null,
  setSelectedAlgoId: () => {},
});

// Component Provider để bọc ngoài ứng dụng
export function AlgorithmProvider({ children }: { children: ReactNode }) {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [selectedAlgoId, setSelectedAlgoId] = useState<number | null>(null);

  useEffect(() => {
    // Gọi API lấy danh sách thuật toán
    fetch("http://localhost:8000/admin/algorithms")
      .then(res => res.json())
      .then((data: Algorithm[]) => {
        // Chỉ lọc lấy những thuật toán đang Bật (is_active = true)
        const activeAlgos = data.filter(algo => algo.is_active);
        setAlgorithms(activeAlgos);
        
        // Mặc định chọn thuật toán đầu tiên nếu có
        if (activeAlgos.length > 0) {
          setSelectedAlgoId(activeAlgos[0].algo_id);
        }
      })
      .catch(err => console.error("Lỗi lấy danh sách thuật toán:", err));
  }, []);

  return (
    <AlgorithmContext.Provider value={{ algorithms, selectedAlgoId, setSelectedAlgoId }}>
      {children}
    </AlgorithmContext.Provider>
  );
}

// Hàm Hook tùy chỉnh để các trang khác gọi ra dùng nhanh
export const useAlgorithm = () => useContext(AlgorithmContext);
