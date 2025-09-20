// Three.js 3D Scene for Hero Background
class ThreeScene {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.capsules = [];
        this.particles = [];
        this.mouse = { x: 0, y: 0 };
        
        this.init();
        this.animate();
        this.addEventListeners();
    }
    
    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x667eea, 0.1, 100);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 5;
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        
        const container = document.getElementById('threejs-container');
        if (container) {
            container.appendChild(this.renderer.domElement);
        }
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0x00d4ff, 1);
        directionalLight.position.set(10, 10, 5);
        this.scene.add(directionalLight);
        
        const pointLight = new THREE.PointLight(0x764ba2, 1, 100);
        pointLight.position.set(-10, -10, -5);
        this.scene.add(pointLight);
        
        // Create 3D time capsules
        this.createCapsules();
        
        // Create particle system
        this.createParticles();
        
        // Create floating geometric shapes
        this.createFloatingShapes();
    }
    
    createCapsules() {
        const capsuleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 8);
        const capsuleMaterial = new THREE.MeshPhongMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.8,
            shininess: 100
        });
        
        for (let i = 0; i < 8; i++) {
            const capsule = new THREE.Mesh(capsuleGeometry, capsuleMaterial);
            
            // Random position
            capsule.position.x = (Math.random() - 0.5) * 20;
            capsule.position.y = (Math.random() - 0.5) * 20;
            capsule.position.z = (Math.random() - 0.5) * 20;
            
            // Random rotation
            capsule.rotation.x = Math.random() * Math.PI;
            capsule.rotation.y = Math.random() * Math.PI;
            capsule.rotation.z = Math.random() * Math.PI;
            
            // Random scale
            const scale = 0.5 + Math.random() * 0.5;
            capsule.scale.set(scale, scale, scale);
            
            // Store initial position for animation
            capsule.userData = {
                initialPosition: capsule.position.clone(),
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.02,
                    y: (Math.random() - 0.5) * 0.02,
                    z: (Math.random() - 0.5) * 0.02
                },
                floatSpeed: Math.random() * 0.01 + 0.005
            };
            
            this.capsules.push(capsule);
            this.scene.add(capsule);
        }
    }
    
    createParticles() {
        const particleCount = 200;
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 50;
            positions[i + 1] = (Math.random() - 0.5) * 50;
            positions[i + 2] = (Math.random() - 0.5) * 50;
            
            velocities[i] = (Math.random() - 0.5) * 0.02;
            velocities[i + 1] = (Math.random() - 0.5) * 0.02;
            velocities[i + 2] = (Math.random() - 0.5) * 0.02;
        }
        
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        particles.userData = { velocities: velocities };
        
        this.particles.push(particles);
        this.scene.add(particles);
    }
    
    createFloatingShapes() {
        // Create various geometric shapes floating in the background
        const shapes = [
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.OctahedronGeometry(0.4),
            new THREE.TetrahedronGeometry(0.6),
            new THREE.IcosahedronGeometry(0.4)
        ];
        
        const materials = [
            new THREE.MeshPhongMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.3 }),
            new THREE.MeshPhongMaterial({ color: 0x764ba2, transparent: true, opacity: 0.3 }),
            new THREE.MeshPhongMaterial({ color: 0x667eea, transparent: true, opacity: 0.3 }),
            new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 })
        ];
        
        for (let i = 0; i < 15; i++) {
            const geometry = shapes[Math.floor(Math.random() * shapes.length)];
            const material = materials[Math.floor(Math.random() * materials.length)];
            const shape = new THREE.Mesh(geometry, material);
            
            shape.position.x = (Math.random() - 0.5) * 30;
            shape.position.y = (Math.random() - 0.5) * 30;
            shape.position.z = (Math.random() - 0.5) * 30;
            
            shape.userData = {
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.01,
                    y: (Math.random() - 0.5) * 0.01,
                    z: (Math.random() - 0.5) * 0.01
                }
            };
            
            this.scene.add(shape);
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = Date.now() * 0.001;
        
        // Animate capsules
        this.capsules.forEach((capsule, index) => {
            // Rotation
            capsule.rotation.x += capsule.userData.rotationSpeed.x;
            capsule.rotation.y += capsule.userData.rotationSpeed.y;
            capsule.rotation.z += capsule.userData.rotationSpeed.z;
            
            // Floating motion
            capsule.position.y = capsule.userData.initialPosition.y + 
                                Math.sin(time * capsule.userData.floatSpeed + index) * 2;
            
            // Mouse interaction
            const mouseInfluence = 0.0001;
            capsule.position.x += (this.mouse.x - capsule.position.x) * mouseInfluence;
            capsule.position.y += (this.mouse.y - capsule.position.y) * mouseInfluence;
        });
        
        // Animate particles
        this.particles.forEach(particleSystem => {
            const positions = particleSystem.geometry.attributes.position.array;
            const velocities = particleSystem.userData.velocities;
            
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += velocities[i];
                positions[i + 1] += velocities[i + 1];
                positions[i + 2] += velocities[i + 2];
                
                // Wrap around screen
                if (positions[i] > 25) positions[i] = -25;
                if (positions[i] < -25) positions[i] = 25;
                if (positions[i + 1] > 25) positions[i + 1] = -25;
                if (positions[i + 1] < -25) positions[i + 1] = 25;
                if (positions[i + 2] > 25) positions[i + 2] = -25;
                if (positions[i + 2] < -25) positions[i + 2] = 25;
            }
            
            particleSystem.geometry.attributes.position.needsUpdate = true;
        });
        
        // Animate geometric shapes
        this.scene.children.forEach(child => {
            if (child.userData && child.userData.rotationSpeed) {
                child.rotation.x += child.userData.rotationSpeed.x;
                child.rotation.y += child.userData.rotationSpeed.y;
                child.rotation.z += child.userData.rotationSpeed.z;
            }
        });
        
        // Camera movement based on mouse
        this.camera.position.x += (this.mouse.x * 0.0005 - this.camera.position.x) * 0.05;
        this.camera.position.y += (-this.mouse.y * 0.0005 - this.camera.position.y) * 0.05;
        this.camera.lookAt(this.scene.position);
        
        this.renderer.render(this.scene, this.camera);
    }
    
    addEventListeners() {
        // Mouse movement
        document.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Mobile touch events
        document.addEventListener('touchmove', (event) => {
            if (event.touches.length > 0) {
                this.mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
                this.mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
            }
        });
    }
}

// Initialize the 3D scene when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ThreeScene();
});