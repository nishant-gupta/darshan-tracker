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
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: message }),
    });
  } catch (error) {
    console.error('Error sending Slack notification:', error);
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

export async function GET(request: Request) {
  try {
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
    
    // Check for changes
    const darshanMessage = detectNewSlots(darshanSlots, previousDarshanSlots, 'darshan');
    const aartiMessage = detectNewSlots(aartiSlots, previousAartiSlots, 'aarti');
    
    // Send notifications if changes detected
    if (darshanMessage) {
      await sendSlackNotification(darshanMessage);
    }
    
    if (aartiMessage) {
      await sendSlackNotification(aartiMessage);
    }
    
    // Update previous state
    previousDarshanSlots = darshanSlots;
    previousAartiSlots = aartiSlots;
    
    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      notifications: {
        darshan: !!darshanMessage,
        aarti: !!aartiMessage
      },
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