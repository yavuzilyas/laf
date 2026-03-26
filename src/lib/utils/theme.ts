export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getCurrentTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  
  // Check for explicit theme setting first
  const htmlElement = document.documentElement;
  if (htmlElement.classList.contains('dark')) {
    return 'dark';
  } else if (htmlElement.classList.contains('light')) {
    return 'light';
  }
  
  // Fall back to system preference
  return getSystemTheme();
}
