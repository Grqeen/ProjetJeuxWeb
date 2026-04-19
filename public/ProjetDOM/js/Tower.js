class Tower {
  constructor(node, type) {
    this.node = node; this.type = type; node.hasTower = true;
    node.el.classList.add('tower-built', type); this.cooldown = 0;
  }
  update() {
    if (this.cooldown > 0) { this.cooldown--; return; }
    let target = enemies.reduce((closest, e) => {
      if (e.hp <= 0 || e.type === 'bonus') return closest;
      let normDx = (e.x - this.node.x) / cx;
      let normDy = (e.y - this.node.y) / cy;
      const d = Math.pow(normDx, 2) + Math.pow(normDy, 2);
      return d < closest.d ? { e, d } : closest;
    }, { e: null, d: 900000 });

    if (target.e) {
      let dmg = this.type === 'sniper' ? baseSniperDmg : baseTowerDmg;
      target.e.takeDamage(dmg, false);
      const l = document.createElement('div'); l.className = `auto-laser ${this.type}`;
      const dx = target.e.x - this.node.x; const dy = target.e.y - this.node.y;
      l.style.width = Math.sqrt(dx * dx + dy * dy) + 'px';
      l.style.left = this.node.x + 'px'; l.style.top = this.node.y + 'px';
      l.style.transform = `rotate(${Math.atan2(dy, dx) * 180 / Math.PI}deg)`;
      gameZone.appendChild(l); setTimeout(() => l.remove(), 50);
      this.cooldown = this.type === 'sniper' ? 120 : 40;
    }
  }
}
