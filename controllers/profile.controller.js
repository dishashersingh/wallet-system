// GET /api/user/profile - Return authenticated user's profile
export const fetchUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ error: 'Access denied: user not authenticated' });
    }

    res.status(200).json({
      message: 'Authenticated user profile retrieved successfully',
      user: req.user
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
  }
};
