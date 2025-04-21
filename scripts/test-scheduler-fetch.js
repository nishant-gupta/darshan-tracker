/**
 * Local scheduler test script using modern fetch API
 * 
 * This script simulates the cron job by calling the slots-monitor API endpoint
 * at regular intervals.
 * 
 * Usage: node scripts/test-scheduler-fetch.js
 */

// Configuration
const INTERVAL_MINUTES = 5; // Testing every 5 minutes
const API_URL = 'http://localhost:3001/api/slots-monitor?test_mode=true';

console.log(`🕒 Starting scheduler test - Will check every ${INTERVAL_MINUTES} minute(s)`);
console.log(`📡 Target endpoint: ${API_URL}`);
console.log('📝 Press Ctrl+C to stop the test\n');

// Perform the initial check immediately
runCheck();

// Set interval to run checks periodically
const intervalId = setInterval(runCheck, INTERVAL_MINUTES * 60 * 1000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping scheduler test');
  clearInterval(intervalId);
  process.exit(0);
});

/**
 * Run a check by calling the slots-monitor API endpoint
 */
async function runCheck() {
  const timestamp = new Date().toISOString();
  console.log(`\n⏱️  Running check at ${timestamp}`);
  
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add auth token if needed
        // 'x-auth-token': 'your-token-here'
      },
    });
    
    console.log(`📊 Status Code: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📋 Response:', JSON.stringify(data, null, 2));
    
    // Check for notifications
    if (data.notifications) {
      if (data.notifications.darshan) {
        console.log('🔔 Darshan notification was sent to Slack!');
      }
      if (data.notifications.aarti) {
        console.log('🔔 Aarti notification was sent to Slack!');
      }
      if (data.notifications.test) {
        console.log('🧪 Test notification was sent to Slack!');
      }
    }
    
    console.log(`✅ Check completed at ${new Date().toISOString()}`);
    console.log(`⏳ Next check in ${INTERVAL_MINUTES} minute(s)...`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.log(`⚠️ Make sure your Next.js dev server is running on port 3000`);
  }
} 