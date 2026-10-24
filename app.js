const state={articles:[],category:"Tất cả",query:"",page:1,perPage:10};
const $=s=>document.querySelector(s);
const fmtDate=s=>new Intl.DateTimeFormat("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(s+"T00:00:00"));
const esc=s=>(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
const catLabel=c=>({"Cảnh báo ANTT":"An ninh - Cảnh báo","Tin thế giới":"Thế giới"}[c]||c);
const catClass=c=>({"Pháp luật":"legal","PCCC":"fire","Cảnh báo ANTT":"security","Chuyển đổi số":"digital","Tin thế giới":"world"}[c]||"news");

async function boot(){
  const res=await fetch("data/articles.json");
  state.articles=(await res.json()).sort((a,b)=>b.date.localeCompare(a.date));
  $("#today").textContent=new Intl.DateTimeFormat("vi-VN",{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date());
  bind(); render();
  const id=new URLSearchParams(location.search).get("id");
  if(id) openArticle(id,false);
}

function bind(){
  document.querySelectorAll(".nav-link").forEach(b=>b.onclick=()=>{
    document.querySelectorAll(".nav-link").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    state.category=b.dataset.category; state.query=""; state.page=1; $("#searchInput").value=""; render();
  });
  $("#searchInput").oninput=e=>{state.query=e.target.value.trim().toLowerCase();state.page=1;render()};
  document.body.addEventListener("click",e=>{
    const id=e.target.closest("[data-open]")?.dataset.open;
    if(id) openArticle(id,true);
    const cat=e.target.closest("[data-jump-category]")?.dataset.jumpCategory;
    if(cat){
      state.category=cat;state.query="";state.page=1;$("#searchInput").value="";
      document.querySelectorAll(".nav-link").forEach(x=>x.classList.toggle("active",x.dataset.category===cat));
      render();scrollTo({top:0,behavior:"smooth"});
    }
    if(e.target.dataset.close) closeArticle();
  });
  window.addEventListener("popstate",()=>{
    const id=new URLSearchParams(location.search).get("id");
    if(id) openArticle(id,false); else closeArticle(false);
  });
}

function filtered(){
  return state.articles.filter(a=>{
    const cat=state.category==="Tất cả"||a.category===state.category;
    const hay=(a.title+" "+a.excerpt+" "+a.content+" "+a.category+" "+(a.partner||"")).toLowerCase();
    return cat&&(!state.query||hay.includes(state.query));
  });
}

function render(){
  renderLatestStrip(); renderStats(); renderPartnerPosts();
  const home=state.category==="Tất cả"&&!state.query;
  $("#homeView").hidden=!home;
  $("#listingView").hidden=home;
  if(home){renderTopStory();renderHomeSections();}
  else{renderGrid();$("#sectionTitle").textContent=state.query?`Kết quả tìm kiếm${state.category!=="Tất cả"?` trong ${catLabel(state.category)}`:""}`:catLabel(state.category);}
}

function img(a,cls=""){return a.image?`<img src="${esc(a.image)}" alt="${esc(a.title)}" class="${cls}">`:`<div class="image-fallback ${cls}"><span>${esc(catLabel(a.category))}</span></div>`;}

function renderLatestStrip(){
  const latest=state.articles.slice(0,5);
  $("#latestStrip").innerHTML=`<span class="latest-label">Mới cập nhật</span><div class="latest-links">${latest.map(a=>`<button data-open="${a.id}">${esc(a.title)}</button>`).join("")}</div>`;
}

function renderTopStory(){
  const lead=state.articles.find(a=>a.featured)||state.articles[0];
  const side=state.articles.filter(a=>a.id!==lead.id).slice(0,4);
  $("#topStory").innerHTML=`
    <div class="lead-story">
      <div class="lead-photo">${img(lead,"lead-photo-img")}<span class="category-tag ${catClass(lead.category)}">${esc(catLabel(lead.category))}</span></div>
      <div class="lead-copy">
        <div class="story-meta">${fmtDate(lead.date)}${lead.partner?` · Phối hợp: ${esc(lead.partner)}`:""}</div>
        <h1><button data-open="${lead.id}">${esc(lead.title)}</button></h1>
        <p>${esc(lead.excerpt)}</p>
      </div>
    </div>
    <div class="top-side">
      <div class="top-side-title">Đáng chú ý</div>
      ${side.map((a,i)=>`<article class="top-side-item ${i===0?"with-thumb":""}">${i===0?`<div class="mini-thumb">${img(a,"mini-thumb-img")}</div>`:""}<div><span>${esc(catLabel(a.category))}</span><h3><button data-open="${a.id}">${esc(a.title)}</button></h3><small>${fmtDate(a.date)}</small></div></article>`).join("")}
    </div>`;
}

function renderHomeSections(){
  const order=["Pháp luật","PCCC","Cảnh báo ANTT","Chuyển đổi số","Tin thế giới"];
  $("#homeSections").innerHTML=order.map((cat,idx)=>{
    const list=state.articles.filter(a=>a.category===cat).slice(0,idx===1?7:6);
    const lead=list[0]; const rest=list.slice(1);
    const partnerNote=cat==="PCCC"?`<div class="section-note">Có bài phối hợp tuyên truyền từ Công an xã Ia Ko và các nguồn công khai.</div>`:"";
    return `<section class="category-block ${catClass(cat)}-block">
      <div class="category-heading"><div><span class="section-kicker">Chuyên mục</span><h2>${esc(catLabel(cat))}</h2>${partnerNote}</div><button data-jump-category="${cat}">Xem tất cả</button></div>
      <div class="category-layout">
        <article class="section-lead">
          <div class="section-lead-photo">${img(lead,"section-lead-img")}</div>
          <div class="story-meta">${fmtDate(lead.date)}${lead.partner?` · Phối hợp: ${esc(lead.partner)}`:""}</div>
          <h3><button data-open="${lead.id}">${esc(lead.title)}</button></h3>
          <p>${esc(lead.excerpt)}</p>
        </article>
        <div class="section-list">${rest.map((a,i)=>`<article class="section-list-item">${i<2?`<div class="list-thumb">${img(a,"list-thumb-img")}</div>`:""}<div><span class="story-meta">${fmtDate(a.date)}</span><h4><button data-open="${a.id}">${esc(a.title)}</button></h4>${i<2?`<p>${esc(a.excerpt)}</p>`:""}</div></article>`).join("")}</div>
      </div>
    </section>`;
  }).join("");
}

function renderGrid(){
  const list=filtered();
  $("#resultCount").textContent=`${list.length} bài`;
  const pages=Math.max(1,Math.ceil(list.length/state.perPage));
  if(state.page>pages)state.page=pages;
  const start=(state.page-1)*state.perPage;
  $("#articleGrid").innerHTML=list.slice(start,start+state.perPage).map(a=>`
    <article class="article-card">
      <div class="thumb">${img(a,"thumb-img")}<span class="category-tag ${catClass(a.category)}">${esc(catLabel(a.category))}</span></div>
      <div class="card-body">
        <div class="story-meta">${fmtDate(a.date)}</div>
        <h3 class="card-title"><button data-open="${a.id}">${esc(a.title)}</button></h3>
        <p class="excerpt">${esc(a.excerpt)}</p>
        <div class="card-foot">${a.partner?`<span>Phối hợp: ${esc(a.partner)}</span>`:`<span>${esc(a.author||"Gia Lai Số News")}</span>`}</div>
      </div>
    </article>`).join("")||`<div class="empty-state">Không tìm thấy bài viết phù hợp.</div>`;
  $("#pager").innerHTML=pages>1?Array.from({length:pages},(_,i)=>i+1).map(p=>`<button class="${p===state.page?"active":""}" data-page="${p}">${p}</button>`).join(""):"";
  $("#pager").querySelectorAll("button").forEach(b=>b.onclick=()=>{state.page=+b.dataset.page;renderGrid();scrollTo({top:document.querySelector(".listing-head").offsetTop-80,behavior:"smooth"})});
}

function renderStats(){
  const order=["Pháp luật","PCCC","Cảnh báo ANTT","Chuyển đổi số","Tin thế giới"];
  $("#categoryStats").innerHTML=order.map(c=>`<button class="stat-row" data-jump-category="${c}"><span>${esc(catLabel(c))}</span><strong>${state.articles.filter(a=>a.category===c).length}</strong></button>`).join("");
}

function renderPartnerPosts(){
  const list=state.articles.filter(a=>a.partner).slice(0,5);
  $("#partnerPosts").innerHTML=list.map(a=>`<div class="partner-item"><button data-open="${a.id}">${esc(a.title)}</button><small>${fmtDate(a.date)} · ${esc(a.partner)}</small></div>`).join("");
}

function openArticle(id,push=true){
  const a=state.articles.find(x=>x.id===id); if(!a)return;
  const paras=(a.content||"").split(/\n\n+/).map(p=>`<p>${esc(p)}</p>`).join("");
  const gallery=(a.gallery&&a.gallery.length)?`<div class="gallery">${a.gallery.map(im=>`<figure><img src="${esc(im)}" alt="${esc(a.title)}"></figure>`).join("")}</div>`:"";
  const partner=a.partner?`<div class="partner-strip"><strong>Nội dung phối hợp:</strong> ${esc(a.partner)} đề xuất/cung cấp nội dung; Gia Lai Số News biên tập và đăng tải.</div>`:"";
  $("#articleView").innerHTML=`
    <header class="article-head">
      <span class="article-category ${catClass(a.category)}">${esc(catLabel(a.category))}</span>
      <h1>${esc(a.title)}</h1>
      <div class="article-meta">${fmtDate(a.date)} · ${esc(a.author||"Gia Lai Số News")}</div>
      <p class="article-deck">${esc(a.excerpt)}</p>${partner}
    </header>
    ${a.image?`<figure class="lead-image-wrap"><img src="${esc(a.image)}" alt="${esc(a.title)}" class="lead-image"></figure>`:""}
    <div class="article-content">${paras}</div>${gallery}
    <div class="source-box"><strong>Nguồn tham khảo</strong>${(a.sources||[]).length?`<ul>${a.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)}</a></li>`).join("")}</ul>`:`<p>Nội dung biên tập của Gia Lai Số News.</p>`}<small>Thông tin trên trang mang tính tổng hợp, tuyên truyền và tham khảo; khi cần áp dụng quy định cụ thể, nên đối chiếu văn bản hoặc thông báo chính thức.</small></div>`;
  $("#articleModal").classList.add("open");$("#articleModal").setAttribute("aria-hidden","false");document.body.style.overflow="hidden";
  if(push)history.pushState({},"",`?id=${encodeURIComponent(id)}`);
}
function closeArticle(push=true){$("#articleModal").classList.remove("open");$("#articleModal").setAttribute("aria-hidden","true");document.body.style.overflow="";if(push&&location.search)history.pushState({},"",location.pathname);}
boot().catch(err=>{document.body.innerHTML=`<div style="font-family:Arial;padding:30px"><h2>Không tải được dữ liệu bài viết</h2><p>${esc(String(err))}</p></div>`});
