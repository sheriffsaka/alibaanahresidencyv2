import { AdminNavSection } from '../components/admin/AdminSidebar';
import { User } from '../types';

/**
 * Default section permissions for Limited Admin (staff role)
 */
export const DEFAULT_STAFF_SECTIONS: AdminNavSection[] = [
  'bookings',
  'students',
  'transactions',
  'messages',
];

/**
 * Full master list of all AdminNavSections
 */
export const ALL_ADMIN_SECTIONS: AdminNavSection[] = [
  'dashboard',
  'bookings',
  'students',
  'rooms_inventory',
  'apartment_media',
  'room_pricing',
  'waitlist',
  'email_logs',
  'maintenance',
  'transactions',
  'payments_credits',
  'messages',
  'reviews',
  'landing_branding',
  'contracts',
  'student_documents',
  'faqs_announcements',
  'admin_users',
  'settings'
];

export interface ConfigurableSectionMeta {
  id: AdminNavSection;
  label: string;
  category: 'Overview' | 'Operations' | 'Finance' | 'Engagement' | 'Content' | 'Administration';
  icon: string;
  description: string;
}

/**
 * Sections that a Main Admin (proprietor) can delegate to Limited Admin (staff).
 * Note: 'admin_users' is strictly reserved for Proprietor only and cannot be delegated.
 */
export const CONFIGURABLE_STAFF_SECTIONS: ConfigurableSectionMeta[] = [
  // Default checked operations
  { id: 'bookings', label: 'Bookings', category: 'Operations', icon: '🛏️', description: 'Occupants, reservations, and approvals' },
  { id: 'students', label: 'Students', category: 'Operations', icon: '🎓', description: 'Student directory and records' },
  { id: 'transactions', label: 'Transactions', category: 'Finance', icon: '💳', description: 'Payments, bank proofs, and invoices' },
  { id: 'messages', label: 'Messages / Inbox', category: 'Engagement', icon: '💬', description: 'Student communications and chats' },

  // Additional configurable operations
  { id: 'dashboard', label: 'Dashboard Overview', category: 'Overview', icon: '📊', description: 'Operational metrics and quick actions' },
  { id: 'rooms_inventory', label: 'Rooms & Inventory', category: 'Operations', icon: '🚪', description: 'Room numbers, capacities, and beds' },
  { id: 'apartment_media', label: 'Apartment Media & Tours', category: 'Operations', icon: '🎥', description: 'Photos, 3D tours, and walkthroughs' },
  { id: 'room_pricing', label: 'Room Pricing', category: 'Operations', icon: '🏷️', description: 'Pricing tiers and currency conversions' },
  { id: 'waitlist', label: 'Waitlist Queue', category: 'Operations', icon: '⏳', description: 'Student applicant waiting list' },
  { id: 'payments_credits', label: 'Payments & Credits', category: 'Finance', icon: '🔄', description: 'Security deposit ledger and credits' },
  { id: 'reviews', label: 'Reviews & Ratings', category: 'Engagement', icon: '⭐', description: 'Resident feedback and reviews' },
  { id: 'landing_branding', label: 'Landing Page & Branding', category: 'Content', icon: '🎨', description: 'Hero copy, imagery, and branding' },
  { id: 'contracts', label: 'Contract Templates', category: 'Content', icon: '📜', description: 'Tenancy agreement texts and terms' },
  { id: 'student_documents', label: 'Student Documents', category: 'Content', icon: '📁', description: 'Passports, visas, and handbooks' },
  { id: 'faqs_announcements', label: 'FAQs & Announcements', category: 'Content', icon: '📢', description: 'Knowledge base and bulletin boards' },
  { id: 'email_logs', label: 'Email Delivery Logs', category: 'Administration', icon: '✉️', description: 'Outbound notifications audit trail' },
  { id: 'maintenance', label: 'Maintenance Requests', category: 'Operations', icon: '🔧', description: 'Property repairs and room tickets' },
  { id: 'settings', label: 'System Settings', category: 'Administration', icon: '⚙️', description: 'Residency configurations and policies' }
];

/**
 * Returns the array of permitted AdminNavSection IDs for a given user.
 * - proprietor has full access to ALL sections (including admin_users).
 * - staff has access to user.allowed_sections (if present & non-empty) or DEFAULT_STAFF_SECTIONS.
 * - other roles have no admin sections.
 */
export function getAllowedAdminSections(user: User | null | undefined): AdminNavSection[] {
  if (!user) return [];

  // Proprietor (Main Admin) has absolute full access to everything
  if (user.role === 'proprietor') {
    return [...ALL_ADMIN_SECTIONS];
  }

  // Staff (Limited Admin) uses allowed_sections from profiles, defaulting to the 4 core sections
  if (user.role === 'staff') {
    if (Array.isArray(user.allowed_sections) && user.allowed_sections.length > 0) {
      // Validate against known section IDs and ensure admin_users cannot be delegated
      const filtered = user.allowed_sections.filter(
        (sec): sec is AdminNavSection => 
          ALL_ADMIN_SECTIONS.includes(sec as AdminNavSection) && sec !== 'admin_users'
      );
      if (filtered.length > 0) {
        return filtered;
      }
    }
    // Default staff access if no custom sections stored
    return [...DEFAULT_STAFF_SECTIONS];
  }

  return [];
}

/**
 * Checks whether a specific section is allowed for a user.
 */
export function isSectionAllowed(
  user: User | null | undefined, 
  section: AdminNavSection | string | null | undefined
): boolean {
  if (!user || !section) return false;
  if (user.role === 'proprietor') return true;
  if (user.role !== 'staff') return false;
  if (section === 'admin_users') return false; // Proprietor-exclusive section

  const allowed = getAllowedAdminSections(user);
  return allowed.includes(section as AdminNavSection);
}

/**
 * Resolves a safe section to display for a user.
 * If the target section is permitted, returns it.
 * Otherwise, redirects to the user's first permitted section.
 * Defaults to 'bookings' if no sections are available.
 */
export function resolveSafeSection(
  user: User | null | undefined,
  targetSection: AdminNavSection | string | null | undefined
): AdminNavSection {
  const allowed = getAllowedAdminSections(user);

  if (targetSection && allowed.includes(targetSection as AdminNavSection)) {
    return targetSection as AdminNavSection;
  }

  // Fallback to first permitted section
  if (allowed.length > 0) {
    return allowed[0];
  }

  return 'bookings';
}
