# Darshan & Aarti Availability Tracker

A Next.js web application to track and display available darshan and aarti slots at SRJBTS.

## Features

- Real-time checking of Darshan availability
- Real-time checking of Aarti availability
- Responsive design that works on mobile and desktop
- One-click refresh to check for updates
- Clear display of available slots, timings, and ticket counts
- Automated slot monitoring with Slack notifications

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- Axios for API requests

## Getting Started

### Prerequisites

- Node.js 18.17 or later

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd darshan-tracker
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```
Edit `.env.local` and add your API token and other required values.

4. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## API Endpoints

The app uses the following API endpoints:

- `/api/darshan` - Gets available darshan slots
- `/api/aarti` - Gets available aarti slots

These endpoints internally communicate with the SRJBTS API to fetch real-time data.

## Deployment

This application can be easily deployed to Vercel or any other Next.js-compatible hosting service:

```bash
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Slot Monitoring Background Job

The application includes a background job that checks for new slot availability every 5 minutes and sends notifications to Slack.

### Setting up Slack Notifications

1. Create a Slack app and webhook URL:
   - Go to [https://api.slack.com/apps](https://api.slack.com/apps)
   - Click "Create New App" and follow the setup process
   - Under "Incoming Webhooks", activate the feature and create a new webhook
   - Copy the webhook URL

2. Add the webhook URL to your `.env.local` file:
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
APP_URL=https://your-deployment-url.com
```

### Setting up the Cron Job

#### Option 1: Using a Cron Service (e.g., Vercel Cron)

If deploying on Vercel, you can use Vercel Cron:

1. Add the following to your `vercel.json` file:
```json
{
  "crons": [
    {
      "path": "/api/slots-monitor",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

#### Option 2: External Cron Service

You can use an external service like [cron-job.org](https://cron-job.org) to trigger the endpoint:

1. Create an account and add a new cron job
2. Set the URL to `https://your-deployment-url.com/api/slots-monitor`
3. Set the schedule to run every 5 minutes
4. Ensure the request is set to GET

#### Option 3: Server-based Cron (if self-hosting)

If you're hosting on a Linux/Unix server:

1. Open your crontab
```bash
crontab -e
```

2. Add a line to call your endpoint every 5 minutes
```
*/5 * * * * curl https://your-deployment-url.com/api/slots-monitor
```

### Testing the Slots Monitor

You can manually test the slots monitor by visiting:

```
https://your-deployment-url.com/api/slots-monitor
```

This should return a JSON response with information about the current slot availability.

### Testing the Slots Monitor Locally

While Vercel Cron jobs only run in production environments, you can test the scheduler locally using the provided test scripts:

1. Start your Next.js development server:
```bash
npm run dev
```

2. In a separate terminal, run the test script:
```bash
# For Node.js 18+ (using fetch)
node scripts/test-scheduler-fetch.js

# For older Node.js versions
node scripts/test-scheduler.js
```

This script will:
- Call your `/api/slots-monitor` endpoint once per minute (configurable)
- Display the response from the endpoint
- Show whether notifications would be sent to Slack
- Continue running until you press `Ctrl+C` to stop it

The first run will establish a baseline, and subsequent runs will check for differences and simulate sending notifications to Slack. You can modify the interval in the script to test more frequently during development.

## License

This project is licensed under the MIT License.
