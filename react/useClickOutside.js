/**
 * Custom React hook for detecting clicks outside of a component
 * @param {Function} callback - Function to call when click outside is detected
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether the hook is enabled (default: true)
 * @param {Array} options.excludeRefs - Array of refs to exclude from detection
 * @param {string} options.eventType - Type of event to listen for (default: 'mousedown')
 * @param {boolean} options.capture - Use capture phase (default: false)
 * @returns {Object} { ref, isOutside }
 */
import { useRef, useEffect, useCallback, useState } from 'react';

function useClickOutside(callback, options = {}) {
  const {
    enabled = true,
    excludeRefs = [],
    eventType = 'mousedown',
    capture = false
  } = options;

  const ref = useRef(null);
  const [isOutside, setIsOutside] = useState(false);

  const handleClickOutside = useCallback((event) => {
    if (!enabled || !ref.current) return;

    // Check if click is inside the main ref
    const isInsideMain = ref.current.contains(event.target);
    
    // Check if click is inside any excluded refs
    const isInsideExcluded = excludeRefs.some(excludeRef => {
      return excludeRef && excludeRef.current && excludeRef.current.contains(event.target);
    });

    // Determine if click is outside
    const clickedOutside = !isInsideMain && !isInsideExcluded;
    
    setIsOutside(clickedOutside);

    if (clickedOutside) {
      callback(event);
    }
  }, [callback, enabled, excludeRefs]);

  // Handle touch events for mobile devices
  const handleTouchOutside = useCallback((event) => {
    if (!enabled || !ref.current) return;

    const isInsideMain = ref.current.contains(event.target);
    const isInsideExcluded = excludeRefs.some(excludeRef => {
      return excludeRef && excludeRef.current && excludeRef.current.contains(event.target);
    });

    const touchedOutside = !isInsideMain && !isInsideExcluded;
    
    setIsOutside(touchedOutside);

    if (touchedOutside) {
      callback(event);
    }
  }, [callback, enabled, excludeRefs]);

  // Handle escape key
  const handleEscapeKey = useCallback((event) => {
    if (!enabled || event.key !== 'Escape') return;
    
    setIsOutside(true);
    callback(event);
  }, [callback, enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Add event listeners
    document.addEventListener(eventType, handleClickOutside, capture);
    document.addEventListener('touchstart', handleTouchOutside, capture);
    document.addEventListener('keydown', handleEscapeKey, capture);

    // Cleanup function
    return () => {
      document.removeEventListener(eventType, handleClickOutside, capture);
      document.removeEventListener('touchstart', handleTouchOutside, capture);
      document.removeEventListener('keydown', handleEscapeKey, capture);
    };
  }, [handleClickOutside, handleTouchOutside, handleEscapeKey, eventType, capture, enabled]);

  // Reset outside state when enabled changes
  useEffect(() => {
    if (!enabled) {
      setIsOutside(false);
    }
  }, [enabled]);

  return { ref, isOutside };
}

// Example usage:
// function DropdownMenu() {
//   const [isOpen, setIsOpen] = useState(false);
//   const buttonRef = useRef(null);
//   
//   const { ref: dropdownRef, isOutside } = useClickOutside(
//     () => setIsOpen(false),
//     {
//       enabled: isOpen,
//       excludeRefs: [buttonRef],
//       eventType: 'mousedown'
//     }
//   );
//   
//   return (
//     <div>
//       <button ref={buttonRef} onClick={() => setIsOpen(!isOpen)}>
//         Toggle Menu
//       </button>
//       {isOpen && (
//         <div ref={dropdownRef} className="dropdown-menu">
//           <div>Menu Item 1</div>
//           <div>Menu Item 2</div>
//         </div>
//       )}
//     </div>
//   );
// }
// 
// function Modal({ isOpen, onClose, children }) {
//   const { ref } = useClickOutside(onClose, {
//     enabled: isOpen,
//     eventType: 'mousedown'
//   });
//   
//   if (!isOpen) return null;
//   
//   return (
//     <div className="modal-overlay">
//       <div ref={ref} className="modal-content">
//         {children}
//       </div>
//     </div>
//   );
// }

export default useClickOutside;