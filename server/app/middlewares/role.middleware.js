export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. User tidak terautentikasi.',
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Memerlukan peran ${role}.`,
      });
    }

    next();
  };
};
