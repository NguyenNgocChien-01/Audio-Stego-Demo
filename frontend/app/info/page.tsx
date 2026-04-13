"use client";
import { useState, useEffect, useRef } from "react";

const HO_SO = {
  ten: "Nguyễn Ngọc Chiến",
  email: "ngocchiien23l@gmail.com",
  dienThoai: "0399 428 511",
  github: "NguyenNgocChien-01",
  linkedin: "linkedin.com/in/nguyenngocchien",
  diaChi: "Ninh Kiều, Cần Thơ",
  gioiThieu:
    "Sinh viên năm cuối ngành Hệ thống Thông tin tại Trường Đại học Cần Thơ với kinh nghiệm phân tích nghiệp vụ, thiết kế hệ thống và phát triển cơ sở dữ liệu. Đặc biệt đam mê làm việc với dữ liệu — từ thiết kế cơ sở dữ liệu, truy vấn tối ưu, xử lý và lưu trữ đến trực quan hoá và khai thác thông tin có giá trị. Có khả năng dẫn dắt nhóm nhỏ và triển khai các sản phẩm phần mềm tích hợp AI thực tế. Đang tìm kiếm vị trí thực tập Business Analyst từ năm 2026.",
  hocVan: {
    truong: "Trường Đại học Cần Thơ",
    gpa: "3,58 / 4,0",
    thoiGian: "2022 – 2026",
    khoa: "Khoa Công nghệ Thông tin & Truyền thông",
    nganh: "Hệ thống Thông tin",
    noiBat: [
      "Điểm cao trong các môn Cơ sở dữ liệu, Phân tích Dữ liệu, Hệ thống Thông tin",
      "Top sinh viên xuất sắc ngành Hệ thống Thông tin",
    ],
  },
  kyNang: {
    ngonNgu: ["Python", "Django", "FastAPI", "PHP", "Laravel", "C#", "WinForm", "C"],
    duLieu: ["SQL Server", "MySQL", "Oracle", "Power BI", "Phân tích dữ liệu", "Machine Learning"],
    congCu: ["Git / GitHub", "Docker", "Google Colab", "Kaggle", "Next.js"],
    memDeo: ["Phân tích nghiệp vụ", "Thiết kế hệ thống", "Dẫn dắt nhóm", "Thu thập yêu cầu"],
  },
  chungChi: [
    { ten: "Gemini Certified University Student", nam: "2025", to_chuc: "Google" },
    { ten: "VSTEP B1", nam: "2024", to_chuc: "Chứng chỉ tiếng Anh" },
  ],
  duAn: [
    {
      ten: "Kỹ thuật Giấu tin trong Âm thanh",
      thoiGian: "Tháng 9/2025 – Tháng 4/2026",
      vaiTro: "Khóa luận tốt nghiệp",
      stack: ["Python", "FastAPI", "Next.js", "Docker"],
      trangThai: "Đang thực hiện",
      github: "NguyenNgocChien-01/Audio-Stego-Demo",
      moTa: [
        "Nghiên cứu và phát triển giải pháp truyền thông bí mật an toàn bằng cách nhúng dữ liệu vào file âm thanh WAV.",
        "Đề xuất thuật toán LSB ngẫu nhiên hoá giúp phá vỡ mẫu thống kê, tăng khả năng chống lại các mô hình steganalysis dựa trên ML/DL hiện đại.",
      ],
      mauSac: "#A78BFA",
    },
    {
      ten: "Trích xuất Thông tin Hóa đơn",
      thoiGian: "Tháng 5 – Tháng 8/2025",
      vaiTro: "Kỹ sư AI & Trưởng nhóm (3 thành viên)",
      stack: ["Django", "PyTorch", "SQLite", "GCN"],
      trangThai: "Hoàn thành",
      github: "NguyenNgocChien-01/WebNVTM",
      moTa: [
        "Lập kế hoạch, phân tích yêu cầu thực tế cho bài toán số hoá hóa đơn; quản lý tiến độ và phân công nhiệm vụ cho nhóm.",
        "Huấn luyện mô hình GCN trên 625 mẫu đạt F1-score: 0,92 (địa chỉ), 0,90 (tên công ty). Tích hợp pipeline suy luận vào ứng dụng web Django + SQLite.",
      ],
      mauSac: "#34D399",
    },
    {
      ten: "Hệ thống Thương mại điện tử – Sản phẩm Công nghệ",
      thoiGian: "Tháng 1 – Tháng 4/2025",
      vaiTro: "Lập trình viên Full-stack, Module Quản trị (4 thành viên)",
      stack: ["Laravel", "MySQL", "Git"],
      trangThai: "Hoàn thành",
      github: "Huong-Truong/UniTechShop",
      moTa: [
        "Thiết kế lược đồ cơ sở dữ liệu với hơn 20 thực thể và triển khai các truy vấn SQL được tối ưu hoá cho module quản lý kho, nhập hàng và khuyến mãi.",
        "Cộng tác theo quy trình Git, đảm bảo tích hợp liên tục và codebase không xung đột giữa các thành viên.",
      ],
      mauSac: "#FB923C",
    },
  ],
  soThich: [
    "Dữ liệu & Phân tích",
    "Trí tuệ nhân tạo / ML",
    "Phân tích nghiệp vụ",
    "Đá banh",
    "Đánh cầu lông",
    "Khám phá công nghệ mới",
  ],
  themVeToi: [
    "Học hỏi nhanh, chủ động tìm hiểu và ứng dụng công nghệ mới qua các dự án thực tế.",
    "Cẩn thận, chịu áp lực tốt, sẵn sàng tiếp nhận và cải thiện theo góp ý.",
    "Đặc biệt yêu thích làm việc với cơ sở dữ liệu và dữ liệu lớn — thiết kế schema, tối ưu truy vấn, phân tích và trực quan hoá thông tin.",
    "Sẵn sàng làm việc toàn thời gian ngay lập tức. Có thể di chuyển theo yêu cầu.",
  ],
};

const M = {
  bg: "#0C0C0F",
  sur: "#16161A",
  vienMo: "rgba(255,255,255,0.07)",
  vienRo: "rgba(255,255,255,0.14)",
  chu: "#E6E4DF",
  mo: "#65636E",
  tim: "#A78BFA",
  xanh: "#34D399",
  duong: "#60A5FA",
  vang: "#FBBF24",
};

function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, v };
}

function HienDan({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, v } = useInView();
  return (
    <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(18px)", transition: `opacity .6s ease ${delay}ms, transform .6s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

function Muc({ nhan, children }: { nhan: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "52px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div style={{ width: "3px", height: "16px", background: `linear-gradient(to bottom, ${M.tim}, ${M.duong})`, borderRadius: "2px" }} />
        <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: M.mo }}>{nhan}</span>
        <div style={{ flex: 1, height: "1px", background: M.vienMo }} />
      </div>
      {children}
    </div>
  );
}

export default function TrangHoSo() {
  const [duAnMo, setDuAnMo] = useState<number | null>(null);
  const [daSao, setDaSao] = useState(false);

  const saoEmail = () => {
    navigator.clipboard.writeText(HO_SO.email);
    setDaSao(true);
    setTimeout(() => setDaSao(false), 2000);
  };

  return (
    <div style={{ background: M.bg, minHeight: "100vh", color: M.chu, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* HERO */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(${M.vienMo} 1px,transparent 1px),linear-gradient(90deg,${M.vienMo} 1px,transparent 1px)`,
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 80% 55% at 50% 0%,black 40%,transparent 100%)",
        }} />
        <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 560, height: 240, background: `radial-gradient(ellipse,rgba(167,139,250,.1) 0%,transparent 70%)`, pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: 900, margin: "0 auto", padding: "80px 24px 60px" }}>

          <HienDan>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 16px", borderRadius: 40, border: `1px solid rgba(167,139,250,.25)`, background: "rgba(167,139,250,.07)", marginBottom: 24 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: M.xanh, animation: "nhip 2s infinite" }} />
              <span style={{ fontSize: 11, color: M.tim, fontWeight: 600, letterSpacing: ".07em" }}>SẴN SÀNG NHẬN VIỆC · THỰC TẬP BA 2026</span>
            </div>
          </HienDan>

          <HienDan delay={80}>
            <h1 style={{ fontSize: "clamp(2.2rem,6vw,4rem)", fontWeight: 800, lineHeight: 1.06, margin: "0 0 16px", letterSpacing: "-.04em" }}>
              {HO_SO.ten.split(" ").slice(0, 2).join(" ")}{" "}
              <span style={{ color: M.tim }}>{HO_SO.ten.split(" ").slice(2).join(" ")}</span>
            </h1>
          </HienDan>

          <HienDan delay={160}>
            <p style={{ fontSize: "clamp(.9rem,2vw,1.05rem)", color: M.mo, maxWidth: 600, lineHeight: 1.8, margin: "0 0 32px" }}>
              {HO_SO.gioiThieu}
            </p>
          </HienDan>

          {/* Liên hệ */}
          <HienDan delay={240}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 40 }}>
              {[
                { bieu: "✉", noi: daSao ? "Đã sao chép!" : HO_SO.email, fn: saoEmail },
                { bieu: "◉", noi: HO_SO.dienThoai },
                { bieu: "⌂", noi: HO_SO.diaChi },
                { bieu: "◈", noi: `github/${HO_SO.github}`, href: `https://github.com/${HO_SO.github}` },
                { bieu: "in", noi: "LinkedIn", href: `https://${HO_SO.linkedin}` },
              ].map((c, i) => (
                <div key={i} onClick={c.fn}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 15px", borderRadius: 9, border: `1px solid ${M.vienMo}`, background: M.sur, fontSize: 13, color: M.mo, cursor: c.fn || c.href ? "pointer" : "default", transition: "all .18s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = M.vienRo; (e.currentTarget as HTMLElement).style.color = M.chu; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = M.vienMo; (e.currentTarget as HTMLElement).style.color = M.mo; }}>
                  <span style={{ fontSize: 10, fontWeight: c.bieu === "in" ? 700 : 400 }}>{c.bieu}</span>
                  {c.href
                    ? <a href={c.href} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }} onClick={e => e.stopPropagation()}>{c.noi}</a>
                    : c.noi}
                </div>
              ))}
            </div>
          </HienDan>

          {/* Số liệu nổi bật */}
          <HienDan delay={320}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 28, paddingTop: 28, borderTop: `1px solid ${M.vienMo}` }}>
              {[
                { gia_tri: "3,58", nhan: "Điểm GPA / 4,0", mau: M.vang },
                { gia_tri: "3", nhan: "Dự án thực tế", mau: M.tim },
                { gia_tri: "2026", nhan: "Tốt nghiệp", mau: M.duong },
                { gia_tri: "B1", nhan: "VSTEP tiếng Anh", mau: M.xanh },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: "1.75rem", fontWeight: 800, color: s.mau, fontFamily: "monospace", lineHeight: 1 }}>{s.gia_tri}</span>
                  <span style={{ fontSize: 10, color: M.mo, letterSpacing: ".05em", textTransform: "uppercase" }}>{s.nhan}</span>
                </div>
              ))}
            </div>
          </HienDan>
        </div>
      </div>

      {/* NỘI DUNG CHÍNH */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "8px 24px 80px" }}>

        {/* KỸ NĂNG */}
        <HienDan>
          <Muc nhan="Kỹ năng & Công nghệ">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(195px,1fr))", gap: 12 }}>
              {[
                { tieu_de: "Ngôn ngữ & Framework", ds: HO_SO.kyNang.ngonNgu, mau: M.tim },
                { tieu_de: "Cơ sở dữ liệu & BI", ds: HO_SO.kyNang.duLieu, mau: M.xanh },
                { tieu_de: "Công cụ", ds: HO_SO.kyNang.congCu, mau: M.duong },
                { tieu_de: "Kỹ năng mềm", ds: HO_SO.kyNang.memDeo, mau: M.vang },
              ].map((g, gi) => (
                <div key={gi} style={{ padding: "18px 20px", borderRadius: 14, border: `1px solid ${M.vienMo}`, background: M.sur }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: g.mau, marginBottom: 13 }}>{g.tieu_de}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {g.ds.map((it, ii) => (
                      <span key={ii} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: `${g.mau}12`, color: g.mau, border: `1px solid ${g.mau}28` }}>{it}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Muc>
        </HienDan>

        {/* DỰ ÁN */}
        <HienDan delay={40}>
          <Muc nhan="Dự án">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {HO_SO.duAn.map((p, i) => (
                <div key={i}
                  onClick={() => setDuAnMo(duAnMo === i ? null : i)}
                  style={{ padding: "22px 26px", borderRadius: 16, border: `1px solid ${duAnMo === i ? p.mauSac + "55" : M.vienMo}`, background: duAnMo === i ? `${p.mauSac}07` : M.sur, cursor: "pointer", transition: "all .22s", position: "relative", overflow: "hidden" }}
                  onMouseEnter={e => { if (duAnMo !== i) (e.currentTarget as HTMLElement).style.borderColor = M.vienRo; }}
                  onMouseLeave={e => { if (duAnMo !== i) (e.currentTarget as HTMLElement).style.borderColor = M.vienMo; }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: p.mauSac, borderRadius: "4px 0 0 4px" }} />

                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 700 }}>{p.ten}</span>
                        <span style={{ fontSize: 10, padding: "2px 10px", borderRadius: 20, background: p.trangThai === "Đang thực hiện" ? "rgba(167,139,250,.15)" : "rgba(52,211,153,.12)", color: p.trangThai === "Đang thực hiện" ? M.tim : M.xanh, fontWeight: 600 }}>
                          {p.trangThai}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: M.mo, marginBottom: 10 }}>{p.vaiTro} · {p.thoiGian}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {p.stack.map((s, si) => (
                          <span key={si} style={{ fontSize: 11, padding: "2px 9px", borderRadius: 5, background: "rgba(255,255,255,.04)", color: M.mo, border: `1px solid ${M.vienMo}` }}>{s}</span>
                        ))}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: M.mo, transition: "transform .2s", transform: duAnMo === i ? "rotate(90deg)" : "none", marginTop: 4 }}>▶</span>
                  </div>

                  {duAnMo === i && (
                    <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${M.vienMo}` }}>
                      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                        {p.moTa.map((mt, mi) => (
                          <li key={mi} style={{ display: "flex", gap: 10, fontSize: 13.5, color: "#A8A6B2", lineHeight: 1.7 }}>
                            <span style={{ color: p.mauSac, flexShrink: 0, marginTop: 3 }}>◈</span>{mt}
                          </li>
                        ))}
                      </ul>
                      <a href={`https://github.com/${p.github}`} target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: p.mauSac, textDecoration: "none", padding: "5px 13px", borderRadius: 8, border: `1px solid ${p.mauSac}38`, background: `${p.mauSac}0E` }}>
                        ◈ {p.github}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Muc>
        </HienDan>

        {/* HỌC VẤN & CHỨNG CHỈ */}
        <HienDan delay={40}>
          <Muc nhan="Học vấn & Chứng chỉ">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ padding: "22px 24px", borderRadius: 14, border: `1px solid ${M.vienMo}`, background: M.sur }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 3 }}>{HO_SO.hocVan.truong}</div>
                    <div style={{ fontSize: 13, color: M.mo }}>{HO_SO.hocVan.khoa} · {HO_SO.hocVan.nganh}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: M.vang, fontFamily: "monospace" }}>{HO_SO.hocVan.gpa}</div>
                    <div style={{ fontSize: 11, color: M.mo }}>{HO_SO.hocVan.thoiGian}</div>
                  </div>
                </div>
                {HO_SO.hocVan.noiBat.map((h, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "#9E9CAA", lineHeight: 1.65, marginBottom: 7 }}>
                    <span style={{ color: M.vang, flexShrink: 0 }}>◈</span>{h}
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
                {HO_SO.chungChi.map((cc, i) => (
                  <div key={i} style={{ padding: "16px 18px", borderRadius: 12, border: `1px solid ${M.vienMo}`, background: M.sur }}>
                    <div style={{ fontSize: 10, color: M.mo, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 5 }}>{cc.to_chuc}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{cc.ten}</div>
                    <div style={{ fontSize: 12, color: M.xanh }}>{cc.nam}</div>
                  </div>
                ))}
              </div>
            </div>
          </Muc>
        </HienDan>

        {/* VỀ TÔI */}
        <HienDan delay={40}>
          <Muc nhan="Về tôi">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ padding: "20px 22px", borderRadius: 14, border: `1px solid ${M.vienMo}`, background: M.sur }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: M.duong, marginBottom: 14 }}>Sở thích</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {HO_SO.soThich.map((st, i) => (
                    <span key={i} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: `1px solid ${M.vienMo}`, color: M.mo }}>{st}</span>
                  ))}
                </div>
              </div>
              <div style={{ padding: "20px 22px", borderRadius: 14, border: `1px solid ${M.vienMo}`, background: M.sur }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: M.xanh, marginBottom: 14 }}>Thêm về tôi</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {HO_SO.themVeToi.map((tv, i) => (
                    <div key={i} style={{ display: "flex", gap: 9, fontSize: 13, color: "#9E9CAA", lineHeight: 1.65 }}>
                      <span style={{ color: M.xanh, flexShrink: 0 }}>◈</span>{tv}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Muc>
        </HienDan>

        {/* CTA */}
        <HienDan>
          <div style={{ padding: "40px 36px", borderRadius: 20, border: `1px solid rgba(167,139,250,.18)`, background: "linear-gradient(135deg,rgba(167,139,250,.05),rgba(96,165,250,.05))", textAlign: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: M.tim, marginBottom: 12 }}>Sẵn sàng hợp tác</div>
            <h3 style={{ fontSize: "clamp(1.2rem,3vw,1.75rem)", fontWeight: 700, margin: "0 0 8px", letterSpacing: "-.02em" }}>Tìm kiếm vị trí Thực tập Business Analyst</h3>
            <p style={{ fontSize: 14, color: M.mo, margin: "0 0 28px" }}>Có thể bắt đầu ngay · Sẵn sàng di chuyển · Đam mê dữ liệu & phân tích</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a href={`mailto:${HO_SO.email}`}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 26px", borderRadius: 11, background: M.tim, color: "#0C0C0F", fontWeight: 700, fontSize: 14, textDecoration: "none", transition: "opacity .2s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = ".82"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
                ✉ Gửi email
              </a>
              <a href={`https://${HO_SO.linkedin}`} target="_blank" rel="noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 26px", borderRadius: 11, border: `1px solid ${M.vienRo}`, color: M.chu, fontWeight: 600, fontSize: 14, textDecoration: "none", transition: "all .2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = M.tim; (e.currentTarget as HTMLElement).style.color = M.tim; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = M.vienRo; (e.currentTarget as HTMLElement).style.color = M.chu; }}>
                in LinkedIn
              </a>
            </div>
          </div>
        </HienDan>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800&display=swap');
        @keyframes nhip { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.82)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 3px; }
      `}</style>
    </div>
  );
}