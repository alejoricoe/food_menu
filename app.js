const dishes = [
  {
    id:'burger', name:'Classic Burger', emoji:'🍔', price:14.90,
    model:'assets/models/classic_burger.glb',
    meta:'Beef · cheddar · tomato · lettuce',
    description:'A stacked classic with a grilled beef patty, cheddar, tomato and crisp lettuce. The AR model is sized to approximate a real plated serving.',
    ingredients:['Beef patty','Brioche bun','Cheddar','Tomato','Lettuce'],
    options:[
      {id:'bacon', label:'Add bacon', delta:1.50},
      {id:'extra', label:'Extra patty', delta:3.50},
      {id:'no-onion', label:'No onion', delta:0},
    ]
  },
  {
    id:'pasta', name:'Truffle Pasta', emoji:'🍝', price:16.50,
    model:'assets/models/truffle_pasta.glb',
    meta:'Fresh pasta · parmesan · herbs',
    description:'Fresh pasta with parmesan, herbs and a truffle-style finish. Use AR to compare the approximate plate size with other dishes.',
    ingredients:['Fresh pasta','Parmesan','Herbs','Truffle sauce'],
    options:[
      {id:'parmesan', label:'Extra parmesan', delta:1.20},
      {id:'chicken', label:'Add chicken', delta:3.20},
      {id:'no-herbs', label:'No herbs', delta:0},
    ]
  },
  {
    id:'salmon', name:'Grilled Salmon', emoji:'🐟', price:19.90,
    model:'assets/models/grilled_salmon.glb',
    meta:'Salmon · asparagus · lemon',
    description:'Grilled salmon served with asparagus and lemon. The model demonstrates a second plate shape and portion profile for the MVP.',
    ingredients:['Salmon','Asparagus','Lemon'],
    options:[
      {id:'veg', label:'Extra vegetables', delta:2.00},
      {id:'sauce', label:'Lemon sauce', delta:1.00},
      {id:'no-lemon', label:'No lemon', delta:0},
    ]
  }
];

const $ = s => document.querySelector(s);
const viewer = $('#viewer');
const carousel = $('#carousel');
const cart = [];
let selected = 0;
let currentOptions = new Set();
let cameraStream = null;

const params = new URLSearchParams(location.search);
const table = params.get('table') || '14';
$('#tableNumber').textContent = table; $('#cartTable').textContent = table;

function euro(n){ return new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR'}).format(n); }
function toast(message){ const t=$('#toast'); t.textContent=message; t.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>t.classList.remove('show'),1800); }

function renderCarousel(){
  carousel.innerHTML = dishes.map((d,i)=>`<button class="dish-card ${i===selected?'active':''}" data-index="${i}"><span class="emoji">${d.emoji}</span><span class="name">${d.name}</span><span class="price">${euro(d.price)}</span></button>`).join('');
  carousel.querySelectorAll('.dish-card').forEach(btn=>btn.addEventListener('click',()=>selectDish(Number(btn.dataset.index))));
}

function selectDish(i){
  selected=i; currentOptions.clear(); const d=dishes[i];
  viewer.src=d.model; $('#dishName').textContent=d.name; $('#dishMeta').textContent=d.meta; $('#dishPrice').textContent=euro(d.price);
  renderCarousel();
  requestAnimationFrame(()=>carousel.querySelector('.active')?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'}));
  toast(`${d.name} selected`);
}

async function enableCamera(){
  try{
    cameraStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
    const v=$('#camera'); v.srcObject=cameraStream; await v.play(); v.classList.add('active'); $('#cameraPlaceholder').classList.add('hidden');
    toast('Camera preview enabled');
  }catch(err){
    console.error(err); toast('Camera permission was not granted');
  }
}

function openSheet(id){
  document.querySelectorAll('.sheet').forEach(s=>s.classList.remove('open'));
  $(id).classList.add('open'); $(id).setAttribute('aria-hidden','false'); $('#backdrop').classList.add('show');
}
function closeSheets(){ document.querySelectorAll('.sheet').forEach(s=>{s.classList.remove('open');s.setAttribute('aria-hidden','true')}); $('#backdrop').classList.remove('show'); }

function openDetails(){
  const d=dishes[selected]; $('#detailName').textContent=d.name; $('#detailDescription').textContent=d.description;
  $('#ingredientChips').innerHTML=d.ingredients.map(x=>`<span class="chip">${x}</span>`).join(''); openSheet('#detailsSheet');
}
function openCustomize(){
  const d=dishes[selected]; currentOptions.clear(); $('#customName').textContent=d.name;
  $('#optionsList').innerHTML=d.options.map(o=>`<label class="option-row"><span><strong>${o.label}</strong><small>${o.delta?` + ${euro(o.delta)}`:' Included'}</small></span><input type="checkbox" value="${o.id}" /></label>`).join('');
  $('#optionsList').querySelectorAll('input').forEach(i=>i.addEventListener('change',()=>{ i.checked?currentOptions.add(i.value):currentOptions.delete(i.value); updateCustomTotal(); }));
  updateCustomTotal(); openSheet('#customizeSheet');
}
function selectedTotal(){ const d=dishes[selected]; return d.price + d.options.filter(o=>currentOptions.has(o.id)).reduce((a,o)=>a+o.delta,0); }
function updateCustomTotal(){ $('#customTotal').textContent=euro(selectedTotal()); }

function addToCart(withOptions=false){
  const d=dishes[selected]; const optionIds=withOptions?[...currentOptions]:[]; const opts=d.options.filter(o=>optionIds.includes(o.id));
  cart.push({dishId:d.id,name:d.name,price:d.price,options:opts,total:d.price+opts.reduce((a,o)=>a+o.delta,0)}); updateCart(); closeSheets(); toast(`${d.name} added to order`);
}
function updateCart(){
  $('#cartCount').textContent=cart.length; const total=cart.reduce((a,x)=>a+x.total,0); $('#cartTotal').textContent=euro(total);
  $('#cartItems').innerHTML=cart.length?cart.map((x,i)=>`<div class="cart-item"><div><strong>${x.name}</strong><small>${x.options.length?x.options.map(o=>o.label).join(' · '):'Standard'}</small></div><strong>${euro(x.total)}</strong></div>`).join(''):`<p class="description">Your order is empty. Add a dish from the AR menu.</p>`;
}

$('#cameraBtn').addEventListener('click',enableCamera);
$('#detailsBtn').addEventListener('click',openDetails);
$('#customizeBtn').addEventListener('click',openCustomize);
$('#addBtn').addEventListener('click',()=>addToCart(false));
$('#customAddBtn').addEventListener('click',()=>addToCart(true));
$('#cartBtn').addEventListener('click',()=>{updateCart();openSheet('#cartSheet')});
$('#backdrop').addEventListener('click',closeSheets);
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',closeSheets));
$('#arBtn').addEventListener('click',()=>{
  // Delegate to model-viewer so it chooses WebXR / Scene Viewer / Quick Look for the current device.
  const nativeBtn=$('#nativeArButton');
  if(nativeBtn) nativeBtn.click();
  else toast('AR is not available on this device');
});
viewer.addEventListener('ar-status',e=>{ if(e.detail.status==='failed') toast('AR could not start on this device'); });

// Swipe anywhere over the model to change dishes with a deliberate horizontal gesture.
let sx=0, sy=0;
viewer.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY});
viewer.addEventListener('pointerup',e=>{ const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)>80&&Math.abs(dx)>Math.abs(dy)*1.4){selectDish((selected+(dx<0?1:-1)+dishes.length)%dishes.length)}});

renderCarousel(); selectDish(0); updateCart();
window.addEventListener('beforeunload',()=>cameraStream?.getTracks().forEach(t=>t.stop()));
