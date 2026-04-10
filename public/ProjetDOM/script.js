// --- MOTEUR DE JEU ---
let dna = 0;
let gold = 50;
let hp = 100;
let shield = 50;
let maxShield = 50;
let frame = 0;

// NOUVEAU : SCORE SYSTEM
let score = 0;

let combo = 0;
let comboMult = 1;

let hasKinetic = false; 
let typingDamage = 20;  

let executionLevel = 0;
const executionPercentages = [1.0, 0.8, 0.6, 0.4, 0.2];

let dnaPerKeystroke = 1;
let targetSlowDown = 0.60;

let baseTowerDmg = 15;
let baseSniperDmg = 100;

let costs = { kinetic: 40, execution: 100, slow: 25, tower: 50, sniper: 150, towerDmg: 100, dnaMult: 15 };

let globalFreezeFrames = 0;

const words = ["BUG", "BOT", "LOG", "RAM", "ROM", "MAC", "SQL", "CODE", "DATA", "NODE", "PORT", "HTML", "FILE", "PROXY", "PING", "HACK", "WIFI", "DISK"];
const bossWords = ["OVERCLOCKING", "VULNERABILITE", "CRYPTOGRAPHIE", "AUTHENTIFICATION", "MICROPROCESSEUR"];
const bonusWords = ["HEAL", "FREEZE", "BOOST"];

const gameZone = document.getElementById('game-zone');
const hud = document.getElementById('typing-hud');
const hudTyped = document.getElementById('hud-typed');
const hudUntyped = document.getElementById('hud-untyped');
const targetingLaser = document.getElementById('targeting-laser');

const uiCombo = document.getElementById('ui-combo');
const uiMult = document.getElementById('ui-mult');
const uiScore = document.getElementById('ui-score');
const uiTime = document.getElementById('ui-time');

let cx = 0, cy = 0;
let enemies = [];
let currentTarget = null;
let towers = [];
let nodes = [];

function formatTime(frames) {
  let totalSeconds = Math.floor(frames / 60);
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function init() {
  const rect = gameZone.getBoundingClientRect();
  cx = rect.width / 2; cy = rect.height / 2;

  for (let i = 0; i < 6; i++) {
    const a = (i/6) * Math.PI * 2;
    const nx = cx + Math.cos(a) * 110;
    const ny = cy + Math.sin(a) * 110;
    const node = document.createElement('div');
    node.className = 'tower-node';
    node.style.left = nx + 'px'; node.style.top = ny + 'px';
    gameZone.appendChild(node);
    nodes.push({ x: nx, y: ny, el: node, hasTower: false });
  }

  window.addEventListener('resize', () => {
    const r = gameZone.getBoundingClientRect();
    cx = r.width / 2; cy = r.height / 2;
  });

  setupShop();
  updateUI();
  
  for(let i=0; i<4; i++) setTimeout(() => enemies.push(new Enemy('normal')), i * 500);
  requestAnimationFrame(loop);
}

class Enemy {
  constructor(type = 'normal') {
    const a = Math.random() * Math.PI * 2;
    const dist = Math.max(cx, cy) + 50 + (Math.random() * 80);
    this.x = cx + Math.cos(a) * dist;
    this.y = cy + Math.sin(a) * dist;

    const targetOffsetA = Math.random() * Math.PI * 2;
    this.targetX = cx + Math.cos(targetOffsetA) * 20;
    this.targetY = cy + Math.sin(targetOffsetA) * 20;

    this.type = type;
    this.isStunned = false;

    if (type === 'boss') {
        this.maxHp = 300 + (frame/10);
        this.baseSpeed = 0.2;
    } else if (type === 'bonus') {
        this.maxHp = 1;
        this.baseSpeed = 0.8;
    } else {
        this.maxHp = 50 + (frame/25);
        this.baseSpeed = 0.4 + Math.random() * 0.3;
    }

    this.hp = this.maxHp;
    
    this.el = document.createElement('div');
    this.el.className = `enemy ${type}`;
    this.miniWord = document.createElement('div');
    this.miniWord.className = 'enemy-word-mini';
    this.el.appendChild(this.miniWord);

    gameZone.appendChild(this.el);
    this.assignNewWord();
  }

  assignNewWord() {
    let dict = words;
    if (this.type === 'boss') dict = bossWords;
    if (this.type === 'bonus') dict = bonusWords;
    this.word = dict[Math.floor(Math.random() * dict.length)];
    this.typedIndex = 0;
    this.miniWord.innerText = this.word;
  }

  stunAndReload() {
    this.isStunned = true;
    this.miniWord.style.display = 'none';
    this.el.classList.add('stunned');
    spawnText(this.x, this.y, "PIRATÉ!", "txt-dmg txt-float");
    
    setTimeout(() => {
      if (this.hp > 0) {
        this.isStunned = false;
        this.el.classList.remove('stunned');
        this.assignNewWord();
        this.miniWord.style.display = 'block';
      }
    }, 1500);
  }

  move() {
    if (this.isStunned || globalFreezeFrames > 0) return;

    const dx = this.targetX - this.x; 
    const dy = this.targetY - this.y;
    const distToTarget = Math.sqrt(dx*dx + dy*dy);
    const trueDist = Math.sqrt(Math.pow(cx - this.x, 2) + Math.pow(cy - this.y, 2));

    if (trueDist < 50) {
      if (this.type === 'bonus') { this.destroy(); return; }

      let dmg = this.type === 'boss' ? 40 : 15;
      if (shield > 0) {
        shield -= dmg;
        if (shield < 0) { hp += shield; shield = 0; }
      } else hp -= dmg;

      gameZone.classList.add('screen-shake');
      setTimeout(() => gameZone.classList.remove('screen-shake'), 300);
      resetCombo();
      this.destroy();
      updateUI();
      return;
    }

    let currentSpeed = (currentTarget === this) ? this.baseSpeed * (1 - targetSlowDown) : this.baseSpeed;
    this.x += (dx/distToTarget) * currentSpeed;
    this.y += (dy/distToTarget) * currentSpeed;
    this.el.style.left = this.x + 'px';
    this.el.style.top = this.y + 'px';
  }

  takeDamage(amount, fromPlayer = false) {
    this.hp -= amount;
    this.el.classList.add('hit');
    setTimeout(() => this.el.classList.remove('hit'), 50);

    if (this.hp <= 0) {
      if (this.type === 'bonus') {
         triggerBonus(this.word, this.x, this.y);
      } else {
         let goldDrop = this.type === 'boss' ? 100 : 15;
         let points = this.type === 'boss' ? 500 : 50; // Points pour le Score !
         
         if(fromPlayer) {
            goldDrop = Math.floor(goldDrop * comboMult);
            points = Math.floor(points * comboMult);
         }
         
         gold += goldDrop;
         score += points;
         
         spawnText(this.x, this.y, `+${goldDrop}💰`, 'txt-gold txt-float');
      }
      this.destroy();
      updateUI();
    }
  }

  destroy() {
    this.el.remove();
    enemies = enemies.filter(e => e !== this);
    if (currentTarget === this) clearTarget();
  }
}

// --- LE MOTEUR DE FRAPPE ---
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (dna >= 50) { dna -= 50; triggerEMP(); updateUI(); }
    return;
  }
  
  if (e.code === 'Backspace' || e.code === 'Escape') {
    if (currentTarget) { currentTarget.typedIndex = 0; clearTarget(); updateHUD(); }
    return;
  }

  if (e.key.length > 1 || !e.key.match(/[a-z]/i)) return;
  const key = e.key.toUpperCase();

  if (!currentTarget) {
    let closestEnemy = null;
    let minDistance = Infinity;

    for (let i = 0; i < enemies.length; i++) {
      let en = enemies[i];
      if (en.hp > 0 && !en.isStunned && en.word[0] === key) {
        let dist = Math.pow(en.x - cx, 2) + Math.pow(en.y - cy, 2);
        if (dist < minDistance) { minDistance = dist; closestEnemy = en; }
      }
    }
    
    if (closestEnemy) {
      currentTarget = closestEnemy;
      currentTarget.el.classList.add('locked');
      currentTarget.miniWord.style.display = 'none';
      hud.classList.add('active');
      document.getElementById('targeting-laser').style.display = 'block';
    }
  }

  if (currentTarget) {
    const expected = currentTarget.word[currentTarget.typedIndex];
    
    if (key === expected) {
      currentTarget.typedIndex++;
      addCombo();

      // L'ADN et le SCORE augmentent à chaque lettre !
      let earnedDna = dnaPerKeystroke * comboMult;
      dna += earnedDna;
      score += (10 * comboMult); 
      
      spawnText(cx + (Math.random()*40-20), cy - 60, `+${earnedDna}🧬`, 'txt-dna txt-float');
      drawShot(currentTarget.x, currentTarget.y);
      
      if (hasKinetic) currentTarget.takeDamage(typingDamage, true);

      updateUI();
      updateHUD();

      let requiredLength = Math.ceil(currentTarget.word.length * executionPercentages[executionLevel]);

      if (currentTarget && currentTarget.typedIndex >= requiredLength) {
        if (currentTarget.type === 'boss') {
           currentTarget.takeDamage(150, true);
           if (currentTarget.hp > 0) currentTarget.stunAndReload();
        } else {
           currentTarget.takeDamage(99999, true); // true = tué par le joueur (donne combo or)
        }
        clearTarget();
      }
    } else {
      resetCombo();
      hud.classList.remove('error-shake');
      void hud.offsetWidth; 
      hud.classList.add('error-shake');
    }
  }
});

function addCombo() {
  combo++; uiCombo.innerText = combo; uiCombo.classList.remove('combo-break');
  let newMult = 1 + Math.floor(combo / 10);
  if (newMult !== comboMult) {
    comboMult = newMult; uiMult.innerText = `x${comboMult}`;
    uiCombo.style.transform = "scale(1.5)"; setTimeout(() => uiCombo.style.transform = "scale(1)", 200);
  }
}

function resetCombo() {
  if (combo > 0) {
    combo = 0; comboMult = 1; uiCombo.innerText = combo; uiMult.innerText = `x1`;
    uiCombo.classList.add('combo-break');
  }
}

function triggerEMP() {
  const emp = document.getElementById('emp-flash');
  emp.classList.remove('emp-active'); void emp.offsetWidth; emp.classList.add('emp-active');
  gameZone.classList.add('screen-shake'); setTimeout(() => gameZone.classList.remove('screen-shake'), 300);
  [...enemies].forEach(e => { e.hp -= 500; if(e.hp <= 0) e.destroy(); }); // Pas de récompense
}

function triggerBonus(type, x, y) {
  if (type === "HEAL") { shield = maxShield; hp = Math.min(hp + 20, 100); spawnText(x, y, "RÉGÉNÉRATION!", "txt-bonus txt-float"); } 
  else if (type === "FREEZE") { globalFreezeFrames = 180; gameZone.classList.add('frozen'); spawnText(x, y, "SYSTÈME GELÉ!", "txt-bonus txt-float"); }
  else if (type === "BOOST") { gold += 200; dna += 200; score += 1000; spawnText(x, y, "JACKPOT!", "txt-bonus txt-float"); }
}

function updateHUD() {
  if (!currentTarget) { hudTyped.innerText = ""; hudUntyped.innerText = ""; return; }
  hudTyped.innerText = currentTarget.word.substring(0, currentTarget.typedIndex);
  hudUntyped.innerText = currentTarget.word.substring(currentTarget.typedIndex);
  
  const dx = currentTarget.x - cx; const dy = currentTarget.y - cy;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const laser = document.getElementById('targeting-laser');
  laser.style.width = `${Math.sqrt(dx*dx + dy*dy)}px`;
  laser.style.left = `${cx}px`; laser.style.top = `${cy}px`;
  laser.style.transform = `rotate(${angle}deg)`;
}

function clearTarget() {
  if(currentTarget) { currentTarget.el.classList.remove('locked'); currentTarget.miniWord.style.display = 'block'; }
  currentTarget = null; hud.classList.remove('active'); document.getElementById('targeting-laser').style.display = 'none';
  updateHUD();
}

function drawShot(tx, ty) {
  const shot = document.createElement('div'); shot.className = 'type-shot';
  const dx = tx - cx; const dy = ty - cy;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  shot.style.width = Math.sqrt(dx*dx + dy*dy) + 'px';
  shot.style.left = cx + 'px'; shot.style.top = cy + 'px';
  shot.style.transform = `rotate(${angle}deg)`;
  gameZone.appendChild(shot); setTimeout(() => shot.remove(), 80);
}

function spawnText(x, y, text, cssClass) {
  const el = document.createElement('div'); el.className = cssClass; el.innerText = text;
  el.style.left = x + 'px'; el.style.top = y + 'px';
  gameZone.appendChild(el); setTimeout(() => el.remove(), 800);
}

class Tower {
  constructor(node, type) {
    this.node = node; this.type = type; node.hasTower = true;
    node.el.classList.add('tower-built', type); this.cooldown = 0;
  }
  update() {
    if(this.cooldown > 0) { this.cooldown--; return; }
    let target = enemies.reduce((closest, e) => {
      if (e.hp <= 0 || e.type === 'bonus') return closest; 
      const d = Math.pow(e.x - this.node.x, 2) + Math.pow(e.y - this.node.y, 2);
      return d < closest.d ? {e, d} : closest;
    }, {e: null, d: 900000});

    if(target.e) {
      let dmg = this.type === 'sniper' ? baseSniperDmg : baseTowerDmg;
      target.e.takeDamage(dmg, false); // false = tower ne gagne pas de combo bonus
      const l = document.createElement('div'); l.className = `auto-laser ${this.type}`;
      const dx = target.e.x - this.node.x; const dy = target.e.y - this.node.y;
      l.style.width = Math.sqrt(dx*dx + dy*dy) + 'px';
      l.style.left = this.node.x + 'px'; l.style.top = this.node.y + 'px';
      l.style.transform = `rotate(${Math.atan2(dy, dx) * 180 / Math.PI}deg)`;
      gameZone.appendChild(l); setTimeout(() => l.remove(), 50);
      this.cooldown = this.type === 'sniper' ? 120 : 40; 
    }
  }
}

function setupShop() {
  document.getElementById('btn-execution').onclick = () => {
    if(dna >= costs.execution && executionLevel < 4) { 
      dna -= costs.execution; executionLevel++; costs.execution = Math.floor(costs.execution * 2.5); updateUI(); 
    }
  };
  document.getElementById('btn-kinetic').onclick = () => {
    if (!hasKinetic && dna >= costs.kinetic) { 
      dna -= costs.kinetic; hasKinetic = true; 
      document.getElementById('title-kinetic').innerText = "Calibre Clavier";
      document.getElementById('title-kinetic').style.color = "white";
      document.getElementById('desc-kinetic').innerHTML = `Dégâts / Lettre : <span id="val-type-dmg">${typingDamage}</span>`;
      costs.kinetic = 40; updateUI(); 
    } else if (hasKinetic && dna >= costs.kinetic) {
      dna -= costs.kinetic; typingDamage += 10; costs.kinetic = Math.floor(costs.kinetic * 1.5); updateUI();
    }
  };
  document.getElementById('btn-dna-mult').onclick = () => { if(dna >= costs.dnaMult) { dna -= costs.dnaMult; dnaPerKeystroke++; costs.dnaMult = Math.floor(costs.dnaMult * 1.5); updateUI(); } };
  document.getElementById('btn-slow').onclick = () => { if(dna >= costs.slow && targetSlowDown < 0.95) { dna -= costs.slow; targetSlowDown += 0.10; costs.slow = Math.floor(costs.slow * 1.6); updateUI(); } };
  document.getElementById('btn-tower').onclick = () => { if(gold >= costs.tower) { const empty = nodes.find(n => !n.hasTower); if(empty) { gold -= costs.tower; towers.push(new Tower(empty, 'basic')); costs.tower = Math.floor(costs.tower * 1.5); updateUI(); } } };
  document.getElementById('btn-sniper').onclick = () => { if(gold >= costs.sniper) { const empty = nodes.find(n => !n.hasTower); if(empty) { gold -= costs.sniper; towers.push(new Tower(empty, 'sniper')); costs.sniper = Math.floor(costs.sniper * 1.5); updateUI(); } } };
  document.getElementById('btn-tower-dmg').onclick = () => { if(gold >= costs.towerDmg) { gold -= costs.towerDmg; baseTowerDmg += 10; baseSniperDmg += 30; costs.towerDmg = Math.floor(costs.towerDmg * 1.6); updateUI(); } };
}

function updateUI() {
  document.getElementById('ui-dna').innerText = Math.floor(dna);
  document.getElementById('ui-gold').innerText = Math.floor(gold);
  document.getElementById('ui-hp').innerText = Math.floor(hp);
  document.getElementById('ui-shield').innerText = `🛡️ ${Math.floor(shield)}`;
  
  // Update HUD Stats
  uiScore.innerText = score;
  uiTime.innerText = formatTime(frame);

  const btnExec = document.getElementById('btn-execution');
  if (executionLevel >= 4) {
    document.getElementById('val-execution').innerText = "20% (MAX)";
    document.getElementById('cost-execution').innerText = "MAX";
    btnExec.disabled = true; btnExec.style.borderColor = "#ff5252";
  } else {
    let nextPct = Math.round(executionPercentages[executionLevel + 1] * 100);
    document.getElementById('val-execution').innerText = nextPct + "%";
    document.getElementById('cost-execution').innerText = costs.execution + " 🧬";
    btnExec.disabled = dna < costs.execution;
  }

  if (hasKinetic) document.getElementById('val-type-dmg').innerText = typingDamage;
  document.getElementById('cost-kinetic').innerText = costs.kinetic + " 🧬";
  document.getElementById('btn-kinetic').disabled = dna < costs.kinetic;
  document.getElementById('val-dna-mult').innerText = dnaPerKeystroke;
  document.getElementById('cost-dna-mult').innerText = costs.dnaMult + " 🧬";
  document.getElementById('btn-dna-mult').disabled = dna < costs.dnaMult;
  document.getElementById('val-slow').innerText = Math.floor(targetSlowDown * 100);
  document.getElementById('cost-slow').innerText = targetSlowDown >= 0.95 ? "MAX" : costs.slow + " 🧬";
  document.getElementById('btn-slow').disabled = dna < costs.slow || targetSlowDown >= 0.95;

  const empty = nodes.find(n => !n.hasTower);
  document.getElementById('val-tower-dmg').innerText = baseTowerDmg;
  document.getElementById('cost-tower-dmg').innerText = costs.towerDmg + " 💰";
  document.getElementById('btn-tower-dmg').disabled = gold < costs.towerDmg;
  document.getElementById('cost-tower').innerText = empty ? costs.tower + " 💰" : "MAX";
  document.getElementById('btn-tower').disabled = gold < costs.tower || !empty;
  document.getElementById('cost-sniper').innerText = empty ? costs.sniper + " 💰" : "MAX";
  document.getElementById('btn-sniper').disabled = gold < costs.sniper || !empty;
}

function loop() {
  frame++;
  
  if (globalFreezeFrames > 0) {
    globalFreezeFrames--;
    if (globalFreezeFrames === 0) gameZone.classList.remove('frozen');
  }

  if (frame % 60 === 0) {
    if(shield < maxShield) shield += 1; 
    updateUI(); // Met à jour le chronomètre chaque seconde
  }

  let spawnInterval = Math.max(40, 120 - Math.floor(frame / 30)); 
  if (frame % spawnInterval === 0) enemies.push(new Enemy('normal'));
  if (frame > 300 && frame % 900 === 0) enemies.push(new Enemy('boss'));
  if (frame > 600 && frame % 1200 === 0) enemies.push(new Enemy('bonus'));

  enemies.forEach(e => e.move());
  towers.forEach(t => t.update());
  
  if (currentTarget) updateHUD();

  // GAME OVER
  if (hp <= 0) {
    document.getElementById('go-time').innerText = formatTime(frame);
    document.getElementById('go-score').innerText = score;
    document.getElementById('game-over').style.display = 'flex';
    return; // Stoppe la boucle !
  }

  requestAnimationFrame(loop);
}

init();