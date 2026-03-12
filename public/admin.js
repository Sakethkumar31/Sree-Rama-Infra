const ADMIN_WHATSAPP_NUMBER = '918956923456';

const adminState = {
    stats: null,
    properties: [],
    interests: [],
    conversations: [],
    filters: {
        conversationQuery: '',
        conversationSource: 'all'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    loadAdminDashboard();
    initPropertyEditor();
    initAdminToolbar();
    initConversationFilters();
    initAdminPages();
    initAvailabilityControls();
});

async function loadAdminDashboard() {
    try {
        const [statsRes, propertiesRes, interestsRes, conversationsRes] = await Promise.all([
            fetch('/api/admin/stats'),
            fetch('/api/admin/properties'),
            fetch('/api/admin/interests'),
            fetch('/api/admin/conversations')
        ]);

        adminState.stats = await statsRes.json();
        adminState.properties = await propertiesRes.json();
        adminState.interests = await interestsRes.json();
        adminState.conversations = await conversationsRes.json();

        renderStats();
        renderProfileCard();
        renderPropertyLists();
        renderInterests();
        renderConversations();
        renderAdminNotes();
        renderRecentActivity();
        renderFollowUpQueue();
        renderSellerSupport();
        renderAvailabilityControls();
    } catch (error) {
        console.error('Admin load failed:', error);
        showAdminToast('error', 'Dashboard Failed', 'Could not load admin data.');
    }
}

function renderStats() {
    const statsEl = document.getElementById('admin-stats-grid');
    const stats = adminState.stats;
    if (!statsEl || !stats) return;

    const approval = stats.properties.byApproval || {};
    statsEl.innerHTML = `
        <div class="admin-stat-card">
            <span>All Listings</span>
            <strong>${stats.properties.total || 0}</strong>
        </div>
        <div class="admin-stat-card">
            <span>Waiting for Approval</span>
            <strong>${approval.pending || 0}</strong>
        </div>
        <div class="admin-stat-card">
            <span>Interested Buyers</span>
            <strong>${stats.interests || 0}</strong>
        </div>
        <div class="admin-stat-card">
            <span>Messages</span>
            <strong>${(stats.contacts || 0) + (stats.chats || 0)}</strong>
        </div>
    `;
}

function renderProfileCard() {
    const card = document.getElementById('admin-profile-card');
    const stats = adminState.stats;
    if (!card || !stats) return;

    card.innerHTML = `
        <h2>${stats.admin.name}</h2>
        <p>Main contact person</p>
        <div class="admin-list">
            <div class="admin-item">
                <div class="admin-meta">
                    <span><i class="fas fa-phone"></i> +91 ${stats.admin.phone}</span>
                    <span><i class="fas fa-envelope"></i> ${stats.admin.email}</span>
                    <span><i class="fas fa-circle"></i> ${stats.settings.adminAvailable ? 'Direct chat is ON' : 'Direct chat is OFF'}</span>
                </div>
                <div class="admin-actions">
                    <a class="admin-btn primary" href="${stats.admin.whatsappUrl}" target="_blank" rel="noreferrer">Open WhatsApp</a>
                    <a class="admin-btn" href="mailto:${stats.admin.email}">Send Email</a>
                </div>
            </div>
            <div class="admin-item">
                <h3>${stats.campaign.name}</h3>
                <p>${stats.campaign.message}</p>
                <div class="admin-meta">
                    <span><i class="fas fa-bullhorn"></i> ${stats.campaign.slug}</span>
                    <span><i class="fas fa-layer-group"></i> ${stats.properties.byApproval.approved || 0} live listings</span>
                </div>
            </div>
        </div>
    `;
}

function renderAvailabilityControls() {
    const toggle = document.getElementById('admin-availability-toggle');
    const note = document.getElementById('admin-availability-note');
    const settings = adminState.stats?.settings;

    if (!toggle || !note || !settings) return;

    toggle.checked = Boolean(settings.adminAvailable);
    note.value = settings.availabilityNote || '';
}

function renderPropertyLists() {
    renderPropertyGroup('pending-properties', 'pending');
    renderPropertyGroup('approved-properties', 'approved');
}

function renderPropertyGroup(targetId, status) {
    const el = document.getElementById(targetId);
    if (!el) return;

    const properties = adminState.properties.filter((property) => property.approvalStatus === status);
    if (properties.length === 0) {
        el.innerHTML = `<div class="admin-empty">No listings in this section right now.</div>`;
        return;
    }

    el.innerHTML = properties.map((property) => {
        const ownerLine = [property.ownerName, property.ownerPhone, property.ownerEmail].filter(Boolean).join(' | ') || 'Seller details not added';
        const statusLabel = status === 'pending' ? 'Waiting' : 'Live';
        return `
            <article class="admin-item">
                <div class="admin-item-top">
                    <div>
                        <h3>${property.title}</h3>
                        <div class="admin-meta">
                            <span>${property.location}</span>
                            <span>${property.price}</span>
                            <span>${property.type}</span>
                        </div>
                    </div>
                    <span class="admin-status ${property.approvalStatus}">${statusLabel}</span>
                </div>
                <p><strong>Seller Contact:</strong> ${ownerLine}</p>
                <p>${property.description || 'No description added yet.'}</p>
                <div class="admin-actions">
                    ${property.approvalStatus !== 'approved' ? `<button class="admin-btn success" onclick="updatePropertyStatus(${property.id}, 'approved')">Publish Listing</button>` : ''}
                    ${property.approvalStatus !== 'pending' ? `<button class="admin-btn" onclick="updatePropertyStatus(${property.id}, 'pending')">Keep on Hold</button>` : ''}
                    ${property.approvalStatus !== 'rejected' ? `<button class="admin-btn danger" onclick="updatePropertyStatus(${property.id}, 'rejected')">Reject Listing</button>` : ''}
                    <button class="admin-btn" onclick="loadPropertyIntoEditor(${property.id})">Edit Details</button>
                    <a class="admin-btn" href="https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello ${property.ownerName || 'seller'}, this is Sree Rama Infra admin regarding your listing ${property.title}.`)}" target="_blank" rel="noreferrer">Message Seller</a>
                </div>
            </article>
        `;
    }).join('');
}

function renderInterests() {
    const el = document.getElementById('interests-table');
    if (!el) return;

    if (adminState.interests.length === 0) {
        el.innerHTML = '<div class="admin-empty">No buyer interest yet.</div>';
        return;
    }

    el.innerHTML = `
        <div class="admin-card-list">
            ${adminState.interests.map((interest) => `
                <article class="admin-mini-card">
                    <div class="admin-mini-top">
                        <strong>${interest.propertyTitle}</strong>
                        <span class="admin-status approved">Buyer Interest</span>
                    </div>
                    <p>${interest.name || 'Visitor'}</p>
                    <p>${interest.note || 'Liked this listing'}</p>
                    <div class="admin-actions">
                        ${interest.phone ? `<a class="admin-btn primary" href="https://wa.me/91${interest.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${interest.name || ''}, this is Sree Rama Infra admin team. We are following up on your interest in ${interest.propertyTitle}.`)}" target="_blank" rel="noreferrer">Contact on WhatsApp</a>` : ''}
                        ${interest.email ? `<a class="admin-btn" href="mailto:${interest.email}">Send Email</a>` : ''}
                    </div>
                </article>
            `).join('')}
        </div>
    `;
}

function renderConversations() {
    const el = document.getElementById('conversations-table');
    if (!el) return;

    const filteredConversations = adminState.conversations.filter((item) => {
        const matchesSource = adminState.filters.conversationSource === 'all' || item.source === adminState.filters.conversationSource;
        const haystack = [item.name, item.email, item.phone, item.propertyTitle, item.message, item.note, item.source]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        const matchesQuery = !adminState.filters.conversationQuery || haystack.includes(adminState.filters.conversationQuery);
        return matchesSource && matchesQuery;
    });

    if (filteredConversations.length === 0) {
        el.innerHTML = '<div class="admin-empty">No buyer messages yet.</div>';
        return;
    }

    el.innerHTML = `
        <div class="admin-card-list">
            ${filteredConversations.map((item) => `
                <article class="admin-mini-card">
                    <div class="admin-mini-top">
                        <strong>${item.name || 'Visitor'}</strong>
                        <span class="admin-status ${conversationStatusClass(item.source)}">${item.source}</span>
                    </div>
                    <p>${item.propertyTitle ? `Property: ${item.propertyTitle}` : 'General message'}</p>
                    <p>${item.message || item.note || '-'}</p>
                    <div class="admin-meta">
                        ${item.phone ? `<span><i class="fas fa-phone"></i> ${item.phone}</span>` : ''}
                        ${item.email ? `<span><i class="fas fa-envelope"></i> ${item.email}</span>` : ''}
                    </div>
                    <div class="admin-actions">
                        ${item.phone ? `<a class="admin-btn primary" href="https://wa.me/91${item.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hello, this is Sree Rama Infra admin team. We are following up on your enquiry.')}" target="_blank" rel="noreferrer">Reply on WhatsApp</a>` : ''}
                        ${item.email ? `<a class="admin-btn" href="mailto:${item.email}">Reply by Email</a>` : ''}
                    </div>
                </article>
            `).join('')}
        </div>
    `;
}

function renderAdminNotes() {
    const el = document.getElementById('admin-notes-panel');
    if (!el || !adminState.stats) return;

    el.innerHTML = `
        <div class="admin-list">
            <div class="admin-item">
                <h3>Seller details stay private</h3>
                <p>Buyer never sees the seller phone number or email. Only admin can contact the seller.</p>
            </div>
            <div class="admin-item">
                <h3>Publish only when ready</h3>
                <p>New seller listings come here first. Publish them only after checking the details.</p>
            </div>
            <div class="admin-item">
                <h3>Buyers talk through admin</h3>
                <p>Messages from the site, chat box, and WhatsApp should be handled by admin, not shared directly with sellers.</p>
            </div>
            <div class="admin-item">
                <h3>Simple daily routine</h3>
                <p>1. Check new listings. 2. Publish ready ones. 3. Reply to buyer messages. 4. Follow up with interested buyers.</p>
            </div>
        </div>
    `;
}

function renderRecentActivity() {
    const el = document.getElementById('recent-activity');
    if (!el) return;

    const recentItems = [
        ...adminState.conversations.slice(0, 3).map((item) => ({
            label: item.source,
            title: item.propertyTitle || item.name || 'Conversation',
            detail: item.message || item.note || 'Awaiting admin follow-up'
        })),
        ...adminState.properties
            .filter((property) => property.approvalStatus === 'pending')
            .slice(0, 2)
            .map((property) => ({
                label: 'new listing',
                title: property.title,
                detail: `${property.location} is waiting for your review`
            }))
    ].slice(0, 5);

    if (recentItems.length === 0) {
        el.innerHTML = '<div class="admin-empty">Nothing urgent right now.</div>';
        return;
    }

    el.innerHTML = recentItems.map((item) => `
        <div class="admin-item">
            <div class="admin-meta">
                <span>${item.label}</span>
            </div>
            <h3>${item.title}</h3>
            <p>${item.detail}</p>
        </div>
    `).join('');
}

function renderFollowUpQueue() {
    const el = document.getElementById('follow-up-queue');
    if (!el) return;

    const queue = [
        ...adminState.interests.map((interest) => ({
            title: interest.name || 'Buyer waiting',
            detail: `Contact about ${interest.propertyTitle}`,
            phone: interest.phone,
            email: interest.email
        })),
        ...adminState.conversations.slice(0, 4).map((item) => ({
            title: item.name || 'Buyer message',
            detail: item.propertyTitle || item.message || item.note || 'Needs a reply',
            phone: item.phone,
            email: item.email
        }))
    ].slice(0, 6);

    if (queue.length === 0) {
        el.innerHTML = '<div class="admin-empty">No follow-up needed right now.</div>';
        return;
    }

    el.innerHTML = queue.map((item) => `
        <div class="admin-item">
            <h3>${item.title}</h3>
            <p>${item.detail}</p>
            <div class="admin-actions">
                ${item.phone ? `<a class="admin-btn primary" href="https://wa.me/91${item.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hello, this is Sree Rama Infra admin team. We are following up with you.')}" target="_blank" rel="noreferrer">Call on WhatsApp</a>` : ''}
                ${item.email ? `<a class="admin-btn" href="mailto:${item.email}">Send Email</a>` : ''}
            </div>
        </div>
    `).join('');
}

function renderSellerSupport() {
    const el = document.getElementById('seller-support-list');
    if (!el) return;

    const items = adminState.properties
        .filter((property) => property.approvalStatus === 'pending')
        .map((property) => ({
            title: property.title,
            detail: property.description ? 'Ready for your final check' : 'Ask seller for a better description before publishing',
            phone: property.ownerPhone,
            email: property.ownerEmail,
            id: property.id
        }))
        .slice(0, 6);

    if (items.length === 0) {
        el.innerHTML = '<div class="admin-empty">No seller clarification needed right now.</div>';
        return;
    }

    el.innerHTML = items.map((item) => `
        <div class="admin-item">
            <h3>${item.title}</h3>
            <p>${item.detail}</p>
            <div class="admin-actions">
                <button class="admin-btn" onclick="loadPropertyIntoEditor(${item.id})">Open Listing</button>
                ${item.phone ? `<a class="admin-btn primary" href="https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello, this is Sree Rama Infra admin. We need a few more details for your listing ${item.title}.`)}" target="_blank" rel="noreferrer">Contact Seller</a>` : ''}
                ${item.email ? `<a class="admin-btn" href="mailto:${item.email}">Send Email</a>` : ''}
            </div>
        </div>
    `).join('');
}

function initConversationFilters() {
    const searchInput = document.getElementById('conversation-search');
    const sourceFilter = document.getElementById('conversation-source-filter');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            adminState.filters.conversationQuery = searchInput.value.trim().toLowerCase();
            renderConversations();
        });
    }

    if (sourceFilter) {
        sourceFilter.addEventListener('change', () => {
            adminState.filters.conversationSource = sourceFilter.value;
            renderConversations();
        });
    }
}

function initAvailabilityControls() {
    const saveBtn = document.getElementById('save-availability-btn');
    if (!saveBtn) return;

    saveBtn.addEventListener('click', async () => {
        const toggle = document.getElementById('admin-availability-toggle');
        const note = document.getElementById('admin-availability-note');

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            const response = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    adminAvailable: toggle.checked,
                    availabilityNote: note.value
                })
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Failed to save chat status');
            }

            showAdminToast('success', 'Chat Status Saved', 'Public chat availability was updated.');
            await loadAdminDashboard();
        } catch (error) {
            console.error('Availability save failed:', error);
            showAdminToast('error', 'Save Failed', error.message || 'Unable to save chat status.');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Chat Status';
        }
    });
}

function conversationStatusClass(source) {
    if (source === 'chat') return 'approved';
    if (source === 'interest') return 'pending';
    return 'rejected';
}

function initAdminToolbar() {
    const refreshBtn = document.getElementById('admin-refresh-btn');
    if (!refreshBtn) return;

    refreshBtn.addEventListener('click', async () => {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing';
        try {
            await loadAdminDashboard();
            showAdminToast('success', 'Updated', 'Latest information has been loaded.');
        } finally {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fas fa-rotate-right"></i> Refresh';
        }
    });
}

function initAdminPages() {
    const tabs = document.querySelectorAll('.admin-page-tab');

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => openAdminPage(tab.dataset.page));
    });
}

function openAdminPage(targetPage) {
    const tabs = document.querySelectorAll('.admin-page-tab');
    const pages = document.querySelectorAll('.admin-page');

    tabs.forEach((item) => item.classList.toggle('active', item.dataset.page === targetPage));
    pages.forEach((page) => page.classList.toggle('active', page.id === targetPage));
}

function initPropertyEditor() {
    const form = document.getElementById('property-editor-form');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const propertyId = document.getElementById('editor-property-id').value;

        if (!propertyId) {
            showAdminToast('info', 'Select Property', 'Choose a property from the list first.');
            return;
        }

        const payload = {
            title: document.getElementById('editor-title').value,
            price: document.getElementById('editor-price').value,
            parking: document.getElementById('editor-parking').value,
            brokerage: document.getElementById('editor-brokerage').value,
            availableFrom: document.getElementById('editor-available-from').value,
            description: document.getElementById('editor-description').value
        };

        try {
            const updateRes = await fetch(`/api/admin/properties/${propertyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const statusRes = await fetch(`/api/admin/properties/${propertyId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: document.getElementById('editor-status').value
                })
            });

            const updateResult = await updateRes.json();
            const statusResult = await statusRes.json();

            if (!updateRes.ok || !statusRes.ok || !updateResult.success || !statusResult.success) {
                throw new Error(updateResult.message || statusResult.message || 'Update failed');
            }

            showAdminToast('success', 'Property Saved', 'Property details updated successfully.');
            await loadAdminDashboard();
        } catch (error) {
            console.error('Property save failed:', error);
            showAdminToast('error', 'Save Failed', error.message || 'Unable to save property.');
        }
    });
}

function loadPropertyIntoEditor(propertyId) {
    const property = adminState.properties.find((item) => item.id === propertyId);
    if (!property) return;

    document.getElementById('editor-property-id').value = property.id;
    document.getElementById('editor-title').value = property.title || '';
    document.getElementById('editor-price').value = property.priceValue || '';
    document.getElementById('editor-parking').value = property.parking || '';
    document.getElementById('editor-brokerage').value = property.brokerage || '';
    document.getElementById('editor-available-from').value = property.availableFrom || '';
    document.getElementById('editor-status').value = property.approvalStatus || 'pending';
    document.getElementById('editor-description').value = property.description || '';
    const helper = document.getElementById('editor-helper');
    if (helper) {
        helper.textContent = `Now editing: ${property.title}`;
    }
    openAdminPage('editor-page');
    document.getElementById('editor').scrollIntoView({ behavior: 'smooth' });
}

async function updatePropertyStatus(propertyId, status) {
    try {
        const response = await fetch(`/api/admin/properties/${propertyId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Status update failed');
        }

        showAdminToast('success', 'Listing Updated', result.message);
        await loadAdminDashboard();
    } catch (error) {
        console.error('Status update failed:', error);
        showAdminToast('error', 'Update Failed', error.message || 'Unable to update the listing.');
    }
}

function showAdminToast(type, title, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${type === 'success' ? 'fa-check' : type === 'error' ? 'fa-times' : 'fa-info'}"></i>
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
    setTimeout(() => toast.remove(), 5000);
}
