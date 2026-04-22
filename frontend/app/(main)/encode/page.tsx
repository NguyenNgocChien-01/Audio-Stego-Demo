"use client";
import { useState, useRef, useEffect } from "react";
import { showError, showSuccess } from "@/app/utils/errorHandler";
// import { withAuth } from "../auth/withAuth";
// import { useAuthFetch } from "../auth/useAuthFetch"; 
interface Algorithm { algo_id: number; algo_name: string; }
type PayloadType = "text" | "image" | "audio" | "file";

const DEEP_LEARNING_KEYWORDS = ["deep", "dnn", "cnn", "neural", "lstm", "autoencoder", "learning", "unet"];
function isDeepLearning(algoName: string) {
  const s = algoName.trim().toLowerCase().replace(/\s+/g, "");
  return DEEP_LEARNING_KEYWORDS.some(k => s.includes(k));
}

const PAYLOAD_TYPES: { id: PayloadType; label: string; accept: string }[] = [
  { id: "text",  label: "Văn bản",  accept: "" },
  { id: "image", label: "Hình ảnh", accept: "image/*" },
  { id: "audio", label: "Âm thanh", accept: "audio/*" },
  { id: "file",  label: "Tệp ZIP",  accept: ".zip,application/zip" },
];

function fmt(s: number) { if(!isFinite(s))return"0:00"; return`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`; }
function fmtBytes(b: number) { if(b<1024)return`${b} B`; if(b<1048576)return`${(b/1024).toFixed(1)} KB`; return`${(b/1048576).toFixed(2)} MB`; }

// ─── STFT Viewer ──────────────────────────────────────────────
function STFTViewer({ src, label }: { src: string; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [error, setError] = useState("");
  useEffect(()=>{ setRendered(false); setLoading(false); setError(""); },[src]);

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

  const compute = () => {
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

  return (
    <div style={{ marginTop:"10px", borderRadius:"6px", overflow:"hidden", border:"1.5px solid #000" }}>
      <div style={{ background:"#f5f5f5", padding:"7px 12px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #000" }}>
        <span style={{ fontSize:"0.72rem", color:"#333", letterSpacing:"0.06em", textTransform:"uppercase", fontWeight:700 }}>STFT — {label}</span>
        <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
          {loading&&<span style={{ display:"inline-block", width:"11px", height:"11px", border:"1.5px solid #ccc", borderTopColor:"#000", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />}
          {!rendered&&!loading&&<button onClick={compute} style={{ padding:"3px 12px", borderRadius:"4px", background:"#000", border:"none", color:"#fff", fontSize:"0.7rem", fontWeight:700, cursor:"pointer" }}>Phân tích</button>}
          {rendered&&<button onClick={()=>setRendered(false)} style={{ padding:"2px 8px", borderRadius:"4px", background:"transparent", border:"1px solid #000", color:"#333", fontSize:"0.68rem", cursor:"pointer" }}>Làm lại</button>}
        </div>
      </div>
      <div style={{ background:"#fff" }}>
        {!rendered&&!loading&&!error&&(
          <div style={{ height:"72px", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:"0.75rem", color:"#bbb" }}>Nhấn "Phân tích" để xem phổ STFT</span>
          </div>
        )}
        {error&&<div style={{ height:"60px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem", color:"#c00", padding:"0 12px", textAlign:"center" }}>{error}</div>}
        <canvas ref={canvasRef} width={680} height={200} style={{ display:rendered?"block":"none", width:"100%", height:"200px" }} />
      </div>
    </div>
  );
}

// ─── Audio Player ─────────────────────────────────────────────────────────────
function AudioPlayer({ src, name }: { src: string; name: string }) {
  const ref=useRef<HTMLAudioElement>(null);
  const[playing,setPlaying]=useState(false);
  const[cur,setCur]=useState(0);
  const[dur,setDur]=useState(0);
  const[showSTFT,setShowSTFT]=useState(false);
  const pct=dur?(cur/dur)*100:0;
  const toggle=()=>{const a=ref.current;if(!a)return;playing?(a.pause(),setPlaying(false)):(a.play(),setPlaying(true));};
  const seek=(e:React.MouseEvent<HTMLDivElement>)=>{const a=ref.current;if(!a||!a.duration)return;const r=e.currentTarget.getBoundingClientRect();a.currentTime=((e.clientX-r.left)/r.width)*a.duration;};
  return(
    <div style={{ marginTop:"12px", padding:"12px 14px", background:"var(--surface-2)", borderRadius:"6px", border:"1.5px solid #000" }}>
      <audio ref={ref} src={src} onTimeUpdate={()=>{if(ref.current)setCur(ref.current.currentTime);}} onLoadedMetadata={()=>{if(ref.current)setDur(ref.current.duration);}} onEnded={()=>{setPlaying(false);setCur(0);if(ref.current)ref.current.currentTime=0;}} style={{display:"none"}} />
      <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }}>
        <button onClick={toggle} style={{ width:"32px", height:"32px", borderRadius:"50%", background:"var(--primary)", border:"none", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.72rem", flexShrink:0 }}>{playing?"⏸":"▶"}</button>
        <div style={{ flex:1, overflow:"hidden" }}>
          <div style={{ fontSize:"0.8rem", color:"var(--text-2)", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</div>
          <div style={{ fontSize:"0.68rem", color:"var(--text-muted)", fontFamily:"monospace" }}>{fmt(cur)} / {fmt(dur)}</div>
        </div>
        <button onClick={()=>setShowSTFT(v=>!v)} style={{ padding:"3px 10px", borderRadius:"4px", flexShrink:0, border:"1.5px solid #000", background:showSTFT?"#000":"transparent", color:showSTFT?"#fff":"#000", fontSize:"0.68rem", fontWeight:700, cursor:"pointer", transition:"all 0.15s" }}>
          {showSTFT?"Đóng":"STFT"}
        </button>
      </div>
      <div onClick={seek} style={{ height:"3px", background:"#ddd", borderRadius:"2px", cursor:"pointer", position:"relative" }}>
        <div style={{ width:`${pct}%`, height:"100%", background:"var(--primary)", borderRadius:"2px", transition:"width 0.1s linear" }} />
        <div style={{ position:"absolute", top:"-4px", left:`${pct}%`, transform:"translateX(-50%)", width:"11px", height:"11px", borderRadius:"50%", background:"var(--primary)", border:"2px solid #fff", boxShadow:"0 0 0 1px #000", transition:"left 0.1s linear" }} />
      </div>
      {showSTFT&&<STFTViewer src={src} label={name} />}
    </div>
  );
}

// ─── Mic Recorder ─────────────────────────────────────────────────────────────
// Thêm hàm chuyển đổi blob WebM sang File WAV
const convertToWav = async (webmBlob: Blob): Promise<File> => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await webmBlob.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  // Cấu hình WAV
  const numOfChan = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  // Viết header WAV
  const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
  const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };
  const writeString = (s: string) => { for (let i = 0; i < s.length; i++) { view.setUint8(pos++, s.charCodeAt(i)); } };

  writeString('RIFF');
  setUint32(length - 8);
  writeString('WAVE');
  writeString('fmt ');
  setUint32(16);
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(audioBuffer.sampleRate);
  setUint32(audioBuffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  writeString('data');
  setUint32(length - pos - 4);

  // Viết dữ liệu âm thanh (Interleaved)
  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }
  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  const wavBlob = new Blob([buffer], { type: "audio/wav" });
  return new File([wavBlob], `mic_${Date.now()}.wav`, { type: "audio/wav" });
};

// ─── Component MicRecorder Cập Nhật ─────────────────────────────────────────────
function MicRecorder({ onRecorded, label="Ghi âm từ microphone", convertToWav: convertToWavProp = true }: { onRecorded:(f:File)=>void; label?:string; convertToWav?:boolean }) {
  const[recording,setRecording]=useState(false);
  const[seconds,setSeconds]=useState(0);
  const[recUrl,setRecUrl]=useState<string|null>(null);
  const mediaRef=useRef<MediaRecorder|null>(null);
  const chunksRef=useRef<Blob[]>([]);
  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null);
  const [processing, setProcessing] = useState(false); // Thêm state chờ convert

  const start=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const mr=new MediaRecorder(stream);
      chunksRef.current=[];
      mr.ondataavailable=e=>chunksRef.current.push(e.data);
      
      mr.onstop = async () => { 
        setProcessing(true);
        const webmBlob = new Blob(chunksRef.current,{type:"audio/webm"}); 
        
        try {
          if (convertToWavProp) {
            const wavFile = await convertToWav(webmBlob);
            setRecUrl(URL.createObjectURL(wavFile)); 
            onRecorded(wavFile);
          } else {
            const webmFile = new File([webmBlob], `mic_${Date.now()}.webm`, { type: "audio/webm" });
            setRecUrl(URL.createObjectURL(webmFile));
            onRecorded(webmFile);
          }
        } catch (err) {
          showError("Lỗi khi xử lý tệp âm thanh");
          console.error('[MIC RECORDER]', err);
        } finally {
          setProcessing(false);
          stream.getTracks().forEach(t=>t.stop()); 
        }
      };
      
      mr.start();
      mediaRef.current=mr;
      setRecording(true);
      setSeconds(0);
      timerRef.current=setInterval(()=>setSeconds(s=>s+1),1000);
    } catch (err) {
      showError("Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.");
      console.error('[MICROPHONE ACCESS]', err);
    }
  };

  const stop=()=>{ 
    mediaRef.current?.stop(); 
    if(timerRef.current) clearInterval(timerRef.current); 
    setRecording(false); 
  };

  useEffect(()=>()=>{ if(timerRef.current)clearInterval(timerRef.current); },[]);

  return(
    <div style={{ border:`1.5px solid ${recording?"var(--error)":recUrl?"var(--success)":"#000"}`, borderRadius:"8px", padding:"14px 16px", background:"var(--surface-2)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
        <button onClick={recording?stop:start} disabled={processing} style={{ width:"38px", height:"38px", borderRadius:"50%", background:recording?"var(--error)":"var(--primary)", border:"none", color:"#fff", cursor:processing?"wait":"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, animation:recording?"pulse 1.5s ease-in-out infinite":"none", opacity: processing?0.5:1 }}>
          {recording?<div style={{ width:"10px", height:"10px", background:"#fff", borderRadius:"2px" }} />:<svg width="14" height="14" viewBox="0 0 18 18" fill="none"><rect x="6" y="2" width="6" height="9" rx="3" fill="white"/><path d="M3 9C3 12.3137 5.68629 15 9 15C12.3137 15 15 12.3137 15 9" stroke="white" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="15" x2="9" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>}
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:"0.83rem", fontWeight:600, color:recording?"var(--error)":recUrl?"var(--success)":"var(--text-2)" }}>
            {recording?"Đang ghi âm...":processing?convertToWavProp?"Đang xử lý (WebM -> WAV)...":"Đang xử lý...":recUrl?"Ghi xong — sẵn sàng":label}
          </div>
          {recording&&<div style={{ fontSize:"0.72rem", color:"var(--error)", fontFamily:"monospace", marginTop:"2px" }}>REC — {fmt(seconds)}</div>}
          {!recording&&!recUrl&&!processing&&<div style={{ fontSize:"0.72rem", color:"var(--text-muted)", marginTop:"2px" }}>Nhấn để bắt đầu ghi</div>}
        </div>
        {recUrl&&!recording&&!processing&&<button onClick={()=>{setRecUrl(null);setSeconds(0);}} style={{ padding:"4px 10px", borderRadius:"4px", border:"1.5px solid #000", background:"transparent", color:"#000", fontSize:"0.72rem", cursor:"pointer" }}>Ghi lại</button>}
      </div>
      {recUrl&&<audio controls src={recUrl} style={{ marginTop:"10px", width:"100%", height:"32px" }} />}
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

function stegoFilename(originalName:string, payloadType:PayloadType):string {
  const base=originalName.replace(/\.[^.]+$/,"");
  const ext=originalName.match(/\.[^.]+$/)?.[0]||".wav";
  return`${base}_stego_${payloadType}_${Date.now()}${ext}`;
}




// ─── Main ─────────────────────────────────────────────────────────────────────
function EncodePage() {
  const[algorithms,setAlgorithms]=useState<Algorithm[]>([]);
  const[selectedAlgoId,setSelectedAlgoId]=useState<string>("");
  const[encodeFile,setEncodeFile]=useState<File|null>(null);
  
  const[encodePassword,setEncodePassword]=useState("");
  const[showPassword, setShowPassword]=useState(false);
  
  const[encryptText, setEncryptText]=useState(false); 

  const[payloadType,setPayloadType]=useState<PayloadType>("text");
  const[textMessage,setTextMessage]=useState("");
  const[payloadFile,setPayloadFile]=useState<File|null>(null);
  const[loading,setLoading]=useState(false);
  const[sourceUrl,setSourceUrl]=useState<string|null>(null);
  const[payloadUrl,setPayloadUrl]=useState<string|null>(null);
  const[useCoverMic,setUseCoverMic]=useState(false);
  const[secretInputMode,setSecretInputMode]=useState<"type"|"mic">("type");
  const[secretMicFile,setSecretMicFile]=useState<File|null>(null);
  const[result,setResult]=useState<{url:string;filename:string;metrics:{mse:number;psnr:number;snr:number};k:number;algo_name?:string;encodingTime?:number}|null>(null);
  const resultRef=useRef<HTMLDivElement>(null);
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    console.log('[DEBUG] Fetching from API:', apiUrl);
    
    if (!apiUrl) {
      console.error('[ERROR] NEXT_PUBLIC_API_URL chưa được thiết lập!');
      return;
    }

    fetch(`${apiUrl}/stego/config`)
      .then((r) => {
        console.log('[DEBUG] Response status:', r.status);
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.json();
      })
      .then((data) => {
        console.log('[DEBUG] Config data received:', data);
        if (data && data.algorithms) {
          const active = data.algorithms
            .filter((a: any) => a.is_active)
            .sort((a: any, b: any) => b.algo_id - a.algo_id);

          console.log('[DEBUG] Active algorithms:', active);
          setAlgorithms(active);

          if (active.length > 0) {
            setSelectedAlgoId(active[0].algo_id.toString());
          }
        } else {
          console.error('[ERROR] Không tìm thấy algorithms trong response');
        }
      })
      .catch((err) => {
        console.error('[ERROR] Lỗi khi fetch config:', err);
      });
  }, []);

  const selectedAlgo=algorithms.find(a=>String(a.algo_id)===String(selectedAlgoId));
  const safeAlgoName=selectedAlgo?.algo_name?.trim().toLowerCase().replace(/\s+/g,'')||"";
 
  // Chỉ yêu cầu nhập mật khẩu nếu bản thân THUẬT TOÁN đó cần
  const algoRequiresPassword=safeAlgoName.includes("random");

  const isDeepLearningAlgo=isDeepLearning(safeAlgoName);
  const selectedPayload=PAYLOAD_TYPES.find(p=>p.id===payloadType)!;

  useEffect(()=>{ if(isDeepLearningAlgo&&payloadType!=="image"){setPayloadType("image");setPayloadFile(null);setTextMessage("");} },[isDeepLearningAlgo]);
  useEffect(()=>{ if(!encodeFile){setSourceUrl(null);return;} const u=URL.createObjectURL(encodeFile);setSourceUrl(u); return()=>URL.revokeObjectURL(u); },[encodeFile]);
  useEffect(()=>{ if(!payloadFile){setPayloadUrl(null);return;} const u=URL.createObjectURL(payloadFile);setPayloadUrl(u); return()=>URL.revokeObjectURL(u); },[payloadFile]);
  useEffect(()=>{ if(result&&resultRef.current)setTimeout(()=>resultRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),100); },[result]);

  const encodeReady=!!selectedAlgoId&&!!encodeFile&&(
  payloadType==="text"
    ?(secretInputMode==="type"?!!textMessage.trim():!!secretMicFile)
    :payloadType==="audio"
      ?(secretInputMode==="mic"?!!secretMicFile:!!payloadFile)
      :!!payloadFile
  )&&(!algoRequiresPassword||!!encodePassword);
// Trong hàm handleEncode của EncodePage

const handleEncode = async () => {
  if (!encodeReady) return;
  setLoading(true);
  setResult(null);
  const startTime = performance.now();

  try {
    const fd = new FormData();
    fd.append("algo_id", selectedAlgoId);
    fd.append("audio", encodeFile!);

    // Đảm bảo mật khẩu được gửi đi nếu thuật toán yêu cầu
    if (algoRequiresPassword && encodePassword) {
      fd.append("password", encodePassword);
    } else if (algoRequiresPassword && !encodePassword) {
       showError("Thuật toán này yêu cầu mật khẩu");
       setLoading(false);
       return;
    }

    if (payloadType === "text") {
      if (secretInputMode === "mic" && secretMicFile) {
        fd.append("secret_file", secretMicFile);
      } else {
        fd.append("secret_text", textMessage);
        fd.append("encrypt_text", encryptText ? "true" : "false");
      }
    } else if (payloadType === "audio") {
      if (secretInputMode === "mic" && secretMicFile) {
        fd.append("secret_file", secretMicFile);
      } else if (payloadFile) {
        fd.append("secret_file", payloadFile);
      }
    } else if (payloadFile) {
      fd.append("secret_file", payloadFile);
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stego/encode`, { 
      method: "POST", 
      body: fd 
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errData = await res.json();
        showError(errData.detail || "Không thể xử lý yêu cầu");
        return;
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const fname = stegoFilename(encodeFile!.name, payloadType);

      // Đọc headers (Đảm bảo backend có expose_headers các trường này)
      const h_mse = res.headers.get("Metrics-MSE") || res.headers.get("X-MSE") || res.headers.get("mse");
      const h_psnr = res.headers.get("Metrics-PSNR") || res.headers.get("X-PSNR") || res.headers.get("psnr");
      const h_snr = res.headers.get("Metrics-SNR") || res.headers.get("X-SNR") || res.headers.get("snr");
      const h_k = res.headers.get("Metrics-K") || res.headers.get("X-K") || res.headers.get("k");
      const h_algo = res.headers.get("Algo-Name") || res.headers.get("X-Algo-Name");

      const metrics = {
        mse: h_mse ? parseFloat(h_mse) : 0,
        psnr: h_psnr ? parseFloat(h_psnr) : 0,
        snr: h_snr ? parseFloat(h_snr) : 0
      };
      const k_val = h_k ? parseInt(h_k) : 0;
      const algo_name = h_algo || selectedAlgo?.algo_name || "Unknown";

      const endTime = performance.now();
      const encodingTime = Math.round((endTime - startTime) / 10) / 100; // Làm tròn đến 2 chữ số thập phân

      const newResult = {
        url: blobUrl,
        filename: fname,
        metrics: metrics,
        k: k_val,
        algo_name: algo_name,
        encodingTime: encodingTime
      };
      setResult(newResult);
      showSuccess("Nhúng dữ liệu thành công!");

      const historyItem = {
        id: Date.now(),
        action: "Encode", // Đánh dấu rõ là Encode cho History Page
        filename: fname,
        algo: algo_name,
        type: payloadType,
        metrics: metrics,
        k: k_val,
        date: new Date().toISOString()
      };
      const existingHistory = JSON.parse(localStorage.getItem("stego_history") || "[]");
      existingHistory.unshift(historyItem);
      localStorage.setItem("stego_history", JSON.stringify(existingHistory.slice(0, 20)));

    } else {
      let errMsg = "Không thể xử lý";
      try {
        const errData = await res.json();
        errMsg = errData.detail || errData.message || errMsg;
      } catch (e) {}
      showError(errMsg);
      console.error('[ENCODE REQUEST]', { status: res.status, message: errMsg });
    }
  } catch (e) {
    showError("Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối mạng.");
    console.error('[ENCODE ERROR]', e);
  } finally {
    setLoading(false);
  }
};

  // const handleDownload=()=>{ if(!result)return; const a=document.createElement("a"); a.href=result.url; a.download=result.filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
  const handleDownload = async () => {
    if (!result) return;
    try {
      const res = await fetch(result.url);
      if (!res.ok) throw new Error("Fetch failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      showSuccess("Tệp đã tải xuống thành công");
    } catch (err) {
      showError("Không thể tải tệp. Vui lòng thử lại.");
      console.error('[DOWNLOAD]', err);
    }
  };
  return(
    <div style={{ maxWidth:"1160px", margin:"0 auto", padding:"48px 36px" }}>

      <div style={{ marginBottom:"40px", paddingBottom:"28px", borderBottom:"2px solid #000" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:"0.72rem", color:"#888", letterSpacing:"0.15em", textTransform:"uppercase", fontWeight:600, marginBottom:"8px" }}>Mã hóa & Giấu tin</div>
            <h1 style={{ fontSize:"2rem", fontWeight:800, color:"var(--primary)", margin:"0 0 10px 0", lineHeight:1.2 }}>Nhúng dữ liệu vào âm thanh</h1>
            <p style={{ margin:0, fontSize:"0.92rem", color:"var(--text-muted)", maxWidth:"520px", lineHeight:1.6 }}>Chọn tệp âm thanh gốc, sau đó nhúng thông điệp bí mật bằng thuật toán steganography đã chọn.</p>
          </div>
          <div style={{ background:"#000", color:"#fff", borderRadius:"8px", padding:"10px 18px", fontSize:"0.72rem", letterSpacing:"0.08em", textTransform:"uppercase", fontWeight:700 }}>Bước 1 — Nhúng</div>
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
            
            {/* Ô mật khẩu chỉ hiện ra khi THUẬT TOÁN yêu cầu (Ví dụ: Random LSB) */}
            {algoRequiresPassword && (
              <div className="fade-in show" style={{ marginTop: "14px" }}>
                <Label>Mật khẩu thuật toán (bắt buộc)</Label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={encodePassword} 
                    onChange={e => setEncodePassword(e.target.value)} 
                    placeholder="Nhập mật khẩu..." 
                    style={{ 
                      width: "100%", 
                      padding: "10px 40px 10px 14px",
                      borderRadius: "6px", 
                      border: "1.5px solid #000", 
                      background: "var(--surface-2)", 
                      fontSize: "0.875rem", 
                      outline: "none", 
                      color: "var(--text)", 
                      boxSizing: "border-box",
                      fontFamily: "inherit"
                    }} 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      color: "var(--text-muted)"
                    }}
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"14px" }}>
              <Label>Âm thanh gốc (Cover Audio)</Label>
              <div style={{ display:"flex", gap:"6px" }}>
                {[{k:false,l:"Upload"},{k:true,l:"Mic"}].map(opt=>(
                  <button key={String(opt.k)} onClick={()=>setUseCoverMic(opt.k as boolean)} style={{ padding:"4px 12px", borderRadius:"4px", fontSize:"0.72rem", fontWeight:600, border:"1.5px solid #000", background:useCoverMic===opt.k?"#000":"transparent", color:useCoverMic===opt.k?"#fff":"#000", cursor:"pointer", transition:"all 0.15s" }}>{opt.l}</button>
                ))}
              </div>
            </div>
            {useCoverMic?(
              <MicRecorder onRecorded={f=>{setEncodeFile(f);setResult(null);}} label="Ghi âm cover audio" />
            ):(
              <div onClick={()=>document.getElementById("coverFileInput")?.click()} style={{ border:"2px solid #000", borderRadius:"8px", padding:"24px", textAlign:"center", cursor:"pointer", background:encodeFile?"#f9f6f0":"var(--surface-2)" }}>
                <input id="coverFileInput" type="file" accept="audio/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f){setEncodeFile(f);setResult(null);}}} />
                {encodeFile?(<div><div style={{fontSize:"0.875rem",fontWeight:700,color:"var(--primary)"}}>{encodeFile.name}</div><div style={{fontSize:"0.75rem",color:"#888",marginTop:"4px"}}>{fmtBytes(encodeFile.size)}</div></div>):(<div><div style={{fontSize:"0.85rem",color:"#888"}}>Kéo thả hoặc nhấp để chọn</div><div style={{fontSize:"0.75rem",color:"#bbb",marginTop:"4px"}}>WAV, MP3, FLAC...</div></div>)}
              </div>
            )}
            {sourceUrl&&encodeFile&&<AudioPlayer src={sourceUrl} name={encodeFile.name} />}
          </Card>
        </div>

        {/* RIGHT */}
        <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>

          <Card>
            <Label>Dữ liệu bí mật cần nhúng</Label>

            {isDeepLearningAlgo?(
              <div>
                <div style={{ padding:"10px 14px", borderRadius:"6px", background:"#f5f5f5", border:"1.5px solid #000", marginBottom:"14px", fontSize:"0.82rem", color:"#333", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span><strong>Hình ảnh</strong> — Deep Learning chỉ hỗ trợ ảnh</span>
                  <span style={{ fontSize:"0.7rem", background:"#000", color:"#fff", padding:"2px 8px", borderRadius:"3px" }}>Khóa</span>
                </div>
                <div onClick={()=>document.getElementById("payloadFileImg")?.click()} style={{ border:"2px solid #000", borderRadius:"8px", padding:"20px", textAlign:"center", cursor:"pointer", background:payloadFile?"#f9f6f0":"var(--surface-2)" }}>
                  <input id="payloadFileImg" type="file" accept="image/*" style={{display:"none"}} onChange={e=>setPayloadFile(e.target.files?.[0]||null)} />
                  {payloadFile?(<div><div style={{fontSize:"0.875rem",fontWeight:700,color:"var(--primary)"}}>{payloadFile.name}</div><div style={{fontSize:"0.75rem",color:"#888",marginTop:"4px"}}>{fmtBytes(payloadFile.size)}</div></div>):(<div style={{fontSize:"0.82rem",color:"#888"}}>Chọn hình ảnh</div>)}
                </div>
                {payloadFile&&payloadUrl&&<img src={payloadUrl} alt="Preview" style={{maxWidth:"100%",maxHeight:"130px",borderRadius:"6px",marginTop:"10px",objectFit:"cover",border:"1.5px solid #000"}} />}
              </div>
            ):(
              <>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"18px" }}>
                  {PAYLOAD_TYPES.map(pt=>(
                    <button key={pt.id} onClick={()=>{setPayloadType(pt.id);setPayloadFile(null);setTextMessage("");setSecretMicFile(null);setSecretInputMode("type");}} style={{ padding:"10px", borderRadius:"6px", cursor:"pointer", border:"1.5px solid #000", background:payloadType===pt.id?"#000":"transparent", color:payloadType===pt.id?"#fff":"#000", fontSize:"0.82rem", fontWeight:600, fontFamily:"inherit", transition:"all 0.15s" }}>
                      {pt.label}
                    </button>
                  ))}
                </div>

                {payloadType==="text"&&(
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <textarea value={textMessage} onChange={e=>setTextMessage(e.target.value)} placeholder="Nhập thông điệp bí mật cần giấu..." rows={5}
                      style={{ width:"100%", padding:"12px 14px", borderRadius:"6px", border:"1.5px solid #000", background:"var(--surface-2)", fontSize:"0.875rem", fontFamily:"inherit", resize:"vertical", outline:"none", boxSizing:"border-box", lineHeight:1.7, color:"var(--text)" }} />
                    
                    {secretInputMode === "type" && textMessage.trim().length > 0 && (
                      <label className="fade-in show" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.82rem", color: "var(--text)", background: "var(--surface-2)", padding: "12px 14px", borderRadius: "6px", border: "1.5px solid #000" }}>
                        <input 
                          type="checkbox" 
                          checked={encryptText} 
                          onChange={e => setEncryptText(e.target.checked)} 
                          style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#000" }} 
                        />
                        <span style={{ fontWeight: 600 }}>Tự động mã hóa văn bản (Bảo mật cấp hệ thống)</span>
                      </label>
                    )}
                  </div>
                )}

                {payloadType==="audio"&&(
                  <div>
                    <div style={{ display:"flex", gap:"6px", marginBottom:"12px" }}>
                      {[{m:"upload" as const,l:"Upload tệp"},{m:"mic" as const,l:"Ghi âm Mic"}].map(opt=>(
                        <button key={opt.m} onClick={()=>{setSecretInputMode(opt.m==="mic"?"mic":"type");setPayloadFile(null);setSecretMicFile(null);}} style={{ padding:"6px 14px", borderRadius:"4px", fontSize:"0.78rem", fontWeight:600, border:"1.5px solid #000", background:(opt.m==="mic"?secretInputMode==="mic":secretInputMode!=="mic")?"#000":"transparent", color:(opt.m==="mic"?secretInputMode==="mic":secretInputMode!=="mic")?"#fff":"#000", cursor:"pointer", transition:"all 0.15s" }}>{opt.l}</button>
                      ))}
                    </div>
                    {secretInputMode==="mic"?(
                      <MicRecorder convertToWav={false} onRecorded={f=>setSecretMicFile(f)} label="Ghi âm thông điệp bí mật" />
                    ):(
                      <div onClick={()=>document.getElementById("payloadFile")?.click()} style={{ border:"2px solid #000", borderRadius:"8px", padding:"20px", textAlign:"center", cursor:"pointer", background:payloadFile?"#f9f6f0":"var(--surface-2)" }}>
                        <input id="payloadFile" type="file" accept={selectedPayload.accept} style={{display:"none"}} onChange={e=>setPayloadFile(e.target.files?.[0]||null)} />
                        {payloadFile?(<div><div style={{fontSize:"0.875rem",fontWeight:700,color:"var(--primary)"}}>{payloadFile.name}</div><div style={{fontSize:"0.75rem",color:"#888",marginTop:"4px"}}>{fmtBytes(payloadFile.size)}</div></div>):(<div style={{fontSize:"0.82rem",color:"#888"}}>Chọn {selectedPayload.label.toLowerCase()}</div>)}
                      </div>
                    )}
                    {payloadFile&&payloadUrl&&<AudioPlayer src={payloadUrl} name={payloadFile.name} />}
                  </div>
                )}

                {(payloadType==="image"||payloadType==="file")&&(
                  <div>
                    <div onClick={()=>document.getElementById("payloadFile")?.click()} style={{ border:"2px solid #000", borderRadius:"8px", padding:"20px", textAlign:"center", cursor:"pointer", background:payloadFile?"#f9f6f0":"var(--surface-2)" }}>
                      <input id="payloadFile" type="file" accept={selectedPayload.accept} style={{display:"none"}} onChange={e=>setPayloadFile(e.target.files?.[0]||null)} />
                      {payloadFile?(<div><div style={{fontSize:"0.875rem",fontWeight:700,color:"var(--primary)"}}>{payloadFile.name}</div><div style={{fontSize:"0.75rem",color:"#888",marginTop:"4px"}}>{fmtBytes(payloadFile.size)}</div></div>):(<div style={{fontSize:"0.82rem",color:"#888"}}>Chọn {selectedPayload.label.toLowerCase()}</div>)}
                    </div>
                    {payloadFile&&payloadUrl&&payloadType==="image"&&<img src={payloadUrl} alt="Preview" style={{maxWidth:"100%",maxHeight:"130px",borderRadius:"6px",marginTop:"10px",objectFit:"cover",border:"1.5px solid #000"}} />}
                  </div>
                )}
              </>
            )}
          </Card>

          <button onClick={handleEncode} disabled={!encodeReady||loading} style={{ width:"100%", padding:"16px", borderRadius:"8px", border:"none", cursor:encodeReady&&!loading?"pointer":"not-allowed", background:encodeReady&&!loading?"#000":"#ccc", color:"#fff", fontSize:"0.9rem", fontWeight:700, fontFamily:"inherit", letterSpacing:"0.04em", textTransform:"uppercase", transition:"all 0.2s" }}>
            {loading?(<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"10px"}}><span style={{display:"inline-block",width:"16px",height:"16px",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.6s linear infinite"}} />Đang xử lý...</span>):"Nhúng Dữ Liệu"}
          </button>

          {result&&(
            <div ref={resultRef} style={{ background:"var(--surface)", borderRadius:"10px", border:"1.5px solid #000", overflow:"hidden", boxShadow:"2px 2px 0 #000", animation:"fadeSlideIn 0.3s ease" }}>
              <div style={{ background:"#f0faf4", padding:"14px 24px", display:"flex", alignItems:"center", gap:"12px", borderBottom:"1.5px solid #000" }}>
                <div style={{ width:"26px", height:"26px", borderRadius:"50%", background:"var(--success)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"0.75rem" }}>✓</div>
                <div>
                  <div style={{ fontSize:"0.9rem", color:"var(--success)", fontWeight:700 }}>Nhúng thành công</div>
                  <div style={{ fontSize:"0.72rem", color:"#5aaa72", marginTop:"1px" }}>Thuật toán: {result.algo_name}</div>
                </div>
              </div>
              <div style={{ padding:"20px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"10px", marginBottom:"16px" }}>
                  {[{label:"PSNR",value:(result.metrics?.psnr?.toFixed(2)||"—")+" dB",desc:"Chất lượng"},{label:"SNR",value:(result.metrics?.snr?.toFixed(2)||"—")+" dB",desc:"Tín nhiễu"},{label:"K",value:String(result.k??"—"),desc:"Bit dùng"},{label:"Thời gian",value:(result.encodingTime??0)+" s",desc:"Thực thi"}].map(m=>(
                    <div key={m.label} style={{ background:"var(--surface-2)", borderRadius:"6px", padding:"12px", border:"1.5px solid #000", textAlign:"center" }}>
                      <div style={{ fontSize:"0.6rem", color:"#888", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"4px" }}>{m.label}</div>
                      <div style={{ fontSize:"1.05rem", fontWeight:700, color:"var(--primary)", fontFamily:"monospace" }}>{m.value}</div>
                      <div style={{ fontSize:"0.6rem", color:"#aaa", marginTop:"2px" }}>{m.desc}</div>
                    </div>
                  ))}
                </div>
                <AudioPlayer src={result.url} name={result.filename} />
                <button onClick={handleDownload} style={{ width:"100%", marginTop:"12px", padding:"12px", borderRadius:"6px", border:"1.5px solid #000", background:"transparent", color:"#000", fontSize:"0.85rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Tải tệp Stego Audio</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeSlideIn { from { opacity:0;transform:translateY(8px); } to { opacity:1;transform:translateY(0); } }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 6px rgba(155,28,28,0.15);}50%{box-shadow:0 0 0 12px rgba(155,28,28,0.04);} }
      `}</style>
    </div>
  );
}

// export default withAuth(EncodePage)
export default EncodePage;

