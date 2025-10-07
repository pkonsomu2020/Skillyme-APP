// Test script to verify all frontend-backend connections
import { adminApi } from './services/api';

export const testAllConnections = async () => {
  console.log('🧪 TESTING FRONTEND-BACKEND CONNECTIONS');
  console.log('=====================================\n');

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
  };

  const logTest = (testName: string, success: boolean, message: string = '') => {
    results.total++;
    if (success) {
      results.passed++;
      console.log(`✅ ${testName}`);
    } else {
      results.failed++;
      console.log(`❌ ${testName}: ${message}`);
    }
    results.details.push({ test: testName, success, message });
  };

  // Test 1: Admin Authentication
  try {
    const response = await adminApi.auth.login('admin@skillyme.com', 'AdminPass@2024!');
    if (response.success && response.data?.token) {
      logTest('Admin Authentication', true, 'Login successful');
      localStorage.setItem('adminToken', response.data.token);
    } else {
      logTest('Admin Authentication', false, 'Login failed');
    }
  } catch (error) {
    logTest('Admin Authentication', false, error instanceof Error ? error.message : 'Unknown error');
  }

  // Test 2: Dashboard Analytics
  try {
    const response = await adminApi.analytics.getDashboardStats();
    if (response.success && response.data?.overview) {
      logTest('Dashboard Analytics', true, `Stats loaded: ${response.data.overview.totalUsers} users`);
    } else {
      logTest('Dashboard Analytics', false, 'Failed to load dashboard stats');
    }
  } catch (error) {
    logTest('Dashboard Analytics', false, error instanceof Error ? error.message : 'Unknown error');
  }

  // Test 3: Sessions Management
  try {
    const response = await adminApi.sessions.getAllSessions();
    if (response.success && response.data?.sessions) {
      logTest('Sessions Management', true, `Found ${response.data.sessions.length} sessions`);
    } else {
      logTest('Sessions Management', false, 'Failed to load sessions');
    }
  } catch (error) {
    logTest('Sessions Management', false, error instanceof Error ? error.message : 'Unknown error');
  }

  // Test 4: Users Management
  try {
    const response = await adminApi.users.getAllUsers();
    if (response.success && response.data?.users) {
      logTest('Users Management', true, `Found ${response.data.users.length} users`);
    } else {
      logTest('Users Management', false, 'Failed to load users');
    }
  } catch (error) {
    logTest('Users Management', false, error instanceof Error ? error.message : 'Unknown error');
  }

  // Test 5: Notifications
  try {
    const response = await adminApi.notifications.getNotificationHistory();
    if (response.success && response.data?.notifications) {
      logTest('Notifications', true, `Found ${response.data.notifications.length} notifications`);
    } else {
      logTest('Notifications', false, 'Failed to load notifications');
    }
  } catch (error) {
    logTest('Notifications', false, error instanceof Error ? error.message : 'Unknown error');
  }

  // Test 6: User Demographics
  try {
    const response = await adminApi.analytics.getUserDemographics();
    if (response.success && response.data) {
      logTest('User Demographics', true, 'Demographics data loaded');
    } else {
      logTest('User Demographics', false, 'Failed to load demographics');
    }
  } catch (error) {
    logTest('User Demographics', false, error instanceof Error ? error.message : 'Unknown error');
  }

  // Test 7: Signup Trends
  try {
    const response = await adminApi.analytics.getSignupTrends();
    if (response.success && response.data) {
      logTest('Signup Trends', true, `Trends data loaded: ${response.data.length} data points`);
    } else {
      logTest('Signup Trends', false, 'Failed to load signup trends');
    }
  } catch (error) {
    logTest('Signup Trends', false, error instanceof Error ? error.message : 'Unknown error');
  }

  // Test 8: Session Performance
  try {
    const response = await adminApi.analytics.getSessionPerformance();
    if (response.success && response.data) {
      logTest('Session Performance', true, `Performance data loaded: ${response.data.length} sessions`);
    } else {
      logTest('Session Performance', false, 'Failed to load session performance');
    }
  } catch (error) {
    logTest('Session Performance', false, error instanceof Error ? error.message : 'Unknown error');
  }

  // Print final results
  console.log('\n📊 CONNECTION TEST RESULTS');
  console.log('==========================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);

  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.details
      .filter(test => !test.success)
      .forEach(test => console.log(`   - ${test.test}: ${test.message}`));
  }

  // Overall assessment
  const successRate = Math.round((results.passed / results.total) * 100);

  console.log('\n🎯 FRONTEND-BACKEND STATUS:');
  console.log('============================');

  if (successRate >= 90) {
    console.log('🎉 ALL CONNECTIONS WORKING!');
    console.log('✅ Frontend is fully connected to backend');
    console.log('✅ All APIs are functional');
    console.log('✅ Ready for production use');
  } else if (successRate >= 70) {
    console.log('⚠️  MOSTLY WORKING');
    console.log('✅ Good connection rate - Minor issues to address');
  } else {
    console.log('❌ CONNECTION ISSUES');
    console.log('⚠️  Low success rate - Several connections need fixing');
  }

  console.log('\n🚀 Frontend-backend connection testing complete!');
  
  return results;
};

// Export for use in components
export default testAllConnections;
