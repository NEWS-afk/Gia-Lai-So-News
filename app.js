
const state={articles:[],category:"Tất cả",query:"",page:1,perPage:9};
const $=s=>document.querySelector(s);
const fmtDate=s=>new Intl.DateTimeFormat("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(s+"T00:00:00"));
const esc=s=>(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
const shortCat=c=>({"PCCC":"PCCC","Pháp luật":"PL","Cảnh báo ANTT":"ANTT","Chuyển đổi số":"CĐS","Tin thế giới":"TG"}[c]||"TIN");

async function boot(){
  const res=await fetch("data/articles.json");
  state.articles=await res.json();
  $("#today").textContent=new Intl.DateTimeFormat("vi-VN",{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date());
  bind();
  render();
  const id=new URLSearchParams(location.search).get("id");
  if(id) openArticle(id,false);
}
function bind(){
  document.querySelectorAll(".nav-link").forEach(b=>b.onclick=()=>{
    document.querySelectorAll(".nav-link").forEach(x=>x.classList.remove("active"));
    b.classList.add("active"); state.category=b.dataset.category;state.page=1;render();
  });
  $("#searchInput").oninput=e=>{state.query=e.target.value.trim().toLowerCase();state.page=1;render()};
  document.body.addEventListener("click",e=>{
    const id=e.target.closest("[data-open]")?.dataset.open;
    if(id) openArticle(id,true);
    if(e.target.dataset.close){closeArticle()}
  });
  window.addEventListener("popstate",()=>{
    const id=new URLSearchParams(location.search).get("id");
    if(id) openArticle(id,false); else closeArticle(false);
  });
}
function filtered(){
  return state.articles.filter(a=>{
    const cat=state.category==="Tất cả"||a.category===state.category;
    const hay=(a.title+" "+a.excerpt+" "+a.content+" "+a.category).toLowerCase();
    return cat && (!state.query||hay.includes(state.query));
  });
}
function render(){ renderHero(); renderGrid(); renderStats(); renderPccc(); $("#sectionTitle").textContent=state.category==="Tất cả"?"Bài viết mới":state.category; }
function coverHTML(a, cls=""){
  if(a.image){ return `<img src="${esc(a.image)}" alt="${esc(a.title)}" class="${cls||'thumb-img'}">`; }
  return `<div class="thumb-fallback ${cls==='hero-img'?'hero-img':''}"><span>${shortCat(a.category)}</span></div>`;
}
function renderHero(){
  const a=state.articles.find(x=>x.featured) || state.articles[0];
  $("#heroSection").innerHTML=`
    <div class="hero">
      <div class="hero-visual">${coverHTML(a,'hero-img')}<div class="hero-overlay"></div><div class="hero-caption"><span class="hero-badge">${esc(a.category)}</span><h2 class="hero-title">${esc(a.title)}</h2></div></div>
      <div class="hero-body">
        <div class="meta">${fmtDate(a.date)} • ${esc(a.author)}</div>
        <p>${esc(a.excerpt)}</p>
        <button class="read-btn" data-open="${a.id}">Đọc bài →</button>
      </div>
    </div>`;
}
function renderGrid(){
  const list=filtered();
  $("#resultCount").textContent=`${list.length} bài`;
  const pages=Math.max(1,Math.ceil(list.length/state.perPage));
  if(state.page>pages)state.page=pages;
  const start=(state.page-1)*state.perPage;
  $("#articleGrid").innerHTML=list.slice(start,start+state.perPage).map(a=>`
    <article class="article-card">
      <div class="thumb">${a.image?`<img src="${esc(a.image)}" alt="${esc(a.title)}" class="thumb-img">`:`<div class="thumb-fallback"><span>${shortCat(a.category)}</span></div>`}<span class="category card-cat">${esc(a.category)}</span></div>
      <div class="card-body">
        <div class="meta">${fmtDate(a.date)}</div>
        <h3 class="card-title"><button data-open="${a.id}">${esc(a.title)}</button></h3>
        <p class="excerpt">${esc(a.excerpt)}</p>
        <div class="card-foot">${esc(a.author)}</div>
      </div>
    </article>`).join("") || `<div class="side-card">Không tìm thấy bài phù hợp.</div>`;
  $("#pager").innerHTML=Array.from({length:pages},(_,i)=>i+1).map(p=>`<button class="${p===state.page?"active":""}" data-page="${p}">${p}</button>`).join("");
  $("#pager").querySelectorAll("button").forEach(b=>b.onclick=()=>{state.page=+b.dataset.page;renderGrid();scrollTo({top:document.querySelector(".section-head").offsetTop-80,behavior:"smooth"})});
}
function renderStats(){
  const order=["Pháp luật","PCCC","Cảnh báo ANTT","Chuyển đổi số","Tin thế giới"];
  $("#categoryStats").innerHTML=order.map(c=>`<div class="stat-row"><span>${c}</span><strong>${state.articles.filter(a=>a.category===c).length}</strong></div>`).join("");
}
function renderPccc(){
  const months=Array.from({length:12},(_,i)=>i+1);
  $("#pcccStatus").innerHTML=`<div class="month-grid">${months.map(m=>{ const ok=state.articles.some(a=>a.category==="PCCC"&&a.date.startsWith(`2026-${String(m).padStart(2,"0")}`)); return `<div class="month ${ok?"ok":"missing"}">T${m}<br>${ok?"✓":"—"}</div>`; }).join("")}</div><p class="muted" style="font-size:12px">Dấu ✓ = đã có ít nhất 01 bài PCCC trong tháng.</p>`;
}
function openArticle(id,push=true){
  const a=state.articles.find(x=>x.id===id); if(!a)return;
  const paras=(a.content||'').split(/\n\n+/).map(p=>`<p>${esc(p)}</p>`).join('');
  const gallery=(a.gallery&&a.gallery.length)?`<div class="gallery">${a.gallery.map(img=>`<figure><img src="${esc(img)}" alt="${esc(a.title)}"></figure>`).join('')}</div>`:'';
  $("#articleView").innerHTML=`
    <header class="article-head">
      <span class="category">${esc(a.category)}</span>
      <h1>${esc(a.title)}</h1>
      <div class="meta">${fmtDate(a.date)} • ${esc(a.author)}</div>
      <p class="muted">${esc(a.excerpt)}</p>
    </header>
    ${a.image?`<div class="lead-image-wrap"><img src="${esc(a.image)}" alt="${esc(a.title)}" class="lead-image"></div>`:''}
    <div class="article-content">${paras}</div>
    ${gallery}
    <div class="source-box"><strong>Nguồn tham khảo:</strong><ul>${(a.sources||[]).map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)}</a></li>`).join("")}</ul>
    <small>Nội dung trên trang được biên tập/tóm lược; ảnh minh họa có thể là ảnh hoạt động tuyên truyền, hướng dẫn thực tế tại địa bàn.</small></div>`;
  $("#articleModal").classList.add("open");$("#articleModal").setAttribute("aria-hidden","false");document.body.style.overflow="hidden";
  if(push) history.pushState({}, "", `?id=${encodeURIComponent(id)}`);
}
function closeArticle(push=true){
  $("#articleModal").classList.remove("open");$("#articleModal").setAttribute("aria-hidden","true");document.body.style.overflow="";
  if(push && location.search) history.pushState({}, "", location.pathname);
}
boot().catch(err=>{ document.body.innerHTML=`<div style="font-family:Arial;padding:30px"><h2>Không tải được dữ liệu bài viết</h2><p>${err}</p><p>Website cần chạy qua máy chủ web/GitHub Pages, không mở trực tiếp bằng file://.</p></div>`; });
