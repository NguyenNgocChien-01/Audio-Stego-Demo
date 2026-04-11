"use client";
import { useState, useEffect, useRef } from "react";
import { AdminPageHeader } from "@/app/layout";
import { withAuth } from "@/app/auth/withAuth";

interface Category { category_id: number; category_name: string; }
interface Algorithm { algo_id: number; algo_name: string; category_id: number | null; is_active: boolean; }

function AlgorithmManagement() {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [newName, setNewName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState<number | "">("");
  const [aiModelFile, setAiModelFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryString, setNewCategoryString] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<number | "">("");

  const API_BASE = "http://localhost:8000/admin";

  const fetchData = async () => {
    try {
      const [resAlgo, resCat] = await Promise.all([fetch(`${API_BASE}/algorithms`), fetch(`${API_BASE}/categories`)]);
      if (resAlgo.ok) setAlgorithms((await resAlgo.json()).sort((a: Algorithm, b: Algorithm) => b.algo_id - a.algo_id));
      if (resCat.ok) setCategories(await resCat.json());
    } catch (err) { 
      console.error("Lỗi tải dữ liệu:", err); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const selectedCategory = categories.find(c => c.category_id === newCategoryId);
  const isAICategory = selectedCategory ? selectedCategory.category_name.toLowerCase().match(/(ai|model|deep|mô hình)/) !== null : false;

  const handleAddQuickCategory = async () => {
    if (!newCategoryString.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_name: newCategoryString.trim() })
      });
      if (res.ok) {
        const newCat = await res.json();
        await fetchData();
        setNewCategoryId(newCat.category_id);
        setIsAddingCategory(false);
        setNewCategoryString("");
      } else alert("Lỗi: Danh mục có thể đã tồn tại!");
    } catch (err) { 
      alert("Lỗi kết nối!"); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newCategoryId === "") return;
    setIsLoading(true);
    try {
      if (isAICategory) {
        if (!aiModelFile) { 
          alert("Vui lòng chọn file trọng số (.pt)!"); 
          setIsLoading(false); 
          return; 
        }
        const formData = new FormData();
        formData.append("algo_name", newName);
        formData.append("model_file", aiModelFile);
        const uploadRes = await fetch(`${API_BASE}/algorithms/upload_ai`, { method: "POST", body: formData });
        
        if (uploadRes.ok) {
          const normalizedName = newName.trim().toLowerCase().replace(/\s+/g, "_");
          const algosRes = await fetch(`${API_BASE}/algorithms`);
          if (algosRes.ok) {
            const allAlgos = await algosRes.json();
            const justAdded = allAlgos.find((a: Algorithm) => a.algo_name === normalizedName);
            if (justAdded) {
              await fetch(`${API_BASE}/algorithms/${justAdded.algo_id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ algo_name: justAdded.algo_name, category_id: Number(newCategoryId), is_active: true })
              });
            }
          }
          alert("Tải lên mô hình AI và thêm thuật toán thành công.");
        } else {
          alert("Lỗi không thể tải lên mô hình AI.");
        }
      } else {
        const res = await fetch(`${API_BASE}/algorithms`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ algo_name: newName, category_id: Number(newCategoryId), is_active: true })
        });
        if (res.ok) alert("Thêm thuật toán thành công.");
      }
      setNewName(""); 
      setNewCategoryId(""); 
      setAiModelFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchData();
    } catch (error) { 
      alert("Lỗi kết nối đến máy chủ."); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleSaveEdit = async (algo: Algorithm) => {
    try {
      const res = await fetch(`${API_BASE}/algorithms/${algo.algo_id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ algo_name: editName, category_id: editCategoryId === "" ? null : Number(editCategoryId), is_active: algo.is_active })
      });
      if (res.ok) { 
        setEditingId(null); 
        fetchData(); 
      } else {
        alert("Lỗi khi cập nhật thuật toán.");
      }
    } catch (err) { 
      console.error(err); 
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditCategoryId("");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xác nhận xóa thuật toán này?")) return;
    try {
      const res = await fetch(`${API_BASE}/algorithms/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        alert("Lỗi khi xóa thuật toán.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối đến máy chủ.");
    }
  };

  const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", fontSize: "0.9rem", color: "var(--text)", outline: "none", fontFamily: "inherit" };

  return (
    <div className="fade-in show" style={{ maxWidth: "1000px" }}>
      <AdminPageHeader 
        eyebrow="Cấu hình hệ thống" 
        title="Quản lý Thuật toán" 
        subtitle="Thêm, sửa, xóa và phân loại các thuật toán giấu tin, bao gồm cả việc tải lên các mô hình Deep Learning (.pt)."
        badge={`${algorithms.length} thuật toán`}
      />

      {/* FORM THÊM MỚI */}
      <div style={{ background: "var(--surface)", padding: "24px", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "var(--shadow)", marginBottom: "32px" }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: isAICategory ? "1fr 1fr 1fr auto" : "2fr 1fr auto", gap: "20px", alignItems: "end" }}>
          
          <div>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "8px" }}>Tên thuật toán {isAICategory && <span style={{color: "var(--success)", fontWeight: 400}}>(VD: unet_v2)</span>}</div>
            <input style={inputStyle} value={newName} onChange={e => setNewName(e.target.value)} disabled={isLoading} required={!isAddingCategory} placeholder="Nhập tên..." />
          </div>
          
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-2)" }}>
              <span>Danh mục</span>
              {!isAddingCategory && <span style={{ color: "var(--primary-light)", cursor: "pointer" }} onClick={() => setIsAddingCategory(true)}>+ Thêm mới</span>}
            </div>
            {isAddingCategory ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <input autoFocus style={{...inputStyle, flex: 1}} placeholder="Tên danh mục..." value={newCategoryString} onChange={(e) => setNewCategoryString(e.target.value)} disabled={isLoading} />
                <button type="button" onClick={handleAddQuickCategory} style={{ padding: "0 14px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>Lưu</button>
                <button type="button" onClick={() => setIsAddingCategory(false)} style={{ padding: "0 14px", background: "var(--surface-3)", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>Hủy</button>
              </div>
            ) : (
              <select style={inputStyle} value={newCategoryId} onChange={e => setNewCategoryId(e.target.value ? Number(e.target.value) : "")} disabled={isLoading} required>
                <option value="">-- Chọn danh mục --</option>
                {categories.map(cat => <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>)}
              </select>
            )}
          </div>

          {isAICategory && !isAddingCategory && (
            <div className="fade-in show">
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-2)", marginBottom: "8px" }}>File trọng số AI (.pt)</div>
              <input type="file" accept=".pt" ref={fileInputRef} onChange={e => setAiModelFile(e.target.files?.[0] || null)} disabled={isLoading} style={{...inputStyle, padding: "7px 10px", background: "var(--surface-2)"}} required />
            </div>
          )}

          <button type="submit" disabled={isLoading || isAddingCategory || !newCategoryId || (isAICategory && !aiModelFile)} style={{ padding: "11px 24px", borderRadius: "8px", border: "none", background: isAICategory ? "var(--success)" : "var(--primary)", color: "#fff", fontWeight: 600, cursor: (isLoading || isAddingCategory || !newCategoryId) ? "not-allowed" : "pointer", opacity: (isLoading || isAddingCategory || !newCategoryId) ? 0.6 : 1, transition: "0.2s" }}>
            {isLoading ? "Đang xử lý..." : (isAICategory ? "Tải lên AI & Lưu" : "Thêm Thuật Toán")}
          </button>
        </form>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div style={{ background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)", fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <th style={{ padding: "16px 24px", fontWeight: 600 }}>ID</th>
              <th style={{ padding: "16px 24px", fontWeight: 600 }}>Tên thuật toán</th>
              <th style={{ padding: "16px 24px", fontWeight: 600 }}>Danh mục</th>
              <th style={{ padding: "16px 24px", fontWeight: 600, textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {algorithms.map(algo => (
              <tr key={algo.algo_id} style={{ borderBottom: "1px solid var(--surface-3)", transition: "background 0.15s" }}>
                <td style={{ padding: "16px 24px", fontFamily: "'JetBrains Mono', monospace", color: "var(--text-muted)", fontSize: "0.9rem" }}>#{algo.algo_id}</td>
                
                {editingId === algo.algo_id ? (
                  <>
                    <td style={{ padding: "12px 24px" }}><input style={{...inputStyle, padding: "8px 12px"}} value={editName} onChange={e => setEditName(e.target.value)} /></td>
                    <td style={{ padding: "12px 24px" }}>
                      <select style={{...inputStyle, padding: "8px 12px"}} value={editCategoryId} onChange={e => setEditCategoryId(e.target.value ? Number(e.target.value) : "")}>
                        <option value="">-- Trống --</option>
                        {categories.map(cat => <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>)}
                      </select>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: "16px 24px", fontWeight: 600, color: "var(--primary)" }}>
                      {algo.algo_name} 
                      {(algo.algo_name.toLowerCase().includes("ai") || algo.algo_name.toLowerCase().includes("unet")) && (
                        <span style={{ fontSize: "0.7rem", background: "var(--success-bg)", color: "var(--success)", padding: "4px 8px", borderRadius: "12px", marginLeft: "12px", fontWeight: 600, border: "1px solid rgba(26,107,60,0.2)" }}>AI Model</span>
                      )}
                    </td>
                    <td style={{ padding: "16px 24px", color: "var(--text-2)" }}>
                      {categories.find(c => c.category_id === algo.category_id)?.category_name || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Chưa phân loại</span>}
                    </td>
                  </>
                )}
                
                <td style={{ padding: "16px 24px", textAlign: "right", whiteSpace: "nowrap" }}>
                  {editingId === algo.algo_id ? (
                    <>
                      <button onClick={() => handleSaveEdit(algo)} style={{ color: "var(--primary)", border: "none", background: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", marginRight: "16px" }}>Lưu lại</button>
                      <button onClick={handleCancelEdit} style={{ color: "var(--text-2)", border: "none", background: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>Hủy</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(algo.algo_id); setEditName(algo.algo_name); setEditCategoryId(algo.category_id || ""); }} style={{ color: "var(--success)", border: "none", background: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", marginRight: "16px" }}>Chỉnh sửa</button>
                      <button onClick={() => handleDelete(algo.algo_id)} style={{ color: "var(--error)", border: "none", background: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", opacity: 0.8 }}>Xóa</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default withAuth(AlgorithmManagement, { adminOnly: true });