import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-storage.js";

const cfg=window.GLS_FIREBASE||{};
const $=s=>document.querySelector(s);
let app,auth,db,storage=null,items=[];

function readyConfig(){
  return cfg.enabled && cfg.config?.apiKey && !cfg.config.apiKey.includes("PASTE_") && cfg.adminEmail && !cfg.adminEmail.includes("YOUR_");
}
if(!readyConfig()){
  $("#loginError").textContent="Chưa cấu hình Firebase. Mở file firebase-config.js và làm theo README_FIREBASE_SETUP.md.";
}
else{
  app=initializeApp(cfg.config); auth=getAuth(app); db=getFirestore(app);
  if(cfg.storageEnabled) storage=getStorage(app);
}

const slugify=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,90);
const parseSources=text=>text.split(/\n+/).map(x=>x.trim()).filter(Boolean).map(line=>{const [name,...rest]=line.split("|");return{name:name.trim(),url:rest.join("|").trim()}}).filter(x=>x.name);
const sourceText=s=>(s||[]).map(x=>`${x.name} | ${x.url||""}`).join("\n");

async function loadDoc(){
  const snap=await getDoc(doc(db,"site","articles"));
  items=snap.exists()&&Array.isArray(snap.data().items)?snap.data().items:[];
  renderList();
}
async function saveAll(){
  await setDoc(doc(db,"site","articles"),{items,updatedAt:serverTimestamp()});
}
function renderList(){
  const q=$("#adminSearch").value.trim().toLowerCase();
  const list=[...items].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).filter(a=>(a.title+" "+a.category).toLowerCase().includes(q));
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
async function uploadImageIfAny(){
  const file=$("#imageFile").files[0];
  if(!file)return $("#imageUrl").value.trim();
  if(!cfg.storageEnabled||!storage)throw new Error("Chưa bật Firebase Storage. Có thể dùng URL ảnh/đường dẫn GitHub thay thế.");
  const ext=(file.name.split(".").pop()||"jpg").replace(/[^a-z0-9]/gi,"");
  const name=`posts/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const r=ref(storage,name); await uploadBytes(r,file,{contentType:file.type}); return await getDownloadURL(r);
}
$("#loginForm").addEventListener("submit",async e=>{
  e.preventDefault();$("#loginError").textContent="";
  if(!readyConfig())return;
  if($("#loginUsername").value.trim()!==cfg.adminUsername){$("#loginError").textContent="Sai tài khoản.";return}
  try{
    await signInWithEmailAndPassword(auth,cfg.adminEmail,$("#loginPassword").value);
  }catch(err){
    console.error("Firebase Auth login error:",err);
    const code=err?.code||"unknown";
    const messages={
      "auth/invalid-credential":"Firebase không chấp nhận thông tin đăng nhập. Kiểm tra đúng user và mật khẩu vừa đặt lại.",
      "auth/wrong-password":"Mật khẩu không đúng.",
      "auth/user-not-found":"Không tìm thấy tài khoản quản trị trong Firebase Authentication.",
      "auth/user-disabled":"Tài khoản quản trị đang bị vô hiệu hóa.",
      "auth/operation-not-allowed":"Phương thức Email/Password chưa được bật trong Authentication > Sign-in method.",
      "auth/too-many-requests":"Firebase tạm khóa đăng nhập do thử quá nhiều lần. Chờ một lúc rồi thử lại.",
      "auth/network-request-failed":"Không kết nối được tới Firebase. Kiểm tra mạng/trình duyệt hoặc tiện ích chặn kết nối.",
      "auth/invalid-api-key":"API key Firebase trong website không hợp lệ.",
      "auth/app-not-authorized":"Web app/API key chưa được phép dùng Firebase Authentication.",
      "auth/unauthorized-domain":"Tên miền GitHub Pages chưa nằm trong Authentication > Settings > Authorized domains."
    };
    $("#loginError").textContent=`${messages[code]||"Firebase từ chối đăng nhập."} (Mã lỗi: ${code})`;
  }
});
if(auth)onAuthStateChanged(auth,async user=>{
  $("#loginScreen").style.display=user?"none":"grid";$("#dashboard").classList.toggle("show",!!user);
  if(user){$("#storageNote").textContent=cfg.storageEnabled?"Có thể tải ảnh trực tiếp lên Firebase Storage.":"Storage đang tắt: hãy dán URL ảnh hoặc dùng đường dẫn ảnh trên GitHub.";await loadDoc();resetForm();}
});
$("#logoutBtn").onclick=()=>signOut(auth);
$("#newPostBtn").onclick=resetForm;
$("#adminSearch").oninput=renderList;
$("#seedBtn").onclick=async()=>{
  if(items.length&&!confirm("Kho dữ liệu đã có bài. Ghi đè bằng 72 bài mẫu?"))return;
  items=(window.SEED_POSTS||[]).map(x=>({...x,status:x.status||"published"}));
  await saveAll();renderList();alert("Đã khởi tạo 72 bài mẫu V10 lên Firestore.");
};
$("#syncPcccBtn").onclick=async()=>{
  const pccc=(window.SEED_POSTS||[]).filter(x=>x.category==="PCCC").map(x=>({...x,status:x.status||"published"}));
  if(!pccc.length)return alert("Không tìm thấy bài PCCC trong dữ liệu mẫu.");
  if(!confirm(`Cập nhật ${pccc.length} bài PCCC Ia Ko lên Firestore? Các chuyên mục khác sẽ được giữ nguyên.`))return;
  items=items.filter(x=>x.category!=="PCCC").concat(pccc);
  await saveAll();renderList();alert(`Đã cập nhật ${pccc.length} bài PCCC Ia Ko. Các bài thuộc chuyên mục khác được giữ nguyên.`);
};
$("#postForm").addEventListener("submit",async e=>{
  e.preventDefault();$("#saveError").textContent="";
  try{
    const oldId=$("#postId").value; const id=oldId||slugify($("#title").value)+"-"+Date.now().toString().slice(-5);
    const image=await uploadImageIfAny();
    const obj={id,title:$("#title").value.trim(),category:$("#category").value,date:$("#date").value,author:$("#author").value.trim()||"Gia Lai Số News",status:$("#status").value,excerpt:$("#excerpt").value.trim(),content:$("#content").value.trim(),partner:$("#partner").value.trim(),image,featured:$("#featured").checked,sources:parseSources($("#sources").value)};
    const i=items.findIndex(x=>x.id===id);if(i>=0)items[i]=obj;else items.push(obj);
    if(obj.featured)items=items.map(x=>x.id===id?x:{...x,featured:false});
    await saveAll();renderList();$("#postId").value=id;alert("Đã lưu bài. Trang công khai sẽ đọc dữ liệu mới từ Firestore.");
  }catch(err){$("#saveError").textContent=err.message||String(err)}
});
$("#deleteBtn").onclick=async()=>{
  const id=$("#postId").value;if(!id)return;
  if(!confirm("Xóa bài này?"))return;
  items=items.filter(x=>x.id!==id);await saveAll();renderList();resetForm();
};
