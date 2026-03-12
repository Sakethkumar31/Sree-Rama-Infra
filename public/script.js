// ========================================
// SREE RAMA INFRA - Premium JavaScript
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all functions
    initNavbar();
    initPropertyFilters();
    initMap();
    initChatWidget();
    initContactForm();
    initNewsletterForm();
    initSmoothScroll();
    initAnimations();
    initInterestForm();
    initSiteMeta();
});

const ADMIN_WHATSAPP_URL = 'https://wa.me/918956923456';
const CHAT_PROFILE_KEY = 'sree-rama-chat-profile';
const CHAT_SESSION_KEY = 'sree-rama-chat-session';
let siteMeta = null;
let activeChatSessionId = localStorage.getItem(CHAT_SESSION_KEY) || '';
let chatPollTimer = null;

// ========================================
// NAVBAR SCROLL EFFECT
// ========================================
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close mobile menu on link click
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
}

// ========================================
    // PROPERTY FILTERS (BUY/SELL/RENT)
    // ========================================
function initPropertyFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const propertiesGrid = document.getElementById('properties-grid');
        
        // Load all properties initially
        loadProperties('all');
        
        // Filter button click handler
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Get purpose and load properties
                const purpose = btn.dataset.purpose;
                loadProperties(purpose);
            });
        });
    }

async function loadProperties(purpose) {
    const grid = document.getElementById('properties-grid');
    
    try {
        const response = await fetch(`/api/properties?purpose=${purpose}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const properties = await response.json();
        currentProperties = properties;
        
        if (properties.length === 0) {
            currentProperties = [];
            grid.innerHTML = '<p class="no-properties">No properties found for this category.</p>';
            return;
        }
        
        grid.innerHTML = properties.map(property => createPropertyCard(property)).join('');
        
    } catch (error) {
        console.error('Error loading properties:', error);
        grid.innerHTML = `<p class="error-message">Failed to load properties. Please try again later.<br><small>Error: ${error.message}</small></p>`;
    }
}

// ========================================
// MAP INTEGRATION WITH LEAFLET
// ========================================
let map;
let markers = [];

function initMap() {
    // Initialize map when section is visible
    const mapSection = document.getElementById('map');
    if (!mapSection) return;

    const mapContainer = document.getElementById('property-map');
    if (typeof L === 'undefined') {
        if (mapContainer) {
            mapContainer.innerHTML = '<p class="error-message">Map is temporarily unavailable.</p>';
        }
        return;
    }
    
    // Create map centered on Hyderabad
    map = L.map('property-map').setView([17.3850, 78.4867], 11);
    
    // Add dark theme tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);
    
    // Load property locations
    loadMapLocations();
}

async function loadMapLocations() {
    try {
        const response = await fetch('/api/locations');
        const locations = await response.json();
        
        // Clear existing markers
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];
        
        // Custom icons
        const icons = {
            buy: createCustomIcon('#c9a227'),
            rent: createCustomIcon('#22c55e'),
            sell: createCustomIcon('#3b82f6')
        };
        
        locations.forEach(loc => {
            const icon = icons[loc.purpose] || icons.buy;
            
            const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(map);
            
            // Create popup content
            const popupContent = `
                <div class="map-popup">
                    <img src="${loc.image}" alt="${loc.title}">
                    <div class="map-popup-content">
                        <div class="map-popup-title">${loc.title}</div>
                        <div class="map-popup-location">${loc.location}</div>
                        <div class="map-popup-price">${loc.price}</div>
                    </div>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            marker.on('click', () => showPropertyDetails(loc.id));
            markers.push(marker);
        });

        if (markers.length > 0) {
            const group = L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.15));
        }
        
    } catch (error) {
        console.error('Error loading map locations:', error);
    }
}

function createCustomIcon(color) {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            background: ${color};
            width: 30px;
            height: 30px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        ">
            <i class="fas fa-home" style="transform: rotate(45deg); color: white; font-size: 12px;"></i>
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
}

// ========================================
// CHAT WIDGET
// ========================================
function initChatWidget() {
    const chatToggle = document.getElementById('chat-toggle');
    const chatWidget = document.getElementById('chat-widget');
    const chatHeader = document.getElementById('chat-header');
    const chatClose = document.getElementById('chat-close');
    const chatForm = document.getElementById('chat-form');
    const quickActions = document.getElementById('chat-quick-actions');
    const editProfileBtn = document.getElementById('chat-edit-profile');
    const messageInput = document.getElementById('chat-message');
    hydrateChatProfile();
    syncChatSession();
    
    // Toggle chat widget
    if (chatToggle && chatWidget) {
        chatToggle.addEventListener('click', () => {
            chatWidget.classList.toggle('active');
            if (chatWidget.classList.contains('active')) {
                chatToggle.style.display = 'none';
                startChatPolling();
                syncChatSession();
            } else {
                stopChatPolling();
            }
        });
        
        // Close button
        chatClose.addEventListener('click', () => {
            chatWidget.classList.remove('active');
            chatToggle.style.display = 'flex';
            stopChatPolling();
        });
        
        // Header click to toggle
        chatHeader.addEventListener('click', (e) => {
            if (e.target !== chatClose) {
                chatWidget.classList.remove('active');
                chatToggle.style.display = 'flex';
                stopChatPolling();
            }
        });
        
        // Chat form submission
        if (chatForm) {
            chatForm.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && !event.shiftKey && event.target.id === 'chat-message') {
                    event.preventDefault();
                    chatForm.requestSubmit();
                }
            });

            chatForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const name = document.getElementById('chat-name').value;
                const email = document.getElementById('chat-email').value;
                const message = document.getElementById('chat-message').value;
                
                const chatMessages = document.getElementById('chat-messages');
                const submitBtn = chatForm.querySelector('button[type="submit"]');

                if (!name || !email || !message.trim()) {
                    showToast('error', 'Missing Details', 'Please add your name, email, and message.');
                    return;
                }

                saveChatProfile(name, email);
                appendChatMessage('user', message, null, null, false);
                
                // Clear input
                document.getElementById('chat-message').value = '';
                autoGrowTextarea(document.getElementById('chat-message'));
                
                // Scroll to bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending';
                }
                showTypingIndicator();
                
                // Send to server
                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name,
                            email,
                            message,
                            sessionId: activeChatSessionId || undefined
                        })
                    });
                    const result = await response.json();
                    if (!response.ok || !result.success) {
                        throw new Error(result.message || 'Chat could not be sent.');
                    }

                    if (result.sessionId) {
                        activeChatSessionId = result.sessionId;
                        localStorage.setItem(CHAT_SESSION_KEY, activeChatSessionId);
                    }
                    removeTypingIndicator();
                    renderChatThread(result.thread?.messages || []);
                    setTimeout(() => {
                        appendChatMessage('bot', `Thank you, ${name}. ${result.message}`, null, `ack-${Date.now()}`);
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }, 500);
                    
                } catch (error) {
                    removeTypingIndicator();
                    console.error('Chat error:', error);
                    appendChatMessage('bot', 'The chat could not be sent right now. Please try again or continue on WhatsApp.');
                } finally {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
                    }
                }
            });
        }

        if (quickActions) {
            quickActions.addEventListener('click', (event) => {
                const chip = event.target.closest('.chat-chip');
                if (!chip) return;

                const messageInput = document.getElementById('chat-message');
                if (messageInput) {
                    messageInput.value = chip.dataset.message || '';
                    messageInput.focus();
                }
            });
        }

        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                const identityGrid = document.getElementById('chat-identity-grid');
                if (identityGrid) {
                    identityGrid.classList.toggle('collapsed');
                }
            });
        }

        if (messageInput) {
            messageInput.addEventListener('input', () => autoGrowTextarea(messageInput));
        }
    }
}

async function initSiteMeta() {
    try {
        const response = await fetch('/api/meta');
        siteMeta = await response.json();
        applyMetaToChat();
    } catch (error) {
        console.error('Meta load failed:', error);
    }
}

function applyMetaToChat() {
    if (!siteMeta) return;

    const statusNote = document.querySelector('.chat-status-note');
    const chatMessages = document.getElementById('chat-messages');
    const quickActions = document.getElementById('chat-quick-actions');
    const sendBtn = document.querySelector('#chat-form .btn-chat');
    const settings = siteMeta.settings || {};
    const directMode = Boolean(settings.adminAvailable);
    const note = directMode
        ? 'Admin is available now for direct one-to-one conversation.'
        : (settings.availabilityNote || 'Leave your message and our team will respond soon.');

    if (statusNote) {
        statusNote.textContent = note;
    }

    if (sendBtn) {
        sendBtn.innerHTML = directMode
            ? '<i class="fas fa-paper-plane"></i> Send Directly'
            : '<i class="fas fa-paper-plane"></i> Send';
    }

    if (quickActions) {
        quickActions.classList.toggle('live-mode', directMode);
    }

    if (chatMessages && !chatMessages.querySelector('.chat-message.system')) {
        appendSystemChatMessage(note);
    }
}

function appendSystemChatMessage(text) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const existing = chatMessages.querySelector('.chat-message.system');
    if (existing) {
        existing.querySelector('p').textContent = text;
        return;
    }

    const systemMsg = document.createElement('div');
    systemMsg.className = 'chat-message bot system';
    systemMsg.innerHTML = `<p>${text}</p>`;
    chatMessages.appendChild(systemMsg);
}

function renderChatThread(messages) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const intro = `
        <div class="chat-message bot intro">
            <p>Hello, this is the Sree Rama Infra admin desk.</p>
            <span class="chat-time">Now</span>
        </div>
    `;
    chatMessages.innerHTML = intro;
    if (siteMeta?.settings) {
        const directMode = Boolean(siteMeta.settings.adminAvailable);
        const note = directMode
            ? 'Admin is available now for direct one-to-one conversation.'
            : (siteMeta.settings.availabilityNote || 'Leave your message and our team will respond soon.');
        appendSystemChatMessage(note);
    }

    messages.forEach((entry) => {
        const role = entry.sender === 'admin' ? 'bot' : 'user';
        appendChatMessage(role, entry.text, formatChatTime(entry.createdAt), entry.id, false);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendChatMessage(role, text, timeLabel, messageId, scroll = true) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    if (messageId && chatMessages.querySelector(`[data-message-id="${messageId}"]`)) {
        return;
    }

    const message = document.createElement('div');
    message.className = `chat-message ${role}`;
    if (messageId) {
        message.dataset.messageId = messageId;
    }
    message.innerHTML = `
        <p>${text}</p>
        <span class="chat-time">${timeLabel || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    `;
    chatMessages.appendChild(message);

    if (scroll) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages || chatMessages.querySelector('.chat-message.typing')) return;

    const typing = document.createElement('div');
    typing.className = 'chat-message bot typing';
    typing.innerHTML = '<p>Admin is typing...</p>';
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    document.querySelector('.chat-message.typing')?.remove();
}

async function syncChatSession() {
    if (!activeChatSessionId) return;

    try {
        const response = await fetch(`/api/chat/session/${activeChatSessionId}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Could not load chat thread.');
        }

        renderChatThread(result.thread?.messages || []);
    } catch (error) {
        console.error('Chat sync failed:', error);
        activeChatSessionId = '';
        localStorage.removeItem(CHAT_SESSION_KEY);
    }
}

function startChatPolling() {
    stopChatPolling();
    chatPollTimer = setInterval(() => {
        syncChatSession();
    }, 5000);
}

function stopChatPolling() {
    if (chatPollTimer) {
        clearInterval(chatPollTimer);
        chatPollTimer = null;
    }
}

function formatChatTime(value) {
    if (!value) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function saveChatProfile(name, email) {
    localStorage.setItem(CHAT_PROFILE_KEY, JSON.stringify({ name, email }));
    hydrateChatProfile();
}

function hydrateChatProfile() {
    const profile = JSON.parse(localStorage.getItem(CHAT_PROFILE_KEY) || '{}');
    const nameInput = document.getElementById('chat-name');
    const emailInput = document.getElementById('chat-email');
    const profileCard = document.getElementById('chat-profile-card');
    const profileName = document.getElementById('chat-profile-name');
    const profileEmail = document.getElementById('chat-profile-email');
    const identityGrid = document.getElementById('chat-identity-grid');

    if (nameInput && profile.name) {
        nameInput.value = profile.name;
    }
    if (emailInput && profile.email) {
        emailInput.value = profile.email;
    }
    if (profileCard && profileName && profileEmail) {
        const hasProfile = Boolean(profile.name && profile.email);
        profileCard.classList.toggle('active', hasProfile);
        profileName.textContent = hasProfile ? profile.name : 'Start your chat';
        profileEmail.textContent = hasProfile ? profile.email : 'Tell us your name and email once, then continue chatting.';
        if (identityGrid) {
            identityGrid.classList.toggle('collapsed', hasProfile);
        }
    }
}

function autoGrowTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
}

// ========================================
// CONTACT FORM
// ========================================
function initContactForm() {
    const form = document.getElementById('contact-form');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                message: formData.get('message')
            };
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showToast('success', 'Message Sent', result.message);
                    form.reset();
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                showToast('error', 'Send Failed', 'Failed to send message. Please try again.');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// ========================================
// SMOOTH SCROLL
// ========================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = target.offsetTop - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ========================================
// ANIMATIONS ON SCROLL
// ========================================
function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements
    document.querySelectorAll('.property-card, .service-card, .about-content, .contact-info, .feature').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    // Add animation class
    document.addEventListener('scroll', () => {
        document.querySelectorAll('.property-card, .service-card, .about-content, .contact-info, .feature').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight - 100) {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }
        });
    });
}

// ========================================
// ADDITIONAL UTILITIES
// ========================================

// Lazy loading images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Counter animation for hero stats
function animateCounters() {
    const counters = document.querySelectorAll('.stat-num');
    
    counters.forEach(counter => {
        const target = parseInt(counter.textContent);
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current) + '+';
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target + '+';
            }
        };
        
        updateCounter();
    });
}

// Initialize counters on page load
animateCounters();

// ========================================
// CALCULATOR FUNCTIONS
// ========================================

// Format number to Indian currency
function formatCurrency(num) {
    if (num >= 10000000) {
        return '₹' + (num / 10000000).toFixed(2) + ' Crore';
    } else if (num >= 100000) {
        return '₹' + (num / 100000).toFixed(2) + ' Lakh';
    } else if (num >= 1000) {
        return '₹' + (num / 1000).toFixed(2) + ' Thousand';
    }
    return '₹' + num.toLocaleString('en-IN');
}

// Update tenure display
function updateTenure() {
    const tenure = document.getElementById('loan-tenure').value;
    document.getElementById('tenure-value').textContent = tenure + ' years';
}

// Update eligibility tenure display
function updateEligibilityTenure() {
    const tenure = document.getElementById('eligibility-tenure').value;
    document.getElementById('eligibility-tenure-value').textContent = tenure + ' years';
}

// EMI Calculator
function calculateEMI() {
    const propertyPrice = parseFloat(document.getElementById('property-price').value) || 0;
    const downPayment = parseFloat(document.getElementById('down-payment').value) || 0;
    const interestRate = parseFloat(document.getElementById('interest-rate').value) || 0;
    const tenureYears = parseInt(document.getElementById('loan-tenure').value) || 20;
    
    const principal = propertyPrice - downPayment;
    const monthlyRate = interestRate / 12 / 100;
    const numberOfEmis = tenureYears * 12;
    
    if (principal <= 0 || interestRate <= 0) {
        showToast('error', 'Invalid Values', 'Please enter valid values');
        return;
    }
    
    // EMI Formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfEmis) / (Math.pow(1 + monthlyRate, numberOfEmis) - 1);
    
    const totalPayment = emi * numberOfEmis;
    const totalInterest = totalPayment - principal;
    
    document.getElementById('monthly-emi').textContent = formatCurrency(Math.round(emi));
    document.getElementById('total-interest').textContent = formatCurrency(Math.round(totalInterest));
    document.getElementById('total-payment').textContent = formatCurrency(Math.round(totalPayment));
}

// Rental Yield Calculator
function calculateYield() {
    const propertyPrice = parseFloat(document.getElementById('rental-property-price').value) || 0;
    const monthlyRent = parseFloat(document.getElementById('monthly-rent').value) || 0;
    const maintenanceCost = parseFloat(document.getElementById('maintenance-cost').value) || 0;
    
    if (propertyPrice <= 0) {
        showToast('error', 'Invalid Price', 'Please enter valid property price');
        return;
    }
    
    const annualRent = monthlyRent * 12;
    const grossYield = (annualRent / propertyPrice) * 100;
    const netYield = ((annualRent - maintenanceCost) / propertyPrice) * 100;
    
    document.getElementById('annual-income').textContent = formatCurrency(annualRent);
    document.getElementById('gross-yield').textContent = grossYield.toFixed(2) + '%';
    document.getElementById('net-yield').textContent = netYield.toFixed(2) + '%';
}

// Loan Eligibility Calculator
function calculateEligibility() {
    const monthlyIncome = parseFloat(document.getElementById('monthly-income').value) || 0;
    const existingEmis = parseFloat(document.getElementById('existing-emis').value) || 0;
    const interestRate = parseFloat(document.getElementById('eligibility-rate').value) || 0;
    const tenureYears = parseInt(document.getElementById('eligibility-tenure').value) || 20;
    
    if (monthlyIncome <= 0) {
        showToast('error', 'Invalid Income', 'Please enter valid monthly income');
        return;
    }
    
    // Maximum EMI should not exceed 50% of monthly income
    const maxEmi = monthlyIncome * 0.5;
    const availableForEmi = maxEmi - existingEmis;
    
    if (availableForEmi <= 0) {
        showToast('error', 'Eligibility Failed', 'Your existing EMIs exceed the allowed limit');
        return;
    }
    
    const monthlyRate = interestRate / 12 / 100;
    const numberOfEmis = tenureYears * 12;
    
    // Calculate maximum loan from EMI
    const maxLoan = availableForEmi * (Math.pow(1 + monthlyRate, numberOfEmis) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, numberOfEmis));
    
    // Property value is typically 75-80% of loan + down payment
    const eligibleProperty = maxLoan + (maxLoan * 0.25); // Assuming 25% down payment
    
    document.getElementById('max-loan').textContent = formatCurrency(Math.round(maxLoan));
    document.getElementById('eligible-property').textContent = formatCurrency(Math.round(eligibleProperty));
}

// ========================================
// PREMIUM ENHANCEMENTS - NEW FEATURES
// ========================================

// Global state
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let currentProperties = [];

// Initialize premium features
document.addEventListener('DOMContentLoaded', () => {
    initFavorites();
    initAdvancedSearch();
    initPriceRange();
    initBedroomButtons();
    updateTenure();
    updateEligibilityTenure();
});

// ========================================
// FAVORITES SYSTEM
// ========================================
function initFavorites() {
    updateFavoritesCount();
    renderFavoritesList();
}

function addToFavorites(property) {
    if (!favorites.find(f => f.id === property.id)) {
        favorites.push(property);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        updateFavoritesCount();
        renderFavoritesList();
        showToast('success', 'Interest Saved', 'This property was added to your liked list.');
    } else {
        showToast('info', 'Already Liked', 'This property is already in your liked list.');
    }
}

function removeFromFavorites(propertyId) {
    favorites = favorites.filter(f => f.id !== propertyId);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoritesCount();
    renderFavoritesList();
    showToast('success', 'Removed', 'Property removed from your liked list.');
}

function updateFavoritesCount() {
    const countEl = document.getElementById('favorites-count');
    if (countEl) {
        countEl.textContent = favorites.length;
    }
}

function renderFavoritesList() {
    const listEl = document.getElementById('favorites-list');
    if (!listEl) return;
    
    if (favorites.length === 0) {
        listEl.innerHTML = '<p class="no-favorites">No liked properties yet</p>';
        return;
    }
    
    listEl.innerHTML = favorites.map(property => `
        <div class="favorite-item">
            <img src="${property.image}" alt="${property.title}" onclick="viewProperty(${property.id})">
            <div class="favorite-item-info">
                <h4>${property.title}</h4>
                <p>${property.price}</p>
            </div>
            <button class="favorite-item-remove" onclick="removeFromFavorites(${property.id})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function toggleFavoritesPanel() {
    const panel = document.getElementById('favorites-panel');
    if (panel) {
        panel.classList.toggle('active');
    }
}

// ========================================
// PROPERTY MODAL - Full Details Display
// ========================================
let currentPropertyId = null;

function openPropertyModal(property) {
    const modal = document.getElementById('property-modal');
    if (!modal) return;
    
    currentPropertyId = property.id;
    modal.dataset.propertyId = property.id;
    
    // Main Info
    document.getElementById('modal-property-image').src = property.image;
    document.getElementById('modal-property-type').textContent = property.purpose.charAt(0).toUpperCase() + property.purpose.slice(1);
    document.getElementById('modal-property-status').textContent = property.status || 'Available';
    document.getElementById('modal-property-price').textContent = property.price;
    document.getElementById('modal-property-title').textContent = property.title;
    document.getElementById('modal-property-address').textContent = property.address || property.location;
    document.getElementById('modal-property-landmark').textContent = property.landmark || 'N/A';
    
    // Property Details Grid
    document.getElementById('modal-property-type2').textContent = property.type || 'N/A';
    const isLandProperty = property.type === 'Plot' || property.type === 'Land';
    document.getElementById('modal-bedrooms').textContent = isLandProperty ? 'N/A' : (property.bedrooms || '0');
    document.getElementById('modal-bathrooms').textContent = isLandProperty ? 'N/A' : (property.bathrooms || '0');
    document.getElementById('modal-sqft').textContent = property.sqft || '0';
    document.getElementById('modal-carpet-area').textContent = property.carpetArea ? (property.carpetArea + ' sqft') : (property.plotArea || 'N/A');
    document.getElementById('modal-floor').textContent = property.floor
        ? (String(property.floor).includes('of') || !property.totalFloors ? property.floor : property.floor + ' of ' + property.totalFloors)
        : 'N/A';
    document.getElementById('modal-facing').textContent = property.facing || 'N/A';
    document.getElementById('modal-property-age').textContent = property.propertyAge || 'N/A';
    document.getElementById('modal-ownership').textContent = property.ownership || 'N/A';
    document.getElementById('modal-status').textContent = property.status || 'N/A';
    
    // Pre-booking section
    const prebookingSection = document.getElementById('prebooking-section');
    if (property.preBooking) {
        prebookingSection.style.display = 'block';
        document.getElementById('modal-booking-amount').textContent = property.bookingAmount || 'N/A';
        document.getElementById('modal-delivery-date').textContent = property.expectedDelivery || 'N/A';
    } else {
        prebookingSection.style.display = 'none';
    }
    
    // Legal & Approvals
    document.getElementById('modal-litigation').textContent = property.litigation || 'N/A';
    document.getElementById('modal-approved').textContent = property.approved || 'N/A';
    document.getElementById('modal-furnish-status').textContent = property.furnishStatus || 'N/A';
    document.getElementById('modal-parking').textContent = property.parking || 'N/A';
    document.getElementById('modal-maintenance').textContent = property.maintenanceCost
        ? ('Rs ' + Number(property.maintenanceCost).toLocaleString('en-IN') + '/month')
        : 'N/A';
    document.getElementById('modal-brokerage').textContent = property.brokerage || 'N/A';
    document.getElementById('modal-available-from').textContent = property.availableFrom || 'N/A';
    document.getElementById('modal-listed-by').textContent = property.listedBy || 'N/A';
    
    // Amenities
    const amenitiesList = document.getElementById('modal-amenities');
    if (property.amenities && property.amenities.length > 0) {
        amenitiesList.innerHTML = property.amenities.map(amenity => '<span class="amenity-tag"><i class="fas fa-check"></i> ' + amenity + '</span>').join('');
    } else {
        amenitiesList.innerHTML = '<p class="no-data">No amenities listed</p>';
    }
    
    // Nearby Facilities
    const nearbyGrid = document.getElementById('modal-nearby');
    if (property.nearby) {
        const icons = {'Schools': 'school', 'Hospitals': 'hospital', 'Metro': 'train', 'Mall': 'shopping-mall', 'IT Park': 'laptop', 'Hospital': 'hospital', 'Market': 'store', 'Railway': 'train', 'Highway': 'road', 'Airport': 'plane', 'Park': 'tree', 'IIT': 'graduation-cap', 'Restaurant': 'utensils'};
        nearbyGrid.innerHTML = Object.entries(property.nearby).map(([key, value]) => '<div class="nearby-item"><i class="fas fa-' + (icons[key] || 'map-marker-alt') + '"></i><span class="nearby-label">' + key + '</span><span class="nearby-value">' + value + '</span></div>').join('');
    } else {
        nearbyGrid.innerHTML = '<p class="no-data">No nearby facilities listed</p>';
    }
    
    // Description
    document.getElementById('modal-property-description').textContent = property.description || 'No description available.';

    const interestForm = document.getElementById('interest-form');
    if (interestForm) {
        interestForm.dataset.propertyId = property.id;
        interestForm.reset();
    }
    
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('property-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function contactForProperty() {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
        closeModal();
        contactSection.scrollIntoView({ behavior: 'smooth' });
        showToast('info', 'Enquiry', 'Share your requirement and our team will contact you soon.');
    }
}

function openWhatsAppForProperty() {
    const property = currentProperties.find((item) => item.id === currentPropertyId);
    const message = property
        ? `Hello admin, I am interested in ${property.title} at ${property.location}. Please guide me further.`
        : 'Hello admin, I need help with a property listing.';
    const whatsappUrl = `${ADMIN_WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener');
}

function initInterestForm() {
    const form = document.getElementById('interest-form');
    if (!form) return;

    form.addEventListener('submit', submitInterestForm);
}

async function submitInterestForm(e) {
    e.preventDefault();

    const form = e.currentTarget;
    const propertyId = form.dataset.propertyId;

    if (!propertyId) {
        showToast('error', 'Property Missing', 'Open a property first to register interest.');
        return;
    }

    const payload = {
        name: document.getElementById('interest-name').value,
        email: document.getElementById('interest-email').value,
        phone: document.getElementById('interest-phone').value,
        note: document.getElementById('interest-note').value || 'Interested in this property'
    };

    try {
        const response = await fetch(`/api/properties/${propertyId}/interests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to save interest');
        }

        form.reset();
        showToast('success', 'Interest Registered', 'Our team will contact you soon about this property.');

        const activeFilter = document.querySelector('.filter-btn.active');
        loadProperties(activeFilter?.dataset.purpose || 'all');
    } catch (error) {
        console.error('Interest error:', error);
        showToast('error', 'Interest Failed', error.message || 'Please try again.');
    }
}

// ========================================
// ADVANCED SEARCH
// ========================================
function initAdvancedSearch() {
    // Initialize price range sliders
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');
    
    if (priceMin && priceMax) {
        priceMin.addEventListener('input', updatePriceDisplay);
        priceMax.addEventListener('input', updatePriceDisplay);
    }
}

function initNewsletterForm() {
    const form = document.querySelector('.newsletter-form');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = form.querySelector('input[type="email"]');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalMarkup = submitBtn ? submitBtn.innerHTML : '';

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }

            const response = await fetch('/api/newsletter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: emailInput ? emailInput.value : ''
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Subscription failed');
            }

            form.reset();
            showToast('success', 'Subscribed', result.message);
        } catch (error) {
            console.error('Newsletter error:', error);
            showToast('error', 'Subscription Failed', error.message || 'Please try again.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalMarkup;
            }
        }
    });
}

function initPriceRange() {
    updatePriceDisplay();
}

function updatePriceDisplay() {
    const minEl = document.getElementById('price-min');
    const maxEl = document.getElementById('price-max');
    const minDisplay = document.getElementById('min-price');
    const maxDisplay = document.getElementById('max-price');
    
    if (minEl && maxEl && minDisplay && maxDisplay) {
        const minVal = parseInt(minEl.value);
        const maxVal = parseInt(maxEl.value);
        
        // Ensure min doesn't exceed max
        if (minVal > maxVal) {
            minEl.value = maxVal;
        }
        
        minDisplay.textContent = formatCurrency(minVal);
        maxDisplay.textContent = formatCurrency(maxVal);
    }
}

function initBedroomButtons() {
    const bedBtns = document.querySelectorAll('.bed-btn');
    bedBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            bedBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

async function advancedSearch() {
    const location = document.getElementById('search-location')?.value;
    const type = document.getElementById('search-type')?.value;
    const minPrice = document.getElementById('price-min')?.value;
    const maxPrice = document.getElementById('price-max')?.value;
    const bedsBtn = document.querySelector('.bed-btn.active');
    const minBeds = bedsBtn?.dataset.beds === 'any' ? 0 : parseInt(bedsBtn?.dataset.beds || 0);
    
    try {
        const response = await fetch('/api/properties?purpose=all');
        let properties = await response.json();
        
        // Filter properties
        properties = properties.filter(p => {
            let match = true;
            
            if (location && !p.location.toLowerCase().includes(location.toLowerCase())) {
                match = false;
            }
            
            if (type && p.type !== type) {
                match = false;
            }

            if (minPrice && Number(p.priceValue || 0) < Number(minPrice)) {
                match = false;
            }

            if (maxPrice && Number(p.priceValue || 0) > Number(maxPrice)) {
                match = false;
            }

            if ((p.type !== 'Plot' && p.type !== 'Land') && Number(minBeds) > 0 && Number(p.bedrooms || 0) < Number(minBeds)) {
                match = false;
            }
            
            return match;
        });
        
        // Update the grid
        const grid = document.getElementById('properties-grid');
        if (grid) {
            if (properties.length === 0) {
                grid.innerHTML = '<p class="no-properties">No properties found matching your criteria.</p>';
            } else {
                grid.innerHTML = properties.map(property => createPropertyCard(property)).join('');
            }
            
            // Scroll to properties
            document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
        }
        
        showToast('success', 'Search Complete', `Found ${properties.length} properties`);
        
    } catch (error) {
        console.error('Search error:', error);
        showToast('error', 'Search Failed', 'Please try again');
    }
}

// ========================================
// TOAST NOTIFICATIONS
// ========================================
function showToast(type, title, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check',
        error: 'fa-times',
        info: 'fa-info'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type]}"></i>
        </div>
        <div class="toast-message">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// ========================================
// ENHANCED PROPERTY CARD
// ========================================
function createPropertyCard(property) {
    const purpose = property.purpose || 'buy';
    const type = property.type || 'Property';
    const isFavorite = favorites.find(f => f.id === property.id);
    
    const bedroomLabel = purpose === 'sell' && (type === 'Plot' || type === 'Land') ? '' : 
        `<span><i class="fas fa-bed"></i> ${property.bedrooms || 0} Beds</span>`;
    
    const purposeLabel = purpose.charAt(0).toUpperCase() + purpose.slice(1);
    
    return `
        <div class="property-card">
            <div class="property-actions">
                <button class="property-action-btn ${isFavorite ? 'favorited' : ''}" onclick="toggleFavorite(${property.id})" title="Like this property" aria-label="Like ${property.title}">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
            <div class="property-image property-image-clickable" onclick="viewProperty(${property.id})" title="View property details">
                <img src="${property.image}" alt="${property.title}" loading="lazy">
                <span class="property-type ${purpose}">${purposeLabel}</span>
            </div>
            <div class="property-content">
                <div class="property-price">${property.price}</div>
                <h3 class="property-title">${property.title}</h3>
                <p class="property-location">
                    <i class="fas fa-map-marker-alt"></i> ${property.location}
                </p>
                <div class="property-features">
                    ${bedroomLabel}
                    <span><i class="fas fa-bath"></i> ${property.bathrooms || 0} Baths</span>
                    <span><i class="fas fa-ruler-combined"></i> ${property.sqft || 0} sqft</span>
                </div>
                <div class="property-card-footer">
                    <span class="property-detail-hint">Tap photo for full details</span>
                    <span class="property-interest-copy">${property.interestCount || 0} interested</span>
                </div>
            </div>
        </div>
    `;
}

async function toggleFavorite(propertyId) {
    try {
        const response = await fetch(`/api/properties/${propertyId}`);
        const property = await response.json();
        
        const isFavorite = favorites.find(f => f.id === property.id);
        
        if (isFavorite) {
            removeFromFavorites(property.id);
        } else {
            addToFavorites(property);
            await fetch(`/api/properties/${propertyId}/interests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    note: 'Liked from property card'
                })
            });
        }
        
        // Refresh property cards to update heart icon
        const activeFilter = document.querySelector('.filter-btn.active');
        const purpose = activeFilter?.dataset.purpose || 'all';
        loadProperties(purpose);
        
    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
}

async function viewProperty(propertyId) {
    try {
        const response = await fetch(`/api/properties/${propertyId}`);
        const property = await response.json();
        if (!currentProperties.find((item) => item.id === property.id)) {
            currentProperties.push(property);
        }
        openPropertyModal(property);
    } catch (error) {
        console.error('Error loading property:', error);
        showToast('error', 'Error', 'Failed to load property details');
    }
}

// Image Preview for Post Property
function previewImages(event) {
    const grid = document.getElementById('image-preview-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    const files = event.target.files;
    
    for (let i = 0; i < Math.min(files.length, 10); i++) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'image-preview';
            grid.appendChild(img);
        };
        reader.readAsDataURL(files[i]);
    }
}

// ========================================
// POST PROPERTY FORM
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initPostPropertyForm();
});

function initPostPropertyForm() {
    const form = document.getElementById('post-property-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
        submitBtn.disabled = true;
        
        // Get all selected amenities
        const amenities = [];
        document.querySelectorAll('input[name="amenities"]:checked').forEach(checkbox => {
            amenities.push(checkbox.value);
        });
        
        const formData = {
            title: form.querySelector('[name="title"]').value,
            purpose: form.querySelector('[name="purpose"]').value,
            type: form.querySelector('[name="type"]').value,
            price: form.querySelector('[name="price"]').value,
            address: form.querySelector('[name="address"]').value,
            city: form.querySelector('[name="city"]').value,
            location: form.querySelector('[name="location"]').value,
            landmark: form.querySelector('[name="landmark"]').value,
            pincode: form.querySelector('[name="pincode"]').value,
            bedrooms: form.querySelector('[name="bedrooms"]').value,
            bathrooms: form.querySelector('[name="bathrooms"]').value,
            sqft: form.querySelector('[name="sqft"]').value,
            carpetArea: form.querySelector('[name="carpetArea"]').value,
            floor: form.querySelector('[name="floor"]').value,
            totalFloors: form.querySelector('[name="totalFloors"]').value,
            facing: form.querySelector('[name="facing"]').value,
            propertyAge: form.querySelector('[name="propertyAge"]').value,
            ownership: form.querySelector('[name="ownership"]').value,
            status: form.querySelector('[name="status"]').value,
            furnishStatus: form.querySelector('[name="furnishStatus"]').value,
            parking: form.querySelector('[name="parking"]').value,
            maintenanceCost: form.querySelector('[name="maintenanceCost"]').value,
            brokerage: form.querySelector('[name="brokerage"]').value,
            availableFrom: form.querySelector('[name="availableFrom"]').value,
            listedBy: form.querySelector('[name="listedBy"]').value,
            plotArea: form.querySelector('[name="plotArea"]').value,
            dimension: form.querySelector('[name="dimension"]').value,
            nearbySchool: form.querySelector('[name="nearbySchool"]').value,
            nearbyHospital: form.querySelector('[name="nearbyHospital"]').value,
            nearbyMetro: form.querySelector('[name="nearbyMetro"]').value,
            nearbyMarket: form.querySelector('[name="nearbyMarket"]').value,
            latitude: form.querySelector('[name="latitude"]').value,
            longitude: form.querySelector('[name="longitude"]').value,
            imageGallery: form.querySelector('[name="imageGallery"]').value,
            videoTourUrl: form.querySelector('[name="videoTourUrl"]').value,
            description: form.querySelector('[name="description"]').value,
            amenities: amenities,
            ownerName: form.querySelector('[name="ownerName"]').value,
            ownerPhone: form.querySelector('[name="ownerPhone"]').value,
            ownerEmail: form.querySelector('[name="ownerEmail"]').value
        };
        
        try {
            const response = await fetch('/api/properties', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast('success', 'Property Submitted', 'Your listing was sent to admin for approval. It will appear after review.');
                form.reset();
                // Scroll to properties section
                document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
            } else {
                showToast('error', 'Post Failed', result.message || 'Failed to post property');
            }
        } catch (error) {
            console.error('Error posting property:', error);
            showToast('error', 'Post Failed', 'Failed to post property. Please try again.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

