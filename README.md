# Darshan & Aarti Availability Tracker

A Next.js web application to track and display available darshan and aarti slots at SRJBTS.

## Features

- Real-time checking of Darshan availability
- Real-time checking of Aarti availability
- Responsive design that works on mobile and desktop
- One-click refresh to check for updates
- Clear display of available slots, timings, and ticket counts

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

3. Run the development server:

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
