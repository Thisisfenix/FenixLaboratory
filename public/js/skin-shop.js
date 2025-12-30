class SkinShop {
    constructor(game) {
        this.game = game;
        this.coins = parseInt(localStorage.getItem('df_coins') || '1000');
        this.ownedSkins = JSON.parse(localStorage.getItem('df_owned_skins') || '[]');
        this.equippedSkins = JSON.parse(localStorage.getItem('df_equipped_skins') || '{}');
        this.isOpen = false;
        
        this.skins = {
            survivors: {
                gissel: [
                    { id: 'gissel_default', name: 'Clásica', price: 0, color: '#FF69B4', owned: true },
                    { id: 'gissel_dark', name: 'Sombra', price: 100, color: '#4B0082' },
                    { id: 'gissel_gold', name: 'Dorada', price: 250, color: '#FFD700' },
                    { id: 'gissel_neon', name: 'Neón', price: 500, color: '#00FFFF' }
                ],
                ia777: [
                    { id: 'ia777_default', name: 'Clásico', price: 0, color: '#00FF00', owned: true },
                    { id: 'ia777_cyber', name: 'Cyber', price: 150, color: '#FF0080' },
                    { id: 'ia777_matrix', name: 'Matrix', price: 300, color: '#00FF41' },
                    { id: 'ia777_ghost', name: 'Fantasma', price: 400, color: '#E6E6FA' }
                ],
                angel: [
                    { id: 'angel_default', name: 'Clásico', price: 0, color: '#87CEEB', owned: true },
                    { id: 'angel_fire', name: 'Fuego', price: 200, color: '#FF4500' },
                    { id: 'angel_ice', name: 'Hielo', price: 200, color: '#B0E0E6' },
                    { id: 'angel_rainbow', name: 'Arcoíris', price: 600, color: '#FF1493' }
                ],
                iris: [
                    { id: 'iris_default', name: 'Clásica', price: 0, color: '#DDA0DD', owned: true },
                    { id: 'iris_nature', name: 'Naturaleza', price: 120, color: '#32CD32' },
                    { id: 'iris_storm', name: 'Tormenta', price: 280, color: '#483D8B' },
                    { id: 'iris_sunset', name: 'Atardecer', price: 450, color: '#FF6347' }
                ]
            },
            killers: {
                vortex: [
                    { id: 'vortex_default', name: 'Clásico', price: 0, color: '#8B0000', owned: true },
                    { id: 'vortex_void', name: 'Vacío', price: 300, color: '#000000' },
                    { id: 'vortex_blood', name: 'Sangre', price: 400, color: '#DC143C' },
                    { id: 'vortex_nightmare', name: 'Pesadilla', price: 800, color: '#4B0082' }
                ]
            }
        };
        
        this.initDefaultSkins();
        this.createShopUI();
        this.createShopMusic();
        console.log('🛒 SkinShop created with', this.coins, 'coins');
    }
    
    initDefaultSkins() {
        Object.values(this.skins.survivors).flat().forEach(skin => {
            if (skin.price === 0) skin.owned = true;
        });
        Object.values(this.skins.killers).flat().forEach(skin => {
            if (skin.price === 0) skin.owned = true;
        });
        
        this.ownedSkins.forEach(skinId => {
            this.markSkinAsOwned(skinId);
        });
    }
    
    markSkinAsOwned(skinId) {
        Object.values(this.skins.survivors).flat().forEach(skin => {
            if (skin.id === skinId) skin.owned = true;
        });
        Object.values(this.skins.killers).flat().forEach(skin => {
            if (skin.id === skinId) skin.owned = true;
        });
    }
    
    createShopUI() {
        const shopHTML = `
            <div id="skinShop" class="skin-shop" style="display: none;">
                <div class="shop-npc-area">
                    <div id="shopNPC" class="shop-npc">
                        <div class="npc-avatar">🛒</div>
                        <div class="npc-dialogue" id="npcDialogue"></div>
                    </div>
                </div>
                <div class="shop-container">
                    <div class="shop-header">
                        <div></div>
                        <h2>🛒 Tienda de Skins</h2>
                        <div class="shop-coins">💰 ${this.coins} monedas</div>
                        <button class="shop-close">✕</button>
                    </div>
                    
                    <div class="shop-tabs">
                        <button class="shop-tab active" data-tab="survivors">👥 Survivors</button>
                        <button class="shop-tab" data-tab="killers">💀 Killers</button>
                    </div>
                    
                    <div class="shop-content">
                        <div id="survivorsTab" class="shop-tab-content active">
                            ${this.generateCharacterIcons('survivors')}
                        </div>
                        <div id="killersTab" class="shop-tab-content">
                            ${this.generateCharacterIcons('killers')}
                        </div>
                        <div id="characterSkinsView" class="character-skins-view" style="display: none;">
                            <button class="back-btn" id="backBtn">← Volver</button>
                            <div id="characterSkinsContent"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', shopHTML);
        this.setupShopEvents();
        this.addShopStyles();
        this.addShopNPC();
    }
    
    generateCharacterIcons(type) {
        const characters = Object.keys(this.skins[type]);
        const iconMap = {
            'gissel': 'GisselInactiveIcon.png',
            'ia777': 'IA777NormalIcon.png',
            'angel': 'AngelNormalIcon.png',
            'iris': 'IrisNormalIcon.png'
        };
        
        let html = '<div class="characters-grid">';
        characters.forEach(character => {
            const skins = this.skins[type][character];
            const ownedCount = skins.filter(skin => skin.owned).length;
            
            if (character === 'vortex') {
                html += `
                    <div class="character-icon" data-character="${character}" data-type="${type}">
                        <div class="character-avatar">🌀</div>
                        <div class="character-name">${character.charAt(0).toUpperCase() + character.slice(1)}</div>
                        <div class="character-progress">${ownedCount}/${skins.length}</div>
                    </div>
                `;
            } else {
                const iconFile = iconMap[character];
                html += `
                    <div class="character-icon" data-character="${character}" data-type="${type}">
                        <div class="character-avatar">
                            <img src="assets/icons/${iconFile}" alt="${character}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
                        </div>
                        <div class="character-name">${character.charAt(0).toUpperCase() + character.slice(1)}</div>
                        <div class="character-progress">${ownedCount}/${skins.length}</div>
                    </div>
                `;
            }
        });
        html += '</div>';
        return html;
    }
    
    generateCharacterSkins(character, type) {
        const skins = this.skins[type][character];
        let html = `
            <div class="character-header">
                <h3>${character.charAt(0).toUpperCase() + character.slice(1)} - Skins</h3>
            </div>
            <div class="skins-grid">
                ${skins.map(skin => this.generateSkinCard(skin, character)).join('')}
            </div>
        `;
        return html;
    }
    
    generateSkinCard(skin, character) {
        const isEquipped = this.equippedSkins[character] === skin.id;
        const canBuy = this.coins >= skin.price && !skin.owned;
        
        return `
            <div class="skin-card ${skin.owned ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}" 
                 data-skin-id="${skin.id}" data-character="${character}">
                <div class="skin-preview" style="background: ${skin.color};">
                    <div class="skin-character">${character.charAt(0).toUpperCase()}</div>
                </div>
                <div class="skin-info">
                    <div class="skin-name">${skin.name}</div>
                    <div class="skin-actions">
                        ${skin.owned ? 
                            (isEquipped ? 
                                '<button class="skin-btn equipped">✓ Equipada</button>' : 
                                '<button class="skin-btn equip">Equipar</button>'
                            ) : 
                            `<button class="skin-btn buy ${canBuy ? '' : 'disabled'}">${skin.price} 💰</button>`
                        }
                    </div>
                </div>
            </div>
        `;
    }
    
    setupShopEvents() {
        document.querySelector('.shop-close').addEventListener('click', () => {
            this.showNPCMessage('exit');
            setTimeout(() => this.close(), 500);
        });
        
        document.querySelectorAll('.shop-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
        
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('buy')) {
                this.buySkin(e.target.closest('.skin-card'));
            } else if (e.target.classList.contains('equip')) {
                this.equipSkin(e.target.closest('.skin-card'));
            } else if (e.target.closest('.character-icon')) {
                this.showCharacterSkins(e.target.closest('.character-icon'));
            } else if (e.target.id === 'backBtn') {
                this.showCharacterSelection();
            }
        });
    }
    
    switchTab(tabName) {
        document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.shop-tab-content').forEach(c => c.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }
    
    async buySkin(skinCard) {
        const skinId = skinCard.dataset.skinId;
        const character = skinCard.dataset.character;
        const skin = this.findSkin(skinId);
        
        if (!skin || skin.owned || this.coins < skin.price) return;
        
        if (!confirm(`¿Comprar ${skin.name} por ${skin.price} monedas?`)) return;
        
        this.coins -= skin.price;
        skin.owned = true;
        this.ownedSkins.push(skinId);
        
        localStorage.setItem('df_coins', this.coins.toString());
        localStorage.setItem('df_owned_skins', JSON.stringify(this.ownedSkins));
        
        await this.syncToSupabase();
        
        this.updateCoinsDisplay();
        this.refreshShop();
        this.equipSkin(skinCard);
        
        console.log(`✅ Skin comprada: ${skin.name}`);
    }
    
    async equipSkin(skinCard) {
        const skinId = skinCard.dataset.skinId;
        const character = skinCard.dataset.character;
        const skin = this.findSkin(skinId);
        
        if (!skin || !skin.owned) return;
        
        this.equippedSkins[character] = skinId;
        localStorage.setItem('df_equipped_skins', JSON.stringify(this.equippedSkins));
        
        await this.syncToSupabase();
        this.broadcastSkins();
        
        this.refreshShop();
        console.log(`✅ Skin equipada: ${skin.name} para ${character}`);
    }
    
    findSkin(skinId) {
        const allSkins = [
            ...Object.values(this.skins.survivors).flat(),
            ...Object.values(this.skins.killers).flat()
        ];
        return allSkins.find(skin => skin.id === skinId);
    }
    
    updateCoinsDisplay() {
        document.querySelector('.shop-coins').textContent = `💰 ${this.coins} monedas`;
    }
    
    refreshShop() {
        document.getElementById('survivorsTab').innerHTML = this.generateCharacterIcons('survivors');
        document.getElementById('killersTab').innerHTML = this.generateCharacterIcons('killers');
        this.updateCoinsDisplay();
    }
    
    showCharacterSkins(characterIcon) {
        const character = characterIcon.dataset.character;
        const type = characterIcon.dataset.type;
        
        document.querySelectorAll('.shop-tab-content').forEach(tab => tab.style.display = 'none');
        document.getElementById('characterSkinsView').style.display = 'block';
        document.getElementById('characterSkinsContent').innerHTML = this.generateCharacterSkins(character, type);
    }
    
    showCharacterSelection() {
        document.getElementById('characterSkinsView').style.display = 'none';
        document.querySelectorAll('.shop-tab-content').forEach(tab => {
            tab.style.display = 'none';
            tab.classList.remove('active');
        });
        const activeTab = document.querySelector('.shop-tab.active').dataset.tab;
        const activeTabElement = document.getElementById(activeTab + 'Tab');
        activeTabElement.style.display = 'block';
        activeTabElement.classList.add('active');
    }
    
    addCoins(amount) {
        this.coins += amount;
        localStorage.setItem('df_coins', this.coins.toString());
        if (this.isOpen) this.updateCoinsDisplay();
        console.log(`💰 +${amount} monedas (Total: ${this.coins})`);
    }
    
    getEquippedSkin(character) {
        return this.equippedSkins[character] || `${character}_default`;
    }
    
    getSkinColor(character) {
        const equippedSkinId = this.getEquippedSkin(character);
        const skin = this.findSkin(equippedSkinId);
        return skin ? skin.color : '#FFFFFF';
    }
    
    open() {
        console.log('🛒 Opening skin shop');
        this.isOpen = true;
        const shopElement = document.getElementById('skinShop');
        if (shopElement) {
            shopElement.style.display = 'flex';
            this.refreshShop();
            this.playShopMusic();
            this.showNPCMessage('enter');
        } else {
            console.error('Shop element not found');
        }
    }
    
    close() {
        this.isOpen = false;
        document.getElementById('skinShop').style.display = 'none';
        this.stopShopMusic();
    }
    
    addShopStyles() {
        const styles = `
            <style>
            .skin-shop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 10000;
                display: grid;
                grid-template-columns: 100px 1fr;
                background: rgba(0,0,0,0.9);
            }
            
            .shop-overlay {
                display: none;
            }
            
            .shop-npc-area {
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(180deg, #1a1a2e, #0a0a0a);
                border-right: 2px solid #FFD700;
            }
            
            .shop-container {
                background: linear-gradient(135deg, #0f0f23, #1a1a2e);
                display: grid;
                grid-template-rows: auto auto 1fr;
                height: 100vh;
            }
            
            .shop-header {
                display: grid;
                grid-template-columns: 1fr auto 1fr;
                align-items: center;
                padding: 20px;
                background: linear-gradient(90deg, rgba(255,215,0,0.1), rgba(255,165,0,0.05));
                border-bottom: 2px solid #FFD700;
            }
            
            .shop-header h2 {
                color: #FFD700;
                margin: 0;
                font-size: 1.8rem;
                text-align: center;
                text-shadow: 0 0 15px rgba(255,215,0,0.8);
            }
            
            .shop-coins {
                color: #FFD700;
                font-weight: bold;
                font-size: 1.1rem;
                text-align: right;
            }
            
            .shop-close {
                background: #ff4757;
                border: none;
                color: white;
                width: 35px;
                height: 35px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 1.1rem;
                transition: all 0.3s;
            }
            
            .shop-close:hover {
                background: #ff3742;
                transform: scale(1.1);
            }
            
            .shop-tabs {
                display: grid;
                grid-template-columns: 1fr 1fr;
                background: rgba(0,0,0,0.3);
            }
            
            .shop-tab {
                padding: 15px;
                background: transparent;
                border: none;
                color: #ccc;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 1rem;
                font-weight: bold;
            }
            
            .shop-tab.active {
                background: rgba(255,215,0,0.2);
                color: #FFD700;
                border-bottom: 3px solid #FFD700;
            }
            
            .shop-content {
                overflow-y: auto;
                padding: 20px;
            }
            
            .shop-tab-content {
                display: none;
            }
            
            .shop-tab-content.active {
                display: block;
            }
            
            .characters-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 20px;
                padding: 20px;
            }
            
            .character-icon {
                background: rgba(255,255,255,0.05);
                border-radius: 15px;
                padding: 20px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
                border: 2px solid transparent;
            }
            
            .character-icon:hover {
                transform: translateY(-5px);
                border-color: #FFD700;
                box-shadow: 0 10px 30px rgba(255,215,0,0.3);
            }
            
            .character-avatar {
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #FFD700, #FFA500);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2rem;
                font-weight: bold;
                color: #000;
                margin: 0 auto 10px;
                border: 3px solid #fff;
            }
            
            .character-name {
                color: #FFD700;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .character-progress {
                color: #ccc;
                font-size: 0.9rem;
            }
            
            .character-skins-view {
                padding: 20px;
            }
            
            .back-btn {
                background: #666;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-bottom: 20px;
                font-size: 1rem;
            }
            
            .back-btn:hover {
                background: #777;
            }
            
            .character-header h3 {
                color: #FFD700;
                margin-bottom: 20px;
                font-size: 1.5rem;
                border-bottom: 2px solid #FFD700;
                padding-bottom: 10px;
            }
            
            .skins-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                gap: 15px;
            }
            
            .skin-card {
                background: rgba(255,255,255,0.05);
                border-radius: 10px;
                padding: 15px;
                text-align: center;
                transition: all 0.3s;
                border: 2px solid transparent;
                cursor: pointer;
            }
            
            .skin-card:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 25px rgba(255,215,0,0.3);
                border-color: rgba(255,215,0,0.5);
            }
            }
            

            
            .skin-card.owned {
                border-color: #00ff00;
            }
            
            .skin-card.equipped {
                border-color: #FFD700;
                background: rgba(255,215,0,0.1);
            }
            
            .skin-preview {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                margin: 0 auto 1rem;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                font-weight: bold;
                color: white;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
            }
            
            .skin-name {
                color: white;
                font-weight: bold;
                margin-bottom: 0.5rem;
            }
            
            .skin-btn {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s;
            }
            
            .skin-btn.buy {
                background: #FFD700;
                color: #000;
            }
            
            .skin-btn.buy:hover {
                background: #FFA500;
            }
            
            .skin-btn.buy.disabled {
                background: #666;
                color: #999;
                cursor: not-allowed;
            }
            
            .skin-btn.equip {
                background: #00ff00;
                color: #000;
            }
            
            .skin-btn.equipped {
                background: #FFD700;
                color: #000;
                cursor: default;
            }
            
            @media (max-width: 768px) {
                .shop-container {
                    width: 95%;
                    height: 90vh;
                }
                
                .skins-grid {
                    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                }
            }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    addShopNPC() {
        const npcStyles = `
            <style>
            .shop-npc {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
            }
            
            .npc-avatar {
                width: 70px;
                height: 70px;
                background: linear-gradient(135deg, #FFD700, #FFA500);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2.5rem;
                border: 3px solid #fff;
                box-shadow: 0 4px 15px rgba(255,215,0,0.5);
                animation: npcBounce 3s ease-in-out infinite;
                margin-bottom: 15px;
            }
            
            .npc-dialogue {
                background: rgba(0,0,0,0.8);
                color: #FFD700;
                padding: 12px 16px;
                border-radius: 15px;
                border: 2px solid #FFD700;
                font-size: 0.85rem;
                font-weight: bold;
                text-align: center;
                min-width: 80px;
                max-width: 90px;
                opacity: 0;
                transform: scale(0.8);
                transition: all 0.4s ease;
                word-wrap: break-word;
            }
            
            .npc-dialogue.show {
                opacity: 1;
                transform: scale(1);
            }
            
            @keyframes npcBounce {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            @media (max-width: 768px) {
                .skin-shop {
                    grid-template-columns: 80px 1fr;
                }
                .npc-avatar {
                    width: 50px;
                    height: 50px;
                    font-size: 2rem;
                }
                .npc-dialogue {
                    font-size: 0.75rem;
                    min-width: 60px;
                    max-width: 70px;
                }
            }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', npcStyles);
    }
    
    showNPCMessage(type) {
        const dialogue = document.getElementById('npcDialogue');
        if (!dialogue) return;
        
        const enterMessages = [
            '¡Bienvenido a mi tienda!',
            '¿Buscas algo especial?',
            'Tengo las mejores skins aquí',
            '¡Ofertas increíbles te esperan!',
            'Cada skin tiene su historia...',
            '¿Qué tal un cambio de look?'
        ];
        
        const exitMessages = [
            '¡Vuelve pronto!',
            'Gracias por tu visita',
            '¡Que disfrutes tu nueva skin!',
            'Siempre estaré aquí',
            'No olvides volver mañana',
            '¡Hasta la próxima!'
        ];
        
        const messages = type === 'enter' ? enterMessages : exitMessages;
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        dialogue.textContent = message;
        dialogue.classList.add('show');
        
        setTimeout(() => {
            dialogue.classList.remove('show');
        }, 3000);
    }
    
    createShopMusic() {
        this.shopMusic = document.createElement('audio');
        this.shopMusic.src = 'assets/shop/shop theme.mp3';
        this.shopMusic.loop = true;
        this.shopMusic.volume = 0.3;
        this.shopMusic.preload = 'auto';
        document.body.appendChild(this.shopMusic);
    }
    
    playShopMusic() {
        if (this.shopMusic) {
            this.shopMusic.currentTime = 0;
            this.shopMusic.play().catch(e => console.log('Shop music autoplay blocked'));
        }
    }
    
    stopShopMusic() {
        if (this.shopMusic) {
            this.shopMusic.pause();
            this.shopMusic.currentTime = 0;
        }
    }
    
    async syncToSupabase() {
        if (!window.supabaseGameInstance?.supabase) return;
        
        try {
            await window.supabaseGameInstance.supabase.from('user_skins').upsert({
                user_id: window.supabaseGameInstance.myPlayerId,
                coins: this.coins,
                owned_skins: this.ownedSkins,
                equipped_skins: this.equippedSkins
            });
        } catch (error) {
            console.error('Error syncing skins to Supabase:', error);
        }
    }
    
    async loadFromSupabase() {
        if (!window.supabaseGameInstance?.supabase) return;
        
        try {
            const { data } = await window.supabaseGameInstance.supabase
                .from('user_skins')
                .select('*')
                .eq('user_id', window.supabaseGameInstance.myPlayerId)
                .single();
                
            if (data) {
                this.coins = data.coins || 1000;
                this.ownedSkins = data.owned_skins || [];
                this.equippedSkins = data.equipped_skins || {};
                
                localStorage.setItem('df_coins', this.coins.toString());
                localStorage.setItem('df_owned_skins', JSON.stringify(this.ownedSkins));
                localStorage.setItem('df_equipped_skins', JSON.stringify(this.equippedSkins));
                
                this.initDefaultSkins();
            }
        } catch (error) {
            console.error('Error loading skins from Supabase:', error);
        }
    }
    
    broadcastSkins() {
        if (window.supabaseGameInstance?.sendSkinSync) {
            window.supabaseGameInstance.sendSkinSync(this.equippedSkins);
        }
    }
}

// Exponer globalmente
window.SkinShop = SkinShop;