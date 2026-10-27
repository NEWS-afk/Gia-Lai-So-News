const $=s=>document.querySelector(s);
const USERNAME="Adminnews";
const PASSWORD_SHA256="536f2e4efd13ace82cc4875e48164cfafabd0151c713272d26fcb8b902772c0f";
const STORE_KEY="gls_news_editor_v12";
const SESSION_KEY="gls_news_admin_session_v12";
let items=[];
let currentLeadImage="";
let currentGallery=[];

const slugify=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,90);
const parseSources=text=>text.split(/\n+/).map(x=>x.trim()).filter(Boolean).map(line=>{const [name,...rest]=line.split("|");return{name:name.trim(),url:rest.join("|").trim()}}).filter(x=>x.name);
const sourceText=s=>(s||[]).map(x=>`${x.name} | ${x.url||""}`).join("\n");
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));

async function sha256(text){
  const data=new TextEncoder().encode(text);
  const digest=await crypto.subtle.digest("SHA-256",data);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
function defaultItems(){return Array.isArray(window.SEED_POSTS)?structuredClone(window.SEED_POSTS):[];}
function loadLocal(){
  try{const raw=localStorage.getItem(STORE_KEY);items=raw?JSON.parse(raw):defaultItems();}
  catch{items=defaultItems();}
  if(!Array.isArray(items))items=defaultItems();
}
function saveLocal(){localStorage.setItem(STORE_KEY,JSON.stringify(items));}
function showDashboard(){
  $("#loginScreen").style.display="none";
  $("#dashboard").classList.add("show");
  loadLocal();renderList();resetForm();
}
function showLogin(){
  $("#dashboard").classList.remove("show");
  $("#loginScreen").style.display="grid";
}
function renderList(){
  const q=$("#adminSearch").value.trim().toLowerCase();
  const list=[...items].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).filter(a=>((a.title||"")+" "+(a.category||"")).toLowerCase().includes(q));
  $("#adminStats").textContent=`${items.length} bài · ${items.filter(x=>x.status!=="draft").length} công khai · ${items.filter(x=>x.status==="draft").length} bản nháp`;
  $("#postList").innerHTML=list.map(a=>`<div class="post-row" data-id="${esc(a.id)}"><strong>${esc(a.title)}</strong><small>${esc(a.date||"")} · ${esc(a.category||"")} ${a.status==="draft"?"· NHÁP":""}</small></div>`).join("");
  document.querySelectorAll(".post-row").forEach(r=>r.onclick=()=>editPost(r.dataset.id));
}
function resetForm(){
  $("#postForm").reset();
  $("#postId").value="";
  $("#date").value=new Date().toISOString().slice(0,10);
  $("#author").value="Gia Lai Số News";
  $("#status").value="published";
  $("#editorTitle").textContent="Bài viết mới";
  $("#saveError").textContent="";
  currentLeadImage="";
  currentGallery=[];
  renderLeadPreview();
  renderGalleryPreview();
}
function editPost(id){
  const a=items.find(x=>x.id===id);if(!a)return;
  $("#postId").value=a.id;
  $("#title").value=a.title||"";
  $("#category").value=a.category||"Pháp luật";
  $("#date").value=a.date||"";
  $("#author").value=a.author||"Gia Lai Số News";
  $("#status").value=a.status||"published";
  $("#excerpt").value=a.excerpt||"";
  $("#content").value=a.content||"";
  $("#partner").value=a.partner||"";
  currentLeadImage=a.image||"";
  $("#imageUrl").value=(currentLeadImage && !currentLeadImage.startsWith("data:"))?currentLeadImage:"";
  currentGallery=Array.isArray(a.gallery)?structuredClone(a.gallery):[];
  $("#sources").value=sourceText(a.sources);
  $("#featured").checked=!!a.featured;
  $("#editorTitle").textContent="Chỉnh sửa bài";
  renderLeadPreview();
  renderGalleryPreview();
  window.scrollTo({top:0,behavior:"smooth"});
}
function downloadText(filename,text,type="text/javascript;charset=utf-8"){
  const blob=new Blob([text],{type});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportData(){
  const text="window.SEED_POSTS = "+JSON.stringify(items,null,2)+";\n";
  downloadText("seed-posts.js",text);
  $("#publishNote").textContent="Đã xuất seed-posts.js. Upload file này lên GitHub để ghi đè file cũ, sau đó Ctrl+F5 trang chủ.";
}

function imageSrcValue(x){return typeof x==="string"?x:(x?.src||x?.url||"");}
function renderLeadPreview(){
  const box=$("#leadImagePreview");
  const src=currentLeadImage||$("#imageUrl")?.value.trim()||"";
  if(!src){box.innerHTML='<div class="empty-image">Bài viết hiện chưa có ảnh đại diện riêng.</div>';return;}
  box.innerHTML=`<img src="${esc(src)}" alt="Xem trước ảnh đại diện">`;
  const img=box.querySelector("img");
  img.onerror=()=>{box.innerHTML='<div class="empty-image">Không tải được ảnh này. Kiểm tra lại URL hoặc chọn ảnh khác từ máy.</div>';};
}
function renderGalleryPreview(){
  const box=$("#galleryPreview");
  if(!currentGallery.length){box.innerHTML='<div class="empty-image">Chưa có ảnh bổ sung trong nội dung bài.</div>';return;}
  box.innerHTML=currentGallery.map((x,i)=>{
    const src=imageSrcValue(x);
    return `<div class="gallery-admin-item"><img src="${esc(src)}" alt="Ảnh ${i+1}"><button type="button" data-remove-gallery="${i}">Xóa ảnh ${i+1}</button></div>`;
  }).join("");
  box.querySelectorAll("[data-remove-gallery]").forEach(btn=>btn.onclick=()=>{
    currentGallery.splice(Number(btn.dataset.removeGallery),1);
    renderGalleryPreview();
  });
}
function fileToDataURL(file){
  return new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error("Không đọc được ảnh."));r.readAsDataURL(file);
  });
}
async function compressImage(file,maxW=1400,maxH=1000,quality=.82){
  if(!file.type.startsWith("image/"))throw new Error("Tệp đã chọn không phải hình ảnh.");
  if(file.size>12*1024*1024)throw new Error(`Ảnh ${file.name} lớn hơn 12 MB.`);
  const data=await fileToDataURL(file);
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error(`Không đọc được ảnh ${file.name}.`));i.src=data;});
  let w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
  const scale=Math.min(1,maxW/w,maxH/h);w=Math.max(1,Math.round(w*scale));h=Math.max(1,Math.round(h*scale));
  const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
  return canvas.toDataURL("image/jpeg",quality);
}

$("#loginForm").addEventListener("submit",async e=>{
  e.preventDefault();$("#loginError").textContent="";
  const user=$("#loginUsername").value.trim();
  const pass=$("#loginPassword").value;
  if(user!==USERNAME){$("#loginError").textContent="Sai tài khoản.";return;}
  const hash=await sha256(pass);
  if(hash!==PASSWORD_SHA256){$("#loginError").textContent="Sai mật khẩu.";return;}
  sessionStorage.setItem(SESSION_KEY,"1");
  $("#loginPassword").value="";
  showDashboard();
});

$("#logoutBtn").onclick=()=>{sessionStorage.removeItem(SESSION_KEY);showLogin();};
$("#newPostBtn").onclick=resetForm;
$("#adminSearch").oninput=renderList;
$("#reloadSeedBtn").onclick=()=>{
  if(!confirm("Nạp lại dữ liệu từ file seed-posts.js trên website? Các chỉnh sửa chưa xuất sẽ bị mất."))return;
  items=defaultItems();saveLocal();renderList();resetForm();$("#publishNote").textContent="Đã nạp lại dữ liệu gốc từ website.";
};
$("#exportBtn").onclick=exportData;
$("#backupBtn").onclick=()=>downloadText(`gia-lai-so-news-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(items,null,2),"application/json;charset=utf-8");
$("#importFile").onchange=async e=>{
  const f=e.target.files?.[0];if(!f)return;
  try{
    const text=await f.text();let data;
    if(f.name.toLowerCase().endsWith('.js')){
      const m=text.match(/window\.SEED_POSTS\s*=\s*(\[[\s\S]*\])\s*;?\s*$/);if(!m)throw new Error("Không đọc được file JS.");data=JSON.parse(m[1]);
    }else data=JSON.parse(text);
    if(!Array.isArray(data))throw new Error("Dữ liệu không đúng định dạng.");
    items=data;saveLocal();renderList();resetForm();$("#publishNote").textContent=`Đã nhập ${items.length} bài.`;
  }catch(err){alert("Không nhập được dữ liệu: "+(err.message||err));}
  e.target.value="";
};

$("#imageUrl").addEventListener("input",()=>{currentLeadImage=$("#imageUrl").value.trim();renderLeadPreview();});
$("#leadImageFile").addEventListener("change",async e=>{
  const f=e.target.files?.[0];if(!f)return;
  try{
    $("#saveError").textContent="Đang xử lý ảnh đại diện...";
    currentLeadImage=await compressImage(f,1600,1100,.84);
    $("#imageUrl").value="";
    renderLeadPreview();
    $("#saveError").textContent="Đã nạp ảnh đại diện từ máy.";
  }catch(err){$("#saveError").textContent=err.message||String(err);}
  e.target.value="";
});
$("#clearLeadImageBtn").onclick=()=>{currentLeadImage="";$("#imageUrl").value="";renderLeadPreview();};
$("#galleryFiles").addEventListener("change",async e=>{
  const files=[...(e.target.files||[])];if(!files.length)return;
  try{
    if(currentGallery.length+files.length>12)throw new Error("Mỗi bài nên tối đa 12 ảnh trong nội dung.");
    $("#saveError").textContent=`Đang xử lý ${files.length} ảnh...`;
    for(const f of files)currentGallery.push(await compressImage(f,1400,1000,.8));
    renderGalleryPreview();
    $("#saveError").textContent=`Đã thêm ${files.length} ảnh vào nội dung bài.`;
  }catch(err){$("#saveError").textContent=err.message||String(err);}
  e.target.value="";
});
$("#clearGalleryBtn").onclick=()=>{currentGallery=[];renderGalleryPreview();};

$("#postForm").addEventListener("submit",e=>{
  e.preventDefault();$("#saveError").textContent="";
  try{
    const oldId=$("#postId").value;
    const id=oldId||slugify($("#title").value)+"-"+Date.now().toString().slice(-5);
    const urlImage=$("#imageUrl").value.trim();
    const obj={
      id,
      title:$("#title").value.trim(),
      category:$("#category").value,
      date:$("#date").value,
      author:$("#author").value.trim()||"Gia Lai Số News",
      status:$("#status").value,
      excerpt:$("#excerpt").value.trim(),
      content:$("#content").value.trim(),
      partner:$("#partner").value.trim(),
      image:urlImage||currentLeadImage||"",
      gallery:structuredClone(currentGallery),
      featured:$("#featured").checked,
      sources:parseSources($("#sources").value)
    };
    const i=items.findIndex(x=>x.id===id);if(i>=0)items[i]=obj;else items.push(obj);
    if(obj.featured)items=items.map(x=>x.id===id?x:{...x,featured:false});
    currentLeadImage=obj.image;
    saveLocal();renderList();$("#postId").value=id;
    $("#publishNote").textContent="Đã lưu trên máy này. Mở trang chủ trên máy này sẽ thấy bản xem trước ngay. Muốn mọi người cùng thấy, bấm “Xuất file cập nhật website” rồi upload seed-posts.js lên GitHub.";
  }catch(err){$("#saveError").textContent=err.message||String(err);}
});
$("#deleteBtn").onclick=()=>{
  const id=$("#postId").value;if(!id)return;
  if(!confirm("Xóa bài này khỏi bản đang biên tập?"))return;
  items=items.filter(x=>x.id!==id);saveLocal();renderList();resetForm();$("#publishNote").textContent="Đã xóa trong bản biên tập. Xuất seed-posts.js để cập nhật lên web.";
};

if(sessionStorage.getItem(SESSION_KEY)==="1")showDashboard();else showLogin();
