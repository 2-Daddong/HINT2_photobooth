import React,{useState,useRef,useEffect} from 'react';import{createRoot}from'react-dom/client';import{FilesetResolver,FaceLandmarker,InteractiveSegmenter}from'@mediapipe/tasks-vision';import QRCode from'qrcode';import './style.css';
const wasm='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm';let face,segment;const loadImage=src=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src});const read=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)});const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function App(){const[page,P]=useState(0),[mode,M]=useState('camera'),[leaving,L]=useState(false),[layout,A]=useState([2,2]),[theme,T]=useState('white'),[photos,H]=useState([]),[chosen,C]=useState([]),[filter,F]=useState('none'),[count,N]=useState(0),[busy,B]=useState(false),[error,E]=useState(''),[stickers,S]=useState([]),[selected,J]=useState(-1),[custom,U]=useState(''),[result,R]=useState(''),[qr,Q]=useState(''),[link,K]=useState('');const [point,setPoint]=useState(null),[cutout,setCutout]=useState(''),[outline,setOutline]=useState(true);const video=useRef(),preview=useRef(),output=useRef(),stream=useRef(),filterRef=useRef(filter),cancel=useRef(false),drag=useRef(null);filterRef.current=filter;const total=layout[0]*layout[1];
useEffect(()=>{if(page!==2&&page!==5)return;let alive=true,raf;async function start(){try{const s=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:1280},height:{ideal:960},facingMode:'user'},audio:false});if(!alive){s.getTracks().forEach(t=>t.stop());return}stream.current=s;video.current.srcObject=s;await video.current.play();function draw(){if(!alive)return;const v=video.current,c=preview.current;if(v&&c&&v.videoWidth){c.width=v.videoWidth;c.height=v.videoHeight;const g=c.getContext('2d');g.save();g.translate(c.width,0);g.scale(-1,1);g.drawImage(v,0,0);if(face&&filterRef.current!=='none'&&page===2){try{const r=face.detectForVideo(v,performance.now());for(const pts of r.faceLandmarks){const a=pts[33],b=pts[263],top=pts[10];const w=Math.hypot((a.x-b.x)*c.width,(a.y-b.y)*c.height);g.save();g.translate((a.x+b.x)*c.width/2,filterRef.current==='glasses'?(a.y+b.y)*c.height/2:top.y*c.height);g.rotate(Math.atan2((b.y-a.y)*c.height,(b.x-a.x)*c.width));g.font=`${w*(filterRef.current==='glasses'?1.35:1.1)}px sans-serif`;g.textAlign='center';g.textBaseline=filterRef.current==='glasses'?'middle':'bottom';g.fillText({glasses:'🕶️',crown:'👑',cat:'🐱'}[filterRef.current],0,0);g.restore()}}catch(e){}}g.restore()}raf=requestAnimationFrame(draw)}draw()}catch(e){if(alive)E('카메라 접근 실패: '+e.message)}}start();return()=>{alive=false;cancelAnimationFrame(raf);stream.current?.getTracks().forEach(t=>t.stop());cancel.current=true}},[page]);
async function chooseFilter(f){F(f);if(f==='none'||face)return;try{B(true);face=await FaceLandmarker.createFromOptions(await FilesetResolver.forVisionTasks(wasm),{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task'},runningMode:'VIDEO',numFaces:6})}catch(e){E('얼굴 모델 로딩 실패: '+e.message);F('none')}finally{B(false)}}
async function shoot(){B(true);cancel.current=false;let arr=[];try{for(let i=0;i<10;i++){for(let n=3;n>0;n--){if(cancel.current)return;N(n);await sleep(1000)}if(cancel.current)return;if(!preview.current?.width)throw Error('카메라 준비 중');arr.push(preview.current.toDataURL('image/jpeg',.92));H([...arr]);N(0);await sleep(350)}C([]);P(3)}catch(e){E(e.message)}finally{N(0);B(false)}}
async function upload(e){try{const a=await Promise.all(Array.from(e.target.files).map(read));H(a);C([]);P(3)}catch(e){E(e.message)}}
const renderVersion=useRef(0);
async function render(qrImage=''){
 const target=output.current;if(!target)return;
 const version=++renderVersion.current,c=document.createElement('canvas');
 const [cols,rows]=layout,w=480,h=360,pad=28,head=100,foot=64;
 c.width=cols*w+(cols+1)*pad;c.height=rows*h+(rows+1)*pad+head+foot;
 const g=c.getContext('2d'),light=theme==='white'||theme==='character_white',character=theme.startsWith('character_'),modern=cols===2&&rows===1&&theme!=='#454c55';
 g.fillStyle=modern?(light?'#f0f0f0':'#082b48'):theme.startsWith('character_')?(light?'#f0f0f0':'#082b48'):theme;g.fillRect(0,0,c.width,c.height);
 const ink=light?'#092c49':'white';
 async function asset(src,x,y,bw,bh){const im=await loadImage(src);const scale=Math.min(bw/im.width,bh/im.height);g.drawImage(im,x+(bw-im.width*scale)/2,y+(bh-im.height*scale)/2,im.width*scale,im.height*scale)}
 if(modern){const suffix=light?'navy':'white';await asset(`/common/hmg_logo_${suffix}.png`,pad,18,125,55);await asset(`/common/hint_logo_${suffix}.png`,c.width-pad-155,8,155,82);}
 else{g.fillStyle=ink;g.font='bold 30px sans-serif';g.textAlign='center';g.fillText('HINT PHOTO BOOTH',c.width/2,44)}
 for(let i=0;i<total;i++){const x=pad+(i%cols)*(w+pad),y=head+pad+Math.floor(i/cols)*(h+pad);g.save();g.beginPath();g.roundRect(x,y,w,h,modern?22:0);g.clip();g.fillStyle=modern?'#fff':'#d5dce3';g.fillRect(x,y,w,h);if(photos[chosen[i]]){const im=await loadImage(photos[chosen[i]]);const scale=Math.min(w/im.width,h/im.height);g.drawImage(im,x+(w-im.width*scale)/2,y+(h-im.height*scale)/2,im.width*scale,im.height*scale)}g.restore()}
 if(modern&&character){await asset('/characters/rabbit_01.png',12,c.height-220,150,210);await asset('/characters/rabbit_02.png',c.width-pad-125,head+pad+h-145,125,145)}
 g.fillStyle=ink;g.font='bold 24px HDharmony, sans-serif';g.textAlign=modern?'right':'center';g.fillText(modern?new Date().toLocaleDateString('sv-SE').replaceAll('-','.'): 'Where Possibility Begins',modern?c.width-pad:c.width/2,c.height-24);
 for(const st of stickers){g.save();g.translate(st.x*c.width,st.y*c.height);g.rotate(st.r*Math.PI/180);if(st.src){const im=await loadImage(st.src);const sw=st.s*c.width;g.drawImage(im,-sw/2,-sw*im.height/im.width/2,sw,sw*im.height/im.width)}else{g.font=`${st.s*c.width}px sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(st.text,0,0)}g.restore()}
 if(qrImage)await asset(qrImage,modern?166:pad,12,78,78);
 if(version!==renderVersion.current)return;target.width=c.width;target.height=c.height;target.getContext('2d').drawImage(c,0,0);
}
useEffect(()=>{if(page===4)render().catch(e=>E(e.message))},[page,stickers,chosen,theme,layout]);
function add(st){S(a=>[...a,{...st,x:.5,y:.5,s:.18,r:0}]);J(stickers.length)}function edit(p){S(a=>a.map((s,i)=>i===selected?{...s,...p}:s))}
function resetCut(src=''){U(src);setPoint(null);setCutout('');E('')}

async function cut(e) {
    if (busy) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const x = Math.max(0, Math.min(1,
        (e.clientX - rect.left) / rect.width
    ));

    const y = Math.max(0, Math.min(1,
        (e.clientY - rect.top) / rect.height
    ));

    setPoint({ x, y });
    setCutout('');
    E('');
    B(true);

    let r;

    try {
        console.log('[Sticker Debug v3] 실행 시작');

        const im = await loadImage(custom);

        // 1. 모델 초기화
        if (!segment) {
            segment = await InteractiveSegmenter.createFromOptions(
                await FilesetResolver.forVisionTasks(wasm),
                {
                    baseOptions: {
                        modelAssetPath:
                            'https://storage.googleapis.com/mediapipe-models/interactive_segmenter/magic_touch/float32/latest/magic_touch.tflite'
                    },
                    outputCategoryMask: true,
                    outputConfidenceMasks: false
                }
            );
        }

        console.log('[1] 모델 로딩 완료');

        // 2. Segmentation 추론
        r = segment.segment(im, {
            keypoint: { x, y }
        });

        const mask = r.categoryMask;

        if (!mask) {
            throw new Error('Category Mask가 없습니다.');
        }

        const width = mask.width;
        const height = mask.height;
        const data = new Uint8Array(mask.getAsUint8Array());

        console.log('[2] 마스크 반환 완료', {
            width,
            height,
            length: data.length,
            values: [...new Set(data)]
        });

        // 3. 클릭한 위치의 마스크 값 확인
        const px = Math.min(width - 1, Math.floor(x * width));
        const py = Math.min(height - 1, Math.floor(y * height));

        const targetValue = data[py * width + px];

        console.log('[3] 선택한 픽셀 값:', targetValue);

        // 4. Canvas 생성
        const canvas = document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');

        ctx.drawImage(im, 0, 0, width, height);

        const imageData = ctx.getImageData(
            0, 0, width, height
        );

        let keptPixels = 0;

        // 5. 클릭한 위치와 같은 마스크 값을 유지
        for (let i = 0; i < data.length; i++) {
            const keep = data[i] === targetValue;

            imageData.data[i * 4 + 3] = keep ? 255 : 0;

            if (keep) keptPixels++;
        }

        console.log('[4] 유지된 픽셀 수:', keptPixels);

        if (keptPixels === 0) {
            throw new Error('유효한 객체 픽셀이 없습니다.');
        }

        ctx.putImageData(imageData, 0, 0);

        // 6. PNG 생성 (Crop 생략)
        const png = canvas.toDataURL('image/png');

        console.log('[5] PNG 생성 완료', {
            length: png.length,
            prefix: png.substring(0, 30)
        });

        // 7. 생성된 PNG 유효성 확인
        const checkImage = await loadImage(png);

        console.log('[6] PNG 검증 완료', {
            width: checkImage.width,
            height: checkImage.height
        });

        // 8. 결과 화면 업데이트
        setCutout(png);

        console.log('[7] setCutout 실행 완료');

    } catch (err) {
        console.error('[AI Sticker Error]', err);

        E('누끼 생성 실패: ' + err.message);

    } finally {
        r?.close?.();
        B(false);
    }
}

async function confirmSticker(){if(!cutout||busy)return;B(true);try{let src=cutout;if(outline){const im=await loadImage(src),c=document.createElement('canvas'),pad=Math.max(3,Math.round(Math.max(im.width,im.height)*.025));c.width=im.width+pad*2;c.height=im.height+pad*2;const g=c.getContext('2d');for(let i=0;i<64;i++){const a=i*Math.PI/32;g.drawImage(im,pad+Math.cos(a)*pad,pad+Math.sin(a)*pad)}g.globalCompositeOperation='source-in';g.fillStyle='white';g.fillRect(0,0,c.width,c.height);g.globalCompositeOperation='source-over';g.drawImage(im,pad,pad);src=c.toDataURL('image/png')}add({src});resetCut();P(4)}catch(e){E(e.message)}finally{B(false)}}
async function share(){if(busy)return;B(true);E('');try{
 const id=crypto.randomUUID(),url=new URL(`/api/share?id=${id}`,window.location.origin).href;
 const qrImage=await QRCode.toDataURL(url,{margin:4,width:400,errorCorrectionLevel:'M'});
 const im=await loadImage(result),code=await loadImage(qrImage),c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);
 const modern=layout.join()==='2,1'&&theme!=='#454c55';g.imageSmoothingEnabled=false;g.drawImage(code,modern?166:28,12,78,78);
 let image=c.toDataURL('image/jpeg',.94);for(let quality=.85;image.length>Math.floor(2*1024*1024*4/3)&&quality>=.35;quality-=.1)image=c.toDataURL('image/jpeg',quality);
 const res=await fetch('/api/share',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image,id})});const d=await res.json();if(!res.ok)throw Error(d.error);R(image);K(url);Q(qrImage);
 }catch(e){E('QR 공유: '+e.message)}finally{B(false)}}
function go(p){E('');P(p)}function begin(m){M(m);L(true);setTimeout(()=>{L(false);go(1)},1000)}
return <main><header><img className="hmg" src="/common/hmg_logo_white.png"/><img className="hint" src="/common/hint_logo_white.png"/></header>{page!==0&&<nav><button onClick={()=>{cancel.current=true;B(false);go(page===5?4:Math.max(0,page-1))}}>← 이전</button><span>HINT PHOTO BOOTH · {['','프레임 선택','사진 촬영','사진 선택','사진 꾸미기','AI 스티커','완료'][page]}</span><button onClick={()=>{cancel.current=true;B(false);go(0)}}>홈</button></nav>}{error&&<aside>{error}<button onClick={()=>E('')}>닫기</button></aside>}
{page===0&&<section className="landing"><h2>HINT 2기<br/>서울 제조지능화 2반</h2><h1>Photo Booth</h1><div className={'car '+(leaving?'leave':'')}><img src="/car.png"/><button className="window rear" onClick={()=>begin('camera')}><i><span>사진 촬영</span></i></button><button className="window front" onClick={()=>begin('upload')}><i><span>사진 불러오기</span></i></button></div></section>}
{page===1&&<section><h1>프레임 선택</h1><div className="options">{[[2,2],[1,4],[2,3],[2,1]].map(l=><button key={l.join()} className={layout.join()===l.join()?'active':''} onClick={()=>{A(l);if(theme.startsWith('character_'))T('white')}}><div className="mini" style={{gridTemplateColumns:`repeat(${l[0]},1fr)`}}>{Array.from({length:l[0]*l[1]},(_,i)=><i key={i}/>)}</div>{l.join(' × ')}</button>)}</div><div className="options">{(layout.join()==='2,1'?[['white','심플 화이트'],['#092c49','심플 네이비'],['character_white','캐릭터 화이트'],['character_navy','캐릭터 네이비'],['#454c55','자동차 테마']]:[['white','심플 화이트'],['#092c49','심플 네이비'],['#71537c','캐릭터'],['#454c55','자동차 테마']]).map(([v,t])=><button className={theme===v?'active':''} onClick={()=>T(v)} key={v}>{t}</button>)}</div>{mode==='camera'?<button onClick={()=>{H([]);go(2)}}>촬영 시작</button>:<label className="button">사진 불러오기<input type="file" accept="image/*" multiple onChange={upload}/></label>}</section>}
{(page===2||page===5)&&<section><h1>{page===2?'사진 촬영':'AI 스티커 제작'}</h1><video ref={video} playsInline muted hidden/><div className="camera"><canvas ref={preview}/>{count>0&&<strong>{count}</strong>}</div>{page===2?<><div className="options">{['none','glasses','crown','cat'].map((f,i)=><button disabled={busy} className={filter===f?'active':''} onClick={()=>chooseFilter(f)} key={f}>{['원본','🕶️','👑','🐱'][i]}</button>)}</div><button disabled={busy} onClick={shoot}>10장 연속 촬영 (3초 간격)</button><p>{photos.length}/10</p></>:<><button disabled={busy} onClick={()=>{if(!video.current?.videoWidth){E('카메라 준비 중');return}resetCut(preview.current.toDataURL())}}>스티커 사진 촬영</button><label className="button">사진 불러오기<input type="file" accept="image/*" disabled={busy} onChange={async e=>{if(e.target.files[0])try{resetCut(await read(e.target.files[0]))}catch(err){E(err.message)}}}/></label>{custom&&<div className="cut-editor"><p>남길 대상의 중앙을 클릭하거나 터치하세요.</p><div className="cut-grid"><div><h3>원본 사진</h3><div className="cut-source"><img src={custom} onClick={cut} alt="남길 대상 선택"/>{point&&<span className="cut-point" style={{left:`${point.x*100}%`,top:`${point.y*100}%`}}/>}</div></div><div><h3>누끼 결과</h3><div className="cut-result">{cutout?<img src={cutout} className={outline?'cut-outline':''} alt="누끼 결과"/>:<span>{busy?'AI 분석 중…':'대상을 선택해주세요'}</span>}</div></div></div><div className="options"><label><input type="checkbox" checked={outline} onChange={e=>setOutline(e.target.checked)}/> 흰색 테두리</label><button disabled={busy} onClick={()=>{setPoint(null);setCutout('');E('')}}>다시 선택</button><button disabled={busy||!cutout} onClick={confirmSticker}>스티커 생성 완료</button></div></div>}</>}</section>}
{page===3&&<section><h1>사진 선택 · {chosen.length}/{total}</h1><p>원하는 순서대로 선택하세요. 다시 누르면 선택이 취소됩니다.</p><div className="photos">{photos.map((p,i)=><button key={i} onClick={()=>C(a=>a.includes(i)?a.filter(x=>x!==i):a.length<total?[...a,i]:a)}><img src={p}/>{chosen.includes(i)&&<b>{chosen.indexOf(i)+1}</b>}</button>)}</div><button disabled={chosen.length!==total} onClick={()=>go(4)}>꾸미기</button></section>}
{page===4&&<section><h1>사진 꾸미기</h1><div className="editor"><canvas ref={output} onPointerDown={e=>{const b=e.currentTarget.getBoundingClientRect(),x=(e.clientX-b.left)/b.width,y=(e.clientY-b.top)/b.height;const i=stickers.findLastIndex(s=>Math.abs(s.x-x)<s.s/2&&Math.abs(s.y-y)<s.s*b.width/b.height/2);J(i);if(i>=0){drag.current=i;e.currentTarget.setPointerCapture(e.pointerId)}}} onPointerMove={e=>{if(drag.current===null)return;const b=e.currentTarget.getBoundingClientRect();S(a=>a.map((s,i)=>i===drag.current?{...s,x:Math.max(0,Math.min(1,(e.clientX-b.left)/b.width)),y:Math.max(0,Math.min(1,(e.clientY-b.top)/b.height))}:s))}} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null}/><div><div className="options">{['💗','⭐','🚗','🤖','🎀','🌼'].map(t=><button key={t} onClick={()=>add({text:t})}>{t}</button>)}</div><button onClick={()=>{resetCut();go(5)}}>+ AI 스티커 제작</button>{selected>=0&&stickers[selected]&&<div><p>크기 <input type="range" min=".04" max=".6" step=".01" value={stickers[selected].s} onChange={e=>edit({s:+e.target.value})}/></p><p>회전 <input type="range" min="-180" max="180" value={stickers[selected].r} onChange={e=>edit({r:+e.target.value})}/></p><button onClick={()=>add({...stickers[selected]})}>복제</button><button onClick={()=>{S(a=>a.filter((_,i)=>i!==selected));J(-1)}}>삭제</button></div>}<button onClick={async()=>{await render();R(output.current.toDataURL('image/jpeg',.94));Q('');K('');go(6)}}>완료</button></div></div></section>}
{page===6&&<section><h1>우리의 순간</h1><img className="result" src={result}/><div className="options"><a className="button" href={result} download="HINT-photo.jpg">사진 다운로드</a><button disabled={busy||!!qr} onClick={share}>QR 공유</button></div>{qr&&<div><img width="180" src={qr}/><p><a href={link}>공유 링크</a></p><small>링크를 가진 누구나 사진을 볼 수 있습니다.</small></div>}</section>}{busy&&<p role="status">처리 중…</p>}<footer><span>Where</span><span>Possibility</span><span>Begins</span></footer></main>}
createRoot(document.getElementById('root')).render(<App/>);
