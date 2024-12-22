async function main() {
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('outputCanvas');
    const context = canvas.getContext('2d');

    const videoWidth = 640;
    const videoHeight = 480;

    video.width = videoWidth;
    video.height = videoHeight;
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    async function setupCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: videoWidth, height: videoHeight }
            });
            video.srcObject = stream;
            console.log("Camera setup successful");
            return new Promise(resolve => video.onloadedmetadata = resolve);
        } catch (error) {
            console.error("Error accessing the webcam:", error);
        }
    }

    // Load Face Detection Model
    let detector;
    try {
        const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const detectorConfig = { runtime: 'tfjs', modelType: 'short' };
        detector = await faceDetection.createDetector(model, detectorConfig);
        console.log("Face detector loaded successfully");
    } catch (error) {
        console.error("Error loading face detection model:", error);
    }

    // THREE.js Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add Lighting
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 1, 1).normalize();
    scene.add(directionalLight);

    // Add OrbitControls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);

    // GLTF Model Loading
    let model;
    const loader = new THREE.GLTFLoader();
    loader.load(
        './scene.glb', // Replace with your GLTF model path
        (gltf) => {
            model = gltf.scene;
            model.scale.set(0.1, 0.1, 0.1); // Adjust scale to make the model smaller
            model.position.set(0, 0, 0); // Ensure the model is positioned correctly
            scene.add(model);
            console.log("Model loaded successfully");
        },
        undefined,
        (error) => console.error('Error loading GLTF model:', error)
    );

    camera.position.set(0, 0, 10); // Move the camera further away and adjust its height

    // Face Detection Function
    async function detectFaces() {
        try {
            context.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
            context.drawImage(video, 0, 0, videoWidth, videoHeight); // Draw video frame

            const faces = await detector.estimateFaces(video);

            if (faces.length > 0) {
                faces.forEach(face => {
                    const { box } = face; // Extract box coordinates
                    if (box) {
                        // Map head movements to the model
                        mapHeadMovements(box, videoWidth, videoHeight);

                        console.log(box);
                    }
                });
            } else {
                console.log("No face detected");
            }
        } catch (error) {
            console.error("Error detecting faces:", error);
        }

        requestAnimationFrame(detectFaces); // Repeat for real-time tracking
    }

    // Map Head Movement Using Bounding Box Center
    function mapHeadMovements(box, videoWidth, videoHeight) {
        if (model && box) {
            const { xMin, yMin, width, height } = box;

            // Calculate center of the bounding box
            const xCenter = xMin + width / 2;
            const yCenter = yMin + height / 2;

            // Normalize the center position to range [-1, 1]
            const normalizedX = (xCenter / videoWidth) * 2 - 1;
            const normalizedY = (yCenter / videoHeight) * 2 - 1;

            // Invert the normalized values to make the model turn in the opposite direction
            model.rotation.y = -normalizedX * Math.PI * 0.8; // Horizontal rotation
            model.rotation.x = normalizedY * Math.PI * 0.5; // Vertical rotation

            console.log(`Rotations - X: ${model.rotation.x}, Y: ${model.rotation.y}`);
        }
    }

    // Start Camera and Detection
    await setupCamera();
    if (detector) {
        detectFaces();
    } else {
        console.error("Face detector not initialized properly.");
    }

    function animate() {
        requestAnimationFrame(animate);
        controls.update(); // Update controls
        renderer.render(scene, camera);
    }

    animate();
}

main();
