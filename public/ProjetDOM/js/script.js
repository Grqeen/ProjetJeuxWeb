// --- MOTEUR DE JEU ---
let dna = 0;
let gold = 50;
let hp = 100;
let shield = 0;
let maxShield = 0;
let frame = 0;

const targetFPS = 60;
const frameInterval = 1000 / targetFPS;
let lastRenderTime;

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

let costs = { kinetic: 40, execution: 100, slow: 25, tower: 50, sniper: 150, towerDmg: 100, dnaMult: 15, shield: 75 };

let globalFreezeFrames = 0;
let isGameOver = false;

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

document.addEventListener('DOMContentLoaded', () => {
  const authStatusMenu = document.getElementById("authStatusMenu");
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  if (authStatusMenu) {
    if (token && username) {
      authStatusMenu.innerHTML = `Connecté en tant que <span>${username}</span> <br><br><a href="#" id="menuLogoutBtn">Déconnexion</a>`;
      document.getElementById('menuLogoutBtn').onclick = (e) => {
        e.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        window.location.reload();
      };
    } else {
      authStatusMenu.innerHTML = `<a href="../login.html?redirect=/ProjetDOM/index.html">Se connecter</a>`;
    }
  }

  const pendingPoints = localStorage.getItem("pendingPoints");
  const pendingTime = localStorage.getItem("pendingTime");
  const pendingSeconds = localStorage.getItem("pendingSeconds");

  if (pendingPoints && token) {
    document.getElementById('start-menu').style.display = 'none';
    document.getElementById('game-over').style.display = 'flex';
    document.getElementById('go-time').innerText = pendingTime;
    document.getElementById('go-score').innerText = pendingPoints;

    const saveContainer = document.getElementById('save-status-container');
    saveContainer.innerHTML = "Sauvegarde en cours...";

    fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        gameId: 'defense',
        score: parseInt(pendingPoints),
        time: pendingTime,
        survivalSeconds: parseFloat(pendingSeconds)
      })
    })
      .then(res => {
        saveContainer.innerHTML = res.ok ? '<span class="save-success">Score sauvegardé sur le site !</span>' : '<span class="save-error">Erreur lors de la sauvegarde.</span>';
        localStorage.removeItem("pendingPoints");
        localStorage.removeItem("pendingTime");
        localStorage.removeItem("pendingSeconds");
      });
  } else {
    document.getElementById('btn-start').addEventListener('click', () => {
      document.getElementById('start-menu').style.display = 'none';
      isGameOver = false;
      lastRenderTime = Date.now();
      init();
    });
  }
});

function formatTime() {
  let totalSeconds = Math.floor(frame / 60);
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function init() {
  const rect = gameZone.getBoundingClientRect();
  cx = rect.width / 2; cy = rect.height / 2;

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const nx = cx + Math.cos(a) * 90;
    const ny = cy + Math.sin(a) * 90;
    const node = document.createElement('div');
    node.className = 'tower-node';
    node.style.left = nx + 'px'; node.style.top = ny + 'px';
    gameZone.appendChild(node);
    nodes.push({ x: nx, y: ny, el: node, hasTower: false });
  }

  window.addEventListener('resize', () => {
    const r = gameZone.getBoundingClientRect();
    cx = r.width / 2; cy = r.height / 2;
    nodes.forEach((node, i) => {
      const a = (i / 6) * Math.PI * 2;
      node.x = cx + Math.cos(a) * 90;
      node.y = cy + Math.sin(a) * 90;
      node.el.style.left = node.x + 'px';
      node.el.style.top = node.y + 'px';
    });
  });

  setupShop();
  updateUI();

  setTimeout(() => enemies.push(new Enemy('normal')), 400);
  setTimeout(() => enemies.push(new Enemy('normal')), 1000);
  setTimeout(() => enemies.push(new Enemy('normal')), 1600);

  requestAnimationFrame(loop);
}



window.addEventListener('keydown', (e) => {
  if (isGameOver) return;
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
    for (let en of enemies) {
      if (en.hp > 0 && !en.isStunned && en.word[0] === key) {
        let normDx = (en.x - cx) / cx;
        let normDy = (en.y - cy) / cy;
        let dist = Math.pow(normDx, 2) + Math.pow(normDy, 2);
        if (dist < minDistance) { minDistance = dist; closestEnemy = en; }
      }
    }
    if (closestEnemy) {
      currentTarget = closestEnemy;
      currentTarget.el.classList.add('locked');
      currentTarget.miniWord.style.display = 'none';
      hud.classList.add('active');
      targetingLaser.style.display = 'block';
    }
  }
  if (currentTarget) {
    const expected = currentTarget.word[currentTarget.typedIndex];
    if (key === expected) {
      currentTarget.typedIndex++;
      addCombo();
      let earnedDna = dnaPerKeystroke * comboMult;
      dna += earnedDna;
      score += (10 * comboMult);
      spawnText(cx + (Math.random() * 40 - 20), cy - 60, `+${earnedDna}🧬`, 'txt-dna txt-float');
      drawShot(currentTarget.x, currentTarget.y);
      if (hasKinetic) currentTarget.takeDamage(typingDamage, true);
      updateUI();
      updateHUD();
      let reqLen = Math.ceil(currentTarget.word.length * executionPercentages[executionLevel]);
      if (currentTarget && currentTarget.typedIndex >= reqLen) {
        if (currentTarget.type === 'boss') {
          currentTarget.takeDamage(150, true);
          if (currentTarget.hp > 0) currentTarget.stunAndReload();
        } else { currentTarget.takeDamage(99999, true); }
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
    uiCombo.style.transform = "scale(1.3)"; setTimeout(() => uiCombo.style.transform = "scale(1)", 150);
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
  [...enemies].forEach(e => { e.hp -= 500; if (e.hp <= 0) e.destroy(); });
}

function triggerBonus(type, x, y) {
  if (type === "HEAL") { if (maxShield > 0) shield = maxShield; hp = Math.min(hp + 20, 100); spawnText(x, y, "RÉGÉNÉRATION!", "txt-bonus txt-float"); }
  else if (type === "FREEZE") { globalFreezeFrames = 180; gameZone.classList.add('frozen'); spawnText(x, y, "SYSTÈME GELÉ!", "txt-bonus txt-float"); }
  else if (type === "BOOST") { gold += 200; dna += 200; score += 1000; spawnText(x, y, "JACKPOT!", "txt-bonus txt-float"); }
}

function updateHUD() {
  if (!currentTarget) { hudTyped.innerText = ""; hudUntyped.innerText = ""; return; }
  hudTyped.innerText = currentTarget.word.substring(0, currentTarget.typedIndex);
  hudUntyped.innerText = currentTarget.word.substring(currentTarget.typedIndex);
  const dx = currentTarget.x - cx; const dy = currentTarget.y - cy;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  targetingLaser.style.width = `${Math.sqrt(dx * dx + dy * dy)}px`;
  targetingLaser.style.left = `${cx + 5}px`; targetingLaser.style.top = `${cy - 2}px`;
  targetingLaser.style.transform = `rotate(${angle}deg)`;
}

function clearTarget() {
  if (currentTarget) { currentTarget.el.classList.remove('locked'); currentTarget.miniWord.style.display = 'block'; }
  currentTarget = null; hud.classList.remove('active'); targetingLaser.style.display = 'none';
  updateHUD();
}

function drawShot(tx, ty) {
  const shot = document.createElement('div'); shot.className = 'type-shot';
  const dx = tx - cx; const dy = ty - cy;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  shot.style.width = Math.sqrt(dx * dx + dy * dy) + 'px';
  shot.style.left = cx + 'px'; shot.style.top = cy + 'px';
  shot.style.transform = `rotate(${angle}deg)`;
  gameZone.appendChild(shot); setTimeout(() => shot.remove(), 80);
}

function spawnText(x, y, text, cssClass) {
  const el = document.createElement('div'); el.className = cssClass; el.innerText = text;
  el.style.left = x + 'px'; el.style.top = y + 'px';
  gameZone.appendChild(el); setTimeout(() => el.remove(), 800);
}



function setupShop() {
  document.getElementById('btn-execution').onclick = () => { if (dna >= costs.execution && executionLevel < 4) { dna -= costs.execution; executionLevel++; costs.execution = Math.floor(costs.execution * 2.5); updateUI(); } };
  document.getElementById('btn-kinetic').onclick = () => {
    if (!hasKinetic && dna >= costs.kinetic) {
      dna -= costs.kinetic; hasKinetic = true; document.getElementById('title-kinetic').innerText = "Calibre Clavier"; costs.kinetic = 40; updateUI();
    } else if (hasKinetic && dna >= costs.kinetic) { dna -= costs.kinetic; typingDamage += 10; costs.kinetic = Math.floor(costs.kinetic * 1.5); updateUI(); }
  };
  document.getElementById('btn-dna-mult').onclick = () => { if (dna >= costs.dnaMult) { dna -= costs.dnaMult; dnaPerKeystroke++; costs.dnaMult = Math.floor(costs.dnaMult * 1.5); updateUI(); } };
  document.getElementById('btn-slow').onclick = () => { if (dna >= costs.slow && targetSlowDown < 0.95) { dna -= costs.slow; targetSlowDown += 0.10; costs.slow = Math.floor(costs.slow * 1.6); updateUI(); } };
  document.getElementById('btn-shield').onclick = () => { if (gold >= costs.shield) { gold -= costs.shield; maxShield += 50; shield += 50; costs.shield = Math.floor(costs.shield * 1.5); updateUI(); } };
  document.getElementById('btn-tower').onclick = () => { if (gold >= costs.tower) { const empty = nodes.find(n => !n.hasTower); if (empty) { gold -= costs.tower; towers.push(new Tower(empty, 'basic')); costs.tower = Math.floor(costs.tower * 1.8); updateUI(); } } };
  document.getElementById('btn-sniper').onclick = () => { if (gold >= costs.sniper) { const empty = nodes.find(n => !n.hasTower); if (empty) { gold -= costs.sniper; towers.push(new Tower(empty, 'sniper')); costs.sniper = Math.floor(costs.sniper * 1.8); updateUI(); } } };
  document.getElementById('btn-tower-dmg').onclick = () => { if (gold >= costs.towerDmg) { gold -= costs.towerDmg; baseTowerDmg += 10; baseSniperDmg += 30; costs.towerDmg = Math.floor(costs.towerDmg * 1.6); updateUI(); } };
}

function updateUI() {
  document.getElementById('ui-dna').innerText = Math.floor(dna);
  document.getElementById('ui-gold').innerText = Math.floor(gold);
  document.getElementById('ui-hp').innerText = Math.floor(hp);
  document.getElementById('ui-shield').innerText = `🛡️ ${Math.floor(shield)}`;
  uiScore.innerText = score;
  uiTime.innerText = formatTime();
  const btnExec = document.getElementById('btn-execution');
  if (executionLevel >= 4) { document.getElementById('val-execution').innerText = "20% (MAX)"; document.getElementById('cost-execution').innerText = "MAX"; btnExec.disabled = true; }
  else { document.getElementById('val-execution').innerText = Math.round(executionPercentages[executionLevel + 1] * 100) + "%"; document.getElementById('cost-execution').innerText = costs.execution + " 🧬"; btnExec.disabled = dna < costs.execution; }
  document.getElementById('cost-kinetic').innerText = costs.kinetic + " 🧬";
  document.getElementById('btn-kinetic').disabled = dna < costs.kinetic;
  document.getElementById('val-dna-mult').innerText = dnaPerKeystroke;
  document.getElementById('cost-dna-mult').innerText = costs.dnaMult + " 🧬";
  document.getElementById('btn-dna-mult').disabled = dna < costs.dnaMult;
  document.getElementById('val-slow').innerText = Math.floor(targetSlowDown * 100);
  document.getElementById('cost-slow').innerText = targetSlowDown >= 0.95 ? "MAX" : costs.slow + " 🧬";
  document.getElementById('btn-slow').disabled = dna < costs.slow || targetSlowDown >= 0.95;
  document.getElementById('cost-shield').innerText = costs.shield + " 💰";
  document.getElementById('btn-shield').disabled = gold < costs.shield;
  const empty = nodes.find(n => !n.hasTower);
  document.getElementById('cost-tower').innerText = empty ? costs.tower + " 💰" : "MAX";
  document.getElementById('btn-tower').disabled = gold < costs.tower || !empty;
  document.getElementById('cost-sniper').innerText = empty ? costs.sniper + " 💰" : "MAX";
  document.getElementById('btn-sniper').disabled = gold < costs.sniper || !empty;
  document.getElementById('cost-tower-dmg').innerText = costs.towerDmg + " 💰";
  document.getElementById('btn-tower-dmg').disabled = gold < costs.towerDmg;
}

function loop() {
  if (isGameOver) return;
  requestAnimationFrame(loop);
  let currentTime = Date.now();
  let elapsedTime = currentTime - lastRenderTime;
  if (elapsedTime < frameInterval) return;
  lastRenderTime = currentTime - (elapsedTime % frameInterval);
  frame++;
  if (globalFreezeFrames > 0) { globalFreezeFrames--; if (globalFreezeFrames === 0) gameZone.classList.remove('frozen'); }
  if (frame % 60 === 0) { if (maxShield > 0 && shield < maxShield) shield += 1; updateUI(); }
  let spawnInterval = Math.max(15, 60 - Math.floor(frame / 30));
  if (frame % spawnInterval === 0) enemies.push(new Enemy('normal'));
  if (frame > 300 && frame % 900 === 0) enemies.push(new Enemy('boss'));
  if (frame > 600 && frame % 1200 === 0) enemies.push(new Enemy('bonus'));
  enemies.forEach(e => e.move());
  towers.forEach(t => t.update());
  if (currentTarget) updateHUD();

  if (hp <= 0) {
    isGameOver = true;
    const finalTime = formatTime();
    const totalSec = Math.floor(frame / 60) + (score / 1000000);
    document.getElementById('go-time').innerText = finalTime;
    document.getElementById('go-score').innerText = score;
    const token = localStorage.getItem("token");
    const saveContainer = document.getElementById('save-status-container');
    const data = { gameId: 'defense', score: score, time: finalTime, survivalSeconds: totalSec };
    if (token) {
      saveContainer.innerHTML = "Sauvegarde...";
      fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      }).then(res => saveContainer.innerHTML = res.ok ? '<span class="save-success">Score sauvegardé !</span>' : 'Erreur.');
    } else {
      saveContainer.innerHTML = `<a href="../login.html?redirect=/ProjetDOM/index.html" id="btn-login-save">Se connecter pour sauvegarder</a>`;
      document.getElementById('btn-login-save').onclick = () => {
        localStorage.setItem("pendingPoints", score);
        localStorage.setItem("pendingTime", finalTime);
        localStorage.setItem("pendingSeconds", totalSec);
      };
    }
    document.getElementById('game-over').style.display = 'flex';
  }
}