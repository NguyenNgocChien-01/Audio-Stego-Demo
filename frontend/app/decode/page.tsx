"use client";
import { useState, useRef, useEffect } from "react";
import { withAuth } from "../auth/withAuth";

interface Algorithm { algo_id: number; algo_name: string; }

function fmt(s: number) { if(!isFinite(s))return"0:00"; return`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`; }
function fmtBytes(b: number) { if(b<1024)return`${b} B`; if(b<1048576)return`${(b/1024).toFixed(1)} KB`; return`${(b/1048576).toFixed(2)} MB`; }

function extFromMimeType(mime?: string | null): string {
  if (!mime) return ".bin";
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
  if (mime.includes("png")) return ".png";
  if (mime.includes("bmp")) return ".bmp";
  if (mime.includes("wav")) return ".wav";
  if (mime.includes("zip")) return ".zip";
  if (mime.includes("pdf")) return ".pdf";
  return "." + mime.split('/')[1]; 
}
// ─── STFT Viewer (sáng, dễ đọc) ──────────────────────────────────────────────
function STFTViewer({ src, label, accentLabel }: { src: string; label: string; accentLabel?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [error, setError] = useState("");
  useEffect(()=>{setRendered(false);setLoading(false);setError("");},[src]);

  function fft(re: Float32Array, im: Float32Array) {
    const N=re.length; let j=0;
    for(let i=1;i<N;i++){ let bit=N>>1; for(;j&bit;bit>>=1)j^=bit; j^=bit; if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]];} }
    for(let len=2;len<=N;len<<=1){ const ang=(-2*Math.PI)/len,wRe=Math.cos(ang),wIm=Math.sin(ang); for(let i=0;i<N;i+=len){ let cRe=1,cIm=0; for(let k=0;k<len/2;k++){ const uRe=re[i+k],uIm=im[i+k],vRe=re[i+k+len/2]*cRe-im[i+k+len/2]*cIm,vIm=re[i+k+len/2]*cIm+im[i+k+len/2]*cRe; re[i+k]=uRe+vRe;im[i+k]=uIm+vIm;re[i+k+len/2]=uRe-vRe;im[i+k+len/2]=uIm-vIm; const t=cRe*wRe-cIm*wIm;cIm=cRe*wIm+cIm*wRe;cRe=t; } } }
  }
  function inferno(t: number): [number,number,number] {
    const s=[[0,0,4],[40,11,84],[120,28,109],[188,55,84],[225,100,44],[247,166,12],[252,255,164]] as [number,number,number][];
    const idx=t*(s.length-1),lo=Math.floor(idx),hi=Math.min(lo+1,s.length-1),f=idx-lo;
    return[Math.round(s[lo][0]+f*(s[hi][0]-s[lo][0])),Math.round(s[lo][1]+f*(s[hi][1]-s[lo][1])),Math.round(s[lo][2]+f*(s[hi][2]-s[lo][2]))];
  }

  const compute=()=>{
    if(!src||rendered)return;
    setLoading(true);setError("");
    const AudioCtx=window.AudioContext||(window as any).webkitAudioContext;
    const ctx=new AudioCtx();
    fetch(src).then(r=>r.arrayBuffer()).then(buf=>ctx.decodeAudioData(buf)).then(audioBuffer=>{
      const canvas=canvasRef.current;if(!canvas)return;
      const raw=audioBuffer.getChannelData(0),sampleRate=audioBuffer.sampleRate;
      const FFT_SIZE=512,HOP=FFT_SIZE>>2,freqBins=FFT_SIZE>>1;
      const win=new Float32Array(FFT_SIZE);
      for(let i=0;i<FFT_SIZE;i++)win[i]=0.5*(1-Math.cos(2*Math.PI*i/(FFT_SIZE-1)));
      const dbFrames:Float32Array[]=[];
      for(let start=0;start+FFT_SIZE<=raw.length;start+=HOP){
        const re=new Float32Array(FFT_SIZE),im=new Float32Array(FFT_SIZE);
        for(let i=0;i<FFT_SIZE;i++)re[i]=(raw[start+i]||0)*win[i];
        fft(re,im);
        const db=new Float32Array(freqBins);
        for(let i=0;i<freqBins;i++)db[i]=20*Math.log10(Math.max(Math.sqrt(re[i]*re[i]+im[i]*im[i]),1e-10));
        dbFrames.push(db);
      }
      if(!dbFrames.length){setError("Dữ liệu quá ngắn");setLoading(false);return;}
      let dbMin=Infinity,dbMax=-Infinity;
      dbFrames.forEach(f=>f.forEach(v=>{if(v<dbMin)dbMin=v;if(v>dbMax)dbMax=v;}));
      const W=canvas.width,H=canvas.height,cx=canvas.getContext("2d")!;
      const ML=48,MB=28,plotW=W-ML-20,plotH=H-MB,nFrames=dbFrames.length;
      cx.fillStyle="#fff";cx.fillRect(0,0,W,H);
      cx.fillStyle="#fafafa";cx.fillRect(ML,0,plotW,plotH);
      const imgData=cx.createImageData(plotW,plotH);
      for(let px=0;px<plotW;px++){
        const fi=Math.min(Math.floor((px/plotW)*nFrames),nFrames-1),frame=dbFrames[fi];
        for(let py=0;py<plotH;py++){
          const bi=Math.floor(((plotH-1-py)/plotH)*freqBins),t=Math.max(0,Math.min(1,(frame[Math.min(bi,freqBins-1)]-dbMin)/(dbMax-dbMin)));
          const[r,g,b]=inferno(t),off=(py*plotW+px)*4;
          imgData.data[off]=r;imgData.data[off+1]=g;imgData.data[off+2]=b;imgData.data[off+3]=255;
        }
      }
      cx.putImageData(imgData,ML,0);
      const maxFreq=sampleRate/2;
      cx.font="10px monospace";cx.fillStyle="#000";cx.textAlign="right";
      [0,500,1000,2000,4000,8000,16000].filter(f=>f<=maxFreq).forEach(freq=>{
        const y=plotH-(freq/maxFreq)*plotH;
        cx.fillText(freq>=1000?`${freq/1000}k`:`${freq}`,ML-5,y+4);
        cx.strokeStyle="rgba(0,0,0,0.12)";cx.lineWidth=0.5;
        cx.beginPath();cx.moveTo(ML,y);cx.lineTo(ML+plotW,y);cx.stroke();
      });
      const dur=audioBuffer.duration;cx.textAlign="center";cx.fillStyle="#000";
      const tSteps=Math.min(8,Math.ceil(dur));
      for(let i=0;i<=tSteps;i++){
        const t=(i/tSteps)*dur,x=ML+(i/tSteps)*plotW;
        cx.fillText(`${t.toFixed(1)}s`,x,H-8);
        cx.strokeStyle="rgba(0,0,0,0.08)";cx.lineWidth=0.5;
        cx.beginPath();cx.moveTo(x,0);cx.lineTo(x,plotH);cx.stroke();
      }
      cx.save();cx.translate(13,plotH/2);cx.rotate(-Math.PI/2);cx.fillStyle="#444";cx.font="10px monospace";cx.textAlign="center";cx.fillText("Hz",0,0);cx.restore();
      cx.fillStyle="#444";cx.textAlign="center";cx.font="10px monospace";cx.fillText("Thời gian (s)",ML+plotW/2,H-8);
      cx.strokeStyle="#000";cx.lineWidth=1;cx.strokeRect(ML,0,plotW,plotH);
      const cbX=ML+plotW+4;
      for(let i=0;i<plotH;i++){const t=1-(i/plotH);const[r,g,b]=inferno(t);cx.fillStyle=`rgb(${r},${g},${b})`;cx.fillRect(cbX,i,12,1);}
      cx.strokeStyle="#000";cx.lineWidth=0.5;cx.strokeRect(cbX,0,12,plotH);
      cx.fillStyle="#000";cx.font="9px monospace";cx.textAlign="center";cx.fillText("dB",cbX+6,plotH+16);
      setLoading(false);setRendered(true);ctx.close();
    }).catch(()=>{setError("Lỗi STFT — không thể giải mã audio");setLoading(false);ctx.close();});
  };

  return(
    <div style={{ marginTop:"10px", borderRadius:"6px", overflow:"hidden", border:"1.5px solid #000" }}>
      <div style={{ background:"#f5f5f5", padding:"7px 12px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #000" }}>
        <span style={{ fontSize:"0.72rem", color:"#333", letterSpacing:"0.06em", textTransform:"uppercase", fontWeight:700 }}>
          STFT{accentLabel?` — ${accentLabel}`:label?` — ${label}`:""}
        </span>
        <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
          {loading&&<span style={{ display:"inline-block", width:"11px", height:"11px", border:"1.5px solid #ccc", borderTopColor:"#000", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />}
          {!rendered&&!loading&&<button onClick={compute} style={{ padding:"3px 12px", borderRadius:"4px", background:"#000", border:"none", color:"#fff", fontSize:"0.7rem", fontWeight:700, cursor:"pointer" }}>Phân tích</button>}
          {rendered&&<button onClick={()=>setRendered(false)} style={{ padding:"2px 8px", borderRadius:"4px", background:"transparent", border:"1px solid #000", color:"#333", fontSize:"0.68rem", cursor:"pointer" }}>Làm lại</button>}
        </div>
      </div>
      <div style={{ background:"#fff" }}>
        {!rendered&&!loading&&!error&&<div style={{ height:"72px", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize:"0.75rem", color:"#bbb" }}>Nhấn "Phân tích" để xem phổ STFT</span></div>}
        {error&&<div style={{ height:"60px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem", color:"#c00", padding:"0 12px", textAlign:"center" }}>{error}</div>}
        <canvas ref={canvasRef} width={680} height={200} style={{ display:rendered?"block":"none", width:"100%", height:"200px" }} />
      </div>
    </div>
  );
}

// ─── Audio Player ─────────────────────────────────────────────────────────────
function AudioPlayer({ src, name, color="var(--primary)" }: { src:string; name:string; color?:string }) {
  const ref=useRef<HTMLAudioElement>(null);
  const[playing,setPlaying]=useState(false);
  const[cur,setCur]=useState(0);
  const[dur,setDur]=useState(0);
  const[showSTFT,setShowSTFT]=useState(false);
  const pct=dur?(cur/dur)*100:0;
  const toggle=()=>{const a=ref.current;if(!a)return;playing?(a.pause(),setPlaying(false)):(a.play(),setPlaying(true));};
  const seek=(e:React.MouseEvent<HTMLDivElement>)=>{const a=ref.current;if(!a||!a.duration)return;const r=e.currentTarget.getBoundingClientRect();a.currentTime=((e.clientX-r.left)/r.width)*a.duration;};
  return(
    <div style={{ marginTop:"10px", padding:"12px 14px", background:"var(--surface-2)", borderRadius:"6px", border:"1.5px solid #000" }}>
      <audio ref={ref} src={src} onTimeUpdate={()=>{if(ref.current)setCur(ref.current.currentTime);}} onLoadedMetadata={()=>{if(ref.current)setDur(ref.current.duration);}} onEnded={()=>{setPlaying(false);setCur(0);if(ref.current)ref.current.currentTime=0;}} style={{display:"none"}} />
      <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }}>
        <button onClick={toggle} style={{ width:"32px", height:"32px", borderRadius:"50%", background:color, border:"none", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.72rem", flexShrink:0 }}>{playing?"⏸":"▶"}</button>
        <div style={{ flex:1, overflow:"hidden" }}>
          <div style={{ fontSize:"0.8rem", color:"var(--text-2)", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</div>
          <div style={{ fontSize:"0.68rem", color:"var(--text-muted)", fontFamily:"monospace" }}>{fmt(cur)} / {fmt(dur)}</div>
        </div>
        <button onClick={()=>setShowSTFT(v=>!v)} style={{ padding:"3px 10px", borderRadius:"4px", flexShrink:0, border:"1.5px solid #000", background:showSTFT?"#000":"transparent", color:showSTFT?"#fff":"#000", fontSize:"0.68rem", fontWeight:700, cursor:"pointer", transition:"all 0.15s" }}>
          {showSTFT?"Đóng":"STFT"}
        </button>
      </div>
      <div onClick={seek} style={{ height:"3px", background:"#ddd", borderRadius:"2px", cursor:"pointer", position:"relative" }}>
        <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:"2px", transition:"width 0.1s linear" }} />
        <div style={{ position:"absolute", top:"-4px", left:`${pct}%`, transform:"translateX(-50%)", width:"11px", height:"11px", borderRadius:"50%", background:color, border:"2px solid #fff", boxShadow:"0 0 0 1px #000", transition:"left 0.1s linear" }} />
      </div>
      {showSTFT&&<STFTViewer src={src} label={name} />}
    </div>
  );
}

const Label=({children}:{children:React.ReactNode})=>(
  <div style={{ fontSize:"0.7rem", fontWeight:700, color:"#555", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"10px", display:"flex", alignItems:"center", gap:"8px" }}>
    <div style={{ width:"12px", height:"2px", background:"#000" }} />{children}
  </div>
);
const Card=({children,style={}}:{children:React.ReactNode;style?:React.CSSProperties})=>(
  <div style={{ background:"var(--surface)", borderRadius:"10px", border:"1.5px solid #000", padding:"24px", boxShadow:"2px 2px 0 #000", ...style }}>{children}</div>
);

function extractedFilename(originalName:string, payloadType:string):string {
  // const base=originalName.replace(/\.[^.]+$/,"");
  const ext=originalName.match(/\.[^.]+$/)?.[0]||".wav";
  return`Extracted_${payloadType}_${Date.now()}${ext}`;
}

// // ─── STFT Comparison ──────────────────────────────────────────────────────────
function STFTComparison({ stegSrc, stegName }: { stegSrc:string; stegName:string }) {
  const[origUrl,setOrigUrl]=useState<string|null>(null);
  const[origName,setOrigName]=useState("");
  return(
    <div style={{ background:"var(--surface)", borderRadius:"10px", border:"1.5px solid #000", overflow:"hidden", boxShadow:"2px 2px 0 #000" }}>
      <div style={{ background:"#000", padding:"14px 20px", display:"flex", alignItems:"center", gap:"10px" }}>
        <span style={{ fontSize:"0.95rem", color:"#fff", fontWeight:700 }}>So sánh STFT Spectrogram</span>
        <span style={{ marginLeft:"auto", fontSize:"0.68rem", color:"#ccc", letterSpacing:"0.08em", textTransform:"uppercase" }}>Phân tích trực quan</span>
      </div>
      <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:"16px" }}>
        <div>
          <Label>Âm thanh gốc để so sánh</Label>
          <label htmlFor="compareOrig" style={{ display:"block", padding:"10px 16px", borderRadius:"6px", border:"2px solid #000", background:origUrl?"#f9f6f0":"var(--surface-2)", cursor:"pointer", fontSize:"0.82rem", color:origUrl?"var(--primary)":"#888", textAlign:"center", transition:"all 0.15s" }}>
            {origUrl?`✓ ${origName}`:"Chọn tệp âm thanh gốc (cover audio)"}
          </label>
          <input id="compareOrig" type="file" accept="audio/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f){setOrigUrl(URL.createObjectURL(f));setOrigName(f.name);}}} />
        </div>
        {origUrl&&(
          <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"12px" }}>
            <div><div style={{ fontSize:"0.72rem", color:"#555", fontWeight:700, marginBottom:"4px", letterSpacing:"0.06em", textTransform:"uppercase" }}>Âm thanh gốc</div><STFTViewer src={origUrl} label={origName} accentLabel="Cover Audio" /></div>
            <div><div style={{ fontSize:"0.72rem", color:"#555", fontWeight:700, marginBottom:"4px", letterSpacing:"0.06em", textTransform:"uppercase" }}>Âm thanh Stego</div><STFTViewer src={stegSrc} label={stegName} accentLabel="Stego Audio" /></div>
          </div>
        )}
        {!origUrl&&<div style={{ textAlign:"center", padding:"16px", color:"#888", fontSize:"0.82rem", background:"var(--surface-2)", borderRadius:"6px", border:"1.5px solid #000" }}>Tải lên âm thanh gốc để so sánh STFT với tệp stego</div>}
        <div style={{ background:"var(--surface-2)", borderRadius:"6px", padding:"12px 16px", border:"1.5px solid #000", fontSize:"0.78rem", color:"var(--text-muted)", lineHeight:1.6 }}>
          <strong style={{color:"#000"}}>Ghi chú:</strong> Hai phổ STFT giống nhau chứng tỏ thuật toán giấu tin có chất lượng cao. Sự khác biệt ở tần số cao có thể chỉ ra phương pháp nhúng ở miền tần số.
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function DecodePage() {
  const[algorithms,setAlgorithms]=useState<Algorithm[]>([]);
  const[selectedAlgoId,setSelectedAlgoId]=useState<string>("");
  const[decodeFile,setDecodeFile]=useState<File|null>(null);
  const[decodePassword,setDecodePassword]=useState("");
  const[loading,setLoading]=useState(false);
  const[decodeError,setDecodeError]=useState("");
  const[decodeResult,setDecodeResult]=useState<{type:string;text?:string;url?:string;filename?:string;}|null>(null);
  const[sourceUrl,setSourceUrl]=useState<string|null>(null);
  const[dragOver,setDragOver]=useState(false);
  const[showCompare,setShowCompare]=useState(false);
  const resultRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{ fetch("http://localhost:8000/admin/algorithms").then(r=>r.json()).then(data=>{ const active=data.filter((a:any)=>a.is_active); setAlgorithms(active); if(active.length>0)setSelectedAlgoId(active[0].algo_id.toString()); }).catch(console.error); },[]);

  const selectedAlgo=algorithms.find(a=>String(a.algo_id)===String(selectedAlgoId));
  const safeAlgoName=selectedAlgo?.algo_name?.trim().toLowerCase().replace(/\s+/g,'')||"";
  const requiresPassword=safeAlgoName.includes("random");

  useEffect(()=>{if(!decodeFile){setSourceUrl(null);return;}const u=URL.createObjectURL(decodeFile);setSourceUrl(u);return()=>URL.revokeObjectURL(u);},[decodeFile]);
  useEffect(()=>{ if(decodeResult&&resultRef.current)setTimeout(()=>resultRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),100); },[decodeResult]);
function logBug(action: string, error: any, context: Record<string, any> = {}): void {
  const timestamp = new Date().toISOString();
  console.group(`🚨 BUG LOG: [${action}] - ${timestamp}`);
  console.error("Message:", error?.message || error);
  if (error?.stack) {
    console.error("Stack Trace:", error.stack);
  }
  console.info("Context Data:", context);
  console.groupEnd();
}
const handleDecode=async()=>{
    if(!decodeFile)return;
    if(requiresPassword&&!decodePassword)return setDecodeError("Thuật toán này yêu cầu mật khẩu!");
    setLoading(true);setDecodeResult(null);setDecodeError("");
    try{
      const fd=new FormData();fd.append("algo_id",selectedAlgoId);fd.append("stego_audio",decodeFile);
      if(requiresPassword&&decodePassword)fd.append("password",decodePassword);
      const res=await fetch("http://localhost:8000/stego/decode",{method:"POST",body:fd});
      const data=await res.json();
      
      if(res.ok&&data.status==="success"){
        if(data.type==="text"||data.payload_type==="text"){
          setDecodeResult({type:"text",text:data.content_text||data.data||data.text,filename:extractedFilename(decodeFile!.name, "text").replace(/\.[^.]+$/, ".txt")});
          return;
        }
        
        let rawData=data.data;
        let b64Str=rawData || ""; 
        
        if(typeof rawData==="string"&&rawData.startsWith("data:")) b64Str=rawData.split(",")[1];
        
        let ext=data.ext||extFromMimeType(data.mime_type)||".bin";
        let mimeType=data.mime_type||"application/octet-stream";
        let uiType=data.type||data.payload_type||"file";
        
        // Kiểm tra an toàn trước khi dùng startsWith
        if(typeof b64Str === "string") {
          if((!data.mime_type||uiType==="file")&&b64Str.startsWith("/9j/")){ext=".jpg";mimeType="image/jpeg";uiType="image";}
          else if((!data.mime_type||uiType==="file")&&b64Str.startsWith("iVBORw")){ext=".png";mimeType="image/png";uiType="image";}
          else if((!data.mime_type||uiType==="file")&&b64Str.startsWith("Qk0")){ext=".bmp";mimeType="image/bmp";uiType="image";}
          else if((!data.mime_type||uiType==="file")&&b64Str.startsWith("UklGR")){ext=".wav";mimeType="audio/wav";uiType="audio";}
          else if((!data.mime_type||uiType==="file")&&b64Str.startsWith("UEsDB")){ext=".zip";mimeType="application/zip";uiType="file";}
          else if((!data.mime_type||uiType==="file")&&b64Str.startsWith("JVBER")){ext=".pdf";mimeType="application/pdf";uiType="file";}
        }
        
        const finalUrl=typeof rawData==="string"&&rawData.startsWith("data:")?rawData:`data:${mimeType};base64,${b64Str}`;
        const resolvedFilename = data.filename || extractedFilename(decodeFile!.name, uiType).replace(/\.[^.]+$/, ext);
        setDecodeResult({type:uiType==="binary"?"file":uiType,url:finalUrl,filename:resolvedFilename});
      } else {
        setDecodeError(data.message||data.detail||"Giải mã thất bại — sai mật khẩu hoặc không có dữ liệu ẩn.");
      }
    }
    catch(error: any){
      logBug("DECODE", error, { selectedAlgoId, decodeFile });
      setDecodeError("Lỗi hệ thống Frontend: " + (error.message || "Không thể kết nối máy chủ."));
    }
    finally{setLoading(false);}
  };
  const handleDownload=()=>{if(!decodeResult?.url)return;const a=document.createElement("a");a.href=decodeResult.url;a.download=decodeResult.filename||"extracted_file";document.body.appendChild(a);a.click();document.body.removeChild(a);};

  return(
    <div style={{ maxWidth:"1160px", margin:"0 auto", padding:"48px 36px" }}>

      <div style={{ marginBottom:"40px", paddingBottom:"28px", borderBottom:"2px solid #000" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:"0.72rem", color:"#888", letterSpacing:"0.15em", textTransform:"uppercase", fontWeight:600, marginBottom:"8px" }}>Giải mã & Trích xuất</div>
            <h1 style={{ fontSize:"2rem", fontWeight:800, color:"var(--primary)", margin:"0 0 10px 0", lineHeight:1.2 }}>Trích xuất dữ liệu ẩn</h1>
            <p style={{ margin:0, fontSize:"0.92rem", color:"var(--text-muted)", maxWidth:"520px", lineHeight:1.6 }}>Tải lên tệp âm thanh stego, chọn đúng thuật toán đã dùng để nhúng, và hệ thống sẽ phục hồi dữ liệu ẩn bên trong.</p>
          </div>
          <div style={{ background:"#000", color:"#fff", borderRadius:"8px", padding:"10px 18px", fontSize:"0.72rem", letterSpacing:"0.08em", textTransform:"uppercase", fontWeight:700 }}>Bước 2 — Trích xuất</div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"28px", alignItems:"start" }}>

        {/* LEFT */}
        <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>

          <Card>
            <Label>Thuật toán steganography</Label>
            <select value={selectedAlgoId} onChange={e=>setSelectedAlgoId(e.target.value)} style={{ width:"100%", padding:"10px 14px", borderRadius:"6px", border:"1.5px solid #000", background:"var(--surface-2)", fontSize:"0.875rem", outline:"none", color:"var(--text)", fontFamily:"inherit", appearance:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23000' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 14px center", cursor:"pointer" }}>
              {algorithms.map(a=><option key={a.algo_id} value={a.algo_id}>{a.algo_name}</option>)}
            </select>
            {requiresPassword&&<div style={{ marginTop:"14px" }}><Label>Mật khẩu giải mã</Label>
            <input type="password" value={decodePassword} onChange={e=>setDecodePassword(e.target.value)} placeholder="Nhập mật khẩu..." style={{ width:"100%", padding:"10px 14px", borderRadius:"6px", border:"1.5px solid #000", background:"var(--surface-2)", fontSize:"0.875rem", outline:"none", color:"var(--text)", boxSizing:"border-box" }} /></div>}
          </Card>

          <Card>
            <Label>Tệp âm thanh stego</Label>
            <div
              onDragOver={e=>{e.preventDefault();setDragOver(true);}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files?.[0];if(f){setDecodeFile(f);setDecodeResult(null);setDecodeError("");}}}
              onClick={()=>document.getElementById("stegoFileInput")?.click()}
              style={{ border:`2px solid ${dragOver?"var(--primary)":"#000"}`, borderRadius:"8px", padding:"24px", textAlign:"center", cursor:"pointer", background:decodeFile?"#f9f6f0":"var(--surface-2)", transition:"all 0.2s" }}
            >
              <input id="stegoFileInput" type="file" accept="audio/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f){setDecodeFile(f);setDecodeResult(null);setDecodeError("");}}} />
              {decodeFile?(
                <div><div style={{fontSize:"0.875rem",fontWeight:700,color:"var(--primary)"}}>{decodeFile.name}</div><div style={{fontSize:"0.75rem",color:"#888",marginTop:"4px"}}>{fmtBytes(decodeFile.size)}</div></div>
              ):(
                <div><div style={{fontSize:"0.85rem",color:"#888",fontWeight:500}}>Kéo thả hoặc nhấp để chọn tệp stego</div><div style={{fontSize:"0.75rem",color:"#bbb",marginTop:"4px"}}>WAV, MP3, FLAC...</div></div>
              )}
            </div>
            {sourceUrl&&decodeFile&&<AudioPlayer src={sourceUrl} name={decodeFile.name} />}
          </Card>

          {decodeError&&(
            <div style={{ background:"#fff5f5", borderRadius:"8px", padding:"14px 16px", border:"1.5px solid #c00", fontSize:"0.85rem", color:"#c00", display:"flex", alignItems:"flex-start", gap:"10px" }}>
              <span style={{flexShrink:0}}>⚠</span><span>{decodeError}</span>
            </div>
          )}

          <button onClick={handleDecode} disabled={!decodeFile||loading} style={{ width:"100%", padding:"16px", borderRadius:"8px", border:"none", cursor:decodeFile&&!loading?"pointer":"not-allowed", background:decodeFile&&!loading?"#000":"#ccc", color:"#fff", fontSize:"0.9rem", fontWeight:700, fontFamily:"inherit", letterSpacing:"0.04em", textTransform:"uppercase", transition:"all 0.2s" }}>
            {loading?(<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"10px"}}><span style={{display:"inline-block",width:"16px",height:"16px",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.6s linear infinite"}} />Đang phân tích...</span>):"Trích Xuất Dữ Liệu"}
          </button>

          {/* {sourceUrl&&(
            <button onClick={()=>setShowCompare(v=>!v)} style={{ width:"100%", padding:"13px", borderRadius:"8px", border:"1.5px solid #000", background:showCompare?"#000":"transparent", color:showCompare?"#fff":"#000", fontSize:"0.85rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}>
              {showCompare?"Đóng so sánh STFT":"So sánh STFT Spectrogram"}
            </button>
          )} */}
        </div>

        {/* RIGHT */}
        <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>

          {!decodeResult&&!loading&&(
            <Card style={{ textAlign:"center", padding:"60px 32px" }}>
              <div style={{ fontSize:"3rem", marginBottom:"20px", opacity:0.08 }}>◎</div>
              <div style={{ fontSize:"1rem", color:"var(--text-muted)", fontStyle:"italic", marginBottom:"8px" }}>Kết quả trích xuất</div>
              <div style={{ fontSize:"0.8rem", color:"#bbb" }}>Chọn tệp stego và nhấn "Trích xuất dữ liệu"</div>
            </Card>
          )}

          {loading&&(
            <Card style={{ textAlign:"center", padding:"60px 32px" }}>
              <div style={{ width:"44px", height:"44px", borderRadius:"50%", margin:"0 auto 20px", border:"3px solid #eee", borderTopColor:"#000", animation:"spin 0.8s linear infinite" }} />
              <div style={{ fontSize:"0.9rem", color:"var(--text-muted)", fontStyle:"italic" }}>Đang phân tích dữ liệu ẩn...</div>
            </Card>
          )}

          {decodeResult&&(
            <div ref={resultRef} style={{ background:"var(--surface)", borderRadius:"10px", border:"1.5px solid #000", overflow:"hidden", boxShadow:"2px 2px 0 #000", animation:"fadeSlideIn 0.3s ease" }}>
              <div style={{ background:"#f0faf4", padding:"16px 24px", display:"flex", alignItems:"center", gap:"12px", borderBottom:"1.5px solid #000" }}>
                <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:"var(--success)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"0.78rem" }}>✓</div>
                <div>
                  <div style={{ fontSize:"0.9rem", color:"var(--success)", fontWeight:700 }}>Giải mã thành công</div>
                  <div style={{ fontSize:"0.72rem", color:"#5aaa72", marginTop:"2px" }}>Thuật toán: {selectedAlgo?.algo_name}</div>
                </div>
              </div>
              <div style={{ padding:"24px" }}>
                {decodeResult.type==="text"&&(
                  <div>
                    <Label>Thông điệp bí mật</Label>
                    <div style={{ background:"var(--surface-2)", padding:"18px", borderRadius:"6px", border:"1.5px solid #000", fontFamily:"monospace", fontSize:"0.88rem", lineHeight:1.7, color:"var(--text)", whiteSpace:"pre-wrap", wordBreak:"break-word", maxHeight:"300px", overflowY:"auto" }}>{decodeResult.text}</div>
                    <button onClick={()=>navigator.clipboard.writeText(decodeResult.text||"")} style={{ marginTop:"10px", padding:"9px 18px", borderRadius:"6px", border:"1.5px solid #000", background:"transparent", color:"#000", fontSize:"0.8rem", cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>Sao chép</button>
                  </div>
                )}
                {decodeResult.type==="image"&&decodeResult.url&&(
                  <div>
                    <Label>Hình ảnh trích xuất</Label>
                    <div style={{ background:"var(--surface-2)", borderRadius:"6px", padding:"12px", border:"1.5px solid #000", display:"flex", alignItems:"center", justifyContent:"center", minHeight:"160px" }}>
                      <img src={decodeResult.url} alt="Extracted" style={{ maxWidth:"100%", maxHeight:"280px", borderRadius:"4px", objectFit:"contain" }} />
                    </div>
                  </div>
                )}
                {decodeResult.type==="audio"&&decodeResult.url&&(
                  <div><Label>Âm thanh trích xuất</Label><AudioPlayer src={decodeResult.url} name={decodeResult.filename||"extracted_audio"} color="var(--success)" /></div>
                )}
                {decodeResult.type!=="text"&&decodeResult.url&&(
                  <div style={{ marginTop:"16px", padding:"14px 16px", background:"var(--surface-2)", borderRadius:"6px", border:"1.5px solid #000", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div><div style={{fontSize:"0.82rem",fontWeight:600,color:"var(--text)"}}>{decodeResult.filename}</div><div style={{fontSize:"0.72rem",color:"#888",marginTop:"2px"}}>Sẵn sàng tải xuống</div></div>
                    <button onClick={handleDownload} style={{ padding:"9px 18px", borderRadius:"6px", border:"none", background:"#000", color:"#fff", fontSize:"0.82rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Tải xuống</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {showCompare&&sourceUrl&&<STFTComparison stegSrc={sourceUrl} stegName={decodeFile?.name||"stego"} />}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeSlideIn { from { opacity:0;transform:translateY(8px); } to { opacity:1;transform:translateY(0); } }
      `}</style>
    </div>
  );
}

export default withAuth(DecodePage)
