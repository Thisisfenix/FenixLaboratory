// Voice.js - Sistema de voz con WebRTC
class VoiceChat {
    constructor() {
        this.peer = null;
        this.localStream = null;
        this.connections = new Map();
        this.isMuted = false;
        this.isEnabled = false;
    }

    async init(playerId) {
        try {
            // Crear peer con servidor público alternativo
            this.peer = new Peer(playerId, {
                host: '0.peerjs.com',
                secure: true,
                port: 443,
                path: '/'
            });

            this.peer.on('open', (id) => {
                console.log('Voice chat ready:', id);
            });

            this.peer.on('call', (call) => {
                this.handleIncomingCall(call);
            });

            this.peer.on('error', (err) => {
                // Ignorar errores de conexión no críticos
                if (err.type !== 'network' && err.type !== 'peer-unavailable') {
                    console.error('Peer error:', err);
                }
            });

            return true;
        } catch (error) {
            console.error('Voice init error:', error);
            return false;
        }
    }

    async enableMicrophone() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: true
                },
                video: false 
            });
            
            this.isEnabled = true;
            console.log('Microphone enabled');
            return true;
        } catch (error) {
            console.error('Microphone error:', error);
            return false;
        }
    }

    callPeer(peerId) {
        if (!this.localStream || !this.peer) return;

        const call = this.peer.call(peerId, this.localStream);
        
        call.on('stream', (remoteStream) => {
            this.playRemoteAudio(peerId, remoteStream);
        });

        call.on('close', () => {
            this.removeConnection(peerId);
        });

        this.connections.set(peerId, call);
    }

    handleIncomingCall(call) {
        if (!this.localStream) return;

        call.answer(this.localStream);
        
        call.on('stream', (remoteStream) => {
            this.playRemoteAudio(call.peer, remoteStream);
        });

        call.on('close', () => {
            this.removeConnection(call.peer);
        });

        this.connections.set(call.peer, call);
    }

    playRemoteAudio(peerId, stream) {
        let audio = document.getElementById(`audio-${peerId}`);
        
        if (!audio) {
            audio = document.createElement('audio');
            audio.id = `audio-${peerId}`;
            audio.autoplay = true;
            audio.volume = 1.0;
            document.body.appendChild(audio);
        }

        audio.srcObject = stream;
        audio.play().catch(e => console.log('Audio play error:', e));
    }

    removeConnection(peerId) {
        const audio = document.getElementById(`audio-${peerId}`);
        if (audio) audio.remove();
        
        this.connections.delete(peerId);
    }

    toggleMute() {
        if (!this.localStream) return;

        this.isMuted = !this.isMuted;
        this.localStream.getAudioTracks().forEach(track => {
            track.enabled = !this.isMuted;
        });

        return this.isMuted;
    }
    
    mute() {
        if (!this.localStream) return;
        this.isMuted = true;
        this.localStream.getAudioTracks().forEach(track => {
            track.enabled = false;
        });
    }
    
    unmute() {
        if (!this.localStream) return;
        this.isMuted = false;
        this.localStream.getAudioTracks().forEach(track => {
            track.enabled = true;
        });
    }

    disconnect() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }

        this.connections.forEach((call) => call.close());
        this.connections.clear();

        if (this.peer) {
            this.peer.destroy();
        }

        this.isEnabled = false;
    }
}

const voiceChat = new VoiceChat();
