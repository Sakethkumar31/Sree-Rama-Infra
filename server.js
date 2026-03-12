const crypto = require('crypto');
const express = require('express');
const path = require('path');
const { initializeStore, readCollection, writeCollection } = require('./storage');
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PROFILE = {
    name: 'Sanjay Kumar',
    role: 'Administrator',
    phone: '8956923456',
    email: 'sanjaykumaarsss@gmail.com',
    whatsappUrl: 'https://wa.me/918956923456'
};
const ACTIVE_CAMPAIGN = {
    name: 'KalyanaShobha.in',
    slug: 'kalyanashobha.in',
    message: 'A special campaign partner for curated visibility and trusted property discovery.'
};
const DEFAULT_SETTINGS = {
    adminAvailable: false,
    availabilityNote: 'Admin is offline for direct 1:1 conversation right now. Leave your message and we will respond soon.'
};

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Render health check
app.get('/healthz', (req, res) => {
    res.status(200).json({ ok: true });
});

app.get('/api/meta', (req, res) => {
    res.json({
        admin: ADMIN_PROFILE,
        campaign: ACTIVE_CAMPAIGN,
        settings: adminSettings
    });
});

// Properties data with detailed information (including user-posted)
let allProperties = [
    // BUY Properties
    {
        id: 1,
        title: "Luxury Villa",
        location: "Madhapur, Hyderabad",
        address: "Plot No. 123, Hitech City Road, Madhapur",
        landmark: "Near Hitech City Metro Station",
        price: "₹2.5 Crore",
        priceValue: 25000000,
        type: "Villa",
        purpose: "buy",
        bedrooms: 4,
        bathrooms: 3,
        sqft: 2500,
        carpetArea: 2200,
        floor: "G+2",
        totalFloors: 3,
        propertyAge: "2 Years",
        facing: "East",
        ownership: "Freehold",
        status: "Ready to Move",
        preBooking: false,
        litigation: "None",
        approved: "Yes - GHMC Approved",
        amenities: ["Swimming Pool", "Gym", "Club House", "24/7 Security", "Power Backup", "Lift", "Parking", "Garden"],
        nearby: {"Schools": "2km", "Hospitals": "1km", "Metro": "500m", "Mall": "1.5km"},
        description: "Beautiful luxury villa with modern amenities, spacious rooms, Italian marble flooring, modular kitchen, home automation system, and private terrace with city views.",
        image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
        lat: 17.4486,
        lng: 78.3908
    },
    {
        id: 2,
        title: "Modern Apartment",
        location: "Gachibowli, Hyderabad",
        address: "Apartment No. 502, Skyline Residency, Gachibowli",
        landmark: "Near Google Office",
        price: "₹85 Lakh",
        priceValue: 8500000,
        type: "Apartment",
        purpose: "buy",
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1600,
        carpetArea: 1400,
        floor: "5th of 12",
        totalFloors: 12,
        propertyAge: "1 Year",
        facing: "North-East",
        ownership: "Freehold",
        status: "Ready to Move",
        preBooking: false,
        litigation: "None",
        approved: "Yes - GHMC Approved",
        amenities: ["Power Backup", "Lift", "Parking", "Children's Play Area", "CCTV Security"],
        nearby: {"Schools": "1km", "Hospitals": "2km", "Metro": "800m", "IT Park": "500m"},
        description: "Spacious apartment in prime location with modern interiors, modular kitchen, and scenic views. Close to major IT companies and shopping malls.",
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
        lat: 17.4401,
        lng: 78.3489
    },
    {
        id: 3,
        title: "Commercial Space",
        location: "Banjara Hills, Hyderabad",
        address: "Office No. 201, Business Tower, Road No. 12",
        landmark: "Near City Center Mall",
        price: "₹4 Crore",
        priceValue: 40000000,
        type: "Commercial",
        purpose: "buy",
        bedrooms: 0,
        bathrooms: 2,
        sqft: 3500,
        carpetArea: 3200,
        floor: "2nd of 8",
        totalFloors: 8,
        propertyAge: "5 Years",
        facing: "North",
        ownership: "Freehold",
        status: "Ready to Move",
        preBooking: false,
        litigation: "None",
        approved: "Yes - Commercial Building Approval",
        amenities: ["Central AC", "High Speed Elevators", "Conference Room", "Power Backup", "Security", "Parking - 5 Cars"],
        nearby: {"Metro": "1km", "Mall": "500m", "Hospital": "2km", "Restaurant": "200m"},
        description: "Prime commercial space in business district with premium finishes, reception area, and excellent connectivity. Perfect for corporate offices.",
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
        lat: 17.4108,
        lng: 78.4079
    },
    {
        id: 4,
        title: "Penthouse Suite",
        location: "Jubilee Hills, Hyderabad",
        address: "Penthouse, Royal Enclave, Jubilee Hills Checkpost",
        landmark: "Near Jubilee Hills Public School",
        price: "₹5.5 Crore",
        priceValue: 55000000,
        type: "Penthouse",
        purpose: "buy",
        bedrooms: 5,
        bathrooms: 4,
        sqft: 4500,
        carpetArea: 4000,
        floor: "Top Floor",
        totalFloors: 5,
        propertyAge: "New Construction",
        facing: "South-West",
        ownership: "Freehold",
        status: "Pre-Booking Open",
        preBooking: true,
        bookingAmount: "₹25 Lakh",
        expectedDelivery: "December 2026",
        litigation: "None",
        approved: "Yes - GHMC Approved",
        amenities: ["Private Terrace", "Home Theater", "Smart Home", "Wine Cellar", "Staff Quarters", "4 Parking Slots", "Private Lift"],
        nearby: {"Schools": "500m", "Hospitals": "1.5km", "Mall": "2km", "Park": "300m"},
        description: "Stunning penthouse with 360-degree city views, premium specifications, and exclusive amenities. Pre-booking now with attractive payment plans.",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
        lat: 17.4254,
        lng: 78.4131
    },
    // RENT Properties
    {
        id: 5,
        title: "Furnished Apartment",
        location: "Kukatpally, Hyderabad",
        address: "Flat No. 302, Legend Apartments, KPHP Colony",
        landmark: "Near JNTU College",
        price: "₹35,000/month",
        priceValue: 35000,
        type: "Apartment",
        purpose: "rent",
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1200,
        carpetArea: 1050,
        floor: "3rd of 7",
        totalFloors: 7,
        propertyAge: "3 Years",
        facing: "West",
        ownership: "Lease",
        status: "Available for Rent",
        availableFrom: "Immediate",
        furnishStatus: "Fully Furnished",
        amenities: ["Furniture", "AC", "TV", "Washing Machine", "Refrigerator", "Power Backup", "Lift", "Parking"],
        nearby: {"Metro": "2km", "School": "1km", "Hospital": "1.5km", "Market": "500m"},
        description: "Fully furnished apartment ready to move in with all modern amenities. Ideal for working professionals and small families.",
        image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
        lat: 17.4949,
        lng: 78.4076
    },
    {
        id: 6,
        title: "Studio Apartment",
        location: "Ameerpet, Hyderabad",
        address: "Room No. 105, Tech Space Building, Ameerpet",
        landmark: "Near Satyam Theatre",
        price: "₹25,000/month",
        priceValue: 25000,
        type: "Studio",
        purpose: "rent",
        bedrooms: 1,
        bathrooms: 1,
        sqft: 600,
        carpetArea: 550,
        floor: "1st of 5",
        totalFloors: 5,
        propertyAge: "4 Years",
        facing: "North",
        ownership: "Lease",
        status: "Available for Rent",
        availableFrom: "Immediate",
        furnishStatus: "Semi-Furnished",
        amenities: ["Bed", "AC", "Wardrobe", "Table", "Power Backup", "Security"],
        nearby: {"Metro": "300m", "School": "500m", "Hospital": "1km", "Market": "200m"},
        description: "Cozy studio in the heart of the city with all essential amenities. Walking distance to metro station.",
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
        lat: 17.4375,
        lng: 78.4483
    },
    {
        id: 7,
        title: "Villa for Rent",
        location: "Gachibowli, Hyderabad",
        address: "House No. 44, Green Valley Colony, Gachibowli",
        landmark: "Near Indian Institute of Technology Hyderabad",
        price: "₹75,000/month",
        priceValue: 75000,
        type: "Villa",
        purpose: "rent",
        bedrooms: 4,
        bathrooms: 3,
        sqft: 2800,
        carpetArea: 2500,
        floor: "G+1",
        totalFloors: 2,
        propertyAge: "2 Years",
        facing: "East",
        ownership: "Lease",
        status: "Available for Rent",
        availableFrom: "15 Days Notice",
        furnishStatus: "Semi-Furnished",
        amenities: ["Garden", "Parking - 2 Cars", "Power Backup", "Security", "Modular Kitchen", "Dining Area"],
        nearby: {"Metro": "3km", "IIT": "1km", "Hospital": "2km", "Mall": "1.5km"},
        description: "Luxurious villa with garden and ample parking space. Perfect for families looking for spacious living in a quiet locality.",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
        lat: 17.4401,
        lng: 78.3489
    },
    // SELL Properties
    {
        id: 8,
        title: "Plot for Sale",
        location: "Shamirpet, Hyderabad",
        address: "Survey No. 215, Greenland Township, Shamirpet",
        landmark: "Near JNV Colony",
        price: "₹45 Lakh",
        priceValue: 4500000,
        type: "Plot",
        purpose: "sell",
        bedrooms: 0,
        bathrooms: 0,
        sqft: 2400,
        plotArea: "2400 sq.ft",
        dimension: "40 x 60 ft",
        propertyAge: "New",
        facing: "North-East",
        ownership: "Freehold",
        status: "Ready to Sell",
        preBooking: false,
        litigation: "None - Clear Title",
        approved: "Yes - HMDA Approved Layout",
        boundaryWall: "Yes",
        electricity: "Available",
        waterConnection: "Available",
        roadAccess: "30 ft Wide Road",
        amenities: ["Gated Community", "Parks", "Underground Drainage", "Street Lights"],
        nearby: {"School": "1km", "Hospital": "3km", "Railway": "5km", "Highway": "2km"},
        description: "Clear title plot in gated community with all approvals. Excellent investment opportunity with high appreciation potential.",
        image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
        lat: 17.5204,
        lng: 78.5478
    },
    {
        id: 9,
        title: "Independent House",
        location: "Tolichowki, Hyderabad",
        address: "House No. 8-2-293/82, MLA Colony, Tolichowki",
        landmark: "Near Salar Jung Colony",
        price: "₹1.8 Crore",
        priceValue: 18000000,
        type: "House",
        purpose: "sell",
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1800,
        carpetArea: 1600,
        floor: "G+1",
        totalFloors: 2,
        propertyAge: "15 Years",
        facing: "West",
        ownership: "Freehold",
        status: "Ready to Move",
        preBooking: false,
        litigation: "None",
        approved: "Yes - GHMC Approved",
        amenities: ["Parking - 2 Cars", "Garden", "Terrace", "Backup Generator"],
        nearby: {"Metro": "2km", "School": "1km", "Hospital": "1.5km", "Market": "500m"},
        description: "Well-maintained independent house in prime location with spacious rooms, car parking, and terrace access.",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
        lat: 17.4052,
        lng: 78.4376
    },
    {
        id: 10,
        title: "Commercial Land",
        location: "Kompally, Hyderabad",
        address: "Survey No. 156, Industrial Area, Kompally",
        landmark: "Near TCS Building",
        price: "₹8 Crore",
        priceValue: 80000000,
        type: "Land",
        purpose: "sell",
        bedrooms: 0,
        bathrooms: 0,
        sqft: 10000,
        plotArea: "1 Acre",
        dimension: "200 x 200 ft",
        propertyAge: "New",
        facing: "East",
        ownership: "Freehold",
        status: "Ready to Sell",
        preBooking: false,
        litigation: "None - Clear Title",
        approved: "Yes - Industrial Area Approval",
        boundaryWall: "Yes",
        electricity: "3-Phase Available",
        waterConnection: "Available",
        roadAccess: "40 ft Wide Road",
        frontage: "200 ft on Main Road",
        amenities: ["Warehouse Permission", "Factory Approval", "Crane Facility"],
        nearby: {"Metro": "5km", "Highway": "1km", "Airport": "20km", "Railway": "8km"},
        description: "Commercial land in developing area with excellent road frontage. Ideal for warehouse, factory, or commercial development.",
        image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
        lat: 17.5512,
        lng: 78.4891
    }
];

const storeSeeds = {
    properties: allProperties,
    users: [],
    sessions: [],
    contacts: [],
    chats: [],
    subscriptions: [],
    interests: [],
    settings: DEFAULT_SETTINGS
};

initializeStore(storeSeeds);

allProperties = readCollection('properties', storeSeeds.properties);
let contactLeads = readCollection('contacts', []);
let chatLeads = readCollection('chats', []);
let newsletterSubscriptions = readCollection('subscriptions', []);
let propertyInterests = readCollection('interests', []);
let adminSettings = {
    ...DEFAULT_SETTINGS,
    ...readCollection('settings', DEFAULT_SETTINGS)
};

// Counter for generating unique IDs
let propertyIdCounter = allProperties.reduce((maxId, property) => {
    return Math.max(maxId, Number(property.id) || 0);
}, 0) + 1;

function persistProperties() {
    writeCollection('properties', allProperties);
}

function persistContacts() {
    writeCollection('contacts', contactLeads);
}

function persistChats() {
    writeCollection('chats', chatLeads);
}

function persistSubscriptions() {
    writeCollection('subscriptions', newsletterSubscriptions);
}

function persistInterests() {
    writeCollection('interests', propertyInterests);
}

function persistSettings() {
    writeCollection('settings', adminSettings);
}

function buildLeadRecord(payload) {
    return {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...payload
    };
}

function toPositiveNumber(value) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0;
}

function normalizeList(value) {
    if (Array.isArray(value)) {
        return value
            .map((item) => String(item).trim())
            .filter(Boolean);
    }

    if (!value) {
        return [];
    }

    return String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

function normalizePropertyRecord(property) {
    const normalizedProperty = {
        ...property
    };

    normalizedProperty.approvalStatus = normalizedProperty.approvalStatus || 'approved';
    normalizedProperty.featured = normalizedProperty.featured !== undefined
        ? normalizedProperty.featured
        : normalizedProperty.approvalStatus === 'approved';
    normalizedProperty.createdAt = normalizedProperty.createdAt || new Date().toISOString();
    normalizedProperty.updatedAt = normalizedProperty.updatedAt || normalizedProperty.createdAt;
    normalizedProperty.amenities = normalizeList(normalizedProperty.amenities);
    normalizedProperty.imageGallery = normalizeList(normalizedProperty.imageGallery);
    normalizedProperty.nearby = normalizedProperty.nearby || {};

    return normalizedProperty;
}

function sanitizePublicProperty(property) {
    const {
        ownerName,
        ownerPhone,
        ownerEmail,
        ...publicProperty
    } = property;

    return {
        ...publicProperty,
        interestCount: propertyInterests.filter((interest) => interest.propertyId === property.id).length
    };
}

function mergeNearby(existingNearby, updates) {
    const merged = { ...(existingNearby || {}) };

    if (updates.nearbySchool) merged.School = updates.nearbySchool;
    if (updates.nearbyHospital) merged.Hospital = updates.nearbyHospital;
    if (updates.nearbyMetro) merged.Metro = updates.nearbyMetro;
    if (updates.nearbyMarket) merged.Market = updates.nearbyMarket;

    return merged;
}

function getPublicProperties() {
    return allProperties
        .filter((property) => property.approvalStatus === 'approved')
        .map(sanitizePublicProperty);
}

allProperties = allProperties.map(normalizePropertyRecord);
persistProperties();

// Get all properties or filter by purpose
app.get('/api/properties', (req, res) => {
    const { purpose } = req.query;
    const visibleProperties = getPublicProperties();
    if (purpose && purpose !== 'all') {
        const filtered = visibleProperties.filter(p => p.purpose === purpose);
        res.json(filtered);
    } else {
        res.json(visibleProperties);
    }
});

// Get single property by ID
app.get('/api/properties/:id', (req, res) => {
    const property = allProperties.find((p) => p.id === parseInt(req.params.id));
    if (property && property.approvalStatus === 'approved') {
        res.json(sanitizePublicProperty(property));
    } else {
        res.status(404).json({ message: 'Property not found' });
    }
});

// POST - Add new property from user submission
app.post('/api/properties', (req, res) => {
    try {
        const {
            title, purpose, type, price,
            address, city, location, landmark, pincode,
            bedrooms, bathrooms, sqft, carpetArea, floor, totalFloors,
            facing, propertyAge, ownership, status,
            amenities, description,
            ownerName, ownerPhone, ownerEmail,
            furnishStatus, parking, maintenanceCost, brokerage,
            availableFrom, listedBy, plotArea, dimension,
            imageGallery, videoTourUrl,
            nearbySchool, nearbyHospital, nearbyMetro, nearbyMarket,
            latitude, longitude
        } = req.body;

        // Validate required fields
        if (!title || !purpose || !type || !price || !address || !location || !sqft) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please fill in all required fields' 
            });
        }

        const numericPrice = parsePrice(price);
        const normalizedAmenities = normalizeList(amenities);
        const normalizedGallery = normalizeList(imageGallery);
        const normalizedLocation = city && !String(location).toLowerCase().includes(String(city).toLowerCase())
            ? `${location}, ${city}`
            : location;
        const nearby = {};

        if (nearbySchool) nearby.School = nearbySchool;
        if (nearbyHospital) nearby.Hospital = nearbyHospital;
        if (nearbyMetro) nearby.Metro = nearbyMetro;
        if (nearbyMarket) nearby.Market = nearbyMarket;

        const defaultImage = normalizedGallery[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800';
        const createdAt = new Date().toISOString();

        // Create new property object
        const newProperty = {
            id: propertyIdCounter++,
            createdAt,
            updatedAt: createdAt,
            title: title,
            location: normalizedLocation,
            address: address,
            landmark: landmark || '',
            pincode: pincode || '',
            price: formatPrice(numericPrice, purpose),
            priceValue: numericPrice,
            type: type,
            purpose: purpose,
            bedrooms: parseInt(bedrooms) || 0,
            bathrooms: parseInt(bathrooms) || 0,
            sqft: parseInt(sqft) || 0,
            carpetArea: parseInt(carpetArea) || parseInt(sqft) || 0,
            floor: floor || '',
            totalFloors: totalFloors || '',
            plotArea: plotArea || '',
            dimension: dimension || '',
            propertyAge: propertyAge || '',
            facing: facing || '',
            ownership: ownership || '',
            status: status || 'Available',
            description: description || '',
            amenities: normalizedAmenities,
            furnishStatus: furnishStatus || '',
            parking: parking || '',
            maintenanceCost: toPositiveNumber(maintenanceCost),
            brokerage: brokerage || '',
            availableFrom: availableFrom || '',
            listedBy: listedBy || 'Owner',
            imageGallery: normalizedGallery,
            videoTourUrl: videoTourUrl || '',
            ownerName: ownerName || '',
            ownerPhone: ownerPhone || '',
            ownerEmail: ownerEmail || '',
            approvalStatus: 'pending',
            featured: false,
            // Default values for new properties
            preBooking: false,
            litigation: 'None',
            approved: 'Verification Pending',
            nearby,
            // Use a default property image
            image: defaultImage,
            lat: latitude ? Number(latitude) : 17.3850 + (Math.random() - 0.5) * 0.2,
            lng: longitude ? Number(longitude) : 78.4867 + (Math.random() - 0.5) * 0.2
        };

        // Add to properties array
        allProperties.unshift(newProperty); // Add to beginning
        persistProperties();

        console.log('New property added:', newProperty.title);
        
        res.json({ 
            success: true, 
            message: 'Property submitted successfully. Our admin team will review and approve it before it appears in Featured Properties.',
            property: sanitizePublicProperty(newProperty)
        });
    } catch (error) {
        console.error('Error posting property:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to post property. Please try again.' 
        });
    }
});

// Helper function to format price
function legacyFormatPrice(value) {
    if (value >= 10000000) {
        return '₹' + (value / 10000000).toFixed(2) + ' Crore';
    } else if (value >= 100000) {
        return '₹' + (value / 100000).toFixed(2) + ' Lakh';
    } else if (value >= 1000) {
        return '₹' + (value / 1000).toFixed(2) + ' Thousand';
    }
    return '₹' + value.toLocaleString('en-IN');
}

// Helper function to parse price string to number
function legacyParsePrice(priceStr) {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return 0;
    
    let cleanStr = priceStr.replace(/[₹,\s]/g, '').toLowerCase();
    
    if (cleanStr.includes('crore') || cleanStr.includes('cr')) {
        return parseFloat(cleanStr.replace(/[crore|cr]/g, '')) * 10000000;
    } else if (cleanStr.includes('lakh') || cleanStr.includes('lac') || cleanStr.includes('lk')) {
        return parseFloat(cleanStr.replace(/[lakh|lac|lk]/g, '')) * 100000;
    } else if (cleanStr.includes('thousand') || cleanStr.includes('k')) {
        return parseFloat(cleanStr.replace(/[thousand|k]/g, '')) * 1000;
    }
    
    return parseFloat(cleanStr) || 0;
}

// Override the initial helpers with stricter parsing/formatting for user-posted properties.
function formatPrice(value, purpose = 'buy') {
    const numericValue = Number(value) || 0;

    if (purpose === 'rent') {
        return 'Rs ' + numericValue.toLocaleString('en-IN') + '/month';
    }

    if (numericValue >= 10000000) {
        return 'Rs ' + (numericValue / 10000000).toFixed(2) + ' Crore';
    } else if (numericValue >= 100000) {
        return 'Rs ' + (numericValue / 100000).toFixed(2) + ' Lakh';
    } else if (numericValue >= 1000) {
        return 'Rs ' + (numericValue / 1000).toFixed(2) + ' Thousand';
    }

    return 'Rs ' + numericValue.toLocaleString('en-IN');
}

function parsePrice(priceStr) {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return 0;

    const cleanStr = String(priceStr)
        .replace(/rs\.?/gi, '')
        .replace(/[,\s]/g, '')
        .replace(/\/month/gi, '')
        .toLowerCase();

    if (cleanStr.includes('crore') || cleanStr.includes('cr')) {
        return parseFloat(cleanStr.replace(/crore|cr/g, '')) * 10000000 || 0;
    } else if (cleanStr.includes('lakh') || cleanStr.includes('lac') || cleanStr.includes('lk')) {
        return parseFloat(cleanStr.replace(/lakh|lac|lk/g, '')) * 100000 || 0;
    } else if (cleanStr.includes('thousand') || cleanStr.includes('k')) {
        return parseFloat(cleanStr.replace(/thousand|k/g, '')) * 1000 || 0;
    }

    return parseFloat(cleanStr) || 0;
}

// Get all property locations for map
app.get('/api/locations', (req, res) => {
    const locations = allProperties.map(p => ({
        id: p.id,
        title: p.title,
        location: p.location,
        price: p.price,
        purpose: p.purpose,
        lat: p.lat,
        lng: p.lng,
        image: p.image
    }));
    res.json(locations);
});

app.put('/api/admin/properties/:id', (req, res) => {
    const propertyId = parseInt(req.params.id);
    const propertyIndex = allProperties.findIndex((property) => property.id === propertyId);

    if (propertyIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Property not found'
        });
    }

    const currentProperty = allProperties[propertyIndex];
    const updates = req.body || {};
    const mergedGallery = normalizeList(updates.imageGallery);

    const updatedProperty = {
        ...currentProperty,
        ...updates,
        priceValue: updates.price ? parsePrice(updates.price) : currentProperty.priceValue,
        price: updates.price ? formatPrice(parsePrice(updates.price), updates.purpose || currentProperty.purpose) : currentProperty.price,
        bedrooms: updates.bedrooms !== undefined ? toPositiveNumber(updates.bedrooms) : currentProperty.bedrooms,
        bathrooms: updates.bathrooms !== undefined ? toPositiveNumber(updates.bathrooms) : currentProperty.bathrooms,
        sqft: updates.sqft !== undefined ? toPositiveNumber(updates.sqft) : currentProperty.sqft,
        carpetArea: updates.carpetArea !== undefined ? toPositiveNumber(updates.carpetArea) : currentProperty.carpetArea,
        maintenanceCost: updates.maintenanceCost !== undefined ? toPositiveNumber(updates.maintenanceCost) : currentProperty.maintenanceCost,
        amenities: updates.amenities !== undefined ? normalizeList(updates.amenities) : currentProperty.amenities,
        imageGallery: mergedGallery.length > 0 ? mergedGallery : (currentProperty.imageGallery || []),
        image: mergedGallery[0] || updates.image || currentProperty.image,
        nearby: mergeNearby(currentProperty.nearby, updates),
        updatedAt: new Date().toISOString()
    };

    allProperties[propertyIndex] = updatedProperty;
    persistProperties();

    res.json({
        success: true,
        message: 'Property updated successfully.',
        property: sanitizePublicProperty(updatedProperty)
    });
});

app.patch('/api/admin/properties/:id/status', (req, res) => {
    const propertyId = parseInt(req.params.id);
    const property = allProperties.find((item) => item.id === propertyId);
    const nextStatus = String(req.body.status || '').toLowerCase();

    if (!property) {
        return res.status(404).json({
            success: false,
            message: 'Property not found'
        });
    }

    if (!['approved', 'pending', 'rejected'].includes(nextStatus)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status'
        });
    }

    property.approvalStatus = nextStatus;
    property.featured = nextStatus === 'approved';
    property.updatedAt = new Date().toISOString();
    if (nextStatus === 'approved') {
        property.approvedAt = property.updatedAt;
    }

    persistProperties();

    res.json({
        success: true,
        message: `Property ${nextStatus} successfully.`,
        property
    });
});

app.post('/api/properties/:id/interests', (req, res) => {
    const propertyId = parseInt(req.params.id);
    const property = allProperties.find((item) => item.id === propertyId && item.approvalStatus === 'approved');
    const { name, email, phone, note } = req.body || {};

    if (!property) {
        return res.status(404).json({
            success: false,
            message: 'Property not found'
        });
    }

    const interest = buildLeadRecord({
        propertyId,
        propertyTitle: property.title,
        name: name ? String(name).trim() : 'Anonymous visitor',
        email: email ? String(email).trim().toLowerCase() : '',
        phone: phone ? String(phone).trim() : '',
        note: note ? String(note).trim() : 'Marked as interested',
        contactOwner: 'admin-only'
    });

    propertyInterests.unshift(interest);
    persistInterests();

    res.json({
        success: true,
        message: 'Interest saved. Our team will contact you soon.',
        interest
    });
});

// Contact form submission
app.post('/api/contact', (req, res) => {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            message: 'Name, email, and message are required.'
        });
    }

    const lead = buildLeadRecord({
        channel: 'enquiry',
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        phone: phone ? String(phone).trim() : '',
        message: String(message).trim(),
        handledBy: ADMIN_PROFILE.name
    });

    contactLeads.unshift(lead);
    persistContacts();

    console.log('Contact form submission:', lead);
    res.json({ success: true, message: 'Thank you for your enquiry. Our team will contact you soon with the right next steps.' });
});

// Chat/Inquiry submission
app.post('/api/chat', (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            message: 'Name, email, and message are required.'
        });
    }

    const chatInquiry = buildLeadRecord({
        channel: 'chat',
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        message: String(message).trim(),
        handledBy: ADMIN_PROFILE.name
    });

    chatLeads.unshift(chatInquiry);
    persistChats();

    console.log('Chat inquiry:', chatInquiry);
    res.json({
        success: true,
        message: adminSettings.adminAvailable
            ? 'Admin is available now. You can continue one-to-one in chat or switch to WhatsApp.'
            : 'Message received. Our team will continue the conversation with you shortly.',
        directConversation: adminSettings.adminAvailable,
        whatsappUrl: ADMIN_PROFILE.whatsappUrl
    });
});

app.post('/api/newsletter', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required.'
        });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingSubscription = newsletterSubscriptions.find((entry) => entry.email === normalizedEmail);

    if (existingSubscription) {
        return res.json({
            success: true,
            message: 'This email is already subscribed.'
        });
    }

    const subscription = buildLeadRecord({ email: normalizedEmail });
    newsletterSubscriptions.unshift(subscription);
    persistSubscriptions();

    res.json({
        success: true,
        message: 'You will receive property updates soon.'
    });
});

app.get('/api/admin/stats', (req, res) => {
    const propertyCounts = allProperties.reduce((counts, property) => {
        const purpose = property.purpose || 'unknown';
        counts[purpose] = (counts[purpose] || 0) + 1;
        return counts;
    }, {});
    const approvalCounts = allProperties.reduce((counts, property) => {
        const status = property.approvalStatus || 'pending';
        counts[status] = (counts[status] || 0) + 1;
        return counts;
    }, {});

    res.json({
        admin: ADMIN_PROFILE,
        campaign: ACTIVE_CAMPAIGN,
        settings: adminSettings,
        properties: {
            total: allProperties.length,
            byPurpose: propertyCounts,
            byApproval: approvalCounts
        },
        contacts: contactLeads.length,
        chats: chatLeads.length,
        subscriptions: newsletterSubscriptions.length,
        interests: propertyInterests.length,
        latestProperty: allProperties[0] ? sanitizePublicProperty(allProperties[0]) : null,
        latestContact: contactLeads[0] || null,
        latestChat: chatLeads[0] || null,
        latestInterest: propertyInterests[0] || null
    });
});

app.get('/api/admin/properties', (req, res) => {
    const { status } = req.query;
    const properties = status
        ? allProperties.filter((property) => property.approvalStatus === status)
        : allProperties;

    res.json(properties);
});

app.get('/api/admin/contacts', (req, res) => {
    res.json(contactLeads);
});

app.get('/api/admin/chats', (req, res) => {
    res.json(chatLeads);
});

app.get('/api/admin/subscriptions', (req, res) => {
    res.json(newsletterSubscriptions);
});

app.get('/api/admin/interests', (req, res) => {
    res.json(propertyInterests);
});

app.get('/api/admin/conversations', (req, res) => {
    const conversations = [
        ...contactLeads.map((lead) => ({ ...lead, source: 'enquiry' })),
        ...chatLeads.map((lead) => ({ ...lead, source: 'chat' })),
        ...propertyInterests.map((lead) => ({ ...lead, source: 'interest' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(conversations);
});

app.patch('/api/admin/settings', (req, res) => {
    const nextAvailability = req.body.adminAvailable;
    const nextNote = req.body.availabilityNote;

    if (typeof nextAvailability === 'boolean') {
        adminSettings.adminAvailable = nextAvailability;
    }

    if (typeof nextNote === 'string' && nextNote.trim()) {
        adminSettings.availabilityNote = nextNote.trim();
    }

    persistSettings();

    res.json({
        success: true,
        settings: adminSettings
    });
});

// Start server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = { app };
