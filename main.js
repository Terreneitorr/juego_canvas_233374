const canvas = document.getElementById("miCanvas");
const ctx = canvas.getContext("2d");
const SPRITE_EXT = ".png";
const playerSprites = [];
let playerSpritesLoaded = 0;
const PLAYER_TOTAL_SPRITES = 9;

const game = {
    level: 1,
    inProgress: true,
    initialBossHp: 30, 
    transitioning: false
};
const supplies = [];
let teclaDisparoPresionada = false;

const particles = [];
const stars = [];

function initStars() {
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2.5,
            speed: Math.random() * 0.8 + 0.3,
            opacity: Math.random() * 0.7 + 0.3
        });
    }
}

function updateStars() {
    for (const star of stars) {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    }
}

function drawStars() {
    for (const star of stars) {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    }
}

function createExplosion(x, y, count = 20, color = '#FF6B00') {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * (Math.random() * 3 + 2),
            vy: Math.sin(angle) * (Math.random() * 3 + 2),
            life: 60,
            maxLife: 60,
            size: Math.random() * 4 + 2,
            color: color
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.save();
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

for (let i = 1; i <= PLAYER_TOTAL_SPRITES; i++) {
    const img = new Image();
    img.src = `./assets/spaceship/${i}${SPRITE_EXT}`;
    img.onload = () => {
        playerSpritesLoaded++;
        startIfReady();
    };
    playerSprites.push(img);
}

const bossSheet = new Image();
bossSheet.src = "./assets/spaceship/boss/boss.png";
let bossLoaded = false;
bossSheet.onload = () => {
    bossLoaded = true;
    boss.frameHeight = bossSheet.height;
    boss.totalFrames = 21;
    boss.frameWidth = Math.floor(bossSheet.width / boss.totalFrames);
    boss.maxHp = game.initialBossHp;
    boss.initialSpeed = boss.speed;
    startIfReady();
};

const Jugador = {
    x: canvas.width / 2 - 35,
    y: canvas.height - 140,
    ancho: 70,
    alto: 70,
    spriteIndex: 1,
    vidas: 5,
    invulnerable: false,
    invulTimer: 0,
    playerPower: 1,
    cadenciaActual: 150,
    escudo: false,
    escudoReflector: false,
    escudoDoble: false, 
    laser: false,
    laserTriple: false, 
    ondaEnergia: false, 
    dispersor: false, 
    homingMissiles: false, 
    trail: []
};

const boss = {
    x: canvas.width / 2 - 75,
    y: 20,
    ancho: 150,
    alto: 150,
    sprite: bossSheet,
    totalFrames: 0,
    frame: 0,
    frameWidth: 0,
    frameHeight: 0,
    frameCounter: 0,
    frameSpeed: 5,
    dir: 1,
    speed: 1.2,
    hp: 0,
    alive: false,
    maxHp: 40,
    initialSpeed: 1.2,
    fireRate: 0.02,
    lifeThresholds: [0.75, 0.50, 0.25],
    lifeGiven: [false, false, false],
    shake: 0,
    attackPattern: 0, 
    attackTimer: 0
};

const balasJugador = [];
const balasBoss = [];
const teclas = { Arriba: false, Abajo: false, Izquierda: false, Derecha: false };
let tiempoUltimoDisparo = 0;

window.addEventListener('keydown', (e) => {
    if (e.code === "Space") {
        e.preventDefault();
        teclaDisparoPresionada = true;
        if (!game.inProgress && Jugador.vidas <= 0) {
            reiniciarJuego();
        }
    } else {
        setKey(e.key, true);
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === "Space") {
        teclaDisparoPresionada = false;
    } else {
        setKey(e.key, false);
    }
});

canvas.addEventListener('click', (e) => {
    if (!game.inProgress && Jugador.vidas <= 0) {
        reiniciarJuego();
    }
});

function setKey(key, state) {
    switch (key) {
        case 'ArrowUp': case 'w': case 'W': teclas.Arriba = state; break;
        case 'ArrowDown': case 's': case 'S': teclas.Abajo = state; break;
        case 'ArrowLeft': case 'a': case 'A': teclas.Izquierda = state; break;
        case 'ArrowRight': case 'd': case 'D': teclas.Derecha = state; break;
    }
    actualizarSpriteJugador();
}

function actualizarSpriteJugador() {
    let base = 0;
    if (teclas.Arriba) base = 3;
    else if (teclas.Abajo) base = 6;
    else base = 0;

    if (teclas.Izquierda) Jugador.spriteIndex = base + 0;
    else if (teclas.Derecha) Jugador.spriteIndex = base + 2;
    else Jugador.spriteIndex = base + 1;
}

function powerUp() {
    Jugador.playerPower++;
    createExplosion(Jugador.x + Jugador.ancho / 2, Jugador.y + Jugador.alto / 2, 15, '#FFFF00');
    
    switch (Jugador.playerPower) {
        case 2:
            Jugador.cadenciaActual = 120;
            break;
        case 3:
            Jugador.cadenciaActual = 100;
            break;
        case 4:
            Jugador.escudo = true; 
            break;
        case 5:
            Jugador.cadenciaActual = 80;
            break;
        case 6:
            Jugador.laser = true; 
            break;
        case 7:
            Jugador.escudoDoble = true; 
            break;
        case 8:
            Jugador.laserTriple = true; 
            break;
        case 9:
            Jugador.escudoReflector = true; 
            break;
        case 10:
            Jugador.ondaEnergia = true; 
            break;
        case 11:
            Jugador.dispersor = true; 
            break;
        case 12:
            Jugador.homingMissiles = true; 
            break;
        default:
            Jugador.cadenciaActual = Math.max(40, Jugador.cadenciaActual - 10);
            if (Jugador.playerPower % 3 === 0) {
                Jugador.escudo = true;
                Jugador.escudoDoble = true;
            }
    }
}

function dispararJugador() {
    const ahora = Date.now();
    if (ahora - tiempoUltimoDisparo < Jugador.cadenciaActual) return;
    tiempoUltimoDisparo = ahora;

    const balaBase = {
        y: Jugador.y,
        ancho: 4,
        alto: 16,
        velY: -7,
        color: "rgb(0, 255, 255)",
        sombraColor: "rgba(0, 255, 255, 0.8)",
        sombraBlur: 10,
        type: 'normal'
    };

    const centerX = Jugador.x + Jugador.ancho / 2;

    if (Jugador.playerPower === 1) {
        balasJugador.push({ ...balaBase, x: centerX - 2 });
    } else if (Jugador.playerPower <= 3) {
        balasJugador.push({ ...balaBase, x: Jugador.x + Jugador.ancho / 4 - 2 });
        balasJugador.push({ ...balaBase, x: Jugador.x + 3 * Jugador.ancho / 4 - 2 });
    } else {
        balasJugador.push({ ...balaBase, x: centerX - 2 });
        balasJugador.push({ ...balaBase, x: Jugador.x + Jugador.ancho / 4 - 2 });
        balasJugador.push({ ...balaBase, x: Jugador.x + 3 * Jugador.ancho / 4 - 2 });
    }

    if (Jugador.laser) {
        balasJugador.push({
            x: centerX - 3,
            y: Jugador.y,
            ancho: 6,
            alto: 30,
            velY: -12,
            color: "rgb(255, 100, 255)",
            sombraColor: "rgba(255, 100, 255, 0.9)",
            sombraBlur: 15,
            type: 'laser'
        });
    }

    if (Jugador.laserTriple) {
        balasJugador.push({
            x: Jugador.x + 10,
            y: Jugador.y,
            ancho: 5,
            alto: 25,
            velY: -11,
            velX: -0.5,
            color: "rgb(255, 0, 255)",
            sombraColor: "rgba(255, 0, 255, 0.9)",
            sombraBlur: 15,
            type: 'laser'
        });
        balasJugador.push({
            x: Jugador.x + Jugador.ancho - 10,
            y: Jugador.y,
            ancho: 5,
            alto: 25,
            velY: -11,
            velX: 0.5,
            color: "rgb(255, 0, 255)",
            sombraColor: "rgba(255, 0, 255, 0.9)",
            sombraBlur: 15,
            type: 'laser'
        });
    }
    if (Jugador.ondaEnergia) {
        balasJugador.push({
            x: centerX - 10,
            y: Jugador.y - 10,
            ancho: 20,
            alto: 20,
            velY: -6,
            color: "rgb(100, 255, 255)",
            sombraColor: "rgba(100, 255, 255, 0.9)",
            sombraBlur: 20,
            type: 'wave',
            radius: 10,
            expansion: 0.5
        });
    }

    if (Jugador.dispersor && Jugador.playerPower >= 11) {
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI / 4) - Math.PI / 2;
            balasJugador.push({
                x: centerX - 3,
                y: Jugador.y,
                ancho: 6,
                alto: 10,
                velY: Math.sin(angle) * 6,
                velX: Math.cos(angle) * 6,
                color: "rgb(255, 255, 0)",
                sombraColor: "rgba(255, 255, 0, 0.9)",
                sombraBlur: 12,
                type: 'spread'
            });
        }
    }

    if (Jugador.homingMissiles && Jugador.playerPower >= 12) {
        balasJugador.push({
            x: Jugador.x,
            y: Jugador.y,
            ancho: 8,
            alto: 15,
            velY: -5,
            velX: 0,
            color: "rgb(255, 150, 0)",
            sombraColor: "rgba(255, 150, 0, 0.9)",
            sombraBlur: 15,
            type: 'homing',
            rotation: 0
        });
        balasJugador.push({
            x: Jugador.x + Jugador.ancho - 8,
            y: Jugador.y,
            ancho: 8,
            alto: 15,
            velY: -5,
            velX: 0,
            color: "rgb(255, 150, 0)",
            sombraColor: "rgba(255, 150, 0, 0.9)",
            sombraBlur: 15,
            type: 'homing',
            rotation: 0
        });
    }
}

function disparoBoss() {
    if (!boss.alive) return;

    const baseRate = 0.015; 
    const levelMultiplier = 1 + (game.level - 1) * 0.3; 
    const hpPerc = boss.hp / boss.maxHp;
    const difficultyFactor = 1 - hpPerc;
    boss.fireRate = baseRate * levelMultiplier * (1 + 1.5 * difficultyFactor); 

    boss.attackTimer++;
    
    if (boss.attackTimer > 250) {
        boss.attackPattern = (boss.attackPattern + 1) % 4;
        boss.attackTimer = 0;
    }

    if (Math.random() < boss.fireRate) {
        const centerX = boss.x + boss.ancho / 2;
        const centerY = boss.y + boss.alto;
        if (boss.attackPattern === 0 || game.level === 1) {
            balasBoss.push({
                x: centerX - 4,
                y: centerY,
                ancho: 8,
                alto: 12,
                velY: 3.0 + (game.level - 1) * 0.3, 
                velX: 0,
                color: "orange",
                type: 'normal',
                rotation: 0
            });
        }
        else if (boss.attackPattern === 1) {
            for (let i = -1; i <= 1; i++) {
                balasBoss.push({
                    x: centerX - 4,
                    y: centerY,
                    ancho: 8,
                    alto: 12,
                    velY: 3.0 + (game.level - 1) * 0.3,
                    velX: i * 1.0, 
                    color: "red",
                    type: 'fan',
                    rotation: 0
                });
            }
        }
        else if (boss.attackPattern === 2) {
            const angle = (boss.attackTimer * 0.1) % (Math.PI * 2);
            for (let i = 0; i < 3; i++) {
                const a = angle + (i * Math.PI * 2 / 3);
                balasBoss.push({
                    x: centerX - 5,
                    y: centerY,
                    ancho: 10,
                    alto: 10,
                    velY: Math.sin(a) * 1.5 + 2, 
                    velX: Math.cos(a) * 1.5, 
                    color: "purple",
                    type: 'spiral',
                    rotation: a
                });
            }
        }
        else if (boss.attackPattern === 3) {
            for (let i = 0; i < 5; i++) {
                balasBoss.push({
                    x: boss.x + (i * boss.ancho / 4),
                    y: centerY,
                    ancho: 6,
                    alto: 14,
                    velY: 3.5 + (game.level - 1) * 0.3,
                    velX: 0,
                    color: "cyan",
                    type: 'rain',
                    rotation: 0
                });
            }
        }
    }
}

function spawnSupply(type, x, y) {
    const supply = {
        x: x - 20,
        y: y - 20,
        ancho: 40,
        alto: 40,
        type: type,
        color: type === 'vida' ? '#00FF00' : '#FFFF00',
        velY: 2,
        pulse: 0,
        rotation: 0,
        particles: [] 
    };
    supplies.push(supply);
}

function resetBossAndStartLevel(newLevel) {
    game.level = newLevel;
    game.transitioning = true;

    setTimeout(() => {
        boss.maxHp = game.initialBossHp + (game.level - 1) * 15; 
        boss.hp = boss.maxHp;
        boss.speed = boss.initialSpeed + (game.level - 1) * 0.15; 
        boss.x = canvas.width / 2 - boss.ancho / 2;
        boss.y = 20;
        boss.alive = true;
        boss.lifeGiven = [false, false, false];
        boss.attackPattern = 0;
        boss.attackTimer = 0;
        balasBoss.length = 0;
        supplies.length = 0;
        game.transitioning = false;
    }, 1000);
}

function reiniciarJuego() {
    Jugador.x = canvas.width / 2 - 35;
    Jugador.y = canvas.height - 140;
    Jugador.vidas = 5;
    Jugador.playerPower = 1;
    Jugador.cadenciaActual = 150;
    Jugador.escudo = false;
    Jugador.escudoReflector = false;
    Jugador.escudoDoble = false;
    Jugador.laser = false;
    Jugador.laserTriple = false;
    Jugador.ondaEnergia = false;
    Jugador.dispersor = false;
    Jugador.homingMissiles = false;
    Jugador.invulnerable = false;
    balasJugador.length = 0;
    balasBoss.length = 0;
    supplies.length = 0;
    particles.length = 0;
    game.inProgress = true;
    resetBossAndStartLevel(1);
}

function actualizar(delta) {
    updateStars();
    updateParticles();

    Jugador.trail.push({ x: Jugador.x + Jugador.ancho / 2, y: Jugador.y + Jugador.alto / 2, life: 10 });
    for (let i = Jugador.trail.length - 1; i >= 0; i--) {
        Jugador.trail[i].life--;
        if (Jugador.trail[i].life <= 0) Jugador.trail.splice(i, 1);
    }

    if (teclas.Arriba && Jugador.y > 0) Jugador.y -= 5;
    if (teclas.Abajo && Jugador.y < canvas.height - Jugador.alto) Jugador.y += 5;
    if (teclas.Izquierda && Jugador.x > 0) Jugador.x -= 5;
    if (teclas.Derecha && Jugador.x < canvas.width - Jugador.ancho) Jugador.x += 5;

    if (teclaDisparoPresionada && game.inProgress) {
        dispararJugador();
    }

    if (boss.shake > 0) boss.shake--;

    for (let i = balasJugador.length - 1; i >= 0; i--) {
        const b = balasJugador[i];
        
        if (b.type === 'homing' && boss.alive) {
            const dx = (boss.x + boss.ancho / 2) - b.x;
            const dy = (boss.y + boss.alto / 2) - b.y;
            const angle = Math.atan2(dy, dx);
            b.velX = Math.cos(angle) * 6;
            b.velY = Math.sin(angle) * 6;
            b.rotation = angle + Math.PI / 2;
        }
        
        if (b.type === 'wave') {
            b.radius += b.expansion;
            b.ancho = b.radius * 2;
            b.alto = b.radius * 2;
        }
        
        b.y += b.velY;
        if (b.velX) b.x += b.velX;

        if (b.y + b.alto < 0 || b.x < 0 || b.x > canvas.width || (b.type === 'wave' && b.radius > 50)) {
            balasJugador.splice(i, 1);
        } else {
            if (boss.alive &&
                b.x < boss.x + boss.ancho && b.x + b.ancho > boss.x &&
                b.y < boss.y + boss.alto && b.y + b.alto > boss.y) {

                let damage = 1;
                if (b.type === 'laser') damage = 2;
                else if (b.type === 'wave') damage = 3;
                else if (b.type === 'homing') damage = 2;
                else if (b.type === 'spread') damage = 1;
                
                boss.hp -= damage;
                boss.shake = 5;
            
                if (b.type !== 'wave') {
                    balasJugador.splice(i, 1);
                }
                createExplosion(b.x, b.y, 8, '#00FFFF');

                const hpPerc = boss.hp / boss.maxHp;
                for (let j = 0; j < boss.lifeThresholds.length; j++) {
                    if (hpPerc <= boss.lifeThresholds[j] && !boss.lifeGiven[j]) {
                        const typeToDrop = (j % 2 === 0) ? 'vida' : 'poder';
                        spawnSupply(typeToDrop, boss.x + boss.ancho / 2, boss.y + boss.alto / 2);
                        boss.lifeGiven[j] = true;
                        break;
                    }
                }

                if (boss.hp <= 0) {
                    boss.alive = false;
                    createExplosion(boss.x + boss.ancho / 2, boss.y + boss.alto / 2, 50, '#FF6B00');
                    setTimeout(() => resetBossAndStartLevel(game.level + 1), 3000);
                }
            }
        }
    }
    for (let i = supplies.length - 1; i >= 0; i--) {
        const s = supplies[i];
        s.y += s.velY;
        s.pulse += 0.1;
        s.rotation += 0.05;

        if (Math.random() < 0.3) {
            const angle = Math.random() * Math.PI * 2;
            particles.push({
                x: s.x + s.ancho / 2 + Math.cos(angle) * 15,
                y: s.y + s.alto / 2 + Math.sin(angle) * 15,
                vx: Math.cos(angle) * 0.5,
                vy: Math.sin(angle) * 0.5,
                life: 20,
                maxLife: 20,
                size: 2,
                color: s.color
            });
        }

        if (s.x < Jugador.x + Jugador.ancho && s.x + s.ancho > Jugador.x &&
            s.y < Jugador.y + Jugador.alto && s.y + s.alto > Jugador.y) {

            if (s.type === 'vida') {
                Jugador.vidas++;
                createExplosion(s.x + s.ancho / 2, s.y + s.alto / 2, 15, '#00FF00');
            } else if (s.type === 'poder') {
                powerUp();
            }

            supplies.splice(i, 1);
            continue;
        }

        if (s.y > canvas.height) supplies.splice(i, 1);
    }
    for (let i = balasBoss.length - 1; i >= 0; i--) {
        const b = balasBoss[i];
        b.y += b.velY;
        if (b.velX) b.x += b.velX;
        b.rotation += 0.1;

        if (!Jugador.invulnerable &&
            b.x < Jugador.x + Jugador.ancho && b.x + b.ancho > Jugador.x &&
            b.y < Jugador.y + Jugador.alto && b.y + b.alto > Jugador.y) {
            if (Jugador.escudoReflector) {
                balasJugador.push({
                    x: b.x,
                    y: b.y,
                    ancho: 6,
                    alto: 14,
                    velY: -7,
                    velX: 0,
                    color: "rgb(0, 255, 255)",
                    sombraColor: "rgba(0, 255, 255, 0.8)",
                    sombraBlur: 10,
                    type: 'reflected'
                });
                Jugador.escudoReflector = false;
                Jugador.invulnerable = true;
                Jugador.invulTimer = 60;
                createExplosion(Jugador.x + Jugador.ancho / 2, Jugador.y + Jugador.alto / 2, 15, '#FFFF00');
            }
            else if (Jugador.escudoDoble) {
                Jugador.escudoDoble = false;
                Jugador.invulnerable = true;
                Jugador.invulTimer = 60;
                createExplosion(Jugador.x + Jugador.ancho / 2, Jugador.y + Jugador.alto / 2, 15, '#FF00FF');
            }
            else if (Jugador.escudo) {
                Jugador.escudo = false;
                Jugador.invulnerable = true;
                Jugador.invulTimer = 60;
                createExplosion(Jugador.x + Jugador.ancho / 2, Jugador.y + Jugador.alto / 2, 15, '#00FFFF');
            }
            else {
                Jugador.vidas -= 1;
                Jugador.invulnerable = true;
                Jugador.invulTimer = 200;
                createExplosion(Jugador.x + Jugador.ancho / 2, Jugador.y + Jugador.alto / 2, 20, '#FF0000');
                if (Jugador.vidas <= 0) game.inProgress = false;
            }
            balasBoss.splice(i, 1);
            continue;
        }
        if (b.y > canvas.height || b.x < 0 || b.x > canvas.width) balasBoss.splice(i, 1);
    }
    if (boss.alive &&
        Jugador.x < boss.x + boss.ancho && Jugador.x + Jugador.ancho > boss.x &&
        Jugador.y < boss.y + boss.alto && Jugador.y + Jugador.alto > boss.y) {

        if (!Jugador.invulnerable) {
            if (Jugador.escudoReflector || Jugador.escudoDoble || Jugador.escudo) {
                if (Jugador.escudoReflector) Jugador.escudoReflector = false;
                else if (Jugador.escudoDoble) Jugador.escudoDoble = false;
                else Jugador.escudo = false;
                Jugador.invulnerable = true;
                Jugador.invulTimer = 60;
                createExplosion(Jugador.x + Jugador.ancho / 2, Jugador.y + Jugador.alto / 2, 15, '#00FFFF');
            } else {
                Jugador.vidas -= 1;
                Jugador.invulnerable = true;
                Jugador.invulTimer = 60;
                createExplosion(Jugador.x + Jugador.ancho / 2, Jugador.y + Jugador.alto / 2, 20, '#FF0000');
                if (Jugador.vidas <= 0) game.inProgress = false;
            }
        }
    }
    if (Jugador.invulnerable) {
        Jugador.invulTimer--;
        if (Jugador.invulTimer <= 0) {
            Jugador.invulnerable = false;
            Jugador.invulTimer = 0;
        }
    }
    if (boss.alive) {
        boss.x += boss.speed * boss.dir;
        boss.y = 20 + Math.sin(Date.now() / 400) * 20;
        const leftLimit = 40;
        const rightLimit = canvas.width - boss.ancho - 40;
        if (boss.x <= leftLimit) boss.dir = 1;
        if (boss.x >= rightLimit) boss.dir = -1;
    }

    disparoBoss();
}
function dibujar() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawStars();
    for (let i = 0; i < Jugador.trail.length; i++) {
        const t = Jugador.trail[i];
        ctx.save();
        ctx.globalAlpha = t.life / 10;
        ctx.fillStyle = '#00FFFF';
        ctx.fillRect(t.x - 1, t.y - 1, 2, 2);
        ctx.restore();
    }
    if (bossLoaded && boss.alive) {
        boss.frameCounter++;
        if (boss.frameCounter >= boss.frameSpeed) {
            boss.frame = (boss.frame + 1) % boss.totalFrames;
            boss.frameCounter = 0;
        }

        ctx.save();
        const shakeX = boss.shake > 0 ? (Math.random() - 0.5) * 5 : 0;
        const shakeY = boss.shake > 0 ? (Math.random() - 0.5) * 5 : 0;

        ctx.drawImage(
            boss.sprite,
            boss.frame * boss.frameWidth, 0,
            boss.frameWidth, boss.frameHeight,
            boss.x + shakeX, boss.y + shakeY,
            boss.ancho, boss.alto
        );
        ctx.restore();
    }
    const spr = playerSprites[Jugador.spriteIndex];
    if (spr) {
        const shouldDraw = !Jugador.invulnerable || (Math.floor(perfNow / 100) % 2 === 0);

        if (shouldDraw) {
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
            ctx.drawImage(spr, Jugador.x, Jugador.y, Jugador.ancho, Jugador.alto);
            ctx.restore();
        }
        if (Jugador.escudo) {
            ctx.save();
            const pulseSize = Math.sin(perfNow / 200) * 3;
            ctx.shadowBlur = 20;
            ctx.shadowColor = "cyan";
            ctx.strokeStyle = "rgba(0, 255, 255, 0.9)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(Jugador.x + Jugador.ancho / 2, Jugador.y + Jugador.alto / 2,
                Jugador.ancho / 2 + 5 + pulseSize, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fillStyle = "rgba(0, 200, 255, 0.1)";
            ctx.fill();
            ctx.restore();
        }
        if (Jugador.escudoDoble) {
            ctx.save();
            const pulseSize = Math.sin(perfNow / 180) * 4;
            ctx.shadowBlur = 25;
            ctx.shadowColor = "magenta";
            ctx.strokeStyle = "rgba(255, 0, 255, 0.9)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(Jugador.x + Jugador.ancho / 2, Jugador.y + Jugador.alto / 2,
                Jugador.ancho / 2 + 12 + pulseSize, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fillStyle = "rgba(255, 0, 255, 0.1)";
            ctx.fill();
            ctx.restore();
        }
        if (Jugador.escudoReflector) {
            ctx.save();
            const pulseSize = Math.sin(perfNow / 150) * 4;
            const rotation = perfNow / 500;
            ctx.shadowBlur = 25;
            ctx.shadowColor = "gold";
            ctx.strokeStyle = "rgba(255, 215, 0, 0.9)";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(Jugador.x + Jugador.ancho / 2, Jugador.y + Jugador.alto / 2,
                Jugador.ancho / 2 + 8 + pulseSize, 0, 2 * Math.PI);
            ctx.stroke();

            for (let i = 0; i < 8; i++) {
                const angle = rotation + (i * Math.PI / 4);
                const x1 = Jugador.x + Jugador.ancho / 2 + Math.cos(angle) * (Jugador.ancho / 2 + 8);
                const y1 = Jugador.y + Jugador.alto / 2 + Math.sin(angle) * (Jugador.ancho / 2 + 8);
                const x2 = Jugador.x + Jugador.ancho / 2 + Math.cos(angle) * (Jugador.ancho / 2 + 15);
                const y2 = Jugador.y + Jugador.alto / 2 + Math.sin(angle) * (Jugador.ancho / 2 + 15);

                ctx.strokeStyle = "rgba(255, 215, 0, 0.7)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }

            ctx.fillStyle = "rgba(255, 215, 0, 0.15)";
            ctx.beginPath();
            ctx.arc(Jugador.x + Jugador.ancho / 2, Jugador.y + Jugador.alto / 2,
                Jugador.ancho / 2 + 8 + pulseSize, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
        }
    }

    for (const s of supplies) {
        ctx.save();
        const pulseSize = Math.sin(s.pulse) * 5;
        const centerX = s.x + s.ancho / 2;
        const centerY = s.y + s.alto / 2;
        ctx.shadowBlur = 20 + pulseSize;
        ctx.shadowColor = s.color;
        ctx.translate(centerX, centerY);
        ctx.rotate(s.rotation);
        ctx.translate(-centerX, -centerY);

        if (s.type === 'vida') {
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 20);
            gradient.addColorStop(0, '#00FF00');
            gradient.addColorStop(1, '#00AA00');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY + 8);
            ctx.bezierCurveTo(centerX - 12, centerY - 5, centerX - 20, centerY + 3, centerX, centerY + 15);
            ctx.bezierCurveTo(centerX + 20, centerY + 3, centerX + 12, centerY - 5, centerX, centerY + 8);
            ctx.fill();
            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
            ctx.beginPath();
            ctx.arc(centerX - 3, centerY, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = "white";
            ctx.font = "bold 18px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("+", centerX, centerY + 1);
        } else {
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 20);
            gradient.addColorStop(0, '#FFFF00');
            gradient.addColorStop(1, '#FFAA00');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const x = centerX + Math.cos(angle) * (18 + pulseSize);
                const y = centerY + Math.sin(angle) * (18 + pulseSize);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const x = centerX + Math.cos(angle) * 8;
                const y = centerY + Math.sin(angle) * 8;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = "black";
            ctx.font = "bold 18px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("P", centerX, centerY + 1);
        }

        ctx.restore();
    }
    for (const b of balasJugador) {
        ctx.save();
        ctx.shadowBlur = b.sombraBlur;
        ctx.shadowColor = b.sombraColor;

        if (b.type === 'laser') {
            const gradient = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.alto);
            gradient.addColorStop(0, 'rgba(255, 100, 255, 0.3)');
            gradient.addColorStop(0.5, 'rgba(255, 100, 255, 1)');
            gradient.addColorStop(1, 'rgba(255, 100, 255, 0.3)');
            ctx.fillStyle = gradient;
            ctx.fillRect(b.x - 1, b.y, b.ancho + 2, b.alto);
        } else if (b.type === 'missile') {
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.moveTo(b.x + b.ancho / 2, b.y);
            ctx.lineTo(b.x + b.ancho, b.y + b.alto);
            ctx.lineTo(b.x + b.ancho / 2, b.y + b.alto - 3);
            ctx.lineTo(b.x, b.y + b.alto);
            ctx.closePath();
            ctx.fill();
        } else if (b.type === 'wave') {
            ctx.strokeStyle = b.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = b.color;
            ctx.fill();
        } else if (b.type === 'homing') {
            ctx.translate(b.x + b.ancho / 2, b.y + b.alto / 2);
            ctx.rotate(b.rotation);
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.moveTo(0, -b.alto / 2);
            ctx.lineTo(b.ancho / 2, b.alto / 2);
            ctx.lineTo(0, b.alto / 3);
            ctx.lineTo(-b.ancho / 2, b.alto / 2);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
            ctx.fillRect(-2, b.alto / 3, 4, 8);
        } else if (b.type === 'spread') {
            ctx.fillStyle = b.color;
            ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI / 2);
                const x = b.x + b.ancho / 2 + Math.cos(angle) * b.ancho / 2;
                const y = b.y + b.alto / 2 + Math.sin(angle) * b.alto / 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.ancho, b.alto);
        }
        ctx.restore();
    }
    for (const b of balasBoss) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = b.color;

        ctx.translate(b.x + b.ancho / 2, b.y + b.alto / 2);
        ctx.rotate(b.rotation);
        ctx.translate(-(b.x + b.ancho / 2), -(b.y + b.alto / 2));

        if (b.type === 'spiral') {
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.moveTo(b.x + b.ancho / 2, b.y);
            ctx.lineTo(b.x + b.ancho, b.y + b.alto / 2);
            ctx.lineTo(b.x + b.ancho / 2, b.y + b.alto);
            ctx.lineTo(b.x, b.y + b.alto / 2);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(b.x + b.ancho / 2, b.y + b.alto / 2, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (b.type === 'rain') {
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.moveTo(b.x + b.ancho / 2, b.y);
            ctx.quadraticCurveTo(b.x + b.ancho, b.y + b.alto / 2, b.x + b.ancho / 2, b.y + b.alto);
            ctx.quadraticCurveTo(b.x, b.y + b.alto / 2, b.x + b.ancho / 2, b.y);
            ctx.fill();
        } else if (b.type === 'fan') {
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.moveTo(b.x + b.ancho / 2, b.y);
            ctx.lineTo(b.x + b.ancho, b.y + b.alto);
            ctx.lineTo(b.x, b.y + b.alto);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(b.x + b.ancho / 2, b.y + b.alto / 2, b.ancho / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawParticles();

    ctx.save();
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.fillStyle = "white";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "left";

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(5, 5, 300, 135);
    ctx.fillStyle = "white";
    ctx.fillText(`❤️ Vidas: ${Jugador.vidas}`, 15, 30);
    let powerInfo = `⚡ Poder: Nivel ${Jugador.playerPower}`;
    ctx.fillText(powerInfo, 15, 55);
    let abilities = '🔥 ';
    if (Jugador.escudo) abilities += '🛡️ ';
    if (Jugador.escudoDoble) abilities += '🛡️🛡️ ';
    if (Jugador.escudoReflector) abilities += '✨ ';
    if (Jugador.laser) abilities += '🔴 ';
    if (Jugador.laserTriple) abilities += '🔴🔴🔴 ';
    if (Jugador.ondaEnergia) abilities += '🌊 ';
    if (Jugador.dispersor) abilities += '💫 ';
    if (Jugador.homingMissiles) abilities += '🚀 ';
    
    ctx.fillText(abilities, 15, 80);
    ctx.fillText(`🌟 Nivel: ${game.level}`, 15, 105);
    const patterns = ['Simple', 'Abanico', 'Espiral', 'Lluvia'];
    ctx.font = "16px Arial";
    ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
    if (boss.alive) {
        ctx.fillText(`Boss: ${patterns[boss.attackPattern]}`, 15, 128);
    }
    if (boss.alive) {
        ctx.textAlign = "right";
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width - 235, 5, 230, 65);
        ctx.fillStyle = "white";
        ctx.font = "bold 18px Arial";
        ctx.fillText(`👾 Boss HP: ${boss.hp}/${boss.maxHp}`, canvas.width - 15, 28);

        const barW = 200;
        const barH = 18;
        const perc = Math.max(0, boss.hp / boss.maxHp);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width - barW - 15, 38, barW, barH);

        const hpGradient = ctx.createLinearGradient(canvas.width - barW - 15, 38, canvas.width - 15, 38);
        if (perc > 0.5) {
            hpGradient.addColorStop(0, '#00ff00');
            hpGradient.addColorStop(1, '#88ff00');
        } else if (perc > 0.25) {
            hpGradient.addColorStop(0, '#ffaa00');
            hpGradient.addColorStop(1, '#ff6600');
        } else {
            hpGradient.addColorStop(0, '#ff0000');
            hpGradient.addColorStop(1, '#aa0000');
        }
        ctx.fillStyle = hpGradient;
        ctx.fillRect(canvas.width - barW - 15, 38, Math.floor(barW * perc), barH);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(canvas.width - barW - 15, 38, Math.floor(barW * perc), barH / 2);
    } else if (game.inProgress && !game.transitioning) {
        ctx.textAlign = "center";
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width / 2 - 200, canvas.height / 2 - 50, 400, 100);
        ctx.fillStyle = "#00ff00";
        ctx.font = "bold 32px Arial";
        ctx.fillText("¡BOSS DERROTADO!", canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText(`Preparando Nivel ${game.level}...`, canvas.width / 2, canvas.height / 2 + 25);
    }
    ctx.restore();
    if (game.transitioning) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = "#00ffff";
        ctx.font = "bold 48px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`NIVEL ${game.level}`, canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = "white";
        ctx.font = "24px Arial";
        ctx.fillText("¡Prepárate!", canvas.width / 2, canvas.height / 2 + 30);
        ctx.restore();
    }
    if (!game.inProgress && Jugador.vidas <= 0) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.shadowBlur = 30;
        ctx.shadowColor = 'red';
        ctx.fillStyle = "red";
        ctx.font = "bold 72px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 60);

        ctx.shadowBlur = 10;
        ctx.shadowColor = 'white';
        ctx.fillStyle = "white";
        ctx.font = "28px Arial";
        ctx.fillText(`Llegaste al Nivel ${game.level}`, canvas.width / 2, canvas.height / 2);

        ctx.font = "24px Arial";
        ctx.fillText("Presiona ESPACIO o haz clic para Reiniciar", canvas.width / 2, canvas.height / 2 + 60);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.strokeRect(canvas.width / 2 - 180, canvas.height / 2 + 80, 360, 50);
        ctx.font = "bold 20px Arial";
        ctx.fillText("🔄 REINTENTAR", canvas.width / 2, canvas.height / 2 + 112);
        ctx.restore();
    }
}
let lastTS = 0;
let perfNow = 0;

function mainLoop(ts) {
    perfNow = performance.now();
    const delta = ts - lastTS;
    lastTS = ts;

    if (game.inProgress && !game.transitioning) {
        actualizar(delta);
    } else if (game.transitioning) {
        updateStars();
        updateParticles();
    }

    dibujar();
    requestAnimationFrame(mainLoop);
}

function startIfReady() {
    if (playerSpritesLoaded === PLAYER_TOTAL_SPRITES && bossLoaded) {
        initStars();
        resetBossAndStartLevel(1);
        console.log("✨ Todo cargado — iniciando juego mejorado");
        requestAnimationFrame(mainLoop);
    }
}