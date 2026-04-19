class Enemy {
  constructor(type = 'normal') {
    if (Math.random() > 0.5) {
      this.x = cx + (Math.random() * 2 - 1) * cx;
      this.y = Math.random() > 0.5 ? -60 : (cy * 2) + 60;
    } else {
      this.x = Math.random() > 0.5 ? -60 : (cx * 2) + 60;
      this.y = cy + (Math.random() * 2 - 1) * cy;
    }

    const targetOffsetA = Math.random() * Math.PI * 2;
    this.targetOffsetX = Math.cos(targetOffsetA) * 15;
    this.targetOffsetY = Math.sin(targetOffsetA) * 15;

    this.type = type;
    this.isStunned = false;

    let minutesSurvived = frame / 3600;
    let difficultyMultiplier = 1 + Math.pow(minutesSurvived, 1.4);

    if (type === 'boss') {
      this.maxHp = Math.floor((300 + (frame / 10)) * difficultyMultiplier);
      this.baseSpeed = 0.30 * (1 + minutesSurvived * 0.15);
    } else if (type === 'bonus') {
      this.maxHp = 1;
      this.baseSpeed = 0.9;
    } else {
      this.maxHp = Math.floor((40 + (frame / 30)) * difficultyMultiplier);
      this.baseSpeed = (0.6 + Math.random() * 0.3) * (1 + minutesSurvived * 0.2);
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
    const curX = cx + this.targetOffsetX;
    const curY = cy + this.targetOffsetY;
    const dx = curX - this.x;
    const dy = curY - this.y;
    const distToTarget = Math.sqrt(dx * dx + dy * dy);
    const trueDist = Math.sqrt(Math.pow(cx - this.x, 2) + Math.pow(cy - this.y, 2));

    if (trueDist < 50) {
      if (this.type === 'bonus') { this.destroy(); return; }
      let dmg = this.type === 'boss' ? 50 : 20;
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
    this.x += (dx / distToTarget) * currentSpeed;
    this.y += (dy / distToTarget) * currentSpeed;
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
        let points = this.type === 'boss' ? 500 : 50;
        if (fromPlayer) {
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
