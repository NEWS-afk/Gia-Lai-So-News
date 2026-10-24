import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const cfg = window.GLS_FIREBASE || {};
const state = {articles:[], category:"Tất cả", query:"", page:1, perPage:12};
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
const fmtDate = s => {
  if(!s) return "";
  const d = new Date(s+"T00:00:00");
  return new Intl.DateTimeFormat("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"}).format(d);
};
const categoryLabel = c => ({"Cảnh báo ANTT":"An ninh - Cảnh báo","Tin thế giới":"Thế giới"}[c]||c);
const placeholderSvg = title => {
  const t = esc((title||"Gia Lai Số News").slice(0,50));
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675"><rect width="1200" height="675" fill="#ecebe7"/><rect x="54" y="55" width="8" height="565" fill="#a80f14"/><text x="100" y="295" font-family="Georgia,serif" font-size="52" font-weight="700" fill="#282828">${t}</text><text x="102" y="360" font-family="Arial,sans-serif" font-size="25" fill="#777">Gia Lai Số News</text></svg>`)}`;
};
function imgSrc(a){ return a.image || placeholderSvg(a.title); }
function safeImg(img,a){ img.onerror=()=>{img.onerror=null;img.src=placeholderSvg(a.title)} }

async function loadArticles(){
  let list = Array.isArray(window.SEED_POSTS) ? [...window.SEED_POSTS] : [];
  if(cfg.enabled && cfg.config?.apiKey && !cfg.config.apiKey.includes("PASTE_")){
    try{
      const app=initializeApp(cfg.config);
      const db=getFirestore(app);
      const snap=await getDoc(doc(db,"site","articles"));
      if(snap.exists() && Array.isArray(snap.data().items)) list=snap.data().items;
    }catch(err){ console.warn("Firebase unavailable, using seed data",err); }
  }
  state.articles=list.filter(a=>a.status!=="draft").sort((a,b)=>(b.date||"").localeCompare(a.date||""));
}
function bind(){
  $("#searchInput").addEventListener("input",e=>{state.query=e.target.value.trim().toLowerCase();state.page=1;renderListingOrHome()});
  document.querySelectorAll(".nav-link").forEach(b=>b.addEventListener("click",()=>{
    document.querySelectorAll(".nav-link").forEach(x=>x.classList.remove("active")); b.classList.add("active");
    state.category=b.dataset.category; state.page=1; renderListingOrHome();
  }));
  document.body.addEventListener("click",e=>{
    const btn=e.target.closest("[data-open]"); if(btn) openArticle(btn.dataset.open,true);
    const cat=e.target.closest("[data-show-category]"); if(cat){state.category=cat.dataset.showCategory;state.page=1;document.querySelectorAll(".nav-link").forEach(x=>x.classList.toggle("active",x.dataset.category===state.category));renderListingOrHome();}
    if(e.target.dataset.close) closeArticle();
  });
  window.addEventListener("popstate",()=>{ const id=new URLSearchParams(location.search).get("id"); if(id) openArticle(id,false); else closeArticle(false); });
}
function filtered(cat=state.category){
  const q=state.query;
  return state.articles.filter(a=>{
    const okCat=cat==="Tất cả"||a.category===cat;
    const hay=(a.title+" "+a.excerpt+" "+a.content+" "+a.category+" "+(a.partner||"")).toLowerCase();
    return okCat && (!q || hay.includes(q));
  });
}
function renderTicker(){
  $("#ticker").innerHTML=`<span class="ticker-label">MỚI CẬP NHẬT</span>${state.articles.slice(0,5).map(a=>`<a href="?id=${encodeURIComponent(a.id)}" data-open="${esc(a.id)}">${esc(a.title)}</a>`).join("")}`;
}
function renderLead(){
  let lead=state.articles.find(a=>a.featured && !a.partner) || state.articles.find(a=>!a.partner) || state.articles[0];
  const el=$("#leadStory");
  el.innerHTML=`<img class="lead-image" src="${esc(imgSrc(lead))}" alt="${esc(lead.title)}"><div class="lead-meta">${fmtDate(lead.date)} · ${esc(categoryLabel(lead.category))}</div><h1 class="lead-title"><button data-open="${esc(lead.id)}">${esc(lead.title)}</button></h1><p class="lead-excerpt">${esc(lead.excerpt||"")}</p>${lead.partner?`<span class="partner-note">Phối hợp tuyên truyền: ${esc(lead.partner)}</span>`:""}`;
  safeImg(el.querySelector("img"),lead);
  const side=state.articles.filter(a=>a.id!==lead.id).slice(0,5);
  $("#topStories").innerHTML=side.map(a=>`<div class="side-story"><small>${categoryLabel(a.category)} · ${fmtDate(a.date)}</small><button data-open="${esc(a.id)}">${esc(a.title)}</button></div>`).join("");
}
function renderHomeSections(){
  const cats=["Pháp luật","PCCC","Cảnh báo ANTT","Chuyển đổi số","Tin thế giới"];
  $("#homeSections").innerHTML=cats.map(c=>{
    const list=state.articles.filter(a=>a.category===c).slice(0,7);
    if(!list.length)return "";
    const main=list[0], rest=list.slice(1);
    return `<section class="category-section">
      <div class="category-head"><h2>${esc(categoryLabel(c))}</h2><button data-show-category="${esc(c)}">Xem tất cả</button></div>
      <div class="section-grid">
        <article class="section-main">
          <img class="section-main-image" src="${esc(imgSrc(main))}" alt="${esc(main.title)}" data-img-id="${esc(main.id)}">
          <div class="story-meta">${fmtDate(main.date)}</div>
          <h3 class="section-main-title"><button data-open="${esc(main.id)}">${esc(main.title)}</button></h3>
          <p>${esc(main.excerpt||"")}</p>
        </article>
        <div class="section-list">${rest.map(a=>`<article class="section-mini">
          <img src="${esc(imgSrc(a))}" alt="${esc(a.title)}" data-img-id="${esc(a.id)}">
          <div><div class="mini-date">${fmtDate(a.date)}</div><div class="mini-title"><button data-open="${esc(a.id)}">${esc(a.title)}</button></div></div>
        </article>`).join("")}</div>
      </div>
    </section>`;
  }).join("");
  document.querySelectorAll("[data-img-id]").forEach(img=>{const a=state.articles.find(x=>x.id===img.dataset.imgId); if(a) safeImg(img,a)});
}
function renderListing(){
  const list=filtered();
  $("#listingTitle").textContent=state.category==="Tất cả"?"Kết quả tìm kiếm":categoryLabel(state.category);
  $("#resultCount").textContent=`${list.length} bài`;
  const pages=Math.max(1,Math.ceil(list.length/state.perPage)); if(state.page>pages)state.page=pages;
  const page=list.slice((state.page-1)*state.perPage,state.page*state.perPage);
  $("#articleGrid").innerHTML=page.map(a=>`<article class="article-card">
    <img class="card-image" src="${esc(imgSrc(a))}" alt="${esc(a.title)}" data-img-id="${esc(a.id)}">
    <span class="card-category">${esc(categoryLabel(a.category))}</span>
    <div class="story-meta">${fmtDate(a.date)}</div>
    <h3 class="card-title"><button data-open="${esc(a.id)}">${esc(a.title)}</button></h3>
    <p class="card-excerpt">${esc(a.excerpt||"")}</p>
  </article>`).join("");
  document.querySelectorAll("[data-img-id]").forEach(img=>{const a=state.articles.find(x=>x.id===img.dataset.imgId); if(a)safeImg(img,a)});
  $("#pager").innerHTML=pages>1?Array.from({length:pages},(_,i)=>i+1).map(p=>`<button class="${p===state.page?"active":""}" data-page="${p}">${p}</button>`).join(""):"";
  $("#pager").querySelectorAll("button").forEach(b=>b.onclick=()=>{state.page=+b.dataset.page;renderListing();scrollTo({top:$("#listingSection").offsetTop-20,behavior:"smooth"})});
}
function renderListingOrHome(){
  const isHome=state.category==="Tất cả"&&!state.query;
  $("#homeSections").classList.toggle("hidden",!isHome);
  $(".lead-layout").classList.toggle("hidden",!isHome);
  $("#listingSection").classList.toggle("hidden",isHome);
  if(isHome){renderLead();renderHomeSections();}else renderListing();
}
function openArticle(id,push=true){
  const a=state.articles.find(x=>x.id===id); if(!a)return;
  const paras=String(a.content||"").split(/\n\n+/).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join("");
  $("#articleView").innerHTML=`<header class="article-head"><span class="card-category">${esc(categoryLabel(a.category))}</span><h1>${esc(a.title)}</h1><div class="article-meta">${fmtDate(a.date)} · ${esc(a.author||"Gia Lai Số News")}</div><p class="article-deck">${esc(a.excerpt||"")}</p>${a.partner?`<div class="partner-note">Phối hợp tuyên truyền: ${esc(a.partner)}</div>`:""}</header><img class="article-lead-image" src="${esc(imgSrc(a))}" alt="${esc(a.title)}"><div class="article-body">${paras}</div><div class="source-box"><strong>Nguồn tham khảo</strong><ul>${(a.sources||[]).map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a></li>`).join("")}</ul></div>`;
  safeImg($("#articleView .article-lead-image"),a);
  $("#articleModal").classList.add("open"); document.body.style.overflow="hidden"; $("#articleModal").setAttribute("aria-hidden","false");
  if(push)history.pushState({},"",`?id=${encodeURIComponent(id)}`);
}
function closeArticle(push=true){$("#articleModal").classList.remove("open");document.body.style.overflow="";$("#articleModal").setAttribute("aria-hidden","true");if(push&&location.search)history.pushState({},"",location.pathname)}
async function boot(){
  $("#today").textContent=new Intl.DateTimeFormat("vi-VN",{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date());
  await loadArticles(); bind(); renderTicker(); renderListingOrHome();
  const id=new URLSearchParams(location.search).get("id"); if(id)openArticle(id,false);
}
boot();
