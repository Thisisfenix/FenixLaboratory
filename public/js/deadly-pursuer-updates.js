class DeadlyPursuerUpdates {
    constructor() {
        this.updates = [];
        this.currentPage = 0;
        this.updatesPerPage = 3;
        this.init();
    }

    async init() {
        await this.loadUpdates();
        this.createUpdateModal();
        this.setupEventListeners();
    }

    async loadUpdates() {
        try {
            const response = await fetch('./deadly-pursuer-updates.json');
            this.updates = await response.json();
        } catch (error) {
            console.error('Error loading Deadly Pursuer updates:', error);
            this.updates = [];
        }
    }

    createUpdateModal() {
        const modal = document.createElement('div');
        modal.id = 'deadlyPursuerUpdatesModal';
        modal.className = 'update-modal';
        modal.innerHTML = `
            <div class="update-modal-content">
                <div class="update-modal-header">
                    <h2>🎮 Deadly Pursuer - Update Log</h2>
                    <button class="update-modal-close">&times;</button>
                </div>
                <div class="update-modal-body">
                    <div id="deadlyPursuerUpdatesList" class="updates-list"></div>
                    <div class="updates-pagination">
                        <button id="prevUpdatesBtn" class="pagination-btn">← Anterior</button>
                        <span id="updatesPageInfo" class="page-info"></span>
                        <button id="nextUpdatesBtn" class="pagination-btn">Siguiente →</button>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .update-modal {
                display: none;
                position: fixed;
                z-index: 10000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.8);
                backdrop-filter: blur(5px);
            }

            .update-modal-content {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
                margin: 5% auto;
                padding: 0;
                border: 2px solid #7289DA;
                border-radius: 15px;
                width: 90%;
                max-width: 800px;
                max-height: 80vh;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            }

            .update-modal-header {
                background: linear-gradient(90deg, #7289DA, #5865F2);
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #4f5acb;
            }

            .update-modal-header h2 {
                margin: 0;
                color: white;
                font-size: 1.5rem;
                font-weight: bold;
            }

            .update-modal-close {
                background: none;
                border: none;
                color: white;
                font-size: 2rem;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.3s;
            }

            .update-modal-close:hover {
                background-color: rgba(255,255,255,0.2);
            }

            .update-modal-body {
                padding: 20px;
                max-height: 60vh;
                overflow-y: auto;
            }

            .updates-list {
                margin-bottom: 20px;
            }

            .update-item {
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(114, 137, 218, 0.3);
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 15px;
                transition: all 0.3s ease;
            }

            .update-item:hover {
                background: rgba(255,255,255,0.08);
                border-color: #7289DA;
                transform: translateY(-2px);
            }

            .update-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                flex-wrap: wrap;
                gap: 10px;
            }

            .update-version {
                font-size: 1.2rem;
                font-weight: bold;
                color: #FFD700;
            }

            .update-date {
                color: #99AAB5;
                font-size: 0.9rem;
            }

            .update-type {
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: bold;
                text-transform: uppercase;
            }

            .update-type.major {
                background: linear-gradient(45deg, #FF6B6B, #FF8E53);
                color: white;
            }

            .update-type.feature {
                background: linear-gradient(45deg, #4ECDC4, #44A08D);
                color: white;
            }

            .update-type.balance {
                background: linear-gradient(45deg, #FFD93D, #FF6B6B);
                color: white;
            }

            .update-type.hotfix {
                background: linear-gradient(45deg, #A8E6CF, #7FCDCD);
                color: white;
            }

            .update-title {
                color: white;
                font-size: 1.1rem;
                font-weight: bold;
                margin-bottom: 10px;
            }

            .update-changes {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .update-changes li {
                color: #DCDDDE;
                padding: 5px 0;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                transition: color 0.3s;
            }

            .update-changes li:last-child {
                border-bottom: none;
            }

            .update-changes li:hover {
                color: #7289DA;
            }

            .updates-pagination {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 20px;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid rgba(114, 137, 218, 0.3);
            }

            .pagination-btn {
                background: linear-gradient(45deg, #7289DA, #5865F2);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 25px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s;
            }

            .pagination-btn:hover:not(:disabled) {
                background: linear-gradient(45deg, #5865F2, #4752C4);
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(114, 137, 218, 0.4);
            }

            .pagination-btn:disabled {
                background: #36393f;
                color: #72767d;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }

            .page-info {
                color: #99AAB5;
                font-weight: bold;
            }

            /* Mobile responsive */
            @media (max-width: 768px) {
                .update-modal-content {
                    width: 95%;
                    margin: 2% auto;
                    max-height: 90vh;
                }

                .update-modal-header h2 {
                    font-size: 1.2rem;
                }

                .update-header {
                    flex-direction: column;
                    align-items: flex-start;
                }

                .updates-pagination {
                    flex-direction: column;
                    gap: 10px;
                }

                .pagination-btn {
                    width: 100%;
                    max-width: 200px;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(modal);
    }

    setupEventListeners() {
        const modal = document.getElementById('deadlyPursuerUpdatesModal');
        const closeBtn = modal.querySelector('.update-modal-close');
        const prevBtn = document.getElementById('prevUpdatesBtn');
        const nextBtn = document.getElementById('nextUpdatesBtn');

        // Close modal
        closeBtn.addEventListener('click', () => this.hideModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideModal();
        });

        // Pagination
        prevBtn.addEventListener('click', () => this.previousPage());
        nextBtn.addEventListener('click', () => this.nextPage());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (modal.style.display === 'block') {
                if (e.key === 'Escape') this.hideModal();
                if (e.key === 'ArrowLeft') this.previousPage();
                if (e.key === 'ArrowRight') this.nextPage();
            }
        });
    }

    showModal() {
        const modal = document.getElementById('deadlyPursuerUpdatesModal');
        modal.style.display = 'block';
        this.currentPage = 0;
        this.renderUpdates();
        document.body.style.overflow = 'hidden';
    }

    hideModal() {
        const modal = document.getElementById('deadlyPursuerUpdatesModal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    renderUpdates() {
        const updatesList = document.getElementById('deadlyPursuerUpdatesList');
        const startIndex = this.currentPage * this.updatesPerPage;
        const endIndex = startIndex + this.updatesPerPage;
        const pageUpdates = this.updates.slice(startIndex, endIndex);

        updatesList.innerHTML = pageUpdates.map(update => `
            <div class="update-item">
                <div class="update-header">
                    <div class="update-version">${update.version}</div>
                    <div class="update-type ${update.type}">${update.type}</div>
                    <div class="update-date">${update.date}</div>
                </div>
                <div class="update-title">${update.title}</div>
                <ul class="update-changes">
                    ${update.changes.map(change => `<li>${change}</li>`).join('')}
                </ul>
            </div>
        `).join('');

        this.updatePagination();
    }

    updatePagination() {
        const totalPages = Math.ceil(this.updates.length / this.updatesPerPage);
        const prevBtn = document.getElementById('prevUpdatesBtn');
        const nextBtn = document.getElementById('nextUpdatesBtn');
        const pageInfo = document.getElementById('updatesPageInfo');

        prevBtn.disabled = this.currentPage === 0;
        nextBtn.disabled = this.currentPage >= totalPages - 1;
        pageInfo.textContent = `${this.currentPage + 1} / ${totalPages}`;
    }

    previousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.renderUpdates();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.updates.length / this.updatesPerPage);
        if (this.currentPage < totalPages - 1) {
            this.currentPage++;
            this.renderUpdates();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.deadlyPursuerUpdates = new DeadlyPursuerUpdates();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeadlyPursuerUpdates;
}