const activityHistoryService = require('../services/activityHistoryService');
const jwt = require('jsonwebtoken');

// Helper function to get user info from token
const getUserFromToken = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

// Helper function to get IP address
const getIpAddress = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         'Unknown';
};

// Map HTTP methods and routes to action descriptions
const getActionDescription = (method, route, body = {}) => {
  // Normalize route to lowercase for comparison
  const routeLower = route.toLowerCase();
  const routeParts = route.split('/').filter(p => p).map(p => p.toLowerCase());
  
  // Skip logging for activity history endpoints to avoid infinite loops
  if (routeLower.includes('activity-history') || routeLower.includes('activityhistory')) {
    return null;
  }

  // Skip auth routes (login is handled separately in authController)
  if (routeLower.includes('/auth/')) {
    return null;
  }

  // Article actions
  if (routeParts.includes('articles') || routeLower.includes('/articles')) {
    if (method === 'POST') return 'Created article';
    if (method === 'PUT' || method === 'PATCH') return 'Updated article';
    if (method === 'DELETE') return 'Deleted article';
  }

  // Article hierarchy actions
  if (routeParts.includes('article-hierarchy') || routeLower.includes('article-hierarchy') || routeLower.includes('articlehierarchy')) {
    if (method === 'POST') return 'Created article hierarchy';
    if (method === 'PUT' || method === 'PATCH') return 'Updated article hierarchy';
    if (method === 'DELETE') return 'Deleted article hierarchy';
  }

  // Article params actions
  if (routeParts.includes('article-params') || routeLower.includes('article-params') || routeLower.includes('articleparams')) {
    if (method === 'POST') return 'Created article parameter';
    if (method === 'PUT' || method === 'PATCH') return 'Updated article parameter';
    if (method === 'DELETE') return 'Deleted article parameter';
  }

  // Client actions
  if (routeParts.includes('clients') || routeLower.includes('/clients')) {
    if (method === 'POST') return 'Created client';
    if (method === 'PUT' || method === 'PATCH') return 'Updated client';
    if (method === 'DELETE') return 'Deleted client';
  }

  // Order actions
  if (routeParts.includes('orders') || routeLower.includes('/orders')) {
    if (method === 'POST') return 'Created order';
    if (method === 'PUT' || method === 'PATCH') {
      if (body.status) return `Updated order status to ${body.status}`;
      return 'Updated order';
    }
    if (method === 'DELETE') return 'Deleted order';
  }

  // Stock actions
  if (routeParts.includes('stock') || routeLower.includes('/stock')) {
    if (method === 'POST') return 'Created stock entry';
    if (method === 'PUT' || method === 'PATCH') return 'Updated stock';
    if (method === 'DELETE') return 'Deleted stock entry';
  }

  // Supplementary prices
  if (routeParts.includes('supplementary-prices') || routeParts.includes('supplementaryprices') || routeLower.includes('supplementary')) {
    if (method === 'POST') return 'Created supplementary price';
    if (method === 'PUT' || method === 'PATCH') return 'Updated supplementary price';
    if (method === 'DELETE') return 'Deleted supplementary price';
  }

  // Fournisseur actions
  if (routeParts.includes('fournisseurs') || routeLower.includes('/fournisseurs')) {
    if (method === 'POST') return 'Created fournisseur';
    if (method === 'PUT' || method === 'PATCH') return 'Updated fournisseur';
    if (method === 'DELETE') return 'Deleted fournisseur';
  }

  // Opticien actions
  if (routeParts.includes('opticiens') || routeLower.includes('/opticiens')) {
    if (method === 'POST') return 'Created opticien';
    if (method === 'PUT' || method === 'PATCH') return 'Updated opticien';
    if (method === 'DELETE') return 'Deleted opticien';
    if (routeParts.includes('permissions') || routeLower.includes('permissions')) return 'Updated permissions';
  }

  // BL (Bon de Livraison) actions
  if (routeParts.includes('bl') || routeLower.includes('/bl')) {
    if (method === 'POST') {
      if (routeLower.includes('import')) return 'Imported bon de livraison';
      return 'Created bon de livraison';
    }
    if (method === 'PUT' || method === 'PATCH') return 'Updated bon de livraison';
    if (method === 'DELETE') return 'Deleted bon de livraison';
  }

  // Profile update requests
  if (routeParts.includes('profile-update-requests') || routeLower.includes('profile-update') || routeLower.includes('profileupdate')) {
    if (method === 'POST') return 'Created profile update request';
    if (method === 'PUT' || method === 'PATCH') {
      if (body.status === 'approved') return 'Approved profile update request';
      if (body.status === 'rejected') return 'Rejected profile update request';
      return 'Updated profile update request';
    }
  }

  // Settings actions
  if (routeParts.includes('settings') || routeLower.includes('/settings')) {
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') return 'Updated settings';
  }

  // Generic actions based on method (fallback)
  if (method === 'POST') return 'Created resource';
  if (method === 'PUT' || method === 'PATCH') return 'Updated resource';
  if (method === 'DELETE') return 'Deleted resource';

  return null;
};

// Get target description from request
const getTargetDescription = (method, route, body = {}, params = {}) => {
  const routeParts = route.split('/').filter(p => p);
  
  // Try to get meaningful target from body or params
  if (body.raison_social) return body.raison_social;
  if (body.libelle) return body.libelle;
  if (body.name) return body.name;
  if (body.code) return body.code;
  if (body.email) return body.email;
  if (params.id) return `ID: ${params.id}`;
  if (body.id) return `ID: ${body.id}`;

  // For specific routes, return route identifier
  if (routeParts.length > 1) {
    const resource = routeParts[routeParts.length - 1];
    if (resource && !isNaN(resource)) {
      return `ID: ${resource}`;
    }
    return resource;
  }

  return null;
};

// Activity logging middleware
const activityLogger = (req, res, next) => {
  // Skip OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Only log POST, PUT, PATCH, DELETE requests (skip GET requests)
  if (req.method === 'GET') {
    return next();
  }

  // Only log for admin users (administrateur and assistant)
  const user = getUserFromToken(req);
  
  // Debug: Log all POST/PUT/PATCH/DELETE requests
  console.log(`[Activity Logger] ${req.method} ${req.originalUrl || req.path} - Checking user...`);
  
  if (!user) {
    console.log(`[Activity Logger] No user token found for ${req.method} ${req.originalUrl || req.path}`);
    return next();
  }

  console.log(`[Activity Logger] User found: ${user.email || user.id}, Role: ${user.role}`);

  if (user.role !== 'administrateur' && user.role !== 'assistant') {
    console.log(`[Activity Logger] User role ${user.role} is not admin, skipping log`);
    return next();
  }

  // Get the route path (use originalUrl or path)
  const route = req.originalUrl || req.path;
  
  // Get action description
  const action = getActionDescription(req.method, route, req.body || {});
  
  // Debug logging (can be removed later)
  if (action) {
    console.log(`[Activity Logger] ${req.method} ${route} - Action: ${action} - User: ${user.email || user.id}`);
  } else {
    console.log(`[Activity Logger] ${req.method} ${route} - No action description - User: ${user.email || user.id}`);
  }
  
  // Skip if no action description
  if (!action) {
    return next();
  }

  // Get target description
  const target = getTargetDescription(req.method, route, req.body || {}, req.params || {});

  // Get user name
  const userName = user.nom && user.prenom 
    ? `${user.prenom} ${user.nom}` 
    : user.email || 'Unknown';

  // Log activity asynchronously (don't wait for it)
  activityHistoryService.logActivity(
    user.id,
    userName,
    user.role,
    action,
    target,
    getIpAddress(req)
  ).then(() => {
    console.log(`[Activity Logger] Successfully logged: ${action} by ${userName}`);
  }).catch(err => {
    console.error('[Activity Logger] Error logging activity:', err);
  });

  next();
};

module.exports = activityLogger;

