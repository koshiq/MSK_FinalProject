const db = require('../config/database');

/**
 * Role-based authorization middleware
 * Checks if the authenticated user has one of the allowed roles
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 */
const roleAuth = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.viewer || !req.viewer.viewerId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            // Get user's role from database
            const [users] = await db.query(
                'SELECT ROLE FROM MSK_VIEWER WHERE VIEWER_ID = ?',
                [req.viewer.viewerId]
            );

            if (users.length === 0) {
                return res.status(401).json({ error: 'User not found' });
            }

            const userRole = users[0].ROLE || 'customer';

            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({ 
                    error: 'Access denied. Insufficient permissions.',
                    required: allowedRoles,
                    current: userRole
                });
            }

            // Attach role to request for further use
            req.viewer.role = userRole;
            next();
        } catch (error) {
            console.error('Role auth error:', error);
            res.status(500).json({ error: 'Authorization check failed' });
        }
    };
};

/**
 * Check if user is admin
 */
const isAdmin = roleAuth('admin');

/**
 * Check if user is admin or employee
 */
const isStaff = roleAuth('admin', 'employee');

/**
 * Check if user owns the resource or is admin
 * @param {string} resourceIdParam - The request parameter containing the resource owner ID
 */
const isOwnerOrAdmin = (resourceIdParam = 'id') => {
    return async (req, res, next) => {
        try {
            if (!req.viewer || !req.viewer.viewerId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            // Get user's role from database
            const [users] = await db.query(
                'SELECT ROLE FROM MSK_VIEWER WHERE VIEWER_ID = ?',
                [req.viewer.viewerId]
            );

            if (users.length === 0) {
                return res.status(401).json({ error: 'User not found' });
            }

            const userRole = users[0].ROLE || 'customer';
            const resourceOwnerId = parseInt(req.params[resourceIdParam] || req.body.viewerId);

            // Admins can access any resource
            if (userRole === 'admin') {
                req.viewer.role = userRole;
                return next();
            }

            // Check if user owns the resource
            if (req.viewer.viewerId === resourceOwnerId) {
                req.viewer.role = userRole;
                return next();
            }

            return res.status(403).json({ 
                error: 'Access denied. You can only modify your own resources.' 
            });
        } catch (error) {
            console.error('Owner auth error:', error);
            res.status(500).json({ error: 'Authorization check failed' });
        }
    };
};

module.exports = { roleAuth, isAdmin, isStaff, isOwnerOrAdmin };

