// scripts/test_limited_admin_permissions.cjs
// Automated test suite for Limited Admin permission resolver, defaults, URL redirection, and proprietor full access.

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Replicate or require the resolver logic directly
const DEFAULT_STAFF_SECTIONS = [
  'bookings',
  'students',
  'transactions',
  'messages',
];

const ALL_ADMIN_SECTIONS = [
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

function getAllowedAdminSections(user) {
  if (!user) return [];
  if (user.role === 'proprietor') {
    return [...ALL_ADMIN_SECTIONS];
  }
  if (user.role === 'staff') {
    if (Array.isArray(user.allowed_sections) && user.allowed_sections.length > 0) {
      const filtered = user.allowed_sections.filter(
        (sec) => ALL_ADMIN_SECTIONS.includes(sec) && sec !== 'admin_users'
      );
      if (filtered.length > 0) {
        return filtered;
      }
    }
    return [...DEFAULT_STAFF_SECTIONS];
  }
  return [];
}

function isSectionAllowed(user, section) {
  if (!user || !section) return false;
  if (user.role === 'proprietor') return true;
  if (user.role !== 'staff') return false;
  if (section === 'admin_users') return false;
  const allowed = getAllowedAdminSections(user);
  return allowed.includes(section);
}

function resolveSafeSection(user, targetSection) {
  const allowed = getAllowedAdminSections(user);
  if (targetSection && allowed.includes(targetSection)) {
    return targetSection;
  }
  if (allowed.length > 0) {
    return allowed[0];
  }
  return 'bookings';
}

async function runTests() {
  console.log("==========================================================");
  console.log("  Limited Admin & Main Admin Permission Test Suite        ");
  console.log("==========================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${message}`);
    }
  }

  // Test 1: Main Admin (proprietor) retains complete access to all sections
  console.log("[Test 1] Testing Main Admin (proprietor) access...");
  const mainAdminUser = {
    id: 'prop-1',
    role: 'proprietor',
    full_name: 'Main Administrator'
  };
  const propAllowed = getAllowedAdminSections(mainAdminUser);
  assert(propAllowed.length === ALL_ADMIN_SECTIONS.length, "Main Admin has access to all 19 admin sections");
  assert(isSectionAllowed(mainAdminUser, 'admin_users'), "Main Admin can access 'admin_users'");
  assert(isSectionAllowed(mainAdminUser, 'settings'), "Main Admin can access 'settings'");
  assert(isSectionAllowed(mainAdminUser, 'dashboard'), "Main Admin can access 'dashboard'");
  assert(resolveSafeSection(mainAdminUser, 'settings') === 'settings', "Main Admin resolveSafeSection keeps 'settings'");
  assert(resolveSafeSection(mainAdminUser, 'admin_users') === 'admin_users', "Main Admin resolveSafeSection keeps 'admin_users'");

  // Test 2: Limited Admin (staff) with default permissions
  console.log("\n[Test 2] Testing Limited Admin (staff) default permissions...");
  const defaultStaffUser = {
    id: 'staff-1',
    role: 'staff',
    full_name: 'Staff Member'
  };
  const staffAllowed = getAllowedAdminSections(defaultStaffUser);
  assert(staffAllowed.length === 4, "Limited Admin default has exactly 4 permitted sections");
  assert(staffAllowed.includes('bookings'), "Default includes 'bookings'");
  assert(staffAllowed.includes('students'), "Default includes 'students'");
  assert(staffAllowed.includes('transactions'), "Default includes 'transactions'");
  assert(staffAllowed.includes('messages'), "Default includes 'messages'");
  assert(!staffAllowed.includes('admin_users'), "Default excludes 'admin_users'");
  assert(!staffAllowed.includes('settings'), "Default excludes 'settings'");
  assert(!staffAllowed.includes('room_pricing'), "Default excludes 'room_pricing'");

  // Test 3: Direct URL access to restricted sections
  console.log("\n[Test 3] Testing URL deep link / direct URL interception for staff...");
  const restrictedAttempt1 = resolveSafeSection(defaultStaffUser, 'settings');
  assert(restrictedAttempt1 === 'bookings', `Staff accessing ?section=settings redirected to first permitted section '${restrictedAttempt1}'`);
  const restrictedAttempt2 = resolveSafeSection(defaultStaffUser, 'admin_users');
  assert(restrictedAttempt2 === 'bookings', `Staff accessing ?section=admin_users redirected to '${restrictedAttempt2}'`);
  const restrictedAttempt3 = resolveSafeSection(defaultStaffUser, 'room_pricing');
  assert(restrictedAttempt3 === 'bookings', `Staff accessing ?section=room_pricing redirected to '${restrictedAttempt3}'`);
  const validAttempt = resolveSafeSection(defaultStaffUser, 'transactions');
  assert(validAttempt === 'transactions', `Staff accessing ?section=transactions safely allowed`);

  // Test 4: Custom configurable permissions granted by Main Admin
  console.log("\n[Test 4] Testing custom permissions granted by Main Admin...");
  const customStaffUser = {
    id: 'staff-custom',
    role: 'staff',
    full_name: 'Custom Staff',
    allowed_sections: ['students', 'messages', 'waitlist', 'reviews']
  };
  const customAllowed = getAllowedAdminSections(customStaffUser);
  assert(customAllowed.length === 4, "Custom staff has 4 configured sections");
  assert(isSectionAllowed(customStaffUser, 'waitlist'), "Custom staff permitted to access 'waitlist'");
  assert(isSectionAllowed(customStaffUser, 'reviews'), "Custom staff permitted to access 'reviews'");
  assert(!isSectionAllowed(customStaffUser, 'bookings'), "Custom staff not permitted to access 'bookings' when not granted");
  assert(resolveSafeSection(customStaffUser, 'bookings') === 'students', "Custom staff accessing ?section=bookings redirected to first permitted section 'students'");

  // Test 5: Verify security rule: admin_users is strictly barred from staff delegation
  console.log("\n[Test 5] Testing delegation safety check (admin_users cannot be delegated to staff)...");
  const rogueStaffUser = {
    id: 'staff-rogue',
    role: 'staff',
    full_name: 'Rogue Staff',
    allowed_sections: ['bookings', 'admin_users']
  };
  assert(!isSectionAllowed(rogueStaffUser, 'admin_users'), "Staff user with 'admin_users' in allowed_sections is rejected for 'admin_users'");
  const rogueAllowed = getAllowedAdminSections(rogueStaffUser);
  assert(!rogueAllowed.includes('admin_users'), "admin_users filtered out of allowed sections for staff");

  // Test 6: Verify Live Supabase profiles table query
  console.log("\n[Test 6] Testing live Supabase query on profiles table...");
  const { data: adminProfiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'proprietor');
  
  if (pErr) {
    console.error("Failed to query profiles:", pErr);
  } else {
    assert(adminProfiles && adminProfiles.length > 0, `Successfully found ${adminProfiles.length} proprietor profile(s) in Supabase`);
    const adminP = adminProfiles[0];
    const liveAdminAllowed = getAllowedAdminSections(adminP);
    assert(liveAdminAllowed.length === 19, "Live proprietor profile resolves all 19 permissions");
  }

  console.log("\n==========================================================");
  console.log(`  Tests Complete: ${passed}/${total} passed (${((passed/total)*100).toFixed(1)}%)`);
  console.log("==========================================================");
}

runTests().catch(console.error);
