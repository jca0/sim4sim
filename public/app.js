// Sim4Sim - Simulation Environment Builder
// Main application logic

class Sim4SimApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.transformControls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Scene objects management
        this.sceneObjects = [];
        this.selectedObject = null;
        
        // File loaders
        this.stlLoader = new THREE.STLLoader();
        
        // API base URL
        this.apiBaseUrl = window.location.origin;
        
        this.init();
        this.setupEventListeners();
        this.loadUploadedFiles();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0); // Light gray background

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(10, 10, 10);
        this.camera.lookAt(0, 0, 0);

        // Renderer setup
        const container = document.getElementById('canvas-container');
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // Lighting
        this.setupLighting();

        // Ground plane
        this.createGroundPlane();

        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Transform controls for object manipulation
        this.transformControls = new THREE.TransformControls(this.camera, this.renderer.domElement);
        this.transformControls.addEventListener('change', () => this.updateTransformInputs());
        this.transformControls.addEventListener('dragging-changed', (event) => {
            this.controls.enabled = !event.value;
        });
        this.scene.add(this.transformControls);

        // Start render loop
        this.animate();
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        this.scene.add(directionalLight);

        // Point light for additional illumination
        const pointLight = new THREE.PointLight(0xffffff, 0.5, 50);
        pointLight.position.set(-10, 10, -10);
        this.scene.add(pointLight);
    }

    createGroundPlane() {
        // Create checkerboard texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        const tileSize = 64; // Size of each checker square
        const tilesPerSide = canvas.width / tileSize;
        
        for (let x = 0; x < tilesPerSide; x++) {
            for (let y = 0; y < tilesPerSide; y++) {
                const isEven = (x + y) % 2 === 0;
                context.fillStyle = isEven ? '#ffffff' : '#e0e0e0';
                context.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 10); // Repeat the pattern across the ground
        
        const geometry = new THREE.PlaneGeometry(50, 50);
        const material = new THREE.MeshLambertMaterial({ 
            map: texture,
            transparent: false
        });
        
        const ground = new THREE.Mesh(geometry, material);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.name = 'ground';
        this.scene.add(ground);

        // Simplified grid helper with subtle lines
        const gridHelper = new THREE.GridHelper(50, 25, 0x999999, 0xbbbbbb);
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.2;
        this.scene.add(gridHelper);
    }

    setupEventListeners() {
        // File input
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Drag and drop
        const container = document.getElementById('canvas-container');
        const dropZone = document.getElementById('dropZone');

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('active');
        });

        container.addEventListener('dragleave', (e) => {
            e.preventDefault();
            if (!container.contains(e.relatedTarget)) {
                dropZone.classList.remove('active');
            }
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('active');
            
            // Get drop position in 3D space
            const rect = container.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            
            this.mouse.x = x;
            this.mouse.y = y;
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            const intersects = this.raycaster.intersectObjects([this.scene.getObjectByName('ground')]);
            const dropPosition = intersects.length > 0 ? intersects[0].point : new THREE.Vector3(0, 0, 0);
            
            this.handleFiles(e.dataTransfer.files, dropPosition);
        });

        // Mouse events for object selection
        this.renderer.domElement.addEventListener('click', (e) => this.onMouseClick(e));

        // Transform input events
        ['posX', 'posY', 'posZ', 'rotX', 'rotY', 'rotZ'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.updateObjectTransform());
        });

        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    async loadUploadedFiles() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/files`);
            const data = await response.json();
            
            if (data.files && data.files.length > 0) {
                console.log('Found uploaded files:', data.files);
                // You could add a UI to show previously uploaded files
            }
        } catch (error) {
            console.error('Error loading uploaded files:', error);
        }
    }

    async handleFiles(files, dropPosition = null) {
        for (const file of Array.from(files)) {
            const extension = file.name.split('.').pop().toLowerCase();
            
            // First upload the file to the server
            try {
                const uploadedFile = await this.uploadFile(file);
                if (uploadedFile) {
                    // Then load it in the scene
                    switch (extension) {
                        case 'stl':
                            await this.loadSTLFile(uploadedFile, dropPosition);
                            break;
                        case 'xml':
                        case 'urdf':
                            await this.loadXMLFile(uploadedFile, dropPosition);
                            break;
                        default:
                            console.warn(`Unsupported file type: ${extension}`);
                    }
                }
            } catch (error) {
                console.error('Error handling file:', error);
                this.showNotification(`Error processing ${file.name}: ${error.message}`, 'error');
            }
        }
    }

    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const result = await response.json();
            this.showNotification(`File ${file.name} uploaded successfully!`, 'success');
            return result.file;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    async loadSTLFile(fileInfo, position = null) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/download/${fileInfo.filename}`);
            const arrayBuffer = await response.arrayBuffer();
            
            const geometry = this.stlLoader.parse(arrayBuffer);
            
            // Center and scale the geometry
            geometry.computeBoundingBox();
            const bbox = geometry.boundingBox;
            const center = bbox.getCenter(new THREE.Vector3());
            geometry.translate(-center.x, -center.y, -center.z);
            
            // Scale to reasonable size
            const size = bbox.getSize(new THREE.Vector3());
            const maxDimension = Math.max(size.x, size.y, size.z);
            const scale = maxDimension > 5 ? 5 / maxDimension : 1;
            geometry.scale(scale, scale, scale);

            const material = new THREE.MeshPhongMaterial({ 
                color: Math.random() * 0xffffff,
                shininess: 100
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData = {
                fileName: fileInfo.originalName,
                fileType: 'stl',
                serverFile: fileInfo
            };

            if (position) {
                mesh.position.copy(position);
                mesh.position.y += size.y * scale / 2; // Place on ground
            }

            this.scene.add(mesh);
            this.addToSceneObjects(mesh);
        } catch (error) {
            console.error('Error loading STL file:', error);
            throw error;
        }
    }

    async loadXMLFile(fileInfo, position = null) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/download/${fileInfo.filename}`);
            const xmlContent = await response.text();
            
            // Create a visual representation for XML/URDF files
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshPhongMaterial({ 
                color: fileInfo.originalName.includes('.urdf') ? 0xff6b6b : 0x4ecdc4,
                transparent: true,
                opacity: 0.8
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData = {
                fileName: fileInfo.originalName,
                fileType: fileInfo.originalName.split('.').pop().toLowerCase(),
                xmlContent: xmlContent,
                serverFile: fileInfo
            };

            if (position) {
                mesh.position.copy(position);
                mesh.position.y += 0.5; // Place on ground
            }

            this.scene.add(mesh);
            this.addToSceneObjects(mesh);
        } catch (error) {
            console.error('Error loading XML file:', error);
            throw error;
        }
    }

    addToSceneObjects(object) {
        this.sceneObjects.push(object);
        this.updateObjectList();
    }

    updateObjectList() {
        const objectList = document.getElementById('objectList');
        
        if (this.sceneObjects.length === 0) {
            objectList.innerHTML = '<div class="help-text">No objects in scene</div>';
            return;
        }

        objectList.innerHTML = this.sceneObjects.map((obj, index) => 
            `<div class="object-item" data-index="${index}">
                ${obj.userData.fileName}
                <small style="display: block; opacity: 0.7;">${obj.userData.fileType.toUpperCase()}</small>
            </div>`
        ).join('');

        // Add click events to object items
        objectList.querySelectorAll('.object-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.selectObject(this.sceneObjects[index]);
            });
        });
    }

    selectObject(object) {
        // Remove previous selection highlighting
        this.sceneObjects.forEach(obj => {
            if (obj.userData.originalMaterial) {
                obj.material = obj.userData.originalMaterial;
                delete obj.userData.originalMaterial;
            }
        });

        // Update UI
        document.querySelectorAll('.object-item').forEach(item => {
            item.classList.remove('selected');
        });

        if (object) {
            this.selectedObject = object;
            
            // Highlight selected object
            object.userData.originalMaterial = object.material;
            object.material = object.material.clone();
            object.material.emissive = new THREE.Color(0x444444);
            
            // Update transform controls
            this.transformControls.attach(object);
            
            // Update UI
            const index = this.sceneObjects.indexOf(object);
            const item = document.querySelector(`[data-index="${index}"]`);
            if (item) item.classList.add('selected');
            
            this.updateTransformInputs();
        } else {
            this.selectedObject = null;
            this.transformControls.detach();
        }
    }

    updateTransformInputs() {
        if (!this.selectedObject) return;

        const pos = this.selectedObject.position;
        const rot = this.selectedObject.rotation;

        document.getElementById('posX').value = pos.x.toFixed(2);
        document.getElementById('posY').value = pos.y.toFixed(2);
        document.getElementById('posZ').value = pos.z.toFixed(2);
        document.getElementById('rotX').value = (rot.x * 180 / Math.PI).toFixed(1);
        document.getElementById('rotY').value = (rot.y * 180 / Math.PI).toFixed(1);
        document.getElementById('rotZ').value = (rot.z * 180 / Math.PI).toFixed(1);
    }

    updateObjectTransform() {
        if (!this.selectedObject) return;

        const posX = parseFloat(document.getElementById('posX').value) || 0;
        const posY = parseFloat(document.getElementById('posY').value) || 0;
        const posZ = parseFloat(document.getElementById('posZ').value) || 0;
        const rotX = parseFloat(document.getElementById('rotX').value) || 0;
        const rotY = parseFloat(document.getElementById('rotY').value) || 0;
        const rotZ = parseFloat(document.getElementById('rotZ').value) || 0;

        this.selectedObject.position.set(posX, posY, posZ);
        this.selectedObject.rotation.set(
            rotX * Math.PI / 180,
            rotY * Math.PI / 180,
            rotZ * Math.PI / 180
        );
    }

    onMouseClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.sceneObjects);

        if (intersects.length > 0) {
            this.selectObject(intersects[0].object);
        } else {
            this.selectObject(null);
        }
    }

    onWindowResize() {
        const container = document.getElementById('canvas-container');
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    async exportScene() {
        const sceneData = {
            objects: this.sceneObjects.map(obj => ({
                fileName: obj.userData.fileName,
                fileType: obj.userData.fileType,
                position: {
                    x: obj.position.x,
                    y: obj.position.y,
                    z: obj.position.z
                },
                rotation: {
                    x: obj.rotation.x,
                    y: obj.rotation.y,
                    z: obj.rotation.z
                },
                scale: {
                    x: obj.scale.x,
                    y: obj.scale.y,
                    z: obj.scale.z
                }
            }))
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/export`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sceneData)
            });

            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'simulation_scene.xml';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showNotification('Scene exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Export failed: ' + error.message, 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
            word-wrap: break-word;
        `;

        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#4caf50';
                break;
            case 'error':
                notification.style.backgroundColor = '#f44336';
                break;
            case 'warning':
                notification.style.backgroundColor = '#ff9800';
                break;
            default:
                notification.style.backgroundColor = '#2196f3';
        }

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Global export function for the button
function exportScene() {
    if (window.sim4sim) {
        window.sim4sim.exportScene();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sim4sim = new Sim4SimApp();
}); 