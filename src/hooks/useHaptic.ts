export function useHaptic() {
  const light = () => {
    if (navigator.vibrate) navigator.vibrate(10);
  };
  const medium = () => {
    if (navigator.vibrate) navigator.vibrate(20);
  };
  const heavy = () => {
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
  };
  return { light, medium, heavy };
}
