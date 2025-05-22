export const checkAdminAccess = (req, res, next) => {
  if (req.user?.isAdmin) {
    return next();
  }

  return res.status(403).json({ message: 'Access denied: Admins only' });
};
