// Main JavaScript functionality for Digital Time Capsule
class DigitalTimeCapsule {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializeAnimations();
        this.loadStats();
        if (window.location.pathname === '/gallery') {
            this.loadGallery();
        }
    }
    
    setupEventListeners() {
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Form submission handling
        const createForm = document.getElementById('create-capsule-form');
        if (createForm) {
            createForm.addEventListener('submit', this.handleFormSubmission.bind(this));
        }
        
        // File upload preview
        const fileInput = document.getElementById('media-upload');
        if (fileInput) {
            fileInput.addEventListener('change', this.handleFilePreview.bind(this));
        }
        
        // Navbar background on scroll
        window.addEventListener('scroll', this.handleNavbarScroll.bind(this));
    }
    
    initializeAnimations() {
        // Animate stats counters
        this.animateCounters();
        
        // Animate elements on scroll
        this.setupScrollAnimations();
        
        // Add entrance animations
        this.addEntranceAnimations();
    }
    
    animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        
        const animateCounter = (counter) => {
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = 2000; // 2 seconds
            const increment = target / (duration / 16); // 60fps
            let current = 0;
            
            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    counter.textContent = Math.floor(current).toLocaleString();
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target.toLocaleString();
                }
            };
            
            updateCounter();
        };
        
        // Start animation when stats section is visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    counters.forEach(counter => {
                        if (!counter.classList.contains('animated')) {
                            counter.classList.add('animated');
                            animateCounter(counter);
                        }
                    });
                }
            });
        });
        
        const statsSection = document.querySelector('.stats');
        if (statsSection) {
            observer.observe(statsSection);
        }
    }
    
    setupScrollAnimations() {
        const animateOnScroll = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        };
        
        const observer = new IntersectionObserver(animateOnScroll, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        // Observe elements with data-aos attribute
        document.querySelectorAll('[data-aos]').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s ease';
            observer.observe(el);
        });
    }
    
    addEntranceAnimations() {
        // Add staggered animation to feature cards
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = `all 0.6s ease ${index * 0.1}s`;
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 500 + index * 100);
        });
    }
    
    handleNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.backdropFilter = 'blur(20px)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.1)';
            navbar.style.backdropFilter = 'blur(20px)';
        }
    }
    
    async handleFormSubmission(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        // Show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading"></span> Creating Capsule...';
        
        try {
            const response = await fetch('/api/capsules', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showMessage('Time capsule created successfully! 🎉', 'success');
                form.reset();
                
                // Redirect to gallery after a delay
                setTimeout(() => {
                    window.location.href = '/gallery';
                }, 2000);
            } else {
                this.showMessage(result.error || 'Failed to create time capsule', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    }
    
    handleFilePreview(event) {
        const file = event.target.files[0];
        const preview = document.getElementById('file-preview');
        
        if (file && preview) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                if (file.type.startsWith('image/')) {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 10px;">`;
                } else if (file.type.startsWith('video/')) {
                    preview.innerHTML = `<video controls style="max-width: 100%; max-height: 200px; border-radius: 10px;"><source src="${e.target.result}" type="${file.type}"></video>`;
                } else {
                    preview.innerHTML = `<p>File selected: ${file.name}</p>`;
                }
            };
            
            reader.readAsDataURL(file);
        }
    }
    
    showMessage(text, type) {
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        
        const form = document.querySelector('.form-container') || document.querySelector('.container');
        if (form) {
            form.insertBefore(message, form.firstChild);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                message.remove();
            }, 5000);
        }
    }
    
    async loadStats() {
        try {
            const response = await fetch('/api/capsules');
            const capsules = await response.json();
            
            if (Array.isArray(capsules)) {
                const totalCapsules = capsules.length;
                const unlockedCapsules = capsules.filter(c => c.is_unlocked).length;
                const totalDays = capsules.reduce((sum, capsule) => {
                    const unlockDate = new Date(capsule.unlock_date);
                    const createdDate = new Date(capsule.created_date);
                    const days = Math.ceil((unlockDate - createdDate) / (1000 * 60 * 60 * 24));
                    return sum + days;
                }, 0);
                
                // Update stat counters
                const counters = document.querySelectorAll('.stat-number');
                if (counters[0]) counters[0].setAttribute('data-target', totalCapsules);
                if (counters[1]) counters[1].setAttribute('data-target', unlockedCapsules);
                if (counters[2]) counters[2].setAttribute('data-target', totalDays);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }
    
    async loadGallery() {
        const galleryContainer = document.getElementById('gallery-container');
        if (!galleryContainer) return;
        
        try {
            const response = await fetch('/api/capsules');
            const capsules = await response.json();
            
            if (Array.isArray(capsules)) {
                galleryContainer.innerHTML = '';
                
                if (capsules.length === 0) {
                    galleryContainer.innerHTML = '<p style="text-align: center; color: #666; font-size: 1.2rem;">No time capsules yet. <a href="/create">Create the first one!</a></p>';
                    return;
                }
                
                capsules.forEach(capsule => {
                    const capsuleElement = this.createCapsuleCard(capsule);
                    galleryContainer.appendChild(capsuleElement);
                });
                
                // Start countdown timers
                this.startCountdownTimers();
            }
        } catch (error) {
            console.error('Failed to load gallery:', error);
            galleryContainer.innerHTML = '<p style="text-align: center; color: #ff6b6b;">Failed to load capsules. Please refresh the page.</p>';
        }
    }
    
    createCapsuleCard(capsule) {
        const card = document.createElement('div');
        card.className = `capsule-card ${capsule.is_unlocked ? 'unlocked' : 'locked'}`;
        
        const unlockDate = new Date(capsule.unlock_date);
        const now = new Date();
        const isUnlocked = capsule.is_unlocked || unlockDate <= now;
        
        card.innerHTML = `
            <h3 class="capsule-title">${this.escapeHtml(capsule.title)}</h3>
            <div class="capsule-meta">
                <span>By: ${this.escapeHtml(capsule.creator_name || 'Anonymous')}</span>
                <span>Created: ${new Date(capsule.created_date).toLocaleDateString()}</span>
            </div>
            
            ${!isUnlocked ? `
                <div class="countdown" data-unlock-date="${capsule.unlock_date}">
                    <div class="countdown-timer" id="countdown-${capsule.id}">
                        Calculating...
                    </div>
                    <div>Time until unlock</div>
                </div>
            ` : `
                <div class="message success">🎉 Capsule Unlocked!</div>
                ${capsule.media_type && capsule.media_type.startsWith('image/') ? 
                    `<img src="/uploads/${capsule.media_path}" alt="Capsule media" class="media-preview">` : ''
                }
                ${capsule.media_type && capsule.media_type.startsWith('video/') ? 
                    `<video controls class="media-preview"><source src="/uploads/${capsule.media_path}" type="${capsule.media_type}"></video>` : ''
                }
            `}
            
            <button class="btn btn-primary" onclick="viewCapsule(${capsule.id})">
                ${isUnlocked ? 'View Contents' : 'View Details'}
            </button>
        `;
        
        return card;
    }
    
    startCountdownTimers() {
        const countdowns = document.querySelectorAll('[data-unlock-date]');
        
        const updateCountdown = (element) => {
            const unlockDate = new Date(element.getAttribute('data-unlock-date'));
            const now = new Date();
            const difference = unlockDate - now;
            
            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                
                const countdownElement = element.querySelector('.countdown-timer');
                if (countdownElement) {
                    countdownElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
                }
            } else {
                // Time's up! Reload the gallery to show unlocked content
                location.reload();
            }
        };
        
        countdowns.forEach(countdown => {
            updateCountdown(countdown);
        });
        
        // Update every second
        setInterval(() => {
            countdowns.forEach(countdown => {
                updateCountdown(countdown);
            });
        }, 1000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global function for viewing capsules
window.viewCapsule = async function(id) {
    try {
        const response = await fetch(`/api/capsules/${id}`);
        const capsule = await response.json();
        
        if (response.ok) {
            // Create a modal or redirect to a detail page
            alert(`Capsule: ${capsule.title}\n\nMessage: ${capsule.message || 'Content is sealed until unlock date'}\n\nCreated: ${new Date(capsule.created_date).toLocaleString()}\nUnlocks: ${new Date(capsule.unlock_date).toLocaleString()}`);
        } else {
            alert('Failed to load capsule details');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Network error. Please try again.');
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DigitalTimeCapsule();
});