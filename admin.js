const $=s=>document.querySelector(s);
const USERNAME="Adminnews";
const PASSWORD_SHA256="536f2e4efd13ace82cc4875e48164cfafabd0151c713272d26fcb8b902772c0f";
const STORE_KEY="gls_news_editor_v11";
const SESSION_KEY="gls_news_admin_session_v11";
let items=[];

const slugify=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,90);
const parseSources=text=>text.split(/\n+/).map(x=>x.trim()).filter(Boolean).map(line=>{const [name,...rest]=line.split("|");return{name:name.trim(),url:rest.join("|").trim()}}).filter(x=>x.name);
const sourceText=s=>(s||[]).map(x=>`${x.name} | ${x.url||""}`).join("\n");

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
  $("#postList").innerHTML=list.map(a=>`<div class="post-row" data-id="${a.id}"><strong>${a.title}</strong><small>${a.date||""} · ${a.category} ${a.status==="draft"?"· NHÁP":""}</small></div>`).join("");
  document.querySelectorAll(".post-row").forEach(r=>r.onclick=()=>editPost(r.dataset.id));
}
function resetForm(){
  $("#postForm").reset();$("#postId").value="";$("#date").value=new Date().toISOString().slice(0,10);$("#author").value="Gia Lai Số News";$("#status").value="published";$("#editorTitle").textContent="Bài viết mới";$("#saveError").textContent="";
}
function editPost(id){
  const a=items.find(x=>x.id===id);if(!a)return;
  $("#postId").value=a.id;$("#title").value=a.title||"";$("#category").value=a.category||"Pháp luật";$("#date").value=a.date||"";$("#author").value=a.author||"Gia Lai Số News";$("#status").value=a.status||"published";$("#excerpt").value=a.excerpt||"";$("#content").value=a.content||"";$("#partner").value=a.partner||"";$("#imageUrl").value=a.image||"";$("#sources").value=sourceText(a.sources);$("#featured").checked=!!a.featured;$("#editorTitle").textContent="Chỉnh sửa bài";
}
function downloadText(filename,text,type="text/javascript;charset=utf-8"){
  const blob=new Blob([text],{type}); const url=URL.createObjectURL(blob); const a=document.createElement("a");
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportData(){
  const text="window.SEED_POSTS = "+JSON.stringify(items,null,2)+";\n";
  downloadText("seed-posts.js",text);
  $("#publishNote").textContent="Đã xuất seed-posts.js. Upload file này lên GitHub để ghi đè file cũ, sau đó Ctrl+F5 trang chủ.";
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

$("#postForm").addEventListener("submit",e=>{
  e.preventDefault();$("#saveError").textContent="";
  try{
    const oldId=$("#postId").value;const id=oldId||slugify($("#title").value)+"-"+Date.now().toString().slice(-5);
    const obj={id,title:$("#title").value.trim(),category:$("#category").value,date:$("#date").value,author:$("#author").value.trim()||"Gia Lai Số News",status:$("#status").value,excerpt:$("#excerpt").value.trim(),content:$("#content").value.trim(),partner:$("#partner").value.trim(),image:$("#imageUrl").value.trim(),featured:$("#featured").checked,sources:parseSources($("#sources").value)};
    const i=items.findIndex(x=>x.id===id);if(i>=0)items[i]=obj;else items.push(obj);
    if(obj.featured)items=items.map(x=>x.id===id?x:{...x,featured:false});
    saveLocal();renderList();$("#postId").value=id;$("#publishNote").textContent="Đã lưu trên máy này. Khi muốn đưa lên web, bấm “Xuất file cập nhật website”.";
  }catch(err){$("#saveError").textContent=err.message||String(err);}
});
$("#deleteBtn").onclick=()=>{
  const id=$("#postId").value;if(!id)return;
  if(!confirm("Xóa bài này khỏi bản đang biên tập?"))return;
  items=items.filter(x=>x.id!==id);saveLocal();renderList();resetForm();$("#publishNote").textContent="Đã xóa trong bản biên tập. Xuất seed-posts.js để cập nhật lên web.";
};

if(sessionStorage.getItem(SESSION_KEY)==="1")showDashboard();else showLogin();
