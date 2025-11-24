# YouTube Analytics Dashboard

A comprehensive Next.js application for analyzing YouTube channels, niches, and revenue potential.

## Features

- **User Authentication**: Secure login and registration system
- **Dashboard**: Overview of platform metrics and analytics
- **Explore Niches**: Browse and analyze different YouTube niches
- **Channel Details**: In-depth analysis of individual YouTube channels
- **Collections**: Organize channels into custom collections
- **Admin Panel**: Administrative features for platform management
- **Niche Viability Score**: Calculate potential success of YouTube niches
- **Revenue Estimation**: Estimate potential earnings for channels
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context API
- **Routing**: Next.js App Router

## Pages

### Login Page (`/login`)
- User authentication with email and password
- Registration option available
- Password visibility toggle

### Dashboard (`/dashboard`)
- Platform overview metrics
- Recent niches and channels
- Quick access to main features

### Explore Niches (`/explore`)
- Browse available niches
- Filter and sort options
- Detailed niche metrics
- Viability score display

### Channel Details (`/channels/[id]`)
- Comprehensive channel analytics
- Video performance metrics
- Revenue estimation
- Viability score breakdown
- Recommendations

### Collections (`/collections`)
- Organize channels into groups
- Create, edit, delete collections
- Add/remove channels from collections

### Admin Panel (`/admin`)
- Manage users (for admin users)
- Platform statistics
- System configuration
- Activity logs

## File Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── login/
│   ├── dashboard/
│   ├── explore/
│   ├── channels/
│   ├── collections/
│   ├── admin/
│   └── layout.tsx
├── components/            # Reusable components
├── context/               # React context providers
│   └── authContext.tsx    # Authentication context
├── types/                 # TypeScript type definitions
│   └── index.ts
├── lib/                   # Utility functions
├── utils/                 # Helper functions
└── styles/                # Global styles
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key

# Database (if using real backend)
DATABASE_URL=your_database_url

# Next.js
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## API Integration

The application is designed to work with a backend API. To integrate with a real backend:

1. Update the API endpoints in each page's API calls
2. Implement proper authentication tokens
3. Add API client utilities in `src/lib/api.ts`
4. Update the mock data in each page with real API calls

## Mock Data Implementation

All pages currently use mock data to demonstrate the UI and functionality. To implement real data:

1. Create API utility functions in `src/lib/api.ts`
2. Replace mock data calls with API calls
3. Implement proper error handling
4. Add loading states

Example API utility:
```typescript
// src/lib/api.ts
export const fetchChannel = async (id: string) => {
  const response = await fetch(`/api/channels/${id}`);
  return response.json();
};
```

## Authentication

The application uses a React Context for authentication management. To implement real authentication:

1. Update the `AuthProvider` to use your authentication system
2. Implement token management
3. Add token refresh logic
4. Update login/register functions to call your API

## Deployment

To build and deploy the application:

```bash
# Build for production
npm run build

# Start production server
npm start
```

The application is ready to be deployed to Vercel, Netlify, or any platform supporting Next.js.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.