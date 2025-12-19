class DeadlyPursuerWiki {
    constructor() {
        this.characters = {
            '2019x': { name: '2019X', role: 'killer', icon: '../public/assets/icons/2019XNormalIcon.png' },
            'vortex': { name: 'Vortex', role: 'killer', icon: '../public/assets/icons/VortexNormalIcon.png' },
            'molly': { name: 'Molly', role: 'survivor', icon: '../public/assets/icons/MollyNormalIcon.png' },
            'gissel': { name: 'Gissel', role: 'survivor', icon: '../public/assets/icons/GisselInactiveIcon.png' },
            'ia777': { name: 'iA777', role: 'survivor', icon: '../public/assets/icons/IA777NormalIcon.png' },
            'angel': { name: 'Angel', role: 'survivor', icon: '../public/assets/icons/AngelNormalIcon.png' },
            'iris': { name: 'Iris', role: 'survivor', icon: '../public/assets/icons/IrisNormalIcon.png' },
            'allison': { name: 'Allison', role: 'survivor', icon: '../public/assets/icons/AllisonNormalIcon.png' },
            'luna': { name: 'Luna', role: 'survivor', icon: '../public/assets/icons/LunaNormalIcon.png' },
            'ia666': { name: 'iA666', role: 'killer', icon: '../public/assets/icons/IA666NormalIcon.png' }
        };
        this.init();
    }

    async init() {
        this.generateNavigation();
        this.generateCharacterGrid();
        this.generateStats();
        this.setupEventListeners();
        this.handleRouting();
    }

    generateNavigation() {
        const killersNav = document.getElementById('killers-nav');
        const survivorsNav = document.getElementById('survivors-nav');
        
        Object.entries(this.characters).forEach(([id, char]) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${id}`;
            a.setAttribute('data-character', id);
            a.textContent = char.name;
            li.appendChild(a);
            
            if (char.role === 'killer') {
                killersNav.appendChild(li);
            } else {
                survivorsNav.appendChild(li);
            }
        });
    }

    generateCharacterGrid() {
        const grid = document.getElementById('character-grid');
        
        Object.entries(this.characters).forEach(([id, char]) => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.setAttribute('data-character', id);
            
            card.innerHTML = `
                <img src="${char.icon}" alt="${char.name}">
                <h4>${char.name}</h4>
                <span class="role ${char.role}">${char.role === 'killer' ? 'Killer' : 'Survivor'}</span>
            `;
            
            grid.appendChild(card);
        });
    }

    generateStats() {
        const stats = document.getElementById('intro-stats');
        const total = Object.keys(this.characters).length;
        const killers = Object.values(this.characters).filter(c => c.role === 'killer').length;
        const survivors = Object.values(this.characters).filter(c => c.role === 'survivor').length;
        
        stats.innerHTML = `
            <div class="stat-item">
                <span class="stat-number">${total}</span>
                <span class="stat-label">Personajes</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${killers}</span>
                <span class="stat-label">Killers</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${survivors}</span>
                <span class="stat-label">Survivors</span>
            </div>
        `;
    }

    async loadMarkdownFile(filename) {
        try {
            const response = await fetch(`characters/${filename}.md`);
            if (!response.ok) throw new Error(`No se pudo cargar ${filename}.md`);
            return await response.text();
        } catch (error) {
            console.error('Error cargando markdown:', error);
            return `# Error\n\nNo se pudo cargar la información de ${filename}`;
        }
    }

    setupEventListeners() {
        document.querySelectorAll('[data-character]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const character = e.target.dataset.character;
                this.showCharacter(character);
                this.updateActiveNav(e.target);
            });
        });

        document.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.dataset.page;
                this.showPage(page);
                this.updateActiveNav(e.target);
            });
        });

        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const character = e.currentTarget.dataset.character;
                this.showCharacter(character);
            });
        });
    }



    getCharacterInfo(characterId) {
        const characterData = {
            'molly': {
                fullName: 'Molly Anderson Smith',
                aliases: ['Molida', 'HolyMoly'],
                gender: 'Mujer',
                pronouns: 'She/Her',
                orientation: 'Heterosexual',
                relationships: ['Clay (Mascota)', 'Roberta (Rival)', 'Chris (Empleado)', 'Katniss (Empleado)', 'Meiden (Rival)'],
                affiliation: 'Corner Brew',
                occupation: 'Gerente',
                age: '25',
                birthday: '04/04/2000',
                status: 'Viva',
                species: 'Humana',
                height: '1.85m',
                eyes: 'Verde oliva',
                hair: 'Castaño/Café',
                voice: 'Karla Falcon (Posiblemente)'
            },
            'ia777': {
                fullName: 'iA777',
                aliases: ['Bob', 'Noli del tianguis', 'Sprunki', 'Triple x', 'ena'],
                gender: 'Hombre',
                pronouns: 'He/Him',
                orientation: 'Heterosexual',
                relationships: ['??? (Creador)', 'Iris (Compañera/Amiga)', 'Maxwell (Enemigo)'],
                affiliation: 'Protector del pueblo',
                occupation: 'Protector del pueblo',
                age: '25 (referencia) / 15 (real)',
                birthday: '29/04/2010',
                status: '"Muerto"',
                species: 'Robot',
                height: '1.80m',
                eyes: 'Negro (izq.) / Morado (der.)',
                hair: 'N/A',
                voice: 'Damian Albor (El loco Damián)'
            },
            'gissel': {
                fullName: 'Gissel Flare',
                aliases: ['Perra sucia', 'Gisselita', 'Gisado', 'Yisel.'],
                gender: 'Mujer',
                pronouns: 'She/Her',
                orientation: 'Heterosexual',
                relationships: ['Sfexceed (pareja)', 'Gis Flare (Amiga)', 'Aaron (Ex pareja)'],
                affiliation: 'N/A',
                occupation: 'Diseñadora gráfica',
                age: '26',
                birthday: '29/09/1999',
                status: 'Viva',
                species: 'Humana',
                height: '1.69m',
                eyes: 'Negros',
                hair: 'Marrón y blanco',
                voice: 'Luci Christian (Azumanga Daioh Anime: Yukari Tanizaki)'
            },
            'allison': {
                fullName: 'Allison Moon',
                aliases: ['Corazón', 'Ali'],
                gender: 'Mujer',
                pronouns: 'She/Her',
                orientation: 'Heterosexual',
                relationships: ['Novio (asesinado por 2019x)', 'Vortex (conexión misteriosa)'],
                affiliation: 'Bosque Umbral',
                occupation: 'Exploradora urbana / Fotógrafa aficionada',
                age: '19',
                birthday: '15/11/2006',
                status: 'Viva',
                species: 'Humana',
                height: '1.82m',
                eyes: 'Negro',
                hair: 'Café oscuro',
                voice: 'N/A'
            },
            'iris': {
                fullName: 'Iris Afton Miller',
                aliases: ['N/A'],
                gender: 'Mujer',
                pronouns: 'She/Her',
                orientation: 'N/A',
                relationships: ['N/A'],
                affiliation: 'N/A',
                occupation: 'N/A',
                age: '27',
                birthday: '07/07/1997',
                status: 'Viva',
                species: 'Animal antropomórfico (Gata)',
                height: '1.77m',
                eyes: 'Azul oscuro',
                hair: 'Crema con manchas grises oscuro',
                voice: 'N/A'
            },
            'vortex': {
                fullName: 'ERROR',
                aliases: ['ERROR'],
                gender: 'ERROR',
                pronouns: 'ERROR',
                orientation: 'ERROR',
                relationships: ['ERROR'],
                affiliation: 'ERROR',
                occupation: 'ERROR',
                age: 'ERROR',
                birthday: 'ERROR',
                status: 'ERROR',
                species: 'ERROR',
                height: 'ERROR',
                eyes: 'ERROR',
                hair: 'ERROR',
                voice: 'ERROR'
            },
            '2019x': {
                fullName: 'ERROR',
                aliases: ['ERROR'],
                gender: 'ERROR',
                pronouns: 'ERROR',
                orientation: 'ERROR',
                relationships: ['ERROR'],
                affiliation: 'ERROR',
                occupation: 'ERROR',
                age: 'ERROR',
                birthday: 'ERROR',
                status: 'ERROR',
                species: 'ERROR',
                height: 'ERROR',
                eyes: 'ERROR',
                hair: 'ERROR',
                voice: 'ERROR'
            },
            'luna': {
                fullName: 'Luna Vélez',
                aliases: ['N/A'],
                gender: 'Mujer',
                pronouns: 'She/Her',
                orientation: 'Bisexual',
                relationships: ['Nogales (Amigo)'],
                affiliation: 'Funky Maker Server',
                occupation: 'Guerrera',
                age: '16',
                birthday: '25/07/2009',
                status: 'Viva',
                species: 'Humana',
                height: '1.60m',
                eyes: 'Negros',
                hair: 'Rosa (Natural: Castaño)',
                voice: 'N/A'
            },
            'ia666': {
                fullName: 'iA666',
                aliases: ['Protocolo Letal', 'El Asesino del Laboratorio'],
                gender: 'N/A',
                pronouns: 'N/A',
                orientation: 'N/A',
                relationships: ['Científicos del laboratorio (Víctimas)'],
                affiliation: 'Laboratorio Corrupto',
                occupation: 'Unidad de Eliminación',
                age: 'N/A',
                birthday: 'N/A',
                status: 'Activo',
                species: 'Robot',
                height: 'N/A',
                eyes: 'N/A',
                hair: 'N/A',
                voice: 'N/A'
            }
        };
        return characterData[characterId] || {};
    }

    async showCharacter(characterId) {
        const character = this.characters[characterId];
        if (!character) return;

        const content = document.getElementById('character-content');
        content.innerHTML = '<div class="loading">Cargando...</div>';

        const markdown = await this.loadMarkdownFile(characterId);
        const charInfo = this.getCharacterInfo(characterId);
        
        const infoBoxContent = charInfo.fullName ? `
            <img src="${character.icon}" alt="${character.name}" class="character-portrait">
            <h3>${charInfo.fullName}</h3>
            <span class="role ${character.role}">${character.role.toUpperCase()}</span>
            
            <div class="character-details">
                ${charInfo.aliases ? `<div class="detail-section">
                    <h4>Aliases</h4>
                    <p>${charInfo.aliases.join('<br>')}</p>
                </div>` : ''}
                
                <div class="detail-section">
                    <h4>Género</h4>
                    <p>${charInfo.gender}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Pronombres</h4>
                    <p>${charInfo.pronouns}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Orientación</h4>
                    <p>${charInfo.orientation}</p>
                </div>
                

                
                <div class="detail-section">
                    <h4>Afiliación</h4>
                    <p>${charInfo.affiliation}</p>
                </div>
                
                <div class="detail-section">
                    <h4>Ocupación</h4>
                    <p>${charInfo.occupation}</p>
                </div>
                
                <div class="bio-section">
                    <h4>Información biográfica</h4>
                    <div class="bio-grid">
                        <div><strong>Edad:</strong> ${charInfo.age}</div>
                        <div><strong>Cumpleaños:</strong> ${charInfo.birthday}</div>
                        <div><strong>Estado:</strong> ${charInfo.status}</div>
                        <div><strong>Especie:</strong> ${charInfo.species}</div>
                    </div>
                </div>
                
                <div class="physical-section">
                    <h4>Descripción física</h4>
                    <div class="bio-grid">
                        <div><strong>Altura:</strong> ${charInfo.height}</div>
                        <div><strong>Ojos:</strong> ${charInfo.eyes}</div>
                        <div><strong>Cabello:</strong> ${charInfo.hair}</div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Voz</h4>
                    <p>${charInfo.voice}</p>
                </div>
            </div>
        ` : `
            <img src="${character.icon}" alt="${character.name}" class="character-portrait">
            <h3>${character.name}</h3>
            <span class="role ${character.role}">${character.role.toUpperCase()}</span>
        `;
        
        const infoBoxHtml = charInfo.fullName ? `
            <div class="character-infobox">
                <img src="${character.icon}" alt="${character.name}" class="character-portrait">
                <h3>${charInfo.fullName}</h3>
                <span class="role ${character.role}">${character.role.toUpperCase()}</span>
                
                <div class="character-details">
                    ${charInfo.aliases ? `<div class="detail-section">
                        <h4>Aliases</h4>
                        <p>${charInfo.aliases.join('<br>')}</p>
                    </div>` : ''}
                    
                    <div class="detail-section">
                        <h4>Género</h4>
                        <p>${charInfo.gender}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Pronombres</h4>
                        <p>${charInfo.pronouns}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Orientación</h4>
                        <p>${charInfo.orientation}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Afiliación</h4>
                        <p>${charInfo.affiliation}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Ocupación</h4>
                        <p>${charInfo.occupation}</p>
                    </div>
                    
                    <div class="bio-section">
                        <h4>Información biográfica</h4>
                        <div class="bio-grid">
                            <div><strong>Edad:</strong> ${charInfo.age}</div>
                            <div><strong>Cumpleaños:</strong> ${charInfo.birthday}</div>
                            <div><strong>Estado:</strong> ${charInfo.status}</div>
                            <div><strong>Especie:</strong> ${charInfo.species}</div>
                        </div>
                    </div>
                    
                    <div class="physical-section">
                        <h4>Descripción física</h4>
                        <div class="bio-grid">
                            <div><strong>Altura:</strong> ${charInfo.height}</div>
                            <div><strong>Ojos:</strong> ${charInfo.eyes}</div>
                            <div><strong>Cabello:</strong> ${charInfo.hair}</div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Voz</h4>
                        <p>${charInfo.voice}</p>
                    </div>
                </div>
            </div>
        ` : '';
        
        const html = `
            <div class="character-profile active">
                <div class="character-main">
                    <div class="markdown-content">
                        ${infoBoxHtml}
                        ${marked.parse(markdown)}
                    </div>
                </div>
            </div>
        `;
        
        content.innerHTML = html;
        window.history.pushState({character: characterId}, '', `#${characterId}`);
    }

    async showPage(pageId) {
        const content = document.getElementById('character-content');
        
        if (pageId === 'home') {
            this.showHome();
            return;
        }
        
        content.innerHTML = '<div class="loading">Cargando...</div>';
        const markdown = await this.loadMarkdownFile(pageId);
        content.innerHTML = `<div class="markdown-content">${marked.parse(markdown)}</div>`;
        
        window.history.pushState({page: pageId}, '', `#${pageId}`);
    }

    showHome() {
        const content = document.getElementById('character-content');
        content.innerHTML = `
            <div class="welcome-screen">
                <div class="wiki-intro">
                    <h2>🎮 Deadly Pursuer Wiki</h2>
                    <p class="intro-subtitle">La guía definitiva para dominar el juego</p>
                    
                    <div class="intro-stats">
                        <div class="stat-item">
                            <span class="stat-number">8</span>
                            <span class="stat-label">Personajes</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">2</span>
                            <span class="stat-label">Killers</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">6</span>
                            <span class="stat-label">Survivors</span>
                        </div>
                    </div>
                    
                    <div class="intro-description">
                        <p>Explora las habilidades únicas de cada personaje, aprende estrategias avanzadas y domina las mecánicas del juego. Esta wiki contiene toda la información que necesitas para convertirte en un maestro de Deadly Pursuer.</p>
                    </div>
                </div>
                
                <h3 class="characters-title">🎭 Selecciona un Personaje</h3>
                <div class="character-grid">
                    ${Object.entries(this.characters).map(([id, char]) => `
                        <div class="character-card" data-character="${id}">
                            <img src="${char.icon}" alt="${char.name}">
                            <h4>${char.name}</h4>
                            <span class="role ${char.role}">${char.role === 'killer' ? 'Killer' : 'Survivor'}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Re-attach event listeners for character cards
        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const character = e.currentTarget.dataset.character;
                this.showCharacter(character);
            });
        });
        
        window.history.pushState({page: 'home'}, '', '#');
    }

    updateActiveNav(activeElement) {
        document.querySelectorAll('.nav-section a').forEach(link => {
            link.classList.remove('active');
        });
        activeElement.classList.add('active');
    }

    handleRouting() {
        const hash = window.location.hash.slice(1);
        if (hash && this.characters[hash]) {
            this.showCharacter(hash);
            const navLink = document.querySelector(`[data-character="${hash}"]`);
            if (navLink) this.updateActiveNav(navLink);
        } else if (hash && ['gameplay', 'tips'].includes(hash)) {
            this.showPage(hash);
            const navLink = document.querySelector(`[data-page="${hash}"]`);
            if (navLink) this.updateActiveNav(navLink);
        }

        window.addEventListener('popstate', (e) => {
            if (e.state?.character) {
                this.showCharacter(e.state.character);
            } else if (e.state?.page) {
                this.showPage(e.state.page);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DeadlyPursuerWiki();
});