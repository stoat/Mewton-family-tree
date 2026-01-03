# Mewton Family Tree

An interactive, web-based family tree visualization and management tool built with React, ReactFlow, and Node.js.

## Features

- **Interactive Tree Visualization**: Drag-and-drop node positioning with ReactFlow
- **Person Editor**: Click any person to edit their details (name, birth/death dates, notes)
- **Relationship Management**: Add parent-child and partner relationships with smart person search
- **Timeline View**: See chronological life events (birth, marriages, death) for each person
- **Relationship Deletion**: Remove incorrectly assigned relationships via the UI
- **Export**: Download the entire family tree as JSON
- **Persistent Storage**: All changes are automatically saved to the backend

## Technology Stack

- **Frontend**: React 18 + Vite, ReactFlow for graph visualization
- **Backend**: Node.js + Express
- **Data Storage**: JSON file with Docker volume persistence
- **Deployment**: Docker & Docker Compose

## Quick Start

### Local Development (Docker)

```bash
# Start dev containers
docker-compose -f .devcontainer/docker-compose.yml up -d

# Access the app
# Web: http://localhost:5173
# API: http://localhost:5175
```

### Production Deployment (Portainer/Raspberry Pi)

1. Update `docker-compose.yml` with your Pi's IP:
   ```bash
   export API_URL=http://192.168.1.XX:5175  # Replace XX with your Pi's IP
   ```

2. Deploy via Portainer:
   - Add Stack → Git repository → Point to this repo
   - Portainer will prompt for `API_URL` environment variable
   - Set it to your Raspberry Pi's LAN IP

3. Access the app at: `http://192.168.1.XX`

## Project Structure

```
.
├── server/                 # Node.js API
│   ├── index.js           # Express server
│   ├── tree.json          # Family tree data
│   └── package.json
├── web/                   # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main app component with all UI
│   │   └── main.jsx
│   ├── Dockerfile         # Multi-stage build (dev & prod)
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml     # Production compose file
└── .devcontainer/         # Dev container config
    ├── docker-compose.yml # Development compose file
    ├── Dockerfile
    └── devcontainer.json
```

## API Endpoints

### GET `/api/tree`
Returns the complete family tree data

```json
{
  "people": [
    {
      "id": "person_id",
      "displayName": "John Doe",
      "birth": "1950",
      "death": "2020",
      "notes": "Additional information",
      "x": 100,
      "y": 200
    }
  ],
  "relationships": [
    {
      "id": "rel_id",
      "type": "parentChild|partner",
      "from": "parent_id",
      "to": "child_id"
    }
  ],
  "meta": {
    "title": "Family Tree"
  }
}
```

### PUT `/api/tree`
Update the entire family tree (accepts same schema as GET response)

## tree.json Structure

The family tree is stored as a single JSON file with three main sections:

- **people**: Array of person objects with id, name, birth/death years, and position coordinates
- **relationships**: Array of relationships defining parent-child and partner connections
- **meta**: Metadata like the tree title

## Features in Detail

### Person Editor
- Click any node to open the edit modal
- Edit: Name, Birth Year, Death Year, Notes
- View: Parents, Children, Partners with quick removal buttons
- Timeline: Chronological view of life events

### Relationship Manager
- Click "Add relationship" to open the modal
- Typeahead search with alphabetical sorting for person selection
- Support for both "Parent → Child" and "Partner" relationships
- Prevents self-relationships

### Drag & Drop
- Click and drag any node to reposition
- Positions are automatically saved to the backend
- Works alongside the edit modal

## Environment Variables

### Development
- `VITE_API_URL`: API base URL (default: `http://localhost:5175`)

### Production
- `API_URL`: Set this when deploying to production with your Pi's IP address

## Security

This application includes password protection via the `TREE_PASSWORD` environment variable.

### Default Password (Development)
Default password is `"password"` for local testing.

### Production Deployment (Portainer)
When deploying to Portainer on your Raspberry Pi:

1. Go to your stack settings
2. Add an environment variable:
   - **Variable name:** `TREE_PASSWORD`
   - **Value:** Your desired password
3. Redeploy the stack

The password will be used for all login attempts. Users must enter this password to access the family tree.

## Persisting Data

The API stores data in a Docker volume named `tree_data`. To back up your data:

```bash
# Copy data out of container
docker cp family-tree-api:/data/tree.json ./server/tree.json

# Copy data into container
docker cp ./server/tree.json family-tree-api:/data/tree.json
```

## Development Notes

- Hot-reload is enabled for both frontend and backend in dev mode
- The dev container provides a full development environment with Node.js
- All changes to the UI are reflected immediately via Vite HMR
- Position changes are persisted asynchronously to avoid blocking the UI

## License

MIT
