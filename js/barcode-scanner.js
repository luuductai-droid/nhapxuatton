// Barcode Scanner Module
class BarcodeScanner {
    constructor(onScanSuccess, onScanError) {
        this.onScanSuccess = onScanSuccess;
        this.onScanError = onScanError;
        this.scanner = null;
        this.isScanning = false;
    }

   async initialize() {
    try {

        // xin quyền camera
        await navigator.mediaDevices.getUserMedia({ video: true });

        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');

        if (!hasCamera) {
            throw new Error('No camera found');
        }

        this.scanner = new Html5Qrcode("reader");

        return true;

    } catch (error) {

        console.error('Scanner initialization failed:', error);

        return false;

    }
}

    async start() {

    if (this.isScanning) {
        return;
    }

    try {

        const config = {
            fps: 10,
            qrbox: 250,
            aspectRatio: 1.777
        };

        // lấy danh sách camera
        const cameras = await Html5Qrcode.getCameras();

        if (!cameras || cameras.length === 0) {
            throw new Error("No camera found");
        }

        // camera sau (thường là camera cuối)
        const cameraId = cameras[cameras.length - 1].id;

        await this.scanner.start(
            cameraId,
            config,
            this.handleScanSuccess.bind(this),
            this.handleScanError.bind(this)
        );

        this.isScanning = true;

        document.getElementById('startScanBtn').style.display = 'none';
        document.getElementById('stopScanBtn').style.display = 'block';

    } catch (error) {

        console.error('Failed to start scanner:', error);

        if (this.onScanError) {
            this.onScanError(error.message);
        }

    }

}
    stop() {
        if (this.scanner && this.isScanning) {
            this.scanner.stop()
                .then(() => {
                    this.isScanning = false;
                    document.getElementById('startScanBtn').style.display = 'block';
                    document.getElementById('stopScanBtn').style.display = 'none';
                })
                .catch(error => {
                    console.error('Failed to stop scanner:', error);
                });
        }
    }

    handleScanSuccess(decodedText, decodedResult) {
        // Vibrate if supported
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }

        // Play beep sound
        this.playBeep();

        if (this.onScanSuccess) {
            this.onScanSuccess(decodedText);
        }

        // Optional: Auto-stop after successful scan
        // this.stop();
    }

    handleScanError(error) {
        // Ignore common errors that don't affect functionality
        if (error.includes('No MultiFormat Readers were able to detect')) {
            return;
        }
        
        console.warn('Scan error:', error);
        if (this.onScanError) {
            this.onScanError(error);
        }
    }

    playBeep() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);

            // Clean up
            oscillator.onended = () => {
                oscillator.disconnect();
                gainNode.disconnect();
            };
        } catch (error) {
            console.log('Beep not supported');
        }
    }

    isScanningActive() {
        return this.isScanning;
    }
}
