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
                ],
                shadow: [
                    { id: 'shadow_default', name: 'Clásico', price: 0, color: '#2F4F4F', owned: true },
                    { id: 'shadow_crimson', name: 'Carmesí', price: 350, color: '#8B0000' },
                    { id: 'shadow_toxic', name: 'Tóxico', price: 500, color: '#ADFF2F' },
                    { id: 'shadow_phantom', name: 'Fantasma', price: 750, color: '#9370DB' }
                ]
            }
        };
        
        this.initDefaultSkins();
        this.createShopUI();
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
                <div class="shop-overlay"></div>
                <div class="shop-container">
                    <div class="shop-header">
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
                            ${this.generateSurvivorSkins()}
                        </div>
                        <div id="killersTab" class="shop-tab-content">
                            ${this.generateKillerSkins()}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', shopHTML);
        this.setupShopEvents();
        this.addShopStyles();
    }
    
    generateSurvivorSkins() {
        let html = '';
        Object.entries(this.skins.survivors).forEach(([character, skins]) => {
            html += `
                <div class="character-section">
                    <h3>${character.charAt(0).toUpperCase() + character.slice(1)}</h3>
                    <div class="skins-grid">
                        ${skins.map(skin => this.generateSkinCard(skin, character)).join('')}
                    </div>
                </div>
            `;
        });
        return html;
    }
    
    generateKillerSkins() {
        let html = '';
        Object.entries(this.skins.killers).forEach(([character, skins]) => {
            html += `
                <div class="character-section">
                    <h3>${character.charAt(0).toUpperCase() + character.slice(1)}</h3>
                    <div class="skins-grid">
                        ${skins.map(skin => this.generateSkinCard(skin, character)).join('')}
                    </div>
                </div>
            `;
        });
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
        document.querySelector('.shop-close').addEventListener('click', () => this.close());
        document.querySelector('.shop-overlay').addEventListener('click', () => this.close());
        
        document.querySelectorAll('.shop-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
        
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('buy')) {
                this.buySkin(e.target.closest('.skin-card'));
            } else if (e.target.classList.contains('equip')) {
                this.equipSkin(e.target.closest('.skin-card'));
            }
        });
    }
    
    switchTab(tabName) {
        document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.shop-tab-content').forEach(c => c.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }
    
    buySkin(skinCard) {
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
        
        this.updateCoinsDisplay();
        this.refreshShop();
        this.equipSkin(skinCard);
        
        console.log(`✅ Skin comprada: ${skin.name}`);
    }
    
    equipSkin(skinCard) {
        const skinId = skinCard.dataset.skinId;
        const character = skinCard.dataset.character;
        const skin = this.findSkin(skinId);
        
        if (!skin || !skin.owned) return;
        
        this.equippedSkins[character] = skinId;
        localStorage.setItem('df_equipped_skins', JSON.stringify(this.equippedSkins));
        
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
        document.getElementById('survivorsTab').innerHTML = this.generateSurvivorSkins();
        document.getElementById('killersTab').innerHTML = this.generateKillerSkins();
        this.updateCoinsDisplay();
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
        } else {
            console.error('Shop element not found');
        }
    }
    
    close() {
        this.isOpen = false;
        document.getElementById('skinShop').style.display = 'none';
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
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .shop-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
            }
            
            .shop-container {
                position: relative;
                width: 90%;
                max-width: 800px;
                height: 80vh;
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border-radius: 15px;
                border: 2px solid #FFD700;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .shop-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                background: rgba(255,215,0,0.1);
                border-bottom: 1px solid #FFD700;
            }
            
            .shop-header h2 {
                color: #FFD700;
                margin: 0;
            }
            
            .shop-coins {
                color: #FFD700;
                font-weight: bold;
                font-size: 1.1rem;
            }
            
            .shop-close {
                background: #ff4757;
                border: none;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 1rem;
            }
            
            .shop-tabs {
                display: flex;
                background: rgba(0,0,0,0.3);
            }
            
            .shop-tab {
                flex: 1;
                padding: 1rem;
                background: transparent;
                border: none;
                color: #ccc;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .shop-tab.active {
                background: rgba(255,215,0,0.2);
                color: #FFD700;
                border-bottom: 2px solid #FFD700;
            }
            
            .shop-content {
                flex: 1;
                overflow-y: auto;
                padding: 1rem;
            }
            
            .shop-tab-content {
                display: none;
            }
            
            .shop-tab-content.active {
                display: block;
            }
            
            .character-section {
                margin-bottom: 2rem;
            }
            
            .character-section h3 {
                color: #FFD700;
                margin-bottom: 1rem;
                text-transform: capitalize;
            }
            
            .skins-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 1rem;
            }
            
            .skin-card {
                background: rgba(255,255,255,0.1);
                border-radius: 10px;
                padding: 1rem;
                text-align: center;
                transition: all 0.3s;
                border: 2px solid transparent;
            }
            
            .skin-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 5px 15px rgba(255,215,0,0.3);
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
}

// Exponer globalmente
window.SkinShop = SkinShop;