class DiscordFriendsMaps {
    constructor(game) {
        this.game = game;
        this.currentMap = 'discord_server';
        this.mapObjects = [];
        this.escapeRing = null;
    }

    generateDiscordServerMap() {
        this.mapObjects = [];
        this.escapeRing = null;
        
        // Crear clusters de objetos para mejor distribución
        const clusters = 8;
        const clusterSize = 200;
        
        for (let c = 0; c < clusters; c++) {
            const centerX = Math.random() * (this.game.worldSize.width - clusterSize * 2) + clusterSize;
            const centerY = Math.random() * (this.game.worldSize.height - clusterSize * 2) + clusterSize;
            
            // Árboles grandes (obstáculos principales)
            for (let i = 0; i < 6; i++) {
                this.mapObjects.push({
                    type: 'tree',
                    x: centerX + (Math.random() - 0.5) * clusterSize,
                    y: centerY + (Math.random() - 0.5) * clusterSize,
                    size: 70 + Math.random() * 50,
                    variant: Math.floor(Math.random() * 3),
                    hasCollision: true
                });
            }
            
            // Arbustos (cobertura)
            for (let i = 0; i < 4; i++) {
                this.mapObjects.push({
                    type: 'bush',
                    x: centerX + (Math.random() - 0.5) * clusterSize,
                    y: centerY + (Math.random() - 0.5) * clusterSize,
                    size: 25 + Math.random() * 25,
                    variant: Math.floor(Math.random() * 2),
                    hasCollision: false
                });
            }
        }
        
        // Rocas dispersas
        for (let i = 0; i < 20; i++) {
            this.mapObjects.push({
                type: 'rock',
                x: Math.random() * (this.game.worldSize.width - 60) + 30,
                y: Math.random() * (this.game.worldSize.height - 60) + 30,
                size: 30 + Math.random() * 30,
                variant: Math.floor(Math.random() * 3),
                hasCollision: true
            });
        }
        
        // Flores decorativas
        for (let i = 0; i < 15; i++) {
            this.mapObjects.push({
                type: 'flower',
                x: Math.random() * this.game.worldSize.width,
                y: Math.random() * this.game.worldSize.height,
                size: 8 + Math.random() * 12,
                color: Math.floor(Math.random() * 4),
                hasCollision: false
            });
        }
        
        // Senderos
        this.generatePaths();
    }

    drawMapObjects(ctx, camera) {
        // Dibujar senderos primero
        this.drawPaths(ctx);
        
        this.mapObjects.forEach(obj => {
            ctx.save();
            
            if (obj.type === 'tree') {
                this.drawTree(ctx, obj);
            } else if (obj.type === 'bush') {
                this.drawBush(ctx, obj);
            } else if (obj.type === 'rock') {
                this.drawRock(ctx, obj);
            } else if (obj.type === 'flower') {
                this.drawFlower(ctx, obj);
            } else if (obj.type === 'pillar') {
                this.drawPillar(ctx, obj);
            } else if (obj.type === 'machine') {
                this.drawMachine(ctx, obj);
            } else if (obj.type === 'crate') {
                this.drawCrate(ctx, obj);
            } else if (obj.type === 'barrel') {
                this.drawBarrel(ctx, obj);
            } else if (obj.type === 'pipe') {
                this.drawPipe(ctx, obj);
            } else if (obj.type === 'gravestone') {
                this.drawGravestone(ctx, obj);
            } else if (obj.type === 'dead_tree') {
                this.drawDeadTree(ctx, obj);
            } else if (obj.type === 'statue') {
                this.drawStatue(ctx, obj);
            } else if (obj.type === 'fog') {
                this.drawFog(ctx, obj);
            }
            
            ctx.restore();
        });
        
        // Dibujar marcadores de spawn en modo sandbox
        if (this.currentMap === 'sandbox') {
            this.drawSpawnMarkers(ctx);
        }
    }
    
    drawTree(ctx, obj) {
        const trunkColors = ['#8B4513', '#654321', '#A0522D'];
        const leafColors = ['#228B22', '#32CD32', '#006400'];
        
        // Tronco con variaciones
        ctx.fillStyle = trunkColors[obj.variant] || trunkColors[0];
        ctx.fillRect(obj.x + obj.size/3, obj.y + obj.size/2, obj.size/3, obj.size/2);
        
        // Copa del árbol con gradiente
        const gradient = ctx.createRadialGradient(
            obj.x + obj.size/2, obj.y + obj.size/3, 0,
            obj.x + obj.size/2, obj.y + obj.size/3, obj.size/3
        );
        gradient.addColorStop(0, leafColors[obj.variant] || leafColors[0]);
        gradient.addColorStop(1, '#1F4F1F');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(obj.x + obj.size/2, obj.y + obj.size/3, obj.size/3, 0, Math.PI * 2);
        ctx.fill();
        
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(obj.x + obj.size/2 + 5, obj.y + obj.size, obj.size/4, obj.size/8, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawBush(ctx, obj) {
        const bushColors = ['#32CD32', '#228B22'];
        const color = bushColors[obj.variant] || bushColors[0];
        
        // Arbusto con textura
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(obj.x + obj.size/2, obj.y + obj.size/2, obj.size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Detalles más oscuros
        ctx.fillStyle = '#1F4F1F';
        for (let i = 0; i < 3; i++) {
            const offsetX = (Math.random() - 0.5) * obj.size/2;
            const offsetY = (Math.random() - 0.5) * obj.size/2;
            ctx.beginPath();
            ctx.arc(obj.x + obj.size/2 + offsetX, obj.y + obj.size/2 + offsetY, obj.size/8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawRock(ctx, obj) {
        const rockColors = ['#696969', '#778899', '#2F4F4F'];
        const color = rockColors[obj.variant] || rockColors[0];
        
        // Roca con forma irregular
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(obj.x, obj.y + obj.size/2);
        ctx.lineTo(obj.x + obj.size/3, obj.y);
        ctx.lineTo(obj.x + obj.size * 2/3, obj.y + obj.size/4);
        ctx.lineTo(obj.x + obj.size, obj.y + obj.size/2);
        ctx.lineTo(obj.x + obj.size * 3/4, obj.y + obj.size);
        ctx.lineTo(obj.x + obj.size/4, obj.y + obj.size);
        ctx.closePath();
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = '#A9A9A9';
        ctx.beginPath();
        ctx.moveTo(obj.x + 3, obj.y + obj.size/2);
        ctx.lineTo(obj.x + obj.size/3, obj.y + 3);
        ctx.lineTo(obj.x + obj.size/2, obj.y + obj.size/4);
        ctx.lineTo(obj.x + obj.size/3, obj.y + obj.size/2);
        ctx.closePath();
        ctx.fill();
    }
    
    drawFlower(ctx, obj) {
        const flowerColors = ['#FFD700', '#FFA500', '#FF8C00', '#DAA520'];
        const color = flowerColors[obj.color] || flowerColors[0];
        
        // Tallo
        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(obj.x + obj.size/2, obj.y + obj.size);
        ctx.lineTo(obj.x + obj.size/2, obj.y + obj.size/2);
        ctx.stroke();
        
        // Pétalos
        ctx.fillStyle = color;
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5;
            const petalX = obj.x + obj.size/2 + Math.cos(angle) * obj.size/4;
            const petalY = obj.y + obj.size/2 + Math.sin(angle) * obj.size/4;
            ctx.beginPath();
            ctx.arc(petalX, petalY, obj.size/6, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Centro
        ctx.fillStyle = '#B8860B';
        ctx.beginPath();
        ctx.arc(obj.x + obj.size/2, obj.y + obj.size/2, obj.size/8, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawPillar(ctx, obj) {
        // Pilar de piedra para sandbox
        const gradient = ctx.createLinearGradient(obj.x, obj.y, obj.x + obj.size, obj.y + obj.size);
        gradient.addColorStop(0, '#A9A9A9');
        gradient.addColorStop(0.5, '#696969');
        gradient.addColorStop(1, '#2F4F4F');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(obj.x, obj.y, obj.size, obj.size);
        
        // Bordes más claros
        ctx.strokeStyle = '#D3D3D3';
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x, obj.y, obj.size, obj.size);
        
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(obj.x + 3, obj.y + 3, obj.size, obj.size);
    }
    
    drawSpawnMarkers(ctx) {
        if (!this.spawnMarkers || this.currentMap !== 'sandbox') return;
        
        this.spawnMarkers.forEach(marker => {
            ctx.save();
            
            if (marker.type === 'player') {
                // Marcador del jugador - azul
                ctx.fillStyle = 'rgba(0, 100, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(marker.x, marker.y, 40, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = '#0064FF';
                ctx.lineWidth = 3;
                ctx.stroke();
                
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('PLAYER', marker.x, marker.y + 5);
            } else if (marker.type === 'dummy') {
                // Marcador de dummy - rojo
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(marker.x, marker.y, 35, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = '#FF0000';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('DUMMY', marker.x, marker.y + 4);
            } else if (marker.type === 'downed') {
                // Marcador de dummy caído - naranja
                ctx.fillStyle = 'rgba(255, 165, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(marker.x, marker.y, 35, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = '#FFA500';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
                
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 11px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('DOWNED', marker.x, marker.y + 4);
            }
            
            ctx.restore();
        });
    }
    
    generatePaths() {
        this.paths = [];
        
        // Sendero principal horizontal
        this.paths.push({
            type: 'horizontal',
            y: this.game.worldSize.height / 2,
            width: this.game.worldSize.width,
            thickness: 60
        });
        
        // Sendero vertical
        this.paths.push({
            type: 'vertical',
            x: this.game.worldSize.width / 2,
            height: this.game.worldSize.height,
            thickness: 50
        });
    }
    
    drawPaths(ctx) {
        if (!this.paths) return;
        
        ctx.fillStyle = '#8B7355';
        this.paths.forEach(path => {
            if (path.type === 'horizontal') {
                ctx.fillRect(0, path.y - path.thickness/2, path.width, path.thickness);
                
                // Bordes del sendero
                ctx.fillStyle = '#654321';
                ctx.fillRect(0, path.y - path.thickness/2, path.width, 5);
                ctx.fillRect(0, path.y + path.thickness/2 - 5, path.width, 5);
                ctx.fillStyle = '#8B7355';
            } else if (path.type === 'vertical') {
                ctx.fillRect(path.x - path.thickness/2, 0, path.thickness, path.height);
                
                // Bordes del sendero
                ctx.fillStyle = '#654321';
                ctx.fillRect(path.x - path.thickness/2, 0, 5, path.height);
                ctx.fillRect(path.x + path.thickness/2 - 5, 0, 5, path.height);
                ctx.fillStyle = '#8B7355';
            }
        });
    }

    showEscapeRing(x = null, y = null) {
        if (this.escapeRing) return;
        
        const margin = 200;
        
        // Si se proporcionan coordenadas, usarlas (recibidas de Supabase)
        if (x !== null && y !== null) {
            this.escapeRing = {
                x: x,
                y: y,
                radius: 80,
                active: true,
                escaped: []
            };
            console.log('🔵 Escape ring received at:', x, y);
        } else {
            // Solo el host genera la posición y la envía
            const ringX = Math.random() * (this.game.worldSize.width - margin * 2) + margin;
            const ringY = Math.random() * (this.game.worldSize.height - margin * 2) + margin;
            
            this.escapeRing = {
                x: ringX,
                y: ringY,
                radius: 80,
                active: true,
                escaped: []
            };
            
            console.log('🔵 Escape ring generated at:', ringX, ringY);
            
            // Enviar posición a otros jugadores
            if (this.game.supabaseGame) {
                this.game.supabaseGame.sendEscapeRingPosition(ringX, ringY);
            }
        }
    }

    drawEscapeRing(ctx, camera) {
        if (!this.escapeRing || !this.escapeRing.active) return;
        
        ctx.save();
        
        const time = Date.now() * 0.001;
        
        // Anillo pulsante con múltiples capas
        const pulse = Math.sin(time * 3) * 0.15 + 0.85;
        const ringRadius = this.escapeRing.radius * pulse;
        
        // Aura exterior con colores dorados
        const outerGradient = ctx.createRadialGradient(
            this.escapeRing.x, this.escapeRing.y, 0,
            this.escapeRing.x, this.escapeRing.y, ringRadius * 1.5
        );
        outerGradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
        outerGradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.1)');
        outerGradient.addColorStop(1, 'rgba(255, 165, 0, 0.3)');
        
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(this.escapeRing.x, this.escapeRing.y, ringRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Anillo principal con efecto de rotación
        for (let i = 0; i < 3; i++) {
            const offset = i * 0.3;
            const currentRadius = ringRadius + Math.sin(time * 2 + offset) * 5;
            
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.8 - i * 0.2})`;
            ctx.lineWidth = 6 - i;
            ctx.beginPath();
            ctx.arc(this.escapeRing.x, this.escapeRing.y, currentRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Partículas orbitales doradas
        for (let i = 0; i < 8; i++) {
            const angle = (time + i * Math.PI / 4) % (Math.PI * 2);
            const particleRadius = ringRadius + 10;
            const particleX = this.escapeRing.x + Math.cos(angle) * particleRadius;
            const particleY = this.escapeRing.y + Math.sin(angle) * particleRadius;
            
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Centro con gradiente dorado
        const centerGradient = ctx.createRadialGradient(
            this.escapeRing.x, this.escapeRing.y, 0,
            this.escapeRing.x, this.escapeRing.y, ringRadius * 0.4
        );
        centerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        centerGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.6)');
        centerGradient.addColorStop(1, 'rgba(255, 165, 0, 0.2)');
        
        ctx.fillStyle = centerGradient;
        ctx.beginPath();
        ctx.arc(this.escapeRing.x, this.escapeRing.y, ringRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Texto con efecto de brillo dorado
        const textPulse = Math.sin(time * 4) * 0.3 + 0.7;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20 * textPulse;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✨ ESCAPE ✨', this.escapeRing.x, this.escapeRing.y - 8);
        ctx.fillText('🏆 ZONE 🏆', this.escapeRing.x, this.escapeRing.y + 12);
        
        ctx.restore();
    }

    checkEscapeRingCollision(player) {
        if (!this.escapeRing || !this.escapeRing.active || player.role !== 'survivor' || !player.alive) return false;
        
        const distance = Math.sqrt(
            Math.pow(player.x + 15 - this.escapeRing.x, 2) + 
            Math.pow(player.y + 15 - this.escapeRing.y, 2)
        );
        
        if (distance <= this.escapeRing.radius && !this.escapeRing.escaped.includes(player.id)) {
            this.escapeRing.escaped.push(player.id);
            player.escaped = true;
            player.spectating = true;
            player.alive = false;
            
            console.log(`🏃 ${player.name} escaped!`);
            
            // Crear partículas de escape
            this.game.createParticles(player.x + 15, player.y + 15, '#00FFFF', 30);
            
            return true;
        }
        
        return false;
    }

    generateMap(mapName) {
        this.currentMap = mapName || 'discord_server';
        console.log('🗺️ Generating map:', this.currentMap);
        
        // Clear existing objects
        this.mapObjects = [];
        this.escapeRing = null;
        
        switch(this.currentMap) {
            case 'discord_server':
                this.generateDiscordServerMap();
                break;
            case 'sandbox':
                this.generateSandboxMap();
                break;
            case 'abandoned_factory':
                this.generateAbandonedFactoryMap();
                break;
            case 'haunted_mansion':
                this.generateHauntedMansionMap();
                break;
            default:
                this.generateDiscordServerMap();
        }
        
        console.log('🗺️ Map generated with', this.mapObjects.length, 'objects');
        console.log('🗺️ First few objects:', this.mapObjects.slice(0, 3));
    }
    
    drawMapObjects(ctx, camera) {
        if (!ctx || !this.mapObjects) return;
        
        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        
        this.mapObjects.forEach(obj => {
            this.drawMapObject(ctx, obj);
        });
        
        // Draw escape ring if exists
        if (this.escapeRing) {
            this.drawEscapeRing(ctx, camera);
        }
        
        ctx.restore();
    }
    
    drawMapObject(ctx, obj) {
        ctx.save();
        
        switch(obj.type) {
            case 'pillar':
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(obj.x - obj.size/2, obj.y - obj.size/2, obj.size, obj.size);
                break;
            case 'rock':
                ctx.fillStyle = '#696969';
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.size/2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'machine':
                ctx.fillStyle = '#2F4F4F';
                ctx.fillRect(obj.x - obj.size/2, obj.y - obj.size/2, obj.size, obj.size);
                break;
            case 'crate':
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(obj.x - obj.size/2, obj.y - obj.size/2, obj.size, obj.size);
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 2;
                ctx.strokeRect(obj.x - obj.size/2, obj.y - obj.size/2, obj.size, obj.size);
                break;
            case 'barrel':
                ctx.fillStyle = '#8B0000';
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.size/2, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }
    
    generateSandboxMap() {
        this.mapObjects = [];
        this.escapeRing = null;
        
        // Mapa plano con obstáculos mínimos para testing
        // Solo algunos obstáculos básicos para probar mecánicas
        
        // 4 pilares en las esquinas para delimitar área de combate
        const pillarPositions = [
            {x: 300, y: 300},
            {x: this.game.worldSize.width - 300, y: 300},
            {x: 300, y: this.game.worldSize.height - 300},
            {x: this.game.worldSize.width - 300, y: this.game.worldSize.height - 300}
        ];
        
        pillarPositions.forEach(pos => {
            this.mapObjects.push({
                type: 'pillar',
                x: pos.x,
                y: pos.y,
                size: 60,
                hasCollision: true
            });
        });
        
        // Algunas rocas pequeñas para cobertura básica
        for (let i = 0; i < 8; i++) {
            this.mapObjects.push({
                type: 'rock',
                x: Math.random() * (this.game.worldSize.width - 200) + 100,
                y: Math.random() * (this.game.worldSize.height - 200) + 100,
                size: 40 + Math.random() * 20,
                variant: Math.floor(Math.random() * 3),
                hasCollision: true
            });
        }
        
        // Marcadores de spawn para testing
        this.spawnMarkers = [
            {x: this.game.worldSize.width / 2, y: 200, type: 'player'},
            {x: 400, y: 600, type: 'dummy'},
            {x: 800, y: 600, type: 'dummy'},
            {x: 1200, y: 600, type: 'dummy'},
            {x: 600, y: 400, type: 'downed', label: 'DOWNED'}
        ];
    }

    generateAbandonedFactoryMap() {
        this.mapObjects = [];
        this.escapeRing = null;
        
        // Máquinas industriales grandes
        const machinePositions = [
            {x: 400, y: 300}, {x: 1200, y: 300}, {x: 2000, y: 300},
            {x: 400, y: 800}, {x: 1200, y: 800}, {x: 2000, y: 800},
            {x: 400, y: 1300}, {x: 1200, y: 1300}, {x: 2000, y: 1300}
        ];
        
        machinePositions.forEach(pos => {
            this.mapObjects.push({
                type: 'machine',
                x: pos.x,
                y: pos.y,
                size: 100 + Math.random() * 40,
                hasCollision: true
            });
        });
        
        // Cajas apiladas
        for (let i = 0; i < 35; i++) {
            this.mapObjects.push({
                type: 'crate',
                x: Math.random() * (this.game.worldSize.width - 100) + 50,
                y: Math.random() * (this.game.worldSize.height - 100) + 50,
                size: 45 + Math.random() * 25,
                hasCollision: true
            });
        }
        
        // Barriles de aceite
        for (let i = 0; i < 20; i++) {
            this.mapObjects.push({
                type: 'barrel',
                x: Math.random() * (this.game.worldSize.width - 80) + 40,
                y: Math.random() * (this.game.worldSize.height - 80) + 40,
                size: 35 + Math.random() * 15,
                hasCollision: true
            });
        }
        
        // Tuberías
        for (let i = 0; i < 8; i++) {
            this.mapObjects.push({
                type: 'pipe',
                x: Math.random() * (this.game.worldSize.width - 150) + 75,
                y: Math.random() * (this.game.worldSize.height - 150) + 75,
                size: 120,
                hasCollision: true
            });
        }
    }
    
    generateDiscordServerMap() {
        this.mapObjects = [];
        this.escapeRing = null;
        
        // Servidores principales
        const serverPositions = [
            {x: 500, y: 400}, {x: 1000, y: 400}, {x: 1500, y: 400},
            {x: 500, y: 800}, {x: 1000, y: 800}, {x: 1500, y: 800}
        ];
        
        serverPositions.forEach(pos => {
            this.mapObjects.push({
                type: 'server',
                x: pos.x,
                y: pos.y,
                size: 80,
                hasCollision: true
            });
        });
        
        // Cables y conexiones
        for (let i = 0; i < 15; i++) {
            this.mapObjects.push({
                type: 'cable',
                x: Math.random() * (this.game.worldSize.width - 100) + 50,
                y: Math.random() * (this.game.worldSize.height - 100) + 50,
                size: 30,
                hasCollision: false
            });
        }
    }
    
    generateHauntedMansionMap() {
        this.mapObjects = [];
        this.escapeRing = null;
        
        // Paredes de habitaciones
        const roomWalls = [
            {x: 400, y: 300, width: 200, height: 20},
            {x: 800, y: 300, width: 200, height: 20},
            {x: 1200, y: 300, width: 200, height: 20},
            {x: 400, y: 700, width: 200, height: 20},
            {x: 800, y: 700, width: 200, height: 20},
            {x: 1200, y: 700, width: 200, height: 20}
        ];
        
        roomWalls.forEach(wall => {
            this.mapObjects.push({
                type: 'wall',
                x: wall.x,
                y: wall.y,
                width: wall.width,
                height: wall.height,
                hasCollision: true
            });
        });
        
        // Muebles antiguos
        for (let i = 0; i < 20; i++) {
            this.mapObjects.push({
                type: 'furniture',
                x: Math.random() * (this.game.worldSize.width - 100) + 50,
                y: Math.random() * (this.game.worldSize.height - 100) + 50,
                size: 60 + Math.random() * 40,
                hasCollision: true
            });
        }
    }
}