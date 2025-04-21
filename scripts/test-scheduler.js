/**
 * Local scheduler test script
 * 
 * This script simulates the cron job by calling the slots-monitor API endpoint
 * at regular intervals.
 * 
 * Usage: node scripts/test-scheduler.js
 */

const http = require('http');

// Configuration
const INTERVAL_MINUTES = 1; // Set to 1 minute for testing, change as needed
const API_PATH = '/api/slots-monitor';
const PORT = 3000; // Default Next.js development port

console.log(`🕒 Starting scheduler test - Will check every ${INTERVAL_MINUTES} minute(s)`);
console.log(`📡 Target endpoint: http://localhost:${PORT}${API_PATH}`);
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
function runCheck() {
  const timestamp = new Date().toISOString();
  console.log(`\n⏱️  Running check at ${timestamp}`);
  
  const options = {
    hostname: 'localhost',
    port: PORT,
    path: API_PATH,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Add auth token if needed
      // 'x-auth-token': 'your-token-here'
    }
  };
  
  const req = http.request(options, (res) => {
    const statusCode = res.statusCode;
    console.log(`📊 Status Code: ${statusCode}`);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(data);
        console.log('📋 Response:', JSON.stringify(parsedData, null, 2));
        
        // Check for notifications
        if (parsedData.notifications) {
          if (parsedData.notifications.darshan) {
            console.log('🔔 Darshan notification would be sent to Slack!');
          }
          if (parsedData.notifications.aarti) {
            console.log('🔔 Aarti notification would be sent to Slack!');
          }
        }
        
        console.log(`✅ Check completed at ${new Date().toISOString()}`);
        console.log(`⏳ Next check in ${INTERVAL_MINUTES} minute(s)...`);
      } catch (e) {
        console.error('❌ Error parsing response:', e.message);
        console.log('Raw response:', data);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`❌ Error making request: ${e.message}`);
    console.log(`⚠️ Make sure your Next.js dev server is running on port ${PORT}`);
  });
  
  req.end();
} 