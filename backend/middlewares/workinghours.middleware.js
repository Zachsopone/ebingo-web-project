export const workingHoursGuard = (req, res, next) => {
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();

  const startMinutes = 9 * 60;        // 9:00 AM
  const endMinutes = 18 * 60 + 5;     // 6:05 PM
  const currentMinutes = hour * 60 + min;

  const isOpen = currentMinutes >= startMinutes && currentMinutes <= endMinutes;

  if (!isOpen) {
    return res.status(423).json({
      message: "Ebingo system is currently closed",
      isClosed: true
    });
  }

  next();
};
