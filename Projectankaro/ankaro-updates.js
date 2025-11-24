/**
 * Ankaro Updates System
 * Sistema de actualizaciones para mostrar el changelog del juego
 */

class AnkaroUpdates {
    constructor() {
        this.updates = [];
        this.modal = null;
        this.init();
    }

    async init() {
        await this.loadUpdates();
        this.createModal();
    }

    async loadUpdates() {
        try {
            const response = await fetch('ankaro-updates.json');
            this.updates = await response.json();
        } catch (error) {
            console.error('Error loading updates:', error);
            this.updates = [];
        }
    }

    createModal() {
        // Crear modal HTML
        const modalHTML = `
            <div id="ankaroUpdatesModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; overflow-y: auto;">
                <div style="max-width: 900px; margin: 50px auto; background: linear-gradient(135deg, #1a1a1a, #2d2d2d); border: 2px solid #FFD700; border-radius: 20px; padding: 30px; box-shadow: 0 0 50px rgba(255,215,0,0.5);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                        <h2 style="color: #FFD700; font-size: 2rem; margin: 0;">📋 Ankaro - Update Log</h2>
                        <button onclick="window.ankaroUpdates?.closeModal()" style="background: #ff0000; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-size: 1.2rem; font-weight: bold;">✕</button>
                    </div>
                    <div id="ankaroUpdatesContent"></div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('ankaroUpdatesModal');
        this.renderUpdates();
    }

    renderUpdates() {
        const content = document.getElementById('ankaroUpdatesContent');
        if (!content) return;

        let html = '';

        this.updates.forEach((update, index) => {
            const typeColors = {
                'major': '#ff4444',
                'feature': '#4ecdc4',
                'balance': '#ffa500',
                'hotfix': '#ff6b6b',
                'minor': '#95e1d3'
            };

            const typeColor = typeColors[update.type] || '#888';

            html += `
                <div style="background: rgba(0,0,0,0.6); border: 2px solid ${typeColor}; border-radius: 15px; padding: 20px; margin-bottom: 20px; animation: fadeIn 0.5s ease ${index * 0.1}s both;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <div>
                            <span style="background: ${typeColor}; color: #000; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 0.9rem; text-transform: uppercase;">${update.type}</span>
                            <span style="color: #FFD700; font-size: 1.5rem; font-weight: bold; margin-left: 15px;">${update.version}</span>
                        </div>
                        <span style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">${update.date}</span>
                    </div>
                    <h3 style="color: #fff; font-size: 1.3rem; margin: 10px 0;">${update.title}</h3>
                    <ul style="list-style: none; padding: 0; margin: 15px 0 0 0;">
                        ${update.changes.map(change => `
                            <li style="color: rgba(255,255,255,0.9); padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 0.95rem;">
                                ${change}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        });

        content.innerHTML = html;

        // Añadir animación CSS
        if (!document.getElementById('ankaroUpdatesStyles')) {
            const style = document.createElement('style');
            style.id = 'ankaroUpdatesStyles';
            style.textContent = `
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    showModal() {
        if (this.modal) {
            this.modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
}

// Inicializar cuando el DOM esté listo
if (typeof window !== 'undefined') {
    window.ankaroUpdates = null;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ankaroUpdates = new AnkaroUpdates();
        });
    } else {
        window.ankaroUpdates = new AnkaroUpdates();
    }
}
