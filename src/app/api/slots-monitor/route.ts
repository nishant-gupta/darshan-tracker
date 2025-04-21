import { NextResponse } from 'next/server';
import { getAvailableDarshanSlots, getAvailableAartiSlots, AvailableSlot, DarshanSlot, AartiSlot } from '@/utils/api';

// In-memory cache for previous state (in production, use a database)
let previousDarshanSlots: AvailableSlot[] | null = null;
let previousAartiSlots: AvailableSlot[] | null = null;

async function sendSlackNotification(message: string) {
  // Replace with your actual Slack webhook URL
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.error('Slack webhook URL not configured');
    return;
  }
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: message }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    return false;
  }
}

function detectNewSlots(newSlots: AvailableSlot[], previousSlots: AvailableSlot[] | null, slotType: string) {
  if (!previousSlots) return null;
  
  // Find newly available dates
  const newAvailableDates = newSlots.filter(
    newSlot => !previousSlots.some(
      prevSlot => prevSlot.date === newSlot.date
    )
  );
  
  // Find dates with more available slots than before
  const datesWithMoreSlots = newSlots.filter(newSlot => {
    const prevSlot = previousSlots.find(ps => ps.date === newSlot.date);
    return prevSlot && newSlot.slots.length > prevSlot.slots.length;
  });
  
  // Combine results
  const changedSlots = [...newAvailableDates, ...datesWithMoreSlots];
  
  if (changedSlots.length === 0) return null;
  
  // Format a message
  let message = `🔔 *New ${slotType} availability detected!*\n\n`;
  
  changedSlots.forEach(slot => {
    message += `📅 *${slot.formattedDate}*\n`;
    message += `   - ${slot.slots.length} slots available\n`;
    
    // List a few specific slots (limit to first 3 to avoid overly long messages)
    const slotsToShow = slot.slots.slice(0, 3);
    slotsToShow.forEach((slotDetail: DarshanSlot | AartiSlot) => {
      const timeRange = `${slotDetail.slotBeginTime} - ${slotDetail.slotEndTime}`;
      message += `   - ${slotDetail.slotName}: ${timeRange}\n`;
    });
    
    if (slot.slots.length > 3) {
      message += `   - ... and ${slot.slots.length - 3} more slots\n`;
    }
    
    message += '\n';
  });
  
  message += `Check the dashboard for more details: ${process.env.APP_URL || 'https://your-app-url.com'}`;
  
  return message;
}

function generateTestNotification(darshanSlots: AvailableSlot[], aartiSlots: AvailableSlot[]) {
  const now = new Date();
  const formattedTime = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    timeZoneName: 'short'
  });
  
  let message = `🧪 *Slot Monitor Test Notification*\n\n`;
  message += `🕒 Check performed at: ${formattedTime}\n\n`;
  message += `📊 *Current Availability:*\n`;
  message += `   - Darshan: ${darshanSlots.length} dates with available slots\n`;
  message += `   - Aarti: ${aartiSlots.length} dates with available slots\n\n`;
  
  // Show sample of current data if available
  if (darshanSlots.length > 0) {
    const sample = darshanSlots[0];
    message += `📅 *Sample Darshan Date: ${sample.formattedDate}*\n`;
    message += `   - ${sample.slots.length} slots available\n\n`;
  }
  
  if (aartiSlots.length > 0) {
    const sample = aartiSlots[0];
    message += `📅 *Sample Aarti Date: ${sample.formattedDate}*\n`;
    message += `   - ${sample.slots.length} slots available\n\n`;
  }
  
  message += `🔗 Check the dashboard for details: ${process.env.APP_URL || 'https://your-app-url.com'}\n`;
  message += `🧪 This is a test notification - Monitor is functioning correctly`;
  
  return message;
}

export async function GET(request: Request) {
  try {
    // Parse URL to check for test mode
    const url = new URL(request.url);
    const isTestMode = url.searchParams.has('test_mode');
    
    // Get the auth token from request headers or environment
    const authToken = request.headers.get('x-auth-token') || process.env.NEXT_PUBLIC_API_TOKEN;
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication token required' }, 
        { status: 401 }
      );
    }
    
    // Get current time
    const now = new Date();
    
    // Fetch latest slot data
    const darshanSlots = await getAvailableDarshanSlots();
    const aartiSlots = await getAvailableAartiSlots();
    
    // Variables to track notification status
    let darshanNotificationSent = false;
    let aartiNotificationSent = false;
    let testNotificationSent = false;
    
    // Regular change detection if not in test mode or in addition to test mode
    const darshanMessage = detectNewSlots(darshanSlots, previousDarshanSlots, 'darshan');
    const aartiMessage = detectNewSlots(aartiSlots, previousAartiSlots, 'aarti');
    
    // Send notifications if changes detected
    if (darshanMessage) {
      darshanNotificationSent = await sendSlackNotification(darshanMessage) || false;
    }
    
    if (aartiMessage) {
      aartiNotificationSent = await sendSlackNotification(aartiMessage) || false;
    }
    
    // Send test notification if in test mode
    if (isTestMode) {
      const testMessage = generateTestNotification(darshanSlots, aartiSlots);
      testNotificationSent = await sendSlackNotification(testMessage) || false;
    }
    
    // Update previous state
    previousDarshanSlots = darshanSlots;
    previousAartiSlots = aartiSlots;
    
    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      notifications: {
        darshan: darshanNotificationSent,
        aarti: aartiNotificationSent,
        test: testNotificationSent
      },
      test_mode: isTestMode,
      darshanSlotCount: darshanSlots.length,
      aartiSlotCount: aartiSlots.length
    });
  } catch (error) {
    console.error('Error in slots monitor:', error);
    
    return NextResponse.json(
      { error: 'Failed to check slot availability' },
      { status: 500 }
    );
  }
} 