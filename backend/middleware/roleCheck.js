module.exports = function (roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ msg: 'Authorization denied. No user found.' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ msg: `Access denied. Requires one of: ${roles.join(', ')}` });
        }

        next();
    };
};
