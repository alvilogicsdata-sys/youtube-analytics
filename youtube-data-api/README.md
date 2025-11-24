# YouTube Data API Module

A comprehensive Node.js module for fetching, analyzing, and storing YouTube channel data, with special focus on YouTube Shorts analytics.

## Features

- Fetch YouTube channel details (title, description, subscriber count, etc.)
- Retrieve video lists with pagination support
- Automatic identification and tracking of YouTube Shorts
- Calculation of Shorts percentage for channels
- PostgreSQL database storage for channel and video data
- Redis-based caching for improved performance
- Rate limiting to handle YouTube API quotas
- Background job queue for processing large datasets
- Comprehensive API endpoints for data retrieval

## Project Structure

```
youtube-data-api/
├── server.js                 # Main application entry point
├── package.json              # Dependencies and scripts
├── .env                      # Environment configuration
├── config/                   # Configuration files
├── controllers/              # Request handlers (not used in this implementation)
├── database/
│   ├── connection.js         # Database connection setup
│   ├── schema.sql            # Database schema
│   └── storage.js            # Data storage operations
├── models/                   # Data models (not used in this implementation)
├── routes/
│   └── youtube.js            # API routes
├── services/
│   ├── youtubeApiClient.js   # YouTube API client with rate limiting
│   ├── youtubeChannelService.js # Channel data service
│   ├── youtubeVideoService.js   # Video data service
│   └── jobQueue.js           # Background job queue
├── middleware/
│   └── rateLimiter.js        # Rate limiting middleware
├── utils/
│   └── analytics.js          # Analytics calculation utilities
└── README.md                 # This file
```

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- Redis server
- YouTube Data API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd youtube-data-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=youtube_analytics

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# YouTube API Configuration
YOUTUBE_API_KEY=your_youtube_api_key

# Server Configuration
PORT=3000
NODE_ENV=development
```

5. Set up the database:
```bash
# Connect to your PostgreSQL instance and run:
psql -d your_database_name -f database/schema.sql
```

6. Start the application:
```bash
npm start
# or for development with auto-restart:
npm run dev
```

## API Endpoints

### Channel Operations

- `GET /api/youtube/channels/:channelId` - Get stored channel details
- `POST /api/youtube/channels/fetch` - Queue a job to fetch and store channel details
- `GET /api/youtube/channels` - Get all stored channels with pagination

### Video Operations

- `GET /api/youtube/channels/:channelId/videos` - Get videos for a channel
- `POST /api/youtube/channels/:channelId/videos/fetch` - Queue a job to fetch videos for a channel
- `GET /api/youtube/videos/:videoId` - Get specific video details

### Analytics

- `GET /api/youtube/channels/:channelId/analytics` - Get channel analytics including shorts percentage
- `POST /api/youtube/channels/:channelId/calculate-shorts` - Calculate shorts percentage on demand

### Job Management

- `GET /api/youtube/jobs/:jobId` - Get background job status

### Health Check

- `GET /health` - Check server health status

## Rate Limiting

The application implements multiple layers of rate limiting:

1. **YouTube API Rate Limiting**: The client respects YouTube's API quotas with daily and per-minute limits
2. **Server Rate Limiting**: Express middleware limits requests per IP
3. **Caching**: Redis-based caching reduces API calls for repeated requests

## Background Job Queue

The system uses Bull (Redis-based job queue) to process:

- Channel fetch jobs
- Video fetch jobs
- Data processing tasks

Jobs are stored in the database for tracking and can be monitored via the API.

## Data Storage

The application stores data in PostgreSQL with the following main tables:

- `channels`: Stores channel information
- `videos`: Stores video details including whether it's a short
- `channel_analytics`: Stores calculated analytics like shorts percentage
- `job_queue`: Tracks background job status

## Usage Examples

### Fetching a Channel

```bash
curl -X POST http://localhost:3000/api/youtube/channels/fetch \
  -H "Content-Type: application/json" \
  -d '{"channelId": "UC_x5XG1OV2P6uZZ5FSM9Ttw"}'
```

### Getting Channel Analytics

```bash
curl http://localhost:3000/api/youtube/channels/UC_x5XG1OV2P6uZZ5FSM9Ttw/analytics
```

### Getting Channel Videos

```bash
curl "http://localhost:3000/api/youtube/channels/UC_x5XG1OV2P6uZZ5FSM9Ttw/videos?limit=20&offset=0"
```

## Shorts Detection

The system identifies Shorts using multiple criteria:

1. Video duration (60 seconds or less)
2. Specific tags containing 'short' or 'shorts'
3. Category ID 23 (YouTube Shorts category)
4. Additional heuristics for edge cases

## Environment Variables

- `YOUTUBE_API_KEY`: Your YouTube Data API key (required)
- `DB_HOST`: PostgreSQL host (default: localhost)
- `DB_PORT`: PostgreSQL port (default: 5432)
- `DB_USER`: PostgreSQL user
- `DB_PASSWORD`: PostgreSQL password
- `DB_NAME`: PostgreSQL database name
- `REDIS_HOST`: Redis host (default: localhost)
- `REDIS_PORT`: Redis port (default: 6379)
- `REDIS_PASSWORD`: Redis password (if any)
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

## Error Handling

The module implements comprehensive error handling:

- YouTube API errors (rate limits, invalid keys, etc.)
- Database connection errors
- Network errors
- Validation errors

## Testing

To run tests:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see the LICENSE file for details.

## Support

For issues and questions, please open an issue in the repository.